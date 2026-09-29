require "GameBase.SvrSystemBase"
require "GameError"
require "CommomDefine"

MailSystem = class__(SvrSystemBase)

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
function MailSystem:receiveNewMail(uId, mailId, mailContent)
    mailContent = mailContent or {}
    mailContent.mailId = mailContent.mailId or mailId
    mailContent.uId = mailContent.uId or uId

    if not self.mailCacheMap[uId] then
        self.mailCacheMap[uId] = {}
    end
    if not self.mailCacheMap[uId].version then
        self.mailCacheMap[uId].version = 0
    end
    if not self.mailCacheMap[uId].mails then
        self.mailCacheMap[uId].mails = {}
    end
    
    self.mailCacheMap[uId].version = self.mailCacheMap[uId].version + 1
    self.mailCacheMap[uId].mails[mailId] = mailContent
    local player = gWorld:findPlayerByUid(uId)
    if player then
        Router.Client.ScNewMailPush({ mail = mailContent }, player) 
    end
end

--邮件发奖给玩家
function MailSystem:giveRewardToPlayer(uId, player, mailId, rewards)
    for _, res in pairs(rewards) do
        local oddsType = res.oddsType or 0
        if res.resType and res.resId and res.resCount and res.resCount > 0 then
            if res.resType == EResourceType.Coins then
                local roundId = res.roundId or ESpecialRoundId.MailAward
                local gemeExt = res.gameExt or {}
                if roundId then
                    local orderId = player:addCoins(roundId, oddsType, ECoinsOperateType.MailAdd, res.resCount, function (ercode, orderID, backPlayer)
                        if not backPlayer then
                            log_error("邮件领取积分回调玩家为nil: uid:{0} ercode:{1} coins:{2} orderID:{3}", uId, ercode, res.resCount, orderID)
                            return
                        end
                        if ercode ~= 0 then
                            log_error("邮件领取积分错误: uid:{0}  ercode:{1}  coins:{2} orderID:{3}", uId, ercode, res.resCount, orderID)
                            local msg = {errorCode = ercode, mailId = mailId, reward = res }
                            Router.Client.CsMailRewardReceiveResp(msg, player)
                            PlatSystem.MailCommon.rsetMailsRewardState(nil, uId, mailId)
                        end

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
function MailSystem:updateMailVersion(uId)
    if self.mailCacheMap[uId] then
        self.mailCacheMap[uId].version = self.mailCacheMap[uId].version + 1
    end
end

--获取邮件列表
function MailSystem:getMailsListToClient(mailsMap, uId)
    local tb = {}
    local deleteIds = {}
    if mailsMap and next(mailsMap) then
        for _, mailData in pairs(mailsMap) do
            if self:checkMailsLifeValid(mailData) then
                table.insert(tb, mailData)
            else
                table.insert(deleteIds, mailData.mailId)
            end
        end
    end

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
function MailSystem:checkMailsLifeValid(mailData)
    local nowTime = os.time()
    local cfgMail = gConfigMgr:getBaseConfig("Mail") 
    local mailCfgId = mailData.mailCfgId
    local cfg = cfgMail and cfgMail[mailCfgId]
    if not cfg then
        return false
    end

    local lifeTime = cfg.LifeTime
    if not lifeTime or lifeTime == 0 then
        return true
    end

    if not mailData.read then
        return true
    end

    local sendTime = mailData.sendTime
    local time = nowTime - sendTime
    if not mailData.rewards or #mailData.rewards == 0 then
        if time >= lifeTime then
            return false
        end
    else
        if mailData.rewardState == EMailRewardState.NoReceive then
            return true
        end
        if time >= lifeTime then
            return false
        end
    end
    return true
end

------------------NetMsg-----------------------
--请求邮件列表
function MailSystem:csMailListReq(uId, player)
    local mailsData = self.mailCacheMap[uId]
    local version = mailsData and mailsData.version or 0
    PlatSystem.MailCommon.getPlayerMailsVersion(function (v)
        if v == version then
            log_info("玩家{0}邮件缓存和Center版本一致:{1}", uId, version)
            local list = {}
            if mailsData and mailsData.mails then
                list = self:getMailsListToClient(mailsData.mails, uId)
            end
            Router.Client.CsMailListResp({ mails = list }, player)
        else
            log_info("玩家{0}邮件缓存和Center版本不一致: version_game:{1}  version_center{2}:", uId, version, v)
            if not mailsData then
                self.mailCacheMap[uId] = {}
            end
            self.mailCacheMap[uId].version = v or 0
            PlatSystem.MailCommon.getPlayerMails(function (mailsData)
                mailsData = mailsData or {}
                self.mailCacheMap[uId].mails = mailsData
                local mailList = self:getMailsListToClient(mailsData, uId)
                Router.Client.CsMailListResp({ mails = mailList }, player)
            end, uId)
        end
    end, uId)
end

--请求读取邮件
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
function MailSystem:csMailRewardReceiveReq(mailIds, uId, player)
    PlatSystem.MailCommon.setMailsRewardReceived(function (mailsData)
        if mailsData and #mailsData > 0 then
            self:updateMailVersion(uId)
            local receiveIds = {}
            local playerMails = self.mailCacheMap[uId] and self.mailCacheMap[uId].mails
            for _, mailData in pairs(mailsData) do
                local mailId = mailData.mailId
                table.insert(receiveIds, mailId)
                if playerMails and playerMails[mailId] then
                    playerMails[mailId].rewardState = EMailRewardState.Received
                    playerMails[mailId].read = true

                    if mailData.rewards and #mailData.rewards > 0 then
                        self:giveRewardToPlayer(uId, player, mailId, mailData.rewards)
                    end
                end
            end
        end
    end, uId, mailIds)
end
