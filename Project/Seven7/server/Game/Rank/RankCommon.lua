require "GameBase.GameSystemBase"
require "Rank.RankCfgMgr"
require "Rank.RankData"

RankCommon = class__(GameSystemBase)

function RankCommon:ctor__()
  GameSystemBase.ctor__(self, "RankCommon")
  -- 热数据计算逻辑
  self.today = app__:time_s()
  self.isOnLoad = false
  self.isOnPlatInfoChanged = false
  self.isInitRankAward = false
  -- IRankUserInfo {
  -- uid: string;
  -- avatar: string;
  -- name: string;
  -- rank: number;   // 排名
  -- bonus: number;  // 奖金
  -- score: number;  // 总分，在服务器用，客户端不用
  -- get: boolean;
  -- }
  self.dayRankUsers = {}       -- IRankUserInfo[]
  self.weekRankUsers = {}      -- IRankUserInfo[]
  self.todayRealTimeUsers = {} -- IRankUserInfo[]
  self.dayGetAwardUser = {}    -- { [uid] = true } 当日已领日榜奖
  self.weekGetAwardUser = {}   -- { [uid] = true } 本周已领周榜奖

  self.dayRankData = nil
  self.weekRankData = nil
end

-- heartbeat 清理：manyDayRankUsers 保留 14 天；dayRankList/dayRankAward 保留 7 天；周榜约 30 天
local DAY_RANK_MAX = 1000
local WEEK_RANK_MAX = 2000
local KEEP_MANY_DAY_RANK_USERS_DAYS = 14
local KEEP_DAY_RANK_LIST_DAYS = 7
local KEEP_WEEK_RANK_LIST_DAYS = 30
local ETradeType = { tradeIn = "tradeIn", tradeOff = "tradeOff" }
local ERankType = { rankDay = "rankDay", rankWeek = "rankWeek" }
local ERankSaveData = {
  infoUsers = "infoUsers",
  manyDayRankUsers = "manyDayRankUsers",
  dayRankList = "dayRankList",
  weekRankList = "weekRankList",
  dayRankAward = "dayRankAward",
  weekRankAward = "weekRankAward"
}

--#region local

local function _addDays(d, days)
  local t = { year = d.year, month = d.month, day = d.day + days, hour = 0, min = 0, sec = 0 }
  return os.date("*t", os.time(t))
end

local function _getYesterday(d)
  return _addDays(d, -1)
end

local function _getLastWeek(d)
  return _addDays(d, -7)
end

local function _dateId(d)
  return string.format("%04d-%02d-%02d", d.year, d.month, d.day)
end

local function _safeToNumber(v, default_v)
  local n = tonumber(v)
  if n == nil then
    return default_v or 0
  end
  return n
end

local function _buildRuntimeRankMap(scoreMap)
  local rankMap = {}
  if type(scoreMap) ~= "table" then
    return rankMap
  end

  -- 存档保持uid->score；这里只构造RankData需要的运行时对象。
  for uid, score in pairs(scoreMap) do
    rankMap[uid] = {
      uid = uid,
      score = _safeToNumber(score, 0),
      updateTime = 0
    }
  end
  return rankMap
end

-- 按日归档用：IRankUserInfo 为扁平表，逐行浅拷贝即可与 self.dayRankUsers 后续修改隔离
local function _cloneRankUserList(src)
  if type(src) ~= "table" or #src == 0 then
    return {}
  end
  local out = {}
  for i = 1, #src do
    local row = src[i]
    if type(row) == "table" then
      local copy = {}
      for k, v in pairs(row) do
        copy[k] = v
      end
      out[#out + 1] = copy
    end
  end
  return out
end

local function _isDateIdKey(k)
  return type(k) == "string" and k:match("^%d%d%d%d%-%d%d%-%d%d$") ~= nil
end

local function _parseWeekKey(k)
  local y, w = string.match(k, "^(%d+):(%d+)$")
  if not y then
    return nil, nil
  end
  return tonumber(y), tonumber(w)
end

local function _weekKeyBefore(a, b)
  local ya, wa = _parseWeekKey(a)
  local yb, wb = _parseWeekKey(b)
  if not ya or not yb then
    return false
  end
  return ya < yb or (ya == yb and wa < wb)
end

local function _parseDate(time)
  local timestamp = _safeToNumber(time, app__:time_s())
  return os.date("*t", timestamp)
end

-- 与 todayWday0（周日=0 … 周六=6）一致：按周日~周六自然周编号
local function _getWeekIdByDate(d)
  local wday0 = (d.wday - 1) % 7
  local weekSunday = _addDays(d, -wday0)
  local jan1 = os.date("*t", os.time({ year = d.year, month = 1, day = 1, hour = 12, min = 0, sec = 0 }))
  local yearWeek1Sunday = _addDays(jan1, -((jan1.wday - 1) % 7))
  local weekTs = os.time({
    year = weekSunday.year,
    month = weekSunday.month,
    day = weekSunday.day,
    hour = 12,
    min = 0,
    sec = 0
  })
  local yearTs = os.time({
    year = yearWeek1Sunday.year,
    month = yearWeek1Sunday.month,
    day = yearWeek1Sunday.day,
    hour = 12,
    min = 0,
    sec = 0
  })
  local diffDays = math.floor((weekTs - yearTs) / 86400)
  local weekNum = math.floor(diffDays / 7) + 1
  return string.format("%d:%d", d.year, weekNum)
end

local function _rankListTop(rankListMap, count)
  local rows = {}
  if type(rankListMap) ~= "table" then
    return {}
  end
  for uid, score in pairs(rankListMap) do
    rows[#rows + 1] = { uid = uid, score = _safeToNumber(score, 0) }
  end
  table.sort(rows, function(a, b)
    return a.score > b.score
  end)
  local out = {}
  local cap = math.min(#rows, count or #rows)
  for i = 1, cap do
    out[rows[i].uid] = rows[i].score
  end
  return out
end

local function _forRankUserByUid(rankUsers, uid, fn)
  if type(rankUsers) ~= "table" then
    return
  end
  for i = 1, #rankUsers do
    local rankUser = rankUsers[i]
    if rankUser and rankUser.uid == uid then
      fn(rankUser)
      break
    end
  end
end

-- 汇总待发放奖励并清零 awardMap；scoreByUid 来自 dayRankList/weekRankList，与热榜 dayRankUsers 解耦
local function _collectExpiredRankAwards(expiresAward, scoreByUid)
  local giveUpData = {}
  for uid, bonusStr in pairs(expiresAward) do
    local bonus = _safeToNumber(bonusStr, 0)
    if bonus > 0 then
      giveUpData[#giveUpData + 1] = { uid = uid, score = _safeToNumber(scoreByUid and scoreByUid[uid], 0), bonus = bonus }
    end
    expiresAward[uid] = 0
  end
  return giveUpData
end

-- dayRankUsers / weekRankUsers：以持久化 awardMap 为准，已领(uid=0)则 bonus 归零（用于停止领奖提醒）
local function _syncRankUsersWithAwardMap(rankUsers, awardMap, awardRateCount)
  if type(awardMap) ~= "table" then
    awardMap = {}
  end
  local cap = math.min(#(rankUsers or {}), awardRateCount or 0)
  for i = 1, cap do
    local rankUser = rankUsers[i]
    if rankUser and rankUser.uid then
      local uid = rankUser.uid
      local stored = awardMap[uid]
      if stored ~= nil then
        rankUser.bonus = _safeToNumber(stored, 0)
      elseif _safeToNumber(rankUser.bonus, 0) > 0 then
        awardMap[uid] = rankUser.bonus
      end
    end
  end
  return awardMap
end

local function _collectPruneShortDayKeys(dayRankList, dayRankAward, cutDayList)
  local pruneShortDayKeys = {}
  if type(dayRankList) == "table" then
    for k, _ in pairs(dayRankList) do
      if _isDateIdKey(k) and k < cutDayList then
        pruneShortDayKeys[k] = true
      end
    end
  end
  if type(dayRankAward) == "table" then
    for k, _ in pairs(dayRankAward) do
      if _isDateIdKey(k) and k < cutDayList then
        pruneShortDayKeys[k] = true
      end
    end
  end
  return pruneShortDayKeys
end

--#endregion


function RankCommon:onLoad(data)
    if not data or not next(data) then
        data = { rankData = {} }
    end
    GameSystemBase.onLoad(self, data)

    -- local root = self:getData()
    -- root = {}
    -- self:resetData(root)

    self.isOnLoad = true
    self:initRankData()
    self:pruneOldRankStorage()
    self:tryInitRankAward()  
end

--整点回调
function RankCommon:onOClock(hour)
    GameSystemBase.onOClock(self, hour)
    local now = app__:time_s()
    local nowDate = _parseDate(now)
    local todayDate = _parseDate(self.today)
    if _dateId(nowDate) ~= _dateId(todayDate) then
        self.today = now
        self:pruneOldRankStorage()
        self:onNewDay()
    end
    -- 移除heartbeat后，整点回调作为配置延迟就绪时的重试入口。
    self:tryInitRankAward()
end

function RankCommon:onPlatInfoChanged()
  self.isOnPlatInfoChanged = true
  self:tryInitRankAward()
end

function RankCommon:tryInitRankAward()
  if self.isInitRankAward or not self.isOnLoad or not self.isOnPlatInfoChanged then
    return
  end
  if not RankCfgMgr:isRankConfigReady() then
    return
  end

  self.isInitRankAward = true
  self:initTodayAward(false)
  self:updatetTomorrowAward()
end

function RankCommon:getRankSaveData(fieldName)
  local root = self:getData()
  if type(root) ~= "table" then
    root = {}
    self:resetData(root)
  end
  if type(root.rankData) ~= "table" then
    root.rankData = {}
  end
  local fieldData = root.rankData[fieldName]
  if type(fieldData) ~= "table" then
    fieldData = {}
    root.rankData[fieldName] = fieldData
  end
  return fieldData
end

function RankCommon:getDayRankUsers(cb)
  cb(self.dayRankUsers)
end

function RankCommon:getWeekRankUsers(cb)
  cb(self.weekRankUsers)
end

function RankCommon:getTodayRealTimeRankUsers(cb)
  cb(self.todayRealTimeUsers)
end

function RankCommon:getDayGetAwardUser(cb)
  cb(self.dayGetAwardUser)
end

function RankCommon:getWeekGetAwardUser(cb)
  cb(self.weekGetAwardUser)
end

function RankCommon:getRankListByDateStr(cb, dateStr)
  local manyDayRankUsers = self:getRankSaveData(ERankSaveData.manyDayRankUsers)
  if dateStr == "today" then
    -- 当前日榜读取增量排序结果，历史日期仍读取持久化快照。
    if not self.dayRankData then
      self:rebuildRuntimeRankData()
    end
    local rankList = self.dayRankData:getRankList()
    local scoreTotal = self:getBonusTotal(rankList, false)
    local todayRealTimeUsers = self:getRankUserInfo(rankList, scoreTotal)
    cb(todayRealTimeUsers)
  elseif dateStr == "thisWeek" then
    -- 当前周榜同样复用RankData，避免查询时全量排序。
    if not self.weekRankData then
      self:rebuildRuntimeRankData()
    end
    local rankList = self.weekRankData:getRankList()
    local scoreTotal = self:getBonusTotal(rankList, true)
    local thisWeekRankUsers = self:getRankUserInfo(rankList, scoreTotal)
    cb(thisWeekRankUsers)
  else
    if (manyDayRankUsers[dateStr]) then
      cb(manyDayRankUsers[dateStr])
    else
      cb({})
    end
  end
end

function RankCommon:getTodayRealTimeRankByUid(uid)
    local msg = { 
        timestamp = app__:time_s() * 1000, 
        timezone = app__:time_zone(), 
        uid = uid, 
        rank = 0
    }
    for i = 1, #self.todayRealTimeUsers do
        if self.todayRealTimeUsers[i].uid == uid then
            msg.rank = _safeToNumber(self.todayRealTimeUsers[i].rank, 0)
            break
        end
    end

    for i = 1, #self.dayRankUsers do
        local rankUser = self.dayRankUsers[i]
        if rankUser and rankUser.uid == uid then
            msg.dayBonus = rankUser.bonus
            break
        end
    end

    for i = 1, #self.weekRankUsers do
        local rankUser = self.weekRankUsers[i]
        if rankUser and rankUser.uid == uid then
            msg.weekBonus = rankUser.bonus
            break
        end
    end

    return msg
end

function RankCommon:getRankUserInfo(rankList, bonusTotal)
  local rankUsers = {}
  local infoUsers = self:getRankSaveData(ERankSaveData.infoUsers)
  local isOrderedRankList = type(rankList) == "table" and type(rankList[1]) == "table"

  if isOrderedRankList then
    -- RankData已经维护好顺序，直接生成展示数据，不再进行第二次排序。
    local cap = math.min(#rankList, 99)
    for i = 1, cap do
      local rankItem = rankList[i]
      rankUsers[i] = {
        uid = rankItem.uid,
        avatar = "",
        name = "",
        rank = i,
        bonus = 0,
        score = math.floor(_safeToNumber(rankItem.score, 0)),
        get = false
      }
    end
  else
    -- 历史结算仍使用uid->score map，保留原来的转换逻辑。
    for uid, sc in pairs(rankList or {}) do
      rankUsers[#rankUsers + 1] = {
        uid = uid,
        avatar = "",
        name = "",
        rank = 0,
        bonus = 0,
        score = math.floor(_safeToNumber(sc, 0)),
        get = false
      }
    end
  end

  if #rankUsers == 0 then
    return {}
  end

  if not isOrderedRankList then
    table.sort(rankUsers, function(a, b)
      return a.score > b.score
    end)
  end

  local rates = RankCfgMgr.AwardRate
  local n = math.min(#rankUsers, 99)
  for i = 1, n do
    local item = rankUsers[i]
    item.rank = i
    if i <= #rates then
      item.bonus = math.floor(bonusTotal * (rates[i] / 100))
    end
    local userInfo = infoUsers[item.uid]
    if userInfo then
      item.name = userInfo.name
      item.avatar = userInfo.avatar
    end
  end

  for i = #rankUsers, n + 1, -1 do
    rankUsers[i] = nil
  end
  return rankUsers
end

function RankCommon:getBonusTotal(rankList, isWeek)
    local scoreTotal = 0
    for _, sc in pairs(rankList) do
        -- 兼容旧的uid->score map和RankData返回的有序对象数组。
        if type(sc) == "table" then
        sc = sc.score
        end
        scoreTotal = scoreTotal + _safeToNumber(sc, 0)
    end
    local bonusRateDay = RankCfgMgr.DayBonusRate
    local bonusRateWeek = RankCfgMgr.WeekBonusRate
    local bonusRate = isWeek and bonusRateWeek or bonusRateDay
    local bonusTotal = scoreTotal * bonusRate
    local maxBonusExchange = isWeek and RankCfgMgr.WeekMaxBonusExchange or RankCfgMgr.DayMaxBonusExchange
    local maxBonus = gApp:getCoins(maxBonusExchange * 100) or (maxBonusExchange * 1000) -- 兜底要是获取不到就按默认的一千比例
    return math.min(bonusTotal, maxBonus) or 0
end

function RankCommon:initRankData()
  local rankSaveDataFields = {
    ERankSaveData.infoUsers,
    ERankSaveData.manyDayRankUsers,
    ERankSaveData.dayRankList,
    ERankSaveData.weekRankList,
    ERankSaveData.dayRankAward,
    ERankSaveData.weekRankAward
  }
  for i = 1, #rankSaveDataFields do
    self:getRankSaveData(rankSaveDataFields[i])
  end
  self:rebuildRuntimeRankData()
end

function RankCommon:rebuildRuntimeRankData()
  local todayDate = _parseDate(self.today)
  local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
  local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
  local dayMap = dayRankList[_dateId(todayDate)]
  local weekMap = weekRankList[_getWeekIdByDate(todayDate)]

  -- 加载或跨天时初始化排序一次，后续分数变化只做局部移动。
  self.dayRankData = RankData(DAY_RANK_MAX, _buildRuntimeRankMap(dayMap))
  self.weekRankData = RankData(WEEK_RANK_MAX, _buildRuntimeRankMap(weekMap))
end

function RankCommon:pruneOldRankStorage()
  local todayDate = _parseDate(self.today)
  local manyDayRankUsers = self:getRankSaveData(ERankSaveData.manyDayRankUsers)
  local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
  local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
  local dayRankAward = self:getRankSaveData(ERankSaveData.dayRankAward)
  local weekRankAward = self:getRankSaveData(ERankSaveData.weekRankAward)
  local cutManyDay = _dateId(_addDays(todayDate, -(KEEP_MANY_DAY_RANK_USERS_DAYS - 1)))
  if type(manyDayRankUsers) == "table" then
    for k, _ in pairs(manyDayRankUsers) do
      if _isDateIdKey(k) and k < cutManyDay then
        manyDayRankUsers[k] = nil
      end
    end
  end
  local cutDayList = _dateId(_addDays(todayDate, -(KEEP_DAY_RANK_LIST_DAYS - 1)))
  local pruneShortDayKeys = _collectPruneShortDayKeys(dayRankList, dayRankAward, cutDayList)
  for k, _ in pairs(pruneShortDayKeys) do
    dayRankList[k] = nil
    dayRankAward[k] = nil
  end
  local oldestWeekKeep = _getWeekIdByDate(_addDays(todayDate, -KEEP_WEEK_RANK_LIST_DAYS))
  local pruneWeekKeys = {}
  if type(weekRankList) == "table" then
    for k, _ in pairs(weekRankList) do
      if _weekKeyBefore(k, oldestWeekKeep) then
        pruneWeekKeys[k] = true
      end
    end
  end
  if type(weekRankAward) == "table" then
    for k, _ in pairs(weekRankAward) do
      if _weekKeyBefore(k, oldestWeekKeep) then
        pruneWeekKeys[k] = true
      end
    end
  end
  for k, _ in pairs(pruneWeekKeys) do
    weekRankList[k] = nil
    weekRankAward[k] = nil
  end
end

function RankCommon:updateRankList(cb, uid, score, name, avatar)
    local addScore = _safeToNumber(score, 0)
    local nowTime = app__:time_s()
    local dateObj = _parseDate(nowTime)
    local dateKey = _dateId(dateObj)
    local weekId = _getWeekIdByDate(dateObj)
    local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
    local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
    local infoUsers = self:getRankSaveData(ERankSaveData.infoUsers)
    local dayMap = dayRankList[dateKey]
    if type(dayMap) ~= "table" then
        dayMap = {}
        dayRankList[dateKey] = dayMap
    end
    dayMap[uid] = _safeToNumber(dayMap[uid], 0) + addScore

    local weekMap = weekRankList[weekId]
    if type(weekMap) ~= "table" then
        weekMap = {}
        weekRankList[weekId] = weekMap
    end
    weekMap[uid] = _safeToNumber(weekMap[uid], 0) + addScore

    local userInfo = { name = name, avatar = avatar }
    infoUsers[uid] = userInfo

    if not self.dayRankData or not self.weekRankData then
        -- 异常情况下从当前存档恢复，不能从空榜继续累计。
        self:rebuildRuntimeRankData()
    end
    self.dayRankData:updateRankList({
        uid = uid, 
        score = dayMap[uid],
        updateTime = nowTime
    })

    self.weekRankData:updateRankList({
        uid = uid, 
        score = weekMap[uid],
        updateTime = nowTime
    })

    -- 配置未就绪时只累计分数，避免奖金比例为空导致运行错误。
    if RankCfgMgr:isRankConfigReady() then
        self:updatetTomorrowAward()
    end

    cb()
    log_info("RankCommon updateRankList uid = {}, score = {}", uid, score)
end

function RankCommon:initRankAwardDay(yesterdayKey)
  local todayDate = _parseDate(self.today)
  local claimDayKey = _dateId(todayDate)
  local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
  local manyDayRankUsers = self:getRankSaveData(ERankSaveData.manyDayRankUsers)
  local dayRankAward = self:getRankSaveData(ERankSaveData.dayRankAward)
  local rawRankList = dayRankList[yesterdayKey]
  local yesterdayRankList = _rankListTop(rawRankList, 5000)
  local scoreTotal = self:getBonusTotal(yesterdayRankList, false)
  self.dayRankUsers = self:getRankUserInfo(yesterdayRankList, scoreTotal) or {}
  local archived = manyDayRankUsers[yesterdayKey]
  if type(archived) ~= "table" or #archived == 0 then
    manyDayRankUsers[yesterdayKey] = _cloneRankUserList(self.dayRankUsers)
  end
  if type(dayRankAward[claimDayKey]) ~= "table" then
    dayRankAward[claimDayKey] = {}
  end
  _syncRankUsersWithAwardMap(self.dayRankUsers, dayRankAward[claimDayKey], #RankCfgMgr.AwardRate)
end

function RankCommon:clearDayRankAward()
  local todayDate = _parseDate(self.today)
  local expiredClaimDate = _getYesterday(todayDate)
  local expiredClaimDayKey = _dateId(expiredClaimDate)
  local dayRankAward = self:getRankSaveData(ERankSaveData.dayRankAward)
  local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
  -- 领奖窗口 24h：今天领的是昨天榜，过期的是「昨天」这一天的 claimDayKey
  local expiresAward = dayRankAward[expiredClaimDayKey]
  if type(expiresAward) ~= "table" then
    return
  end
  local scoreByUid = dayRankList[_dateId(_getYesterday(expiredClaimDate))]
  local giveUpData = _collectExpiredRankAwards(expiresAward, scoreByUid)
  self:awardGiveUp(giveUpData, false)
end

function RankCommon:initRankAwardWeek(lastWeekKey)
  local todayDate = _parseDate(self.today)
  local claimWeekKey = _getWeekIdByDate(todayDate)
  local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
  local weekRankAward = self:getRankSaveData(ERankSaveData.weekRankAward)
  local rawRankList = weekRankList[lastWeekKey]
  local rankList = _rankListTop(rawRankList, 10000)
  local scoreTotal = self:getBonusTotal(rankList, true)
  self.weekRankUsers = self:getRankUserInfo(rankList, scoreTotal) or {}
  if type(weekRankAward[claimWeekKey]) ~= "table" then
    weekRankAward[claimWeekKey] = {}
  end
  _syncRankUsersWithAwardMap(self.weekRankUsers, weekRankAward[claimWeekKey], #RankCfgMgr.AwardRate)
end

function RankCommon:clearWeekRankAward()
  local todayDate = _parseDate(self.today)
  local todayWday0 = (todayDate.wday - 1) % 7
  -- 周榜仅在周日开放 24h 领奖；周一跨天后清理昨天（周日）的未领奖励
  if todayWday0 ~= 1 then
    return
  end
  local expiredClaimWeekKey = _getWeekIdByDate(_getYesterday(todayDate))
  local weekRankAward = self:getRankSaveData(ERankSaveData.weekRankAward)
  local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
  local expiresAward = weekRankAward[expiredClaimWeekKey]
  if type(expiresAward) ~= "table" then
    return
  end
  local scoreByUid = weekRankList[expiredClaimWeekKey]
  local giveUpData = _collectExpiredRankAwards(expiresAward, scoreByUid)
  self:awardGiveUp(giveUpData, true)
end

function RankCommon:initTodayAward(statisCanReward)
  local todayDate = _parseDate(self.today)
  local yesterdayKey = _dateId(_getYesterday(todayDate))
  local lastWeekKey = _getWeekIdByDate(_getLastWeek(todayDate))
  -- os.date("%w") 风格：周日=0 … 周六=6（由 *t 的 wday 换算）
  local todayWday0 = (todayDate.wday - 1) % 7
  if todayWday0 ~= 0 then
    self:initRankAwardDay(yesterdayKey)
    if statisCanReward then
        self:canAwardStatis(false)
    end
  else
    self:initRankAwardWeek(lastWeekKey)
    if statisCanReward then
        self:canAwardStatis(true)
    end  
  end
end

function RankCommon:updatetTomorrowAward()
    if not RankCfgMgr:isRankConfigReady() then
        self.todayRealTimeUsers = {}
        return
    end

    if not self.dayRankData or not self.weekRankData then
        self:rebuildRuntimeRankData()
    end

    local todayDate = _parseDate(self.today)
    local todayWday0 = (todayDate.wday - 1) % 7
    local isWeek = (todayWday0 == 6)

    -- 实时奖励预览直接读取增量榜，移除heartbeat中的全量table.sort。
    local rankData = isWeek and self.weekRankData or self.dayRankData
    local rankList = rankData:getRankList()
    local scoreTotal = self:getBonusTotal(rankList, isWeek)
    self.todayRealTimeUsers = self:getRankUserInfo(rankList, scoreTotal)
end

function RankCommon:onNewDay()
  self.dayGetAwardUser = {}
  self.weekGetAwardUser = {}
  self.dayRankUsers = {}
  self.weekRankUsers = {}
  self.todayRealTimeUsers = {}

  -- 日期存档仍由原逻辑维护；排序层从新日期和当前周存档重新构造。
  self:rebuildRuntimeRankData()

  if self.isInitRankAward and RankCfgMgr:isRankConfigReady() then
    self:clearDayRankAward()
    self:clearWeekRankAward()
    self:initTodayAward(true)
    self:updatetTomorrowAward()
  end
end

function RankCommon:getDayAwardData(uid, gameId)
  if self.dayGetAwardUser[uid] then
    log_error("receiveDayAward repeat", "uid:", uid, "gameId:", gameId)
    --cb(nil)
    return
  end
  local todayDate = _parseDate(self.today)
  local claimDayKey = _dateId(todayDate)
  local yesterdayKey = _dateId(_getYesterday(todayDate))
  local dayRankAward = self:getRankSaveData(ERankSaveData.dayRankAward)
  local dayRankList = self:getRankSaveData(ERankSaveData.dayRankList)
  local manyDayRankUsers = self:getRankSaveData(ERankSaveData.manyDayRankUsers)
  local dayAwardMap = dayRankAward[claimDayKey]
  if type(dayAwardMap) ~= "table" then
    log_error("receiveDayAward dayAwardMap not table", "uid:", uid, "gameId:", gameId, "claimDayKey:", claimDayKey)
    --cb(nil)
    return
  end
  local bonus = _safeToNumber(dayAwardMap[uid], 0)
  if bonus == 0 then
    log_error("receiveDayAward bonus == 0", "uid:", uid, "gameId:", gameId, "claimDayKey:", claimDayKey)
    --cb(nil)
    return
  end
  dayAwardMap[uid] = 0
  self.dayGetAwardUser[uid] = true
  local dayListMap = dayRankList[yesterdayKey]
  local score = _safeToNumber(dayListMap and dayListMap[uid], 0)
  _forRankUserByUid(self.dayRankUsers, uid, function(rankUser)
    rankUser.bonus = 0
  end)
  _forRankUserByUid(manyDayRankUsers[yesterdayKey], uid, function(rankUser)
    rankUser.get = true
  end)
  return {bonus = bonus, score = score}
end

function RankCommon:getWeekAwardData(uid, gameId)
  if self.weekGetAwardUser[uid] then
    log_error("receiveWeekAward repeat", "uid:", uid, "gameId:", gameId)
    --cb(nil)
    return
  end
  local todayDate = _parseDate(self.today)
  local claimWeekKey = _getWeekIdByDate(todayDate)
  local lastWeekKey = _getWeekIdByDate(_getLastWeek(todayDate))
  local weekRankAward = self:getRankSaveData(ERankSaveData.weekRankAward)
  local weekRankList = self:getRankSaveData(ERankSaveData.weekRankList)
  local weekAwardMap = weekRankAward[claimWeekKey]
  if type(weekAwardMap) ~= "table" then
    log_error("receiveWeekAward weekAwardMap not table", "uid:", uid, "gameId:", gameId, "claimWeekKey:", claimWeekKey)
    --cb(nil)
    return
  end
  local bonus = _safeToNumber(weekAwardMap[uid], 0)
  if bonus == 0 then
    log_error("receiveWeekAward bonus == 0", "uid:", uid, "gameId:", gameId, "claimWeekKey:", claimWeekKey)
    --cb(nil)
    return
  end
  weekAwardMap[uid] = 0
  self.weekGetAwardUser[uid] = true
  local weekListMap = weekRankList[lastWeekKey]
  local score = _safeToNumber(weekListMap and weekListMap[uid], 0)
  _forRankUserByUid(self.weekRankUsers, uid, function(rankUser)
    rankUser.bonus = 0
  end)
  return {bonus = bonus, score = score}
end

------------------统计-----------------------

--可以领取奖励
function RankCommon:canAwardStatis(isWeek)
    local nowTime = app__:time_s()
    local nowDate = _dateId(_parseDate(nowTime))
    local gameId = gApp:getServerId()
    local rankType = isWeek and ERankType.rankWeek or ERankType.rankDay
    local users = isWeek and self.weekRankUsers or self.dayRankUsers
    if users and #users > 0 then
        for _, user in ipairs(users) do
            local statisInfo = {
                rank_type = rankType,             -- string 日榜还是周榜
                day = nowDate,                    -- string 日期
                game_id = gameId,                 -- string 游戏id
                save_time = nowTime,              -- number 保存时间
                uid = user.uid,                   -- string 玩家uid
                score = user.score,               -- number 玩家得分
                bonus = user.bonus,               -- number 玩家奖金
            }
            gApp:statis(10006, statisInfo)
        end
    end
end

--放弃奖励
function RankCommon:awardGiveUp(giveUpData, isWeek)
    local nowTime = app__:time_s()
    local nowDate = _dateId(_parseDate(nowTime))
    local gameId = gApp:getServerId() -- GameCenter那边没有需要删除
    local rankType = isWeek and ERankType.rankWeek or ERankType.rankDay
    -- 统计玩家放弃领奖round数据
    for i = 1, #giveUpData do
        local playerData = giveUpData[i]
        local rankAwardEntity = {
            rank_type = rankType,             -- string 日榜还是周榜
            day = nowDate,                    -- string 日期
            round = 0,                        -- string 固定值0
            uid = playerData.uid,             -- string 玩家uid
            score = playerData.score,         -- number 玩家得分
            bonus = 0,                        -- number 玩家奖金
            give_up_bonus = playerData.bonus, -- number 放弃奖金
            game_id = gameId,                 -- string 游戏id
            save_time = nowTime               -- number 保存时间
        }
        gApp:statis(10005, rankAwardEntity)
    end
end

--请求领取奖励统计
function RankCommon:awardReqStatis(cb, gameId, uid, bonus, score, isWeek)
    local nowTime = app__:time_s()
    local nowDate = _dateId(_parseDate(nowTime))
    local rankRoundId = self.rankAwarkRoundId

    -- 领奖后统计玩家round数据
    local rankAwardEntity = {
        rank_type = isWeek and ERankType.rankWeek or ERankType.rankDay, -- string 日榜还是周榜
        day = nowDate,                                                  -- string 日期
        round = rankRoundId,                                            -- string 固定值999999
        uid = uid,                                                      -- string 玩家uid
        score = score,                                                  -- number 玩家得分
        bonus = bonus,                                                  -- number 玩家奖金
        game_id = gameId,                                               -- string 游戏id
        save_time = nowTime                                             -- number 保存时间
    }
    gApp:statis(10003, rankAwardEntity)
end

--请求领取奖励成功统计
function RankCommon:awardSucStatis(cb, gameId, uid, bonus, orderID, accountDiamond)
    local nowTime = app__:time_s()
    local nowDate = _dateId(_parseDate(nowTime))
    local rankRoundId = self.rankAwarkRoundId

    -- 领奖后统计玩家trade数据
    local rankAwardTrade = {
        day = nowDate,                    -- string 日期
        round = rankRoundId,              -- string 固定值999999
        uid = uid,                        -- string 玩家uid
        token = "",                       -- string 交易token
        order_type = ETradeType.tradeOff, -- string 交易类型
        diamond = bonus,
        response_id = orderID,            -- string 平台订单号
        account_diamond = accountDiamond, -- number 账户余额
        game_id = gameId,                 -- string 游戏id
        save_time = nowTime               -- number 保存时间
    }
    gApp:statis(10004, rankAwardTrade)
end


------------------NetMsg-----------------------

--领取日榜奖励
function RankCommon:csReceiveDayAwardReq(cb, uId)
    local gameId = gApp:getServerId()
    if not uId or not gameId then
      log_error("csReceiveDayAwardReq parameter error", uId, gameId)
      cb(nil)
      return
    end

    if not RankCfgMgr:isRankOpen() then
        log_error("csReceiveDayAwardReq EnableRank close", uId, gameId)
        cb(nil)
        return
    end
    local data = self:getDayAwardData(uId, gameId)   
    if data then
        cb(data)
        return
    end
    cb(nil)
end

--领取周榜奖励
function RankCommon:csReceiveWeekAwardReq(cb, uId)
    local gameId = gApp:getServerId()
    if not uId or not gameId then
        log_error("csReceiveWeekAwardReq parameter error", uId, gameId)
        cb(nil)
        return
    end

    if not RankCfgMgr:isRankOpen() then
        log_error("csReceiveWeekAwardReq EnableRank close", uId, gameId)
        cb(nil)
        return
    end
    local data = self:getWeekAwardData(uId, gameId)   
    if data then
        cb(data)
        return
    end
    cb(nil)
end

--拉取实时排名
function RankCommon:csGetTodayRealTimeRankReq(cb, uId)
    local data = self:getTodayRealTimeRankByUid(uId)
    if data then
        cb(data)
        return
    end
    cb(nil)
end
