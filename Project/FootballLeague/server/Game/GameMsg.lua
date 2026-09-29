require "ServerType"
require "Receiver"


---------------------------FromGameCenterMsg-------------------------------------
local FromGameCenterMsg = Receiver:getReceiver(ServerType.ST_GameCenter)
function FromGameCenterMsg.SendNewMail(msg)
    log_info("GameMsg收到新邮件消息: uId:{0} mailId:{1} sendTime:{2}",  msg.uId, msg.mailId, msg.mailContent.sendTime)
    if msg then
        SvrSystem.MailSystem.receiveNewMail(msg.uId, msg.mailId, msg.mailContent)
    end
end
