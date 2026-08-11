require "GameBase.SvrSystemBase"

-- Local implementation used when the platform ranking service is unavailable.
-- It is persisted by SvrSystemBase and has deterministic score/tie ordering.
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
    -- Monday starts a new ranking week; settle the week that ended yesterday.
    if tonumber(os.date("%w", now)) == 1 then
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
    end
    local map, out = self:getData().dates[dateStr] or {}, {}
    for _, item in pairs(map) do table.insert(out, normalizeRankItem(LCClone(item))) end
    sortRank(out)
    for i, item in ipairs(out) do item.rank = i end
    while #out > safeNumber(count or self.maxSize, self.maxSize) do table.remove(out) end
    return out
end

function RankCommon:finalize(dateStr, kind)
    if not dateStr or self:getData().finalized and self:getData().finalized[kind .. ":" .. dateStr] then return end
    local users, total = self:getRankListByDateStrSync(dateStr, self.maxSize), 0
    for _, user in ipairs(users) do total = total + safeNumber(user.score, 0) end
    local rate = kind == "week" and 0.0006 or 0.0008
    local rates, pool = { 45,20,13,8,5,3,2,2,1,1 }, math.floor(total * rate)
    self:getData().finalized = self:getData().finalized or {}
    self:getData().finalized[kind .. ":" .. dateStr] = true
    for i = 1, math.min(#users, #rates) do
        local user, bonus = users[i], math.floor(pool * rates[i] / 100)
        self:getData().awards[awardKey(kind, dateStr, user.uid)] = { kind = kind, uid = user.uid, rank = i, score = user.score, bonus = bonus, claimed = false, date = dateStr }
    end
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
    callback(self:getRankListByDateStrSync(os.date("%Y-%m-%d"), self.maxSize))
end

function RankCommon:getTodayRealTimeRankByUid(uid)
    uid = safeString(uid, "")
    for _, item in ipairs(self:getRankListByDateStrSync(os.date("%Y-%m-%d"), self.maxSize)) do
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
    record.claimed = true -- persist claim before crediting; prevents repeat reward on retransmit
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
