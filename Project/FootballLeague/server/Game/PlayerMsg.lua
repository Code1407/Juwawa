require "Player"

function Player:CsSyncTimeReq(msg)
    return {cTime = msg.cTime, sTime = app__:utc_milli_s()}
end

function Player:CsPlayerBaseDataReq()
    self:csPlayerBaseDataReq()
end

--#region 排行榜

--拉取实时排名
function Player:CsGetTodayRealTimeRankReq()
    local sys = self:getSystem("RankPSystem")
    if sys then
        sys:CsGetTodayRealTimeRankReq()
    end
end


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

--昨日日榜可领奖
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


function Player:CsCurGameInfoReq(msg)
   SvrSystem.FootballLeagueMain.csCurGameInfoReq(self, msg)
end

function Player:CsBetReq(msg)
    local pid = self:getPid()
    SvrSystem.FootballLeagueMain.csBetReq(pid, msg)
end

function Player:CsGameHistoryReq(msg)
    local team_id = msg and msg.team_id and self:setTeamId(msg.team_id) or self:getTeamId()
    local data = SvrSystem.FootballLeagueMain.csGameHistoryReq(team_id)
    if data then
        Router.Client.CsGameHistoryResp(data, self)
    end
end

function Player:CsSelfBetHistoryReq(msg)
    SvrSystem.FootballLeagueMain.csSelfBetHistoryReq(self)
end

function Player:CsRevenueRankReq()
    GameSystem.GameRankMgr.getRankList(function (data)
        if data then
            local result = {list = data}
            Router.Client.CsRevenueRankResp(result, self)
        end
    end)
end

function Player:CsAudioChangeReq(msg)
    if msg then
        self:csAudioChangeReq(msg.openAudio)
    end
end

function Player:CsChipChangeReq(msg)
    if msg then
        self:csChipChangeReq(msg.chipIndex)
    end
end

function Player:CsTeamChangeReq(msg)
    if msg then
        self:csTeamChangeReq(msg.team_id)
    end
end
