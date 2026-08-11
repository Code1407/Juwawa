require "Player"
require "FortuneSlot.FortuneSlotCommon"

local function getFortuneSlotSys(player)
    return player:getSystem(FortuneSlotConst.gameName)
end

function Player:CsSyncTimeReq(msg)
    return { cTime = msg.cTime, sTime = app__:time_milli_s() }
end

function Player:CsPlayerBaseDataReq()
    return self:csPlayerBaseDataReq()
end

function Player:enterGame(msg)
    local sys = getFortuneSlotSys(self)
    return FOProtoEncodeEnterGameResp(sys:enterGame(msg))
end

function Player:betNormal(msg)
    local sys = getFortuneSlotSys(self)
    return sys:betNormal(msg.betAmount, msg.calculateAmount, msg.isExtra)
end

function Player:betFree(msg)
    local sys = getFortuneSlotSys(self)
    return sys:betFree()
end

function Player:stopRound(msg)
    local sys = getFortuneSlotSys(self)
    return FOProtoEncodeStopRoundResp(sys:stopRound(msg.roundId))
end

function Player:setBetAmountButton(msg)
    local sys = getFortuneSlotSys(self)
    return sys:setBetAmountButton(msg.betAmountButtonIndex)
end

function Player:updateSettings(msg)
    local sys = getFortuneSlotSys(self)
    return sys:updateSettings(msg.config)
end

function Player:synchronize(msg)
    local sys = getFortuneSlotSys(self)
    return FOProtoEncodeEnterGameResp(sys:synchronize())
end

function Player:test(msg)
    local sys = getFortuneSlotSys(self)
    return sys:test(msg.betAmount, msg.calculateAmount, msg.isExtra)
end

function Player:dbmHeartbeat(msg)
    return { code = 0 }
end


--#region 排行榜

--领取日榜奖励
function Player:CsReceiveDayAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsReceiveDayAwardReq()
    end
end

--领取周榜奖励
function Player:CsReceiveWeekAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsReceiveWeekAwardReq()
    end
end

--请求昨日日榜可领奖
function Player:CsDayRankAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsDayRankAwardReq()
    end
end

--上周周榜可领奖
function Player:CsWeekRankAwardReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsWeekRankAwardReq()
    end
end

--拉取实时排名
function Player:CsGetTodayRealTimeRankReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsGetTodayRealTimeRankReq()
    end
end

--拉取榜单
function Player:CsGetRankListByDateStrReq(msg)
    local sys = self:getSystem("RankPSystem")
    if sys and msg and msg.dateStr then
        sys:CsGetRankListByDateStrReq(msg.dateStr)
    end
end

--#endregion


--#region 邮件

--请求邮件列表
function Player:CsMailListReq()
    local sys = self:getSystem("MailPSystem")
    if sys then
        sys:CsMailListReq()
    end
end

--请求读取邮件
function Player:CsMailReadReq(msg)
    local sys = self:getSystem("MailPSystem")
    if sys then
        sys:CsMailReadReq(msg)
    end
end

--请求删除邮件
function Player:CsMailDeleteReq(msg)
    local sys = self:getSystem("MailPSystem")
    if sys then
        sys:CsMailDeleteReq(msg)
    end
end

--请求删除所有已读邮件
function Player:CsMailDeleteAllReadReq()
    local sys = self:getSystem("MailPSystem")
    if sys then
        sys:CsMailDeleteAllReadReq()
    end
end

--请求邮件邮件领奖
function Player:CsMailRewardReceiveReq(msg)
    local sys = self:getSystem("MailPSystem")
    if sys then
        sys:CsMailRewardReceiveReq(msg)
    end
end

--#endregion
