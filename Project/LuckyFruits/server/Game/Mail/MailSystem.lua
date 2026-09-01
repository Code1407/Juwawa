-- ============================================================
-- MailSystem 模块：服务器级邮件系统
-- 继承自 SvrSystemBase，作为 SvrSystem 的子系统在整个游戏服范围内单例。
-- 职责：
--   1. 接收来自 GameCenter（跨服）的新邮件并缓存到本服
--   2. 通过 PlatSystem.MailCommon 与平台邮件服务交互（持久化、状态变更）
--   3. 维护玩家邮件缓存（mailCacheMap），通过版本号与平台保持一致
--   4. 处理客户端邮件请求（列表/已读/删除/领奖）
--   5. 邮件生命周期管理：已读/已领奖邮件到达LifeTime自动删除
-- ============================================================

require "GameBase.SvrSystemBase"
require "GameError"
require "CommomDefine"

MailSystem = class__(SvrSystemBase)

-- 构造函数：初始化邮件缓存映射
-- mailCacheMap 结构：{ uId => { version = number, mails = { mailId => mailContent } } }
function MailSystem:ctor__()
    SvrSystemBase.ctor__(self, "MailSystem")

    self.mailCacheMap = {}
end

--发送邮件
 ---@param uId string 玩家uId
 ---@param gameId number 游戏Id
 ---@param mailCfgId number 邮件配置Id
 ---@param rewards table{table{资源类型，资源id，资源数量}...} 奖励:一个资源数据的数组, 单个资源数据(resType:资源类型,resId:资源ID,resCount:资源数量,oddsType:资源添加类型,默认0) 
 ---@param extraJson string 扩展json字符串
function MailSystem:sendNewMail(uId, gameId, mailCfgId, rewards, extraJson)
    local cfgMail = gConfigMgr:getBaseConfig("Mail") 
    if not cfgMail then
        return log_error("sendNewMail 没有邮件配置")
    end


    local cfg = cfgMail[mailCfgId]
    if not cfg then
        return log_error("sendNewMail 没有邮件Id为:{0}的配置", mailCfgId)
    end

    local mailContent = {}
    mailContent.uId = uId
    mailContent.gameId = gameId
    mailContent.mailCfgId = mailCfgId
    mailContent.rewards = rewards or {}
    mailContent.extraJson = extraJson or ""
    mailContent.read = false
    mailContent.sendTime = os.time()

    local haveReward = rewards and #rewards > 0 or false
    if haveReward then
        mailContent.rewardState = EMailRewardState.NoReceive
    else
        mailContent.rewardState = EMailRewardState.NoReward
    end

    PlatSystem.MailCommon.sendNewMail(nil, uId, mailContent)
end

--接收邮件
-- 由 GameMsg.SendNewMail 调用，接收 GameCenter 推送的新邮件
-- 流程：填充缺失字段 → 写入缓存并自增版本号 → 玩家在线则推送通知
function MailSystem:receiveNewMail(uId, mailId, mailContent)
    mailContent = mailContent or {}
    -- 优先使用 mailContent 中的字段，缺失时用入参兜底，保证关键字段完整
    mailContent.mailId = mailContent.mailId or mailId
    mailContent.uId = mailContent.uId or uId

    -- 懒初始化玩家缓存结构：version用于与平台版本对比检测变更
    if not self.mailCacheMap[uId] then
        self.mailCacheMap[uId] = {}
    end
    if not self.mailCacheMap[uId].version then
        self.mailCacheMap[uId].version = 0
    end
    if not self.mailCacheMap[uId].mails then
        self.mailCacheMap[uId].mails = {}
    end
    
    -- 版本号自增：标记缓存已变更，后续列表请求会以此与平台对比
    self.mailCacheMap[uId].version = self.mailCacheMap[uId].version + 1
    self.mailCacheMap[uId].mails[mailId] = mailContent
    -- 玩家在线则主动推送新邮件通知，避免客户端轮询
    local player = gWorld:findPlayerByUid(uId)
    if player then
        Router.Client.ScNewMailPush({ mail = mailContent }, player) 
    end
end

--邮件发奖给玩家
-- 遍历奖励资源数组，按资源类型分发：积分通过addCoins异步入账，头像框走专门逻辑
function MailSystem:giveRewardToPlayer(uId, player, mailId, rewards)
    for _, res in pairs(rewards) do
        local oddsType = res.oddsType or 0
        if res.resType and res.resId and res.resCount and res.resCount > 0 then
            if res.resType == EResourceType.Coins then
                -- 积分奖励：通过addCoins异步入账，回调中根据结果推送客户端
                local roundId = res.roundId or ESpecialRoundId.MailAward
                local gemeExt = res.gameExt or {}
                if roundId then
                    local orderId = player:addCoins(roundId, oddsType, ECoinsOperateType.MailAdd, res.resCount, function (ercode, orderID, backPlayer)
                        -- 回调玩家为nil：通常是玩家已离线，仅记录日志
                        if not backPlayer then
                            log_error("邮件领取积分回调玩家为nil: uid:{0} ercode:{1} coins:{2} orderID:{3}", uId, ercode, res.resCount, orderID)
                            return
                        end
                        -- 入账失败：推送错误码并重置平台侧奖励状态，允许玩家重试
                        if ercode ~= 0 then
                            log_error("邮件领取积分错误: uid:{0}  ercode:{1}  coins:{2} orderID:{3}", uId, ercode, res.resCount, orderID)
                            local msg = {errorCode = ercode, mailId = mailId, reward = res }
                            Router.Client.CsMailRewardReceiveResp(msg, player)
                            PlatSystem.MailCommon.rsetMailsRewardState(nil, uId, mailId)
                        end

                        -- 入账成功：推送成功响应并记录日志
                        if backPlayer and ercode == 0 then
                            local msg = {errorCode = 0, mailId = mailId, reward = res }
                            Router.Client.CsMailRewardReceiveResp(msg, player)
                            log_info("玩家{0}领取邮件积分奖励{1}成功", uId, res.resCount)
                        end

                    end, gemeExt)
                    log_info("玩家{0}请求领取邮件{1}积分奖励 oddsType:{2} orderID:{3}", uId, res.resCount, oddsType, orderId)
                end         
            elseif res.resType == EResourceType.AvatarFrame then
                --领取头像框
            end
        else
            log_error("玩家{0}邮件{1}奖励领取参数错误 resType:{2} resId:{3} resCount:{4}", uId, mailId, res.resType, res.resId, res.resCount)
        end
    end
end

--更新缓存邮件版本
-- 在本地缓存发生变更（增删改）后调用，保持与平台版本号同步
function MailSystem:updateMailVersion(uId)
    if self.mailCacheMap[uId] then
        self.mailCacheMap[uId].version = self.mailCacheMap[uId].version + 1
    end
end

--获取邮件列表
-- 从缓存中取出有效邮件，并清理已过期的邮件（异步通知平台删除）
-- @return table 有效邮件数组（供推送给客户端）
function MailSystem:getMailsListToClient(mailsMap, uId)
    local tb = {}
    local deleteIds = {}
    -- 遍历缓存邮件，按生命周期规则分类：有效则返回，过期则收集待删除
    if mailsMap and next(mailsMap) then
        for _, mailData in pairs(mailsMap) do
            if self:checkMailsLifeValid(mailData) then
                table.insert(tb, mailData)
            else
                table.insert(deleteIds, mailData.mailId)
            end
        end
    end

    -- 批量清理过期邮件：异步通知平台删除并清理本地缓存
    if #deleteIds > 0 then
        PlatSystem.MailCommon.deleteMails(function (mails)
            if mails and #mails > 0 then
                local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
                for _, mailId in pairs(mails) do
                    if playerMails and playerMails[mailId] then
                        log_info("玩家{0} 邮件 {1} 生命周期已到,自动删除", uId, mailId)
                        playerMails[mailId] = nil
                    end
                end
                self:updateMailVersion(uId)
            end
        end, uId, deleteIds)
    end
    return tb
end

--检查邮件生命周期是否有效
-- 过期规则（基于配置LifeTime）：
--   1. 无配置或LifeTime为0 → 永久有效
--   2. 未读邮件 → 永久有效（已读才开始计时）
--   3. 无奖励邮件：已读后超过LifeTime则过期
--   4. 有奖励邮件：未领取前永久有效，已领取后超过LifeTime则过期
function MailSystem:checkMailsLifeValid(mailData)
    local nowTime = os.time()
    local cfgMail = gConfigMgr:getBaseConfig("Mail") 
    local mailCfgId = mailData.mailCfgId
    local cfg = cfgMail and cfgMail[mailCfgId]
    if not cfg then
        return false
    end

    local lifeTime = cfg.LifeTime
    -- LifeTime为0或未配置表示永久有效
    if not lifeTime or lifeTime == 0 then
        return true
    end

    -- 未读邮件不计入生命周期，永久保留
    if not mailData.read then
        return true
    end

    -- 已读邮件按配置LifeTime计算是否过期
    local sendTime = mailData.sendTime
    local time = nowTime - sendTime
    if not mailData.rewards or #mailData.rewards == 0 then
        -- 无奖励邮件：已读后超过LifeTime即过期
        if time >= lifeTime then
            return false
        end
    else
        -- 有奖励邮件：未领取前永久有效（避免奖励丢失）
        if mailData.rewardState == EMailRewardState.NoReceive then
            return true
        end
        -- 已领取后超过LifeTime则过期
        if time >= lifeTime then
            return false
        end
    end
    return true
end

------------------NetMsg-----------------------
--请求邮件列表
-- 缓存机制：先与平台版本号对比，一致则直接用本地缓存，不一致则全量拉取
function MailSystem:csMailListReq(uId, player)
    local mailsData = self.mailCacheMap[uId]
    local version = mailsData and mailsData.version or 0
    -- 先查询平台邮件版本号，决定是否需要全量拉取
    PlatSystem.MailCommon.getPlayerMailsVersion(function (v)
        if v == version then
            -- 版本一致：本地缓存有效，直接从缓存取列表（含过期清理）
            log_info("玩家{0}邮件缓存和Center版本一致:{1}", uId, version)
            if mailsData and mailsData.mails then
                local list = self:getMailsListToClient(mailsData.mails, uId)
                if #list > 0 then
                    Router.Client.CsMailListResp({ mails = list }, player)
                end
            end
        else
            -- 版本不一致：缓存过期，需要从平台全量拉取邮件
            log_info("玩家{0}邮件缓存和Center版本不一致: version_game:{1}  version_center{2}:", uId, version, v)
            if not mailsData then
                self.mailCacheMap[uId] = {}
            end
            self.mailCacheMap[uId].version = v
            PlatSystem.MailCommon.getPlayerMails(function (mailsData)
                if mailsData and next(mailsData) then
                    self.mailCacheMap[uId].mails = mailsData
                    local mailList = self:getMailsListToClient(mailsData, uId)
                    if #mailList > 0 then
                        Router.Client.CsMailListResp({ mails = mailList }, player)
                    end
                end
            end, uId)
        end
    end, uId)
end

--请求读取邮件
-- 通知平台标记邮件为已读，成功后更新本地缓存并自增版本号
function MailSystem:csMailReadReq(mailIds, uId, player)
    PlatSystem.MailCommon.setMailsReadState(function (mails)
        if mails and #mails > 0 then
            local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
            for _, mailId in pairs(mails) do
                if playerMails and playerMails[mailId] then
                    playerMails[mailId].read = true
                end
            end
            self:updateMailVersion(uId)
            Router.Client.CsMailReadResp({ mails = mails }, player)
        end
    end, uId, mailIds, true)
end

--请求删除邮件
-- 通知平台删除指定邮件，成功后清理本地缓存并自增版本号
function MailSystem:csMailDeleteReq(mailIds, uId, player)
    PlatSystem.MailCommon.deleteMails(function (mails)
        if mails and #mails > 0 then
            local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
            for _, mailId in pairs(mails) do
                if playerMails and playerMails[mailId] then
                    playerMails[mailId] = nil
                end
            end
            self:updateMailVersion(uId)
            Router.Client.CsMailDeleteResp({ mails = mails }, player)
        end
    end, uId, mailIds)
end

--请求删除所有已读邮件
-- 通知平台删除所有已读邮件，成功后清理本地缓存并自增版本号
function MailSystem:csMailDeleteAllReadReq(uId, player)
    PlatSystem.MailCommon.deleteAllReadMails(function (mailIds)
        if mailIds and #mailIds > 0 then
            local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
            for _, mailId in pairs(mailIds) do
                if playerMails and playerMails[mailId] then
                    playerMails[mailId] = nil
                end
            end
            self:updateMailVersion(uId)
            Router.Client.CsMailDeleteResp({ mails = mailIds }, player)
        end
    end, uId)
end

--请求邮件邮件领奖
-- 先通知平台标记奖励为已领取（防重），再遍历邮件奖励调用giveRewardToPlayer入账
function MailSystem:csMailRewardReceiveReq(mailIds, uId, player)
    PlatSystem.MailCommon.setMailsRewardReceived(function (mailsData)
        if mailsData and #mailsData > 0 then
            self:updateMailVersion(uId)
            local receiveIds = {}
            local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
            for _, mailData in pairs(mailsData) do
                local mailId = mailData.mailId
                table.insert(receiveIds, mailId)
                -- 更新本地缓存：奖励状态置为已领取并标记已读
                if playerMails and playerMails[mailId] then
                    playerMails[mailId].rewardState = EMailRewardState.Received
                    playerMails[mailId].read = true

                    -- 有奖励则异步入账，回调中推送结果给客户端
                    if mailData.rewards and #mailData.rewards > 0 then
                        self:giveRewardToPlayer(uId, player, mailId, mailData.rewards)
                    end
                end
            end
        end
    end, uId, mailIds)
end
