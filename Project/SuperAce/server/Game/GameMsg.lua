require "ServerType"
require "Receiver"


---------------------------FromGameCenterMsg-------------------------------------
local FromGameCenterMsg = Receiver:getReceiver(ServerType.ST_GameCenter)
function FromGameCenterMsg.TestProto(msg)
    
end
