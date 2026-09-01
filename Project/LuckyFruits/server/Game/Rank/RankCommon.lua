-- ============================================================
-- RankCommon 模块：本地排行榜系统（兜底实现）
-- 当平台排行榜服务不可用时使用此本地实现，由 SvrSystemBase
-- 负责持久化。采用积分降序+更新时间升序的确定性排序规则，
-- 支持日榜、周榜（周日为周榜截止日）以及奖励发放与领取全生命周期。
-- ============================================================

require "GameBase.SvrSystemBase"
require "Rank.RankCfgMgr"
require "LuckyFruits.LuckyFruits"

-- Local implementation used when the platform ranking service is unavailable.
-- It is persisted by SvrSystemBase and has deterministic score/tie ordering.
RankCommon = class__(SvrSystemBase)
-- 安全数字转换：非数字时返回默认值，避免配置异常导致后续计算崩溃
local function safeNumber(value, defaultValue)
    local numberValue = tonumber(value)
    if numberValue == nil then
        return defaultValue or 0
    end
    return numberValue
end
-- 安全字符串转换：仅接受字符串/数字，其他类型返回默认值
local function safeString(value, defaultValue)
    local valueType = type(value)
    if valueType == "string" or valueType == "number" then
        return tostring(value)
    end
    return defaultValue or ""
end
-- 生成奖励记录的唯一键：kind(日/周)+日期+UID，用于awards哈希表索引
local function awardKey(kind, date, uid) return kind .. ":" .. date .. ":" .. uid end
-- 归一化排行榜项：将各项数值字段强制转为非空数字，防止脏数据污染排序
local function normalizeRankItem(item)
    item.score = safeNumber(item.score, 0)
    item.updateTime = safeNumber(item.updateTime, 0)
    item.bonus = safeNumber(item.bonus, 0)
    item.rank = safeNumber(item.rank, 0)
    return item
end
-- 清洗持久化的排行榜数据：dates结构为 dateStr -> {uid -> rankItem}
-- 过滤掉非法日期与空UID，确保加载后内存数据结构完整可靠
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
-- 清洗奖励记录：以 kind+date+uid 重组键，统一规整字段类型
-- kind仅接受"week"/"day"两种取值，非法值统一回退为"day"
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
-- 构造函数：maxSize为排行榜容量上限，isOnPlatInfoChanged标记平台信息变更
function RankCommon:ctor__()
    SvrSystemBase.ctor__(self, "RankCommon")
    self.maxSize = 100
    self.isOnPlatInfoChanged = false
end
-- 加载持久化数据：dates(每日积分)、awards(奖励发放记录)、finalized(已结算标记)
-- 加载后立即调用清洗函数确保数据完整性，防止历史脏数据导致排序异常
function RankCommon:onLoad(data)
    SvrSystemBase.onLoad(self, data or { dates = {}, awards = {}, finalized = {} })
    self:getData().dates = sanitizeRankDates(self:getData().dates)
    self:getData().awards = sanitizeRankAwards(self:getData().awards)
    self:getData().finalized = type(self:getData().finalized) == "table" and self:getData().finalized or {}
end

-- 平台信息变更回调：置脏标记，供后续逻辑感知配置可能已更新
function RankCommon:onPlatInfoChanged()
    self.isOnPlatInfoChanged = true
end

-- 整点回调：仅在0点（自然日切换）触发新一天结算流程
function RankCommon:onOClock(hour)
    if SvrSystemBase.onOClock then
        SvrSystemBase.onOClock(self, hour)
    end
    if hour == 0 then
        self:onNewDay()
    end
end

-- 新一天结算：对昨日进行日榜结算并统计上报；若昨日为周日则额外触发周榜结算
function RankCommon:onNewDay()
    local now = app__ and app__.time_s and app__:time_s() or os.time()
    local yesterday = os.date("%Y-%m-%d", now - 24 * 60 * 60)
    self:finalize(yesterday, "day")
    self:canAwardStatis(false)
    -- Keep the same Sunday-Saturday ranking week as Seven7.
    if tonumber(os.date("%w", now)) == 0 then
        self:finalize(yesterday, "week")
        self:canAwardStatis(true)
    end
end
-- 排序规则：积分降序优先，积分相同则按更新时间升序（先达成者排前）
local function sortRank(list)
    table.sort(list, function(a, b)
        local scoreA, scoreB = safeNumber(a.score, 0), safeNumber(b.score, 0)
        if scoreA ~= scoreB then
            return scoreA > scoreB
        end
        return safeNumber(a.updateTime, 0) < safeNumber(b.updateTime, 0)
    end)
end

-- 日期字符串解析为时间戳：固定hour=12避免夏令时/时区切换导致的日期漂移
local function dateTime(dateStr)
    local year, month, day = safeString(dateStr, ""):match("^(%d%d%d%d)%-(%d%d)%-(%d%d)$")
    if not year then return nil end
    return os.time({ year = tonumber(year), month = tonumber(month), day = tonumber(day), hour = 12 })
end

-- 日期偏移：在指定日期基础上加减dayOffset天，返回新的日期字符串
local function shiftDate(dateStr, dayOffset)
    local time = dateTime(dateStr)
    if not time then return nil end
    return os.date("%Y-%m-%d", time + dayOffset * 24 * 60 * 60)
end

-- 计算指定日期所属周的起始日期（周日为一周第一天，与Seven7保持一致）
local function weekStartDate(dateStr)
    local time = dateTime(dateStr)
    if not time then return nil end
    local weekDay = tonumber(os.date("%w", time)) or 0
    return shiftDate(dateStr, -weekDay)
end

-- 合并排行榜映射：将source中各UID的积分累加到target
-- 名称/头像仅在source项的updateTime更近时才覆盖，保证最新信息
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

-- 从哈希映射构造排行榜列表：转换为数组→排序→赋名次
local function buildRankList(map)
    local out = {}
    for _, item in pairs(map or {}) do
        out[#out + 1] = normalizeRankItem(LFClone(item))
    end
    sortRank(out)
    for i, item in ipairs(out) do item.rank = i end
    return out
end

-- 周榜聚合：从周末日期回推周起始，逐日合并7天日榜数据为一张周榜表
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

-- 列表裁剪：超出count的部分从尾部移除，控制返回客户端的数据量
local function trimRankList(list, count)
    local maxCount = math.max(0, math.floor(safeNumber(count, 100)))
    while #list > maxCount do table.remove(list) end
    return list
end

-- 计算奖金总额：按日/周配置的bonusRate×总积分，并受maxBonusExchange封顶
-- maxBonus优先从gApp.getCoins获取实时值，获取失败则回退默认上限×1000
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

-- 按配置的奖励比例分配奖金到各名次玩家
-- 超出AwardRate配置范围的名次不予奖励（bonus=0），所有项get标记为未领取
function RankCommon:applyRankBonus(rankList, isWeek)
    local bonusTotal = self:getBonusTotal(rankList, isWeek)
    local awardRates = type(RankCfgMgr.AwardRate) == "table" and RankCfgMgr.AwardRate or {}
    for i, item in ipairs(rankList) do
        item.bonus = i <= #awardRates and math.floor(bonusTotal * safeNumber(awardRates[i], 0) / 100) or 0
        item.get = false
    end
    return rankList
end
-- 更新当日排行榜：累加玩家当日积分，同步最新名称/头像/更新时间
-- 仅接受有效UID，callback可选用于异步通知调用方完成
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
-- 同步获取指定日期的排行榜列表，支持三种查询模式：
--   "today"     今日实时日榜（含临时奖金计算）
--   "thisWeek"  本周实时周榜（含临时奖金计算）
--   其他日期字符串 已结算的历史日榜（从awards回填奖励状态）
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
-- 结算指定日期与类型的排行榜：生成奖励记录供玩家后续领取
-- 幂等设计：已结算过的日期直接返回，避免重复发奖
-- 前置检查RankCfgMgr就绪状态，未就绪则记录错误并跳过
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

-- 获取指定日期与类型的中奖玩家列表：从awards取出已结算的奖励记录
-- 名称/头像从当日原排行榜补充，按名次升序返回
function RankCommon:getAwardRankUsers(kind, dateStr, count)
    kind = kind == "week" and "week" or "day"
    local sourceMap = kind == "week" and aggregateWeekMap(self, dateStr) or self:getData().dates[dateStr]
    local sourceUsers = sourceMap or {}
    local out = {}
    for _, award in pairs(self:getData().awards or {}) do
        if award.kind == kind and award.date == dateStr then
            local item = normalizeRankItem(LFClone(award))
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
-- 异步查询指定日期排行榜：本地实现同步获取后直接回调
function RankCommon:getRankListByDateStr(callback, dateStr)
    if type(callback) ~= "function" then
        return log_error("RankCommon.getRankListByDateStr callback invalid")
    end
    callback(self:getRankListByDateStrSync(dateStr, self.maxSize))
end
-- 异步获取今日实时排行榜（含临时奖金计算）
function RankCommon:getTodayRealTimeRankUsers(callback)
    if type(callback) ~= "function" then
        return log_error("RankCommon.getTodayRealTimeRankUsers callback invalid")
    end
    callback(self:getRankListByDateStrSync("today", self.maxSize))
end

-- 根据UID获取该玩家在今日实时榜中的名次信息
function RankCommon:getTodayRealTimeRankByUid(uid)
    uid = safeString(uid, "")
    for _, item in ipairs(self:getRankListByDateStrSync("today", self.maxSize)) do
        if safeString(item.uid, "") == uid then
            return item
        end
    end
end

-- 客户端请求今日实时名次：异步返回该UID对应的榜单位置
function RankCommon:csGetTodayRealTimeRankReq(callback, uid)
    if type(callback) == "function" then
        callback(self:getTodayRealTimeRankByUid(uid))
    end
end

-- 获取指定类型中最新一期未领取的奖励用户列表
-- 先扫描出最新日期，再筛选该日期下全部未领奖记录，按日期后名次升序返回
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
            users[#users + 1] = normalizeRankItem(LFClone(award))
        end
    end
    table.sort(users, function(a, b)
        if a.date ~= b.date then return a.date > b.date end
        return a.rank < b.rank
    end)
    return users
end

-- 异步获取日榜最新一期未领取奖励用户列表
function RankCommon:getDayRankUsers(callback)
    if type(callback) == "function" then callback(getAwardUsers(self, "day")) end
end

-- 异步获取周榜最新一期未领取奖励用户列表
function RankCommon:getWeekRankUsers(callback)
    if type(callback) == "function" then callback(getAwardUsers(self, "week")) end
end
-- 获取指定UID与类型下最新一期未领取的奖励记录
function RankCommon:getAward(kind, uid)
    local newest = nil
    for _, award in pairs(self:getData().awards) do
        normalizeRankItem(award)
        if award.uid == uid and award.kind == kind and not award.claimed and (not newest or award.date > newest.date) then newest = award end
    end
    return newest
end
-- 领取奖励：返回奖励记录并把claimed置true防止重发
-- 重要：必须在入账前先持久化领取状态，避免重传导致重复发奖
function RankCommon:claimAward(kind, uid)
    local record = self:getAward(kind, uid)
    if not record or record.claimed then return nil end
    record.claimed = true -- persist claim before crediting; prevents repeat reward on retransmit
    return record
end


-- 客户端请求领取日榜奖励：返回该玩家未领的最新日榜奖励记录
function RankCommon:csReceiveDayAwardReq(callback, uid)
    if type(callback) == "function" then callback(self:getAward("day", safeString(uid, ""))) end
end

-- 客户端请求领取周榜奖励：返回该玩家未领的最新周榜奖励记录
function RankCommon:csReceiveWeekAwardReq(callback, uid)
    if type(callback) == "function" then callback(self:getAward("week", safeString(uid, ""))) end
end

-- 排行榜类型映射：优先使用ERankType枚举，缺失时回退字符串
local function rankType(isWeek)
    if ERankType then return isWeek and ERankType.rankWeek or ERankType.rankDay end
    return isWeek and "week" or "day"
end

-- 结算后可领奖统计上报（stat 10006）：记录每个获奖玩家的类型/日期/积分/奖金
function RankCommon:canAwardStatis(isWeek)
    local users = getAwardUsers(self, isWeek and "week" or "day")
    for _, user in ipairs(users) do
        gApp:statis(10006, {
            rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), game_id = gApp:getServerId(),
            save_time = app__:time_s(), uid = user.uid, score = user.score, bonus = user.bonus,
        })
    end
end

-- 放弃奖励统计上报（stat 10005）：玩家未领取的奖金作为give_up_bonus记录
function RankCommon:awardGiveUp(giveUpData, isWeek)
    for _, user in ipairs(giveUpData or {}) do
        gApp:statis(10005, {
            rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), round = 0,
            uid = user.uid, score = user.score, bonus = 0, give_up_bonus = user.bonus,
            game_id = gApp:getServerId(), save_time = app__:time_s(),
        })
    end
end


-- 奖励请求统计上报（stat 10003）：玩家发起领奖请求时记录
function RankCommon:awardReqStatis(_callback, gameId, uid, bonus, score, isWeek)
    gApp:statis(10003, {
        rank_type = rankType(isWeek), day = os.date("%Y-%m-%d"), round = ESpecialRoundId.RankAward,
        uid = uid, score = score, bonus = bonus, game_id = gameId, save_time = app__:time_s(),
    })
end


-- 奖励发放成功统计上报（stat 10004）：记录订单号、玩家钻石余额、发放金额等
function RankCommon:awardSucStatis(_callback, gameId, uid, bonus, orderId, accountDiamond)
    gApp:statis(10004, {
        day = os.date("%Y-%m-%d"), round = ESpecialRoundId.RankAward, uid = uid, token = "",
        order_type = ETradeType and ETradeType.tradeOff or 0, diamond = bonus,
        response_id = orderId, account_diamond = accountDiamond,
        game_id = gameId, save_time = app__:time_s(),
    })
end
