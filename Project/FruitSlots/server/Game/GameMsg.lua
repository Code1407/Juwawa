-- ============================================================
-- 游戏消息路由模块
-- 处理来自GameCenter服务器的跨服消息
-- ============================================================

require "ServerType"
require "Receiver"

-- 创建GameCenter消息接收器
local FromGameCenterMsg = Receiver:getReceiver(ServerType.ST_GameCenter)

-- 接收并处理来自GameCenter的新邮件推送消息
function FromGameCenterMsg.SendNewMail(msg)
    if msg and msg.uId and msg.mailId and msg.mailContent then
        SvrSystem.MailSystem.receiveNewMail(msg.uId, msg.mailId, msg.mailContent)
    end
end
