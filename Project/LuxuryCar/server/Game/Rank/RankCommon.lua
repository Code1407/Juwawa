require "GameBase.SvrSystemBase"
require "Rank.RankCfgMgr"

-- 当平台排行服务不可用时使用的本地实现。
-- 由 SvrSystemBase 持久化，且分数与并列排名顺序确定。
RankCommon = class__(SvrSystemBase)
local function safeNumber(value, defaultValue)
    local numberValue = tonumber(value)
    if numberValue == nil then
        return defaultValue or 0
    end
    return numberValue
end
local function safeString(value, defaultValue)
    local valueType = type(value)
    if valueType == "string" or valueType == "number" then
        return tostring(value)
    end
    return defaultValue or ""
end
local function awardKey(kind, date, uid) return kind .. ":" .. date .. ":" .. uid end
local function normalizeRankItem(item)
    item.score = safeNumber(item.score, 0)
    item.updateTime = safeNumber(item.updateTime, 0)
    item.bonus = safeNumber(item.bonus, 0)
    item.rank = safeNumber(item.rank, 0)
    return item
end
local function sanitizeRankDates(dates)
    local cleanedDates = {}
    if type(dates) ~= "table" then
        return cleanedDates
    end
    for dateStr, map in pairs(dates) do
        local cleanDateStr = safeString(dateStr, nil)
        if cleanDateStr and cleanDateStr ~= "" and type(map) == "table" then
            cleanedDates[cleanDateStr] = cleanedDates[cleanDateStr] or {}
            for uid, item in pairs(map) do
                if type(item) == "table" then
                    local cleanUid = safeString(item.uid, safeString(uid, nil))
                    if cleanUid and cleanUid ~= "" then
                        cleanedDates[cleanDateStr][cleanUid] = normalizeRankItem({
                            uid = cleanUid,
                            score = item.score,
                            name = safeString(item.name, ""),
                            avatar = safeString(item.avatar, ""),
                            updateTime = item.updateTime,
                        })
                    end
                end
            end
        end
    end
    return cleanedDates
end
local function sanitizeRankAwards(awards)
    local cleanedAwards = {}
    if type(awards) ~= "table" then
        return cleanedAwards
    end
    for _, award in pairs(awards) do
        if type(award) == "table" then
            local uid = safeString(award.uid, nil)
            local date = safeString(award.date, nil)
            local kind = award.kind == "week" and "week" or "day"
            if uid and uid ~= "" and date and date ~= "" then
                cleanedAwards[awardKey(kind, date, uid)] = normalizeRankItem({
                    kind = kind,
                    uid = uid,
                    rank = award.rank,
                    score = award.score,
                    bonus = award.bonus,
                    claimed = award.claimed == true,
                    date = date,
                })
            end
        end
    end
    return cleanedAwards
end
function RankCommon:ctor__()
    SvrSystemBase.ctor__(self, "RankCommon")
    self.maxSize = 100
    self.isOnPlatInfoChanged = false
end
function RankCommon:onLoad(data)
    SvrSystemBase.onLoad(self, data or { dates = {}, awards = {}, finalized = {} })
    self:getData().dates = sanitizeRankDates(self:getData().dates)
    self:getData().awards = sanitizeRankAwards(self:getData().awards)
    self:getData().finalized = type(self:getData().finalized) == "table" and self:getData().finalized or {}
end

function RankCommon:onPlatInfoChanged()
    self.isOnPlatInfoChanged = true
end

function RankCommon:onOClock(hour)
    if SvrSystemBase.onOClock then
        SvrSystemBase.onOClock(self, hour)
    end
    if hour == 0 then
        self:onNewDay()
    end
end

function RankCommon:onNewDay()
    local now = app__ and app__.time_s and app__:time_s() or os.time()
    local yesterday = os.date("%Y-%m-%d", now - 24 * 60 * 60)
    self:finalize(yesterday, "day")
    self:canAwardStatis(false)
    -- 与 Seven7 一致：周日开启新的排行周，结算周六结束的上一周。
    if tonumber(os.date("%w", now)) == 0 then
        self:finalize(yesterday, "week")
        self:canAwardStatis(true)
    end
end
local function sortRank(list)
    table.sort(list, function(a, b)
        local scoreA, scoreB = safeNumber(a.score, 0), safeNumber(b.score, 0)
        if scoreA ~= scoreB then
            return scoreA > scoreB
        end
        return safeNumber(a.updateTime, 0) < safeNumber(b.updateTime, 0)
    end)
end

local function dateTime(dateStr)
    local year, month, day = safeString(dateStr, ""):match("^(%d%d%d%d)%-(%d%d)%-(%d%d)$")
    if not year then return nil end
    return os.time({ year = tonumber(year), month = tonumber(month), day = tonumber(day), hour = 12 })
end

local function shiftDate(dateStr, dayOffset)
    local time = dateTime(dateStr)
    if not time then return nil end
    return os.date("%Y-%m-%d", time + dayOffset * 24 * 60 * 60)
end

local function weekStartDate(dateStr)
    local time = dateTime(dateStr)
    if not time then return nil end
    local weekDay = tonumber(os.date("%w", time)) or 0
    return shiftDate(dateStr, -weekDay)
end

local function mergeRankMap(target, source)
    for uid, item in pairs(source or {}) do
        if type(item) == "table" then
            local cleanUid = safeString(item.uid, safeString(uid, ""))
            if cleanUid ~= "" then
                local merged = target[cleanUid] or {
                    uid = cleanUid, score = 0, name = "", avatar = "", updateTime = 0,
                }
                merged.score = safeNumber(merged.score, 0) + safeNumber(item.score, 0)
                if safeNumber(item.updateTime, 0) >= safeNumber(merged.updateTime, 0) then
                    merged.name = safeString(item.name, merged.name)
                    merged.avatar = safeString(item.avatar, merged.avatar)
                    merged.updateTime = safeNumber(item.updateTime, merged.updateTime)
                end
                target[cleanUid] = merged
            end
        end
    end
end

local function buildRankList(map)
    local out = {}
    for _, item in pairs(map or {}) do
        out[#out + 1] = normalizeRankItem(LCClone(item))
    end
    sortRank(out)
    for i, item in ipairs(out) do item.rank = i end
    return out
end

local function aggregateWeekMap(self, endDateStr)
    local startDateStr = weekStartDate(endDateStr)
    local out = {}
    if not startDateStr then return out end
    local currentDateStr = startDateStr
    for _ = 1, 7 do
        if currentDateStr > endDateStr then break end
        mergeRankMap(out, self:getData().dates[currentDateStr])
        currentDateStr = shiftDate(currentDateStr, 1)
    end
    return out
end

local function trimRankList(list, count)
    local maxCount = math.max(0, math.floor(safeNumber(count, 100)))
    while #list > maxCount do table.remove(list) end
    return list
end

function RankCommon:getBonusTotal(rankList, isWeek)
    local scoreTotal = 0
    for _, item in pairs(rankList or {}) do
        scoreTotal = scoreTotal + safeNumber(type(item) == "table" and item.score or item, 0)
    end
    local bonusRate = safeNumber(isWeek and RankCfgMgr.WeekBonusRate or RankCfgMgr.DayBonusRate, 0)
    local maxBonusExchange = safeNumber(isWeek and RankCfgMgr.WeekMaxBonusExchange or RankCfgMgr.DayMaxBonusExchange, 0)
    local fallbackMaxBonus = maxBonusExchange * 1000
    local maxBonus = fallbackMaxBonus
    if gApp and gApp.getCoins then
        maxBonus = gApp:getCoins(maxBonusExchange * 100) or fallbackMaxBonus
    end
    return math.min(scoreTotal * bonusRate, maxBonus)
end

function RankCommon:applyRankBonus(rankList, isWeek)
    local bonusTotal = self:getBonusTotal(rankList, isWeek)
    local awardRates = type(RankCfgMgr.AwardRate) == "table" and RankCfgMgr.AwardRate or {}
    for i, item in ipairs(rankList) do
        item.bonus = i <= #awardRates and math.floor(bonusTotal * safeNumber(awardRates[i], 0) / 100) or 0
        item.get = false
    end
    return rankList
end

function RankCommon:updateRankList(callback, uid, score, name, avatar)
    if callback ~= nil and type(callback) ~= "function" then
        log_error("RankCommon.updateRankList callback invalid")
        callback = nil
    end
    uid = safeString(uid, nil)
    if not uid or uid == "" then
        return
    end
    local date, dates = os.date("%Y-%m-%d"), self:getData().dates
    dates[date] = dates[date] or {}
    local item = dates[date][uid] or { uid = uid, score = 0 }
    item.score, item.name, item.avatar, item.updateTime = safeNumber(item.score, 0) + math.max(0, math.floor(safeNumber(score, 0))), safeString(name, ""), safeString(avatar, ""), app__:utc_s()
    dates[date][uid] = item
    if callback then callback() end
end
function RankCommon:getRankListByDateStrSync(dateStr, count)
    dateStr = safeString(dateStr, os.date("%Y-%m-%d"))
    if dateStr == "today" then
        dateStr = os.date("%Y-%m-%d")
        return trimRankList(self:applyRankBonus(buildRankList(self:getData().dates[dateStr]), false), count or self.maxSize)
    end
    if dateStr == "thisWeek" then
        local today = os.date("%Y-%m-%d")
        return trimRankList(self:applyRankBonus(buildRankList(aggregateWeekMap(self, today)), true), count or self.maxSize)
    end

    local out = buildRankList(self:getData().dates[dateStr])
    for _, item in ipairs(out) do
        local award = self:getData().awards[awardKey("day", dateStr, item.uid)]
        if award then
            item.bonus = safeNumber(award.bonus, 0)
            item.get = award.claimed == true
        end
    end
    return trimRankList(out, count or self.maxSize)
end

function RankCommon:finalize(dateStr, kind)
    kind = kind == "week" and "week" or "day"
    if not dateStr or self:getData().finalized and self:getData().finalized[kind .. ":" .. dateStr] then return end
    if not RankCfgMgr:isRankConfigReady() then
        log_error("RankCommon.finalize rank config not ready", kind, dateStr)
        return
    end
    local rankMap = kind == "week" and aggregateWeekMap(self, dateStr) or self:getData().dates[dateStr]
    local users = self:applyRankBonus(buildRankList(rankMap), kind == "week")
    local rates = type(RankCfgMgr.AwardRate) == "table" and RankCfgMgr.AwardRate or {}
    self:getData().finalized = self:getData().finalized or {}
    self:getData().finalized[kind .. ":" .. dateStr] = true
    for i = 1, math.min(#users, #rates) do
        local user = users[i]
        self:getData().awards[awardKey(kind, dateStr, user.uid)] = {
            kind = kind, uid = user.uid, rank = i, score = user.score,
            bonus = user.bonus, claimed = false, date = dateStr,
        }
    end
end

function RankCommon:getAwardRankUsers(kind, dateStr, count)
    kind = kind == "week" and "week" or "day"
    local sourceMap = kind == "week" and aggregateWeekMap(self, dateStr) or self:getData().dates[dateStr]
    local sourceUsers = sourceMap or {}
    local out = {}
    for _, award in pairs(self:getData().awards or {}) do
        if award.kind == kind and award.date == dateStr then
            local item = normalizeRankItem(LCClone(award))
            local source = sourceUsers[item.uid]
            if source then
                item.name = safeString(source.name, "")
                item.avatar = safeString(source.avatar, "")
                item.updateTime = safeNumber(source.updateTime, 0)
            end
            item.get = award.claimed == true
            out[#out + 1] = item
        end
    end
    table.sort(out, function(a, b) return safeNumber(a.rank, 0) < safeNumber(b.rank, 0) end)
    return trimRankList(out, count or self.maxSize)
end
function RankCommon:getRankListByDateStr(callback, dateStr)
    if type(callback) ~= "function" then
        return log_error("RankCommon.getRankListByDateStr callback invalid")
    end
    callback(self:getRankListByDateStrSync(dateStr, self.maxSize))
end
function RankCommon:getTodayRealTimeRankUsers(callback)
    if type(callback) ~= "function" then
        return log_error("RankCommon.getTodayRealTimeRankUsers callback invalid")
    end
    callback(self:getRankListByDateStrSync("today", self.maxSize))
end

function RankCommon:getTodayRealTimeRankByUid(uid)
    uid = safeString(uid, "")
    for _, item in ipairs(self:getRankListByDateStrSync("today", self.maxSize)) do
        if safeString(item.uid, "") == uid then
            return item
        end
    end
end

function RankCommon:csGetTodayRealTimeRankReq(callback, uid)
    if type(callback) == "function" then
        callback(self:getTodayRealTimeRankByUid(uid))
    end
end

local function getAwardUsers(self, kind)
    local users = {}
    local newestDate = nil
    for _, award in pairs(self:getData().awards or {}) do
        if award.kind == kind and not award.claimed and (not newestDate or award.date > newestDate) then
            newestDate = award.date
        end
    end
    for _, award in pairs(self:getData().awards or {}) do
        if award.kind == kind and not award.claimed and award.date == newestDate then
            users[#users + 1] = normalizeRankItem(LCClone(award))
        end
    end
    table.sort(users, function(a, b)
        if a.date ~= b.date then return a.date > b.date end
        return a.rank < b.rank
    end)
    return users
end

function RankCommon:getDayRankUsers(callback)
    if type(callback) == "function" then callback(getAwardUsers(self, "day")) end
end

function RankCommon:getWeekRankUsers(callback)
    if type(callback) == "function" then callback(getAwardUsers(self, "week")) end
end
function RankCommon:getAward(kind, uid)
    local newest = nil
    for _, award in pairs(self:getData().awards) do
        normalizeRankItem(award)
        if award.uid == uid and award.kind == kind and not award.claimed and (not newest or award.date > newest.date) then newest = award end
    end
    return newest
end
function RankCommon:claimAward(kind, uid)
    local record = self:getAward(kind, uid)
    if not record or record.claimed then return nil end
    record.claimed = true -- 在发奖前持久化领取记录，防止重传时重复发奖
    return record
end


function RankCommon:csReceiveDayAwardReq(callback, uid)
    if type(callback) == "function" then callback(self:getAward("day", safeString(uid, ""))) end
end

function RankCommon:csReceiveWeekAwardReq(callback, uid)
    if type(callback) == "function" then callback(self:getAward("week", safeString(uid, ""))) end
end

local function rankType(isWeek)
    if ERankType then return isWeek and ERankType.rankWeek or ERankType.rankDay end
    return isWeek and "week" or "day"
end

function RankCommon:canAwardStatis(isWeek)
    local users = getAwardUsers(self, isWeek and "week" or "day")
    for _, user in ipairs(users) do
        gApp:statis(10006, {
            rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), game_id = gApp:getServerId(),
            save_time = app__:time_s(), uid = user.uid, score = user.score, bonus = user.bonus,
        })
    end
end

function RankCommon:awardGiveUp(giveUpData, isWeek)
    for _, user in ipairs(giveUpData or {}) do
        gApp:statis(10005, {
            rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), round = 0,
            uid = user.uid, score = user.score, bonus = 0, give_up_bonus = user.bonus,
            game_id = gApp:getServerId(), save_time = app__:time_s(),
        })
    end
end


function RankCommon:awardReqStatis(_callback, gameId, uid, bonus, score, isWeek)
    gApp:statis(10003, {
        rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), round = ESpecialRoundId.RankAward,
        uid = uid, score = score, bonus = bonus, game_id = gameId, save_time = app__:time_s(),
    })
end


function RankCommon:awardSucStatis(_callback, gameId, uid, bonus, orderId, accountDiamond)
    gApp:statis(10004, {
        day = os.date("%Y-%m-%d"), round = ESpecialRoundId.RankAward, uid = uid, token = "",
        order_type = ETradeType and ETradeType.tradeOff or 0, diamond = bonus,
        response_id = orderId, account_diamond = accountDiamond,
        game_id = gameId, save_time = app__:time_s(),
    })
end
