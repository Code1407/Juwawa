require "GameBase.SystemBase"
require "CommomDefine"

MailPSystem = class__(SystemBase)

function MailPSystem:ctor__(player)
    SystemBase.ctor__(self, "MailPSystem", player)
end

function MailPSystem:onEnter()
    SystemBase.onEnter(self)
end

function MailPSystem:onOClock(hour)
    SystemBase.onOClock(self, hour)
end

------------------NetMsg-----------------------

--请求邮件列表
function MailPSystem:CsMailListReq()
    local uId = self.player:getUid()
    SvrSystem.MailSystem.csMailListReq(uId, self.player)
end

--请求读取邮件
function MailPSystem:CsMailReadReq(msg)
    if msg and msg.mails and #msg.mails > 0 then
        local uId = self.player:getUid()
        SvrSystem.MailSystem.csMailReadReq(msg.mails, uId, self.player)
    end
end

--请求删除邮件
function MailPSystem:CsMailDeleteReq(msg)
    if msg and msg.mails and #msg.mails > 0 then
        local uId = self.player:getUid()
        SvrSystem.MailSystem.csMailDeleteReq(msg.mails, uId, self.player)
    end
end

--请求删除所有已读邮件
function MailPSystem:CsMailDeleteAllReadReq()
    local uId = self.player:getUid()
    SvrSystem.MailSystem.csMailDeleteAllReadReq(uId, self.player)
end

--请求邮件邮件领奖
function MailPSystem:CsMailRewardReceiveReq(msg)
    if msg and msg.mails and #msg.mails > 0 then
        local uId = self.player:getUid()
        SvrSystem.MailSystem.csMailRewardReceiveReq(msg.mails, uId, self.player)
    end
end