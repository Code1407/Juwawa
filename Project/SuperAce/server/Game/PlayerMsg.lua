
require "Player"

--时间同步
function Player:CsSyncTimeReq(msg)
    return {cTime = msg.cTime, sTime = app__:time_milli_s()}
end

--玩家基础信息请求
function Player:CsPlayerBaseDataReq()
    self:csPlayerBaseDataReq()
end

function Player:CsReceiveDayAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsReceiveDayAwardReq()
    end
end

function Player:CsReceiveWeekAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsReceiveWeekAwardReq()
    end
end

function Player:CsDayRankAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsDayRankAwardReq()
    end
end

function Player:CsWeekRankAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsWeekRankAwardReq()
    end
end

function Player:CsGetTodayRealTimeRankReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsGetTodayRealTimeRankReq()
    end
end

function Player:CsGetRankListByDateStrReq(msg)
    local sys = self:getSystem("RankPSystem")
    if sys and msg and msg.dateStr then
        sys:CsGetRankListByDateStrReq(msg.dateStr)
    end
end

local function _mail(player)
    return player:getSystem("MailPSystem")
end

function Player:CsMailListReq()
    _mail(self):CsMailListReq()
end

function Player:CsMailReadReq(msg)
    _mail(self):CsMailReadReq(msg)
end

function Player:CsMailDeleteReq(msg)
    _mail(self):CsMailDeleteReq(msg)
end

function Player:CsMailDeleteAllReadReq()
    _mail(self):CsMailDeleteAllReadReq()
end

function Player:CsMailRewardReceiveReq(msg)
    _mail(self):CsMailRewardReceiveReq(msg)
end

local function _superAce(player)
    return player:getSystem("SuperAce")
end

function Player:CsSuperAceEnterReq()
    _superAce(self):enterGame()
end

function Player:CsSuperAceBetNormalReq(msg)
    _superAce(self):betNormal(msg.betAmount, msg.calculateAmount)
end

function Player:CsSuperAceBetFreeReq()
    _superAce(self):betFree()
end

function Player:CsSuperAceStopRoundReq(msg)
    _superAce(self):stopRound(msg.roundId)
end

function Player:CsSuperAceSynchronizeReq()
    _superAce(self):synchronize()
end

function Player:CsSuperAceUpdateSettingsReq(msg)
    _superAce(self):updateSettings(msg.playerSettings)
end
