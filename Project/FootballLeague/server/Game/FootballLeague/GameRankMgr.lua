require "GameBase.GameSystemBase"
require "GameError"
require "FootballLeague.GameUtils"
require "Rank.RankData"
require "FootballLeague.FootballLeagueCfgMgr"
require "CommomDefine"

GameRankMgr = class__(GameSystemBase)

--构造函数
function GameRankMgr:ctor__()
    GameSystemBase.ctor__(self, "GameRankMgr")
    self.resetHour = 12  --重置时间点
end

--数据加载回调
function GameRankMgr:onLoad(data)
    if not data then 
        data = {rankDataList = {}, lastResetTime = 0}
    end

    if not self:checkIsSameDay(data.lastResetTime) then
        data = {rankDataList = {}, lastResetTime = os.time()}
    end
    local showRankCount = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.ShowRankCount) or 20
    self.dayRevenueRank = RankData(showRankCount, data.rankDataList)
    GameSystemBase.onLoad(self, data)
end

function GameRankMgr:onOClock(hour)
   if hour == self.resetHour then
        self:resetRevenueInfo()      
   end     
end

function GameRankMgr:updateData(cb, data)
    local rankHaveChange = self.dayRevenueRank:updateRankList(data)
    if rankHaveChange then
        local dataList = self.dayRevenueRank:getRankDataList()
        local sysData = self:getData()
        local lastResetTime = sysData.lastResetTime
        self:resetData({lastResetTime = lastResetTime, rankDataList = dataList})
    end 
    cb()
end

--GameSystemBase 接口调用不改变，写法稍变
function GameRankMgr:getRankList(cb)
    cb(self.dayRevenueRank:getRankList())
end

function GameRankMgr:checkIsSameDay(lastResetTime)
    if not lastResetTime then
        local data = self:getData() 
        lastResetTime = data and data.lastResetTime or 0
    end
    local nowTime = os.time()
    return GameUtils:isSameDay(lastResetTime, nowTime)
end

function GameRankMgr:resetRevenueInfo()
    if not self:checkIsSameDay() then
        self:clearRankData()
    end
end

function GameRankMgr:clearRankData()
    self:resetData({lastResetTime = os.time(), rankDataList = {}})
    self.dayRevenueRank:clear()
end
