require "GameBase.SystemBase"
require "GameBase.PlatSystem"
require "Rank.RankCommon"
require "Rank.RankCfgMgr"

RankPSystem = class__(SystemBase)
local rates = { 45,20,13,8,5,3,2,2,1,1 }
function RankPSystem:ctor__(player)
    SystemBase.ctor__(self, "RankPSystem", player)
    self.awardCountShow = 5
    self.rankNum = 0
    self.pullRankTick = 1000
    self.pullRankTimer = nil
end

function RankPSystem:onEnter()
    SystemBase.onEnter(self)
    self:pullRankData()
    self:pullDayRankAward()
    self:pullWeekRankAward()
end

function RankPSystem:onOClock(hour)
    SystemBase.onOClock(self, hour)
    self.player:addOnceTimer(1000, function()
        if self.rankNum > 0 and self.rankNum <= #rates then
            self:pullDayRankAward()
            self:pullWeekRankAward()
        end
    end)
end
function RankPSystem:getRankCommon()
    if RankCfgMgr:isPlatformOpen() then return PlatSystem.RankCommon end
    return SvrSystem.RankCommon
end

function RankPSystem:addPullRankDataTimer()
    self:removePullRankDataTimer()
    self.pullRankTimer = self.player:addTimer(1000, self.pullRankTick, -1, function()
        self:pullRankData()
    end)
end

function RankPSystem:removePullRankDataTimer()
    if self.pullRankTimer then
        self.player:removeTimer(self.pullRankTimer)
        self.pullRankTimer = nil
    end
end

function RankPSystem:pullRankData()
    local common = self:getRankCommon()
    if RankCfgMgr:isPlatformOpen() then
        return common.getTodayRealTimeRankUsers(function(data) self:pushSelfRankInfo(data) end)
    end
    common.getTodayRealTimeRankUsers(function(data) self:pushSelfRankInfo(data) end)
end

function RankPSystem:pullDayRankAward()
    self:_pushAward("day", "ScDayRankAwardPush")
end

function RankPSystem:pullWeekRankAward()
    self:_pushAward("week", "ScWeekRankAwardPush")
end

function RankPSystem:pushSelfRankInfo(data)
    local uid = self.player:getUid()
    for _, user in ipairs(data or {}) do
        if user.uid == uid then
            if self.rankNum ~= user.rank then
                self.rankNum = user.rank
                Router.Client.ScTodayRealTimeRankPush({
                    timestamp = app__:time_s() * 1000,
                    timezone = app__:time_zone(),
                    uid = uid,
                    rank = user.rank,
                }, self.player)
            end
            if not self.pullRankTimer then self:addPullRankDataTimer() end
            return
        end
    end
    if self.rankNum > 0 and self.rankNum <= #rates then
        self:pullDayRankAward()
        self:pullWeekRankAward()
    end
    self.rankNum = 0
    self:removePullRankDataTimer()
end
function RankPSystem:updateRankList(score)
    -- Keep the game-local turnover board in sync for the LuxuryCarR scene, then
    -- mirror the same successful wager to the cross-game platform board.
    SvrSystem.RankCommon.updateRankList(function()
            local game = self.player:getSystem(LuxuryCarRConst.gameName)
            if game and game.scene then
                game.scene:broadcast("onRankListChange", { rankList = game.scene:rankList() })
            end
            self:pullRankData()
        end, self.player:getUid(), score, self.player:getName(), self.player:getAvatarUrl())
    if RankCfgMgr:isRankOpen() and RankCfgMgr:isPlatformOpen() then
        PlatSystem.RankCommon.updateRankList(function() self:pullRankData() end, self.player:getUid(), score, self.player:getName(), self.player:getAvatarUrl())
    end
end

function RankPSystem:CsGetTodayRealTimeRankReq()
    local common = self:getRankCommon()
    local callback = function(list)
        if RankCfgMgr:isPlatformOpen() then
            local item = list or { timestamp = app__:time_s() * 1000, timezone = app__:time_zone(), uid = self.player:getUid(), rank = 0 }
            return Router.Client.CsGetTodayRealTimeRankResp(item, self.player)
        end
        local mine = { timestamp = app__:utc_milli_s(), timezone = app__:time_zone(), uid = self.player:getUid(), rank = 0 }
        for _, item in ipairs(list) do
            if item.uid == mine.uid then
                mine.rank = item.rank; 
                break
            end
        end
        Router.Client.CsGetTodayRealTimeRankResp(mine, self.player)
    end
    if RankCfgMgr:isPlatformOpen() then 
        common.csGetTodayRealTimeRankReq(callback, self.player:getUid())
    else
        common.getTodayRealTimeRankUsers(callback) 
    end
end

function RankPSystem:CsGetRankListByDateStrReq(msg)
    local dateStr = type(msg) == "string" and msg or (msg and msg.dateStr or os.date("%Y-%m-%d"))
    local common = self:getRankCommon()
    common.getRankListByDateStr(function(users) Router.Client.CsGetRankListByDateStrResp({ dateStr = dateStr, rankUsers = users }, self.player) end, dateStr)
end

function RankPSystem:_pushAward(kind, route)
    if RankCfgMgr:isPlatformOpen() then
        local getter = kind == "day" and self:getRankCommon().getDayRankUsers or self:getRankCommon().getWeekRankUsers
        return getter(function(users)
            for _, user in ipairs(users or {}) do
                if user.uid == self.player:getUid() then
                    local shown = {}
                    for i = 1, math.min(#users, 5) do 
                        shown[i] = users[i] 
                    end
                    return Router.Client[route]({ uid = user.uid, rank = user.rank, bonus = user.bonus, score = user.score, rankUsers = shown }, self.player)
                end
            end
        end)
    end
    local common = self:getRankCommon()
    local award = common.getAward(kind, self.player:getUid())
    if not award then return end
    local list = common.getRankListByDateStrSync(award.date, 5)
    Router.Client[route]({ uid = award.uid, rank = award.rank, bonus = award.bonus, score = award.score, rankUsers = list }, self.player)
end

function RankPSystem:CsDayRankAwardReq() self:_pushAward("day", "ScDayRankAwardPush") end

function RankPSystem:CsWeekRankAwardReq() self:_pushAward("week", "ScWeekRankAwardPush") end

function RankPSystem:_receive(kind, route)
    if RankCfgMgr:isPlatformOpen() then
        local common, uid, gameId = self:getRankCommon(), self.player:getUid(), gApp:getServerId()
        local request = kind == "day" and common.csReceiveDayAwardReq or common.csReceiveWeekAwardReq
        return request(function(data)
            if not data or (data.bonus or 0) <= 0 then return Router.Client[route]({ code = -1, accountDiamond = self.player:getCoins(), bonus = 0 }, self.player) end
            common.awardReqStatis(nil, gameId, uid, data.bonus, data.score, kind == "week")
            self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, data.bonus, function(code, orderId, backPlayer)
                local player = backPlayer or self.player
                if code == 0 then common.awardSucStatis(nil, gameId, uid, data.bonus, orderId, player:getCoins()) end
                Router.Client[route]({ code = code, accountDiamond = player:getCoins(), bonus = data.bonus }, player)
            end, { win_id = "-1" })
        end, uid, gameId)
    end
    local common = self:getRankCommon()
    local award = common.claimAward(kind, self.player:getUid())
    if not award or (award.bonus or 0) <= 0 then return Router.Client[route]({ code = -1, accountDiamond = self.player:getCoins(), bonus = 0 }, self.player) end
    local uid, gameId = self.player:getUid(), gApp:getServerId()
    common.awardReqStatis(nil, gameId, uid, award.bonus, award.score, kind == "week")
    self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, award.bonus, function(code, orderId, backPlayer)
        local player = backPlayer or self.player
        if code == 0 then
            common.awardSucStatis(nil, gameId, uid, award.bonus, orderId, player:getCoins())
        end
        Router.Client[route]({ code = code, accountDiamond = player:getCoins(), bonus = award.bonus }, player)
    end, { win_id = "-1" })
end

function RankPSystem:CsReceiveDayAwardReq() self:_receive("day", "CsReceiveDayAwardResp") end

function RankPSystem:CsReceiveWeekAwardReq() self:_receive("week", "CsReceiveWeekAwardResp") end
