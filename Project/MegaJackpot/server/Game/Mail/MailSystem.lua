-- ============================================================
-- 全局邮件系统模块
-- 继承自SvrSystemBase，管理所有玩家的邮件缓存
-- 与平台PlatSystem.MailCommon交互，处理邮件的增删改查和奖励发放
-- ============================================================

require "GameBase.SvrSystemBase"

MailSystem = class__(SvrSystemBase)

-- 构造函数：创建邮件缓存表
function MailSystem:ctor__()
    SvrSystemBase.ctor__(self, "MailSystem")
    self.mailCacheMap = {} -- {uid -> {version, mails}}
end

-- 生成缓存键
local function uidKey(uid)
    return tostring(uid or "")
end

-- 获取指定用户的邮件缓存（懒初始化）
function MailSystem:getCache(uid)
    local key = uidKey(uid)
    self.mailCacheMap[key] = self.mailCacheMap[key] or { version = 0, mails = {} }
    return self.mailCacheMap[key]
end

-- 发送新邮件（创建并推送到平台）
-- uId: 目标用户ID、gameId: 游戏ID、mailCfgId: 邮件配置ID
-- rewards: 奖励列表、extraJson: 扩展JSON
function MailSystem:sendNewMail(uId, gameId, mailCfgId, rewards, extraJson)
    local cfgMail = gConfigMgr:getBaseConfig("Mail")
    if not cfgMail or not cfgMail[mailCfgId] then
        return log_error("sendNewMail missing Mail config, id:{0}", mailCfgId)
    end
    local mail = {
        uId = uId,
        gameId = gameId,
        mailCfgId = mailCfgId,
        rewards = rewards or {},
        extraJson = extraJson or "",
        read = false,
        sendTime = app__:utc_s(), -- 发送时间戳（UTC）
        rewardState = rewards and #rewards > 0 and EMailRewardState.NoReceive or EMailRewardState.NoReward,
    }
    PlatSystem.MailCommon.sendNewMail(nil, uId, mail)
end

-- 接收新邮件通知（从GameCenter推送过来）
-- mailId: 平台邮件ID、mailContent: 邮件内容
function MailSystem:receiveNewMail(uId, mailId, mailContent)
    local cache = self:getCache(uId)
    cache.version = cache.version + 1
    mailContent.mailId = mailContent.mailId or mailId
    cache.mails[mailId] = mailContent -- 存入缓存
    local player = gWorld:findPlayerByUid(uId)
    if player then
        Router.Client.ScNewMailPush({ mail = mailContent }, player) -- 推送给在线玩家
    end
end

-- 递增邮件版本号（标记缓存失效）
function MailSystem:updateMailVersion(uId)
    local cache = self:getCache(uId)
    cache.version = cache.version + 1
end

-- 检查邮件是否在有效期内
function MailSystem:checkMailsLifeValid(mail)
    local cfgMail = gConfigMgr:getBaseConfig("Mail")
    local cfg = cfgMail and cfgMail[mail.mailCfgId]
    if not cfg then return false end
    local life = tonumber(cfg.LifeTime or cfg.lifeTime or cfg.ValidTime or cfg.validTime or 0) or 0
    return life <= 0 or (tonumber(mail.sendTime) or 0) + life > app__:utc_s()
end

-- 构建发送给客户端的邮件列表（过滤过期邮件，按时间倒序）
function MailSystem:getMailsListToClient(mailsMap, uId)
    local result, expired = {}, {}
    for mailId, mail in pairs(mailsMap or {}) do
        if self:checkMailsLifeValid(mail) then
            result[#result + 1] = mail -- 有效邮件
        else
            expired[#expired + 1] = mail.mailId or mailId -- 过期邮件
        end
    end
    -- 异步清理过期邮件
    if #expired > 0 then
        PlatSystem.MailCommon.deleteMails(function(ids)
            local cache = self:getCache(uId)
            for _, id in ipairs(ids or {}) do cache.mails[id] = nil end
            self:updateMailVersion(uId)
        end, uId, expired)
    end
    table.sort(result, function(a, b) return (a.sendTime or 0) > (b.sendTime or 0) end)
    return result
end

-- 处理客户端请求邮件列表（带版本号增量同步）
function MailSystem:csMailListReq(uId, player)
    local cache = self:getCache(uId)
    -- 先比较版本号
    PlatSystem.MailCommon.getPlayerMailsVersion(function(version)
        if version == cache.version then
            -- 版本一致，直接用缓存
            Router.Client.CsMailListResp({ mails = self:getMailsListToClient(cache.mails, uId) }, player)
            return
        end
        -- 版本不一致，从平台重新拉取
        cache.version = version or 0
        PlatSystem.MailCommon.getPlayerMails(function(mails)
            cache.mails = mails or {}
            Router.Client.CsMailListResp({ mails = self:getMailsListToClient(cache.mails, uId) }, player)
        end, uId)
    end, uId)
end

-- 标记邮件已读
function MailSystem:csMailReadReq(mailIds, uId, player)
    PlatSystem.MailCommon.setMailsReadState(function(ids)
        local cache = self:getCache(uId)
        for _, id in ipairs(ids or {}) do if cache.mails[id] then cache.mails[id].read = true end end
        self:updateMailVersion(uId)
        Router.Client.CsMailReadResp({ mails = ids or {} }, player)
    end, uId, mailIds, true)
end

-- 删除指定邮件
function MailSystem:csMailDeleteReq(mailIds, uId, player)
    PlatSystem.MailCommon.deleteMails(function(ids)
        local cache = self:getCache(uId)
        for _, id in ipairs(ids or {}) do cache.mails[id] = nil end
        self:updateMailVersion(uId)
        Router.Client.CsMailDeleteResp({ mails = ids or {} }, player)
    end, uId, mailIds)
end

-- 删除所有已读邮件
function MailSystem:csMailDeleteAllReadReq(uId, player)
    PlatSystem.MailCommon.deleteAllReadMails(function(ids)
        local cache = self:getCache(uId)
        for _, id in ipairs(ids or {}) do cache.mails[id] = nil end
        self:updateMailVersion(uId)
        Router.Client.CsMailDeleteResp({ mails = ids or {} }, player)
    end, uId)
end

-- 发放邮件奖励到玩家（金币等）
function MailSystem:giveRewardToPlayer(uId, player, mailId, rewards)
    for _, reward in ipairs(rewards or {}) do
        if reward.resType == EResourceType.Coins and (tonumber(reward.resCount) or 0) > 0 then
            local roundId = reward.roundId or ESpecialRoundId.MailAward
            local oddsType = reward.oddsType or 0
            player:addCoins(roundId, oddsType, ECoinsOperateType.MailAdd, reward.resCount, function(code, _, backPlayer)
                local target = backPlayer or player
                if code ~= 0 then PlatSystem.MailCommon.rsetMailsRewardState(nil, uId, mailId) end -- 失败回滚
                Router.Client.CsMailRewardReceiveResp({ errorCode = code, mailId = mailId, reward = reward }, target)
            end)
        end
    end
end

-- 领取邮件奖励：先通知平台标记领取，再发放奖励
function MailSystem:csMailRewardReceiveReq(mailIds, uId, player)
    PlatSystem.MailCommon.setMailsRewardReceived(function(mails)
        local cache = self:getCache(uId)
        for _, mail in ipairs(mails or {}) do
            local id = mail.mailId
            if cache.mails[id] then
                cache.mails[id].rewardState = EMailRewardState.Received -- 标记已领取
                cache.mails[id].read = true
            end
            self:giveRewardToPlayer(uId, player, id, mail.rewards) -- 发放奖励
        end
        self:updateMailVersion(uId)
    end, uId, mailIds)
end
