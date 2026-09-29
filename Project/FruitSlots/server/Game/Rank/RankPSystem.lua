require "GameBase.SystemBase"
require "CommomDefine"
require "Rank.RankCfgMgr"

RankPSystem = class__(SystemBase)

local function _buildRankShow(rankUsers, count)
    local out = {}
    if type(rankUsers) ~= "table" then
        return out
    end
    local cap = math.min(#rankUsers, count or 0)
    for i = 1, cap do
        out[i] = rankUsers[i]
    end
    return out
end

local function _pushRankAwardToOnline(msg, uId, awardCountShow)
    if not msg then
        return nil
    end
    for i = 1, #msg do
        local rankUser = msg[i]
        local userUId = rankUser.uid
        if uId == userUId then
            local sendMsg = {
                uid = userUId,
                rank = rankUser.rank,
                bonus = rankUser.bonus,
                score = rankUser.score,
                rankUsers = _buildRankShow(msg, awardCountShow)
            }
            return sendMsg
        end
    end
    return nil
end

function RankPSystem:ctor__(player)
    SystemBase.ctor__(self, "RankPSystem", player)
    self.awardCountShow = 5
    self.rankNum = 0
    self.tick = 1000
    self.timer = nil
end

function RankPSystem:onEnter()
    SystemBase.onEnter(self)
    self:pullRankData()
    self:pullDayRankAward()
    self:pullWeekRankAward()
end

function RankPSystem:onOClock(hour)
    SystemBase.onOClock(self, hour)

    self.player:addOnceTimer(1000, function ()
        if self.rankNum > 0 and self.rankNum <= #RankCfgMgr.AwardRate then
            self:pullDayRankAward()
            self:pullWeekRankAward()
        end
    end)
end

--获取排行榜类型系统
function RankPSystem:getRankCommon()
    if RankCfgMgr:isPlatformOpen() then
        return PlatSystem.RankCommon
    end
    return GameSystem.RankCommon
end

function RankPSystem:addPullRankDataTimer()
    self:removePullRankDataTimer()
    self.timer = self.player:addTimer(1000, self.tick, -1, function()
        self:pullRankData()
    end)
end

function RankPSystem:removePullRankDataTimer()
    if self.timer then
        self.player:removeTimer(self.timer)
        self.timer = nil
    end
end

function RankPSystem:pullRankData()
    local rankCommon = self:getRankCommon()
    rankCommon.getTodayRealTimeRankUsers(function (data)
        self:pushSelfRankInfo(data)
    end)
end

--昨日日榜可领奖
function RankPSystem:pullDayRankAward()
    local uId = self.player:getUid()
    local rankCommon = self:getRankCommon()
    rankCommon.getDayRankUsers(function (data)
        local msg = _pushRankAwardToOnline(data, uId, self.awardCountShow)
        if msg then
            Router.Client.ScDayRankAwardPush(msg, self.player)
        end
    end)
end

--上周周榜可领奖
function RankPSystem:pullWeekRankAward()
    local uId = self.player:getUid()
    local rankCommon = self:getRankCommon()
    rankCommon.getWeekRankUsers(function (data)
        local msg = _pushRankAwardToOnline(data, uId, self.awardCountShow)
        if msg then
            Router.Client.ScWeekRankAwardPush(msg, self.player)
        end
    end)
end

function RankPSystem:pushSelfRankInfo(data)
    if not data then
        return
    end
    for i = 1, #data do
        local rankUser = data[i]
        if rankUser then
            local uId = self.player:getUid()
            if uId == rankUser.uid then
                if self.rankNum ~= rankUser.rank then
                    self.rankNum = rankUser.rank
                    local sendMsg = { 
                        timestamp = app__:time_s() * 1000, 
                        timezone = app__:time_zone(), 
                        uid = rankUser.uid, 
                        rank = rankUser.rank 
                    }
                    Router.Client.ScTodayRealTimeRankPush(sendMsg, self.player)
                    if not self.timer then
                        self:addPullRankDataTimer()
                    end
                end
                return
            end
        end
    end
    --可能是跨天
    if self.rankNum > 0 and self.rankNum <= #RankCfgMgr.AwardRate then
        self:pullDayRankAward()
        self:pullWeekRankAward()
    end
    self.rankNum = 0
    self:removePullRankDataTimer()
end

--更新排行榜数据
function RankPSystem:updateRankList(score)
    if RankCfgMgr:isRankOpen() then
        local uId = self.player:getUid()
        local name = self.player:getName()
        local avatar = self.player:getAvatarUrl()
        local rankCommon = self:getRankCommon()
        rankCommon.updateRankList(function ()
           self:pullRankData()          
        end, uId, score, name, avatar)       
    end
end

------------------NetMsg-----------------------

--拉取实时排名
function RankPSystem:CsGetTodayRealTimeRankReq()
    local uId = self.player:getUid()
    local rankCommon = self:getRankCommon()
    rankCommon.csGetTodayRealTimeRankReq(function (data)
        if data then
            Router.Client.CsGetTodayRealTimeRankResp(data, self.player)
        end
    end, uId)
end

--请求昨日日榜可领奖(2.0用)
function RankPSystem:CsDayRankAwardReq()
    self:pullDayRankAward()
end

--请求上周周榜可领奖(2.0用)
function RankPSystem:CsWeekRankAwardReq()
    self:pullWeekRankAward()
end

--领取日榜奖励
function RankPSystem:CsReceiveDayAwardReq()
    local gameId = gApp:getServerId()
    local uId = self.player:getUid()
    local rankCommon = self:getRankCommon()
    rankCommon.csReceiveDayAwardReq(function (data)
        if data then
            local rankPsys = self.player:getSystem("RankPSystem")
            if rankPsys then
                rankPsys:getRankCommon().awardReqStatis(nil, gameId, uId, data.bonus, data.score, false)
            end
            self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, data.bonus, function (ercode, orderID, backPlayer)
                if not backPlayer then
                    log_error("排行日榜领奖加钱回调backPlayer为nil:uId:{} bonus:{} orderId:{} ercode:{}", uId, data.bonus, orderID, ercode)
                    return
                end
                if ercode ~= 0 then
                    log_error("排行日榜领奖加钱回调有错:uId:{} bonus:{} orderId:{} ercode:{}", uId, data.bonus, orderID, ercode)
                    return
                end

                local accountDiamond = backPlayer:getCoins()
                local rankPsys2 = backPlayer:getSystem("RankPSystem")
                if rankPsys2 then
                    rankPsys:getRankCommon().awardSucStatis(nil, gameId, uId, data.bonus, orderID, accountDiamond)
                end
                local msg = {code = ercode, accountDiamond = accountDiamond, bonus = data.bonus}
                Router.Client.CsReceiveDayAwardResp(msg, backPlayer)
                log_info("排行日榜领奖加钱成功:uId:{} bonus:{} orderId:{}", uId, data.bonus, orderID)
            end, {win_id = "-1"} )
        else
            Router.Client.CsReceiveDayAwardResp({ code = -1, accountDiamond = self.player:getCoins() }, self.player)
        end
    end, uId, gameId)
end

--领取周榜奖励
function RankPSystem:CsReceiveWeekAwardReq()
    local gameId = gApp:getServerId()
    local uId = self.player:getUid()
    local rankCommon = self:getRankCommon()
    rankCommon.csReceiveWeekAwardReq(function (data)
        if data then
            local rankPsys = self.player:getSystem("RankPSystem")
            if rankPsys then
                rankPsys:getRankCommon().awardReqStatis(nil, gameId, uId, data.bonus, data.score, true)
            end
            self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, data.bonus, function (ercode, orderID, backPlayer)
                if not backPlayer then
                    log_error("排行周榜领奖加钱回调backPlayer为nil:uId:{} bonus:{} orderId:{} ercode:{}", uId, data.bonus, orderID, ercode)
                    return
                end
                if ercode ~= 0 then
                    log_error("排行周榜领奖加钱回调有错:uId:{} bonus:{} orderId:{} ercode:{}", uId, data.bonus, orderID, ercode)
                    return
                end

                local accountDiamond = backPlayer:getCoins()
                local rankPsys2 = backPlayer:getSystem("RankPSystem")
                if rankPsys2 then
                    rankPsys:getRankCommon().awardSucStatis(nil, gameId, uId, data.bonus, orderID, accountDiamond)
                end

                local msg = {code = ercode, accountDiamond = accountDiamond, bonus = data.bonus}
                Router.Client.CsReceiveWeekAwardResp(msg, backPlayer)
                log_info("排行周榜领奖加钱成功:uId:{} bonus:{} orderId:{}", uId, data.bonus, orderID)
            end, {win_id = "-1"})
        else
            Router.Client.CsReceiveWeekAwardResp({ code = -1, accountDiamond = self.player:getCoins() }, self.player)
        end
    end, uId, gameId)
end

--拉取榜单
function RankPSystem:CsGetRankListByDateStrReq(dateStr)
    local rankCommon = self:getRankCommon()
    rankCommon.getRankListByDateStr(function (data)
        if data then
            local msg = {dateStr = dateStr, rankUsers = data}
            Router.Client.CsGetRankListByDateStrResp(msg, self.player)
        end
    end, dateStr)
end
