-- ============================================================
-- 玩家邮件系统组件模块（单玩家）
-- 继承自SystemBase，作为Player的附属组件注入
-- 所有邮件操作均委托给全局MailSystem处理
-- ============================================================

require "GameBase.SystemBase"

MailPSystem = class__(SystemBase)

-- 构造函数：注册为"MailPSystem"系统
function MailPSystem:ctor__(player)
    SystemBase.ctor__(self, "MailPSystem", player)
end

function MailPSystem:onEnter()
    SystemBase.onEnter(self)
end

-- 每日0点触发：刷新邮件列表
function MailPSystem:onOClock(hour)
    if hour == 0 then
        SvrSystem.MailSystem.csMailListReq(self.player:getUid(), self.player)
    end
end

-- ===== 以下CS消息均委托给全局MailSystem处理 =====

-- 请求邮件列表
function MailPSystem:CsMailListReq()
    SvrSystem.MailSystem.csMailListReq(self.player:getUid(), self.player)
end

-- 标记邮件已读
function MailPSystem:CsMailReadReq(msg)
    SvrSystem.MailSystem.csMailReadReq((msg or {}).mails or {}, self.player:getUid(), self.player)
end

-- 删除邮件
function MailPSystem:CsMailDeleteReq(msg)
    SvrSystem.MailSystem.csMailDeleteReq((msg or {}).mails or {}, self.player:getUid(), self.player)
end

-- 删除所有已读邮件
function MailPSystem:CsMailDeleteAllReadReq()
    SvrSystem.MailSystem.csMailDeleteAllReadReq(self.player:getUid(), self.player)
end

-- 领取邮件奖励
function MailPSystem:CsMailRewardReceiveReq(msg)
    SvrSystem.MailSystem.csMailRewardReceiveReq((msg or {}).mails or {}, self.player:getUid(), self.player)
end
