require "ServerType"
require "Receiver"


---------------------------FromGameCenterMsg-------------------------------------
local FromGameCenterMsg = Receiver:getReceiver(ServerType.ST_GameCenter)
function FromGameCenterMsg.SendNewMail(msg)
    if msg then
        SvrSystem.MailSystem.receiveNewMail(msg.uId, msg.mailId, msg.mailContent)
        log_info("*********GameMsg SendNewMail************{0}-{1}", msg.uId, msg.mailId)
    end
end
