-- ============================================================
-- MailPSystem 模块：玩家邮件子系统
-- 继承自 SystemBase，作为 Player 的子系统挂载在玩家实例上。
-- 负责将客户端的邮件请求转发给服务器级 MailSystem 处理，
-- 本身不持久化邮件数据，仅做请求路由与UID提取。
-- ============================================================

require "GameBase.SystemBase"
require "CommomDefine"

MailPSystem = class__(SystemBase)

-- 构造函数：以玩家实例为宿主，注册子系统名称"MailPSystem"
function MailPSystem:ctor__(player)
    SystemBase.ctor__(self, "MailPSystem", player)
end

-- 玩家进入时触发：交由基类处理通用进入逻辑
function MailPSystem:onEnter()
    SystemBase.onEnter(self)
end

-- 整点回调：交由基类处理（邮件过期清理等逻辑由MailSystem负责）
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