-- ============================================================
-- GameMsg 模块：跨服消息处理器
-- 本模块负责接收来自 GameCenter（游戏中心）的跨服消息，
-- 并将其分发到对应的业务系统进行处理。
-- 通过 Receiver 机制实现跨服务器进程间的通信。
-- ============================================================

require "ServerType"
require "Receiver"

-- FromGameCenterMsg：GameCenter 消息接收器
-- 从全局 Receiver 管理器中获取专用于接收 GameCenter 服务器
-- 发来消息的接收器实例，后续在其上注册的函数会自动响应
-- 来自 GameCenter 的对应消息。
local FromGameCenterMsg = Receiver:getReceiver(ServerType.ST_GameCenter)
--- 处理 GameCenter 推送的新邮件通知
--- 当玩家在其他服务器或由系统生成的新邮件需要跨服推送到本服时，
--- GameCenter 会通过此接口将邮件信息下发，本服收到后将其
--- 转发给 MailSystem（邮件系统）进行入库和通知玩家。
--- @param msg table 邮件消息体，包含以下字段：
---   - uId         number  玩家唯一标识（跨服通用 ID）
---   - mailId      number  邮件唯一标识
---   - mailContent table   邮件完整内容（标题、正文、附件等）
function FromGameCenterMsg.SendNewMail(msg)
    -- 校验消息体完整性：必须同时包含玩家 ID、邮件 ID 和邮件内容
    -- 缺少任何字段则视为无效消息，直接丢弃
    if msg and msg.uId and msg.mailId and msg.mailContent then
        -- 将有效的新邮件转发给本服邮件系统进行处理
        SvrSystem.MailSystem.receiveNewMail(msg.uId, msg.mailId, msg.mailContent)
    end
end
