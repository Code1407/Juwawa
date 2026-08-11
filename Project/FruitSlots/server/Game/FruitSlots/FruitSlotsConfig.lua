-- ============================================================
-- 水果老虎机配置数据模块
-- 定义中奖线路径、概率表、赔付表等硬编码默认值
-- 以及从配置管理器加载运行时配置的逻辑
-- ============================================================

require "FruitSlots.FruitSlotsCommon"

-- 中奖线路径配置（30条线，每条线由5个格子索引组成）
FRLinePaths = {
    {11, 12, 13, 14, 15},
    {11, 12, 8, 9, 10},
    {11, 12, 3, 14, 15},
    {11, 7, 13, 9, 5},
    {11, 7, 13, 14, 10},
    {6, 12, 13, 14, 10},
    {6, 12, 8, 4, 10},
    {6, 12, 3, 14, 10},
    {6, 7, 13, 9, 10},
    {6, 2, 13, 4, 15},
    {1, 12, 13, 14, 5},
    {1, 12, 8, 14, 5},
    {1, 12, 3, 14, 5},
    {1, 7, 13, 9, 5},
    {1, 2, 8, 14, 15},
    {11, 7, 8, 9, 15},
    {11, 7, 3, 9, 15},
    {11, 2, 13, 4, 15},
    {11, 2, 8, 4, 15},
    {11, 2, 3, 4, 15},
    {6, 7, 8, 9, 10},
    {6, 7, 3, 9, 10},
    {6, 2, 8, 14, 10},
    {6, 2, 3, 4, 10},
    {11, 7, 8, 9, 5},
    {1, 7, 8, 9, 5},
    {1, 7, 3, 9, 5},
    {1, 2, 13, 4, 5},
    {11, 2, 8, 14, 5},
    {1, 2, 3, 4, 5},
}

-- 默认转轮概率表（5个转轮，每个转轮8个符号的概率分布）
FRSlotProbabilitysDefault = {
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0},
    {0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4},
    {0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4},
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1},
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1},
}

-- 符号连线赔付倍率表 [符号ID][连续数-2] = 倍率
FRConnectMultiples = {
    {1, 2, 3},    -- 符号0: 3连1倍, 4连2倍, 5连3倍
    {2, 3, 4},    -- 符号1
    {3, 4, 5},    -- 符号2
    {3, 4, 5},    -- 符号3
    {3, 5, 10},   -- 符号4
    {3, 5, 10},   -- 符号5
    {5, 10, 20},  -- 符号6
    {0, 0, 0},    -- 符号7（特殊符号，无连线赔付）
}

FRBigWinMultiple = 100           -- 大赢倍数阈值（超过此倍数不再触发免费/Jackpot）
FRLineCount = 30                 -- 中奖线总数
FRNewUserRoundDefault = 20       -- 新玩家保护回合数
FRJackpotPeriod = 5000           -- Jackpot周期（每隔多少局重新计算Jackpot投放）
FRJackpotRateDefault = { min = 2, max = 2 } -- Jackpot每周期投放次数范围
FRJackpotPoolIncrRate = 0.02     -- Jackpot奖池增长率（从赢取金额中提取的比例）
FRFreeProbabilityDefault = 0.01  -- 默认免费游戏触发概率
FRFreeCountProbability012 = {0.5, 0.3, 0.2, 0, 0, 0}   -- 普通模式下免费符号数量分布
FRFreeCountProbability345 = {0, 0, 0, 0.6, 0.3, 0.1}   -- 命中模式下免费符号数量分布
FRFreeTimes = {0, 0, 0, 5, 8, 12}                       -- N个免费符号对应的免费旋转次数
FRJackpotCountProbability012 = {0.5, 0.3, 0.2, 0, 0, 0} -- 普通模式下Jackpot符号数量分布
FRJackpotCountProbability345 = {0, 0, 0, 0.7, 0.3, 0}   -- 命中模式下Jackpot符号数量分布
FRJackpotPercentage = {0, 0, 0, 0.05, 0.15, 0.5}        -- N个Jackpot符号对应的奖池提取比例
FRDefaultRateType = FRRateType.normal  -- 默认赔率类型
FRBetAmounts = {100, 1000, 10000, 100000} -- 服务端权威单线下注档位

function FruitSlotsGetBetAmounts()
    local commonConfig = gApp and gApp.getProjCommon and gApp:getProjCommon() or nil
    local costs = type(commonConfig) == "table" and commonConfig.Costs or nil
    local amounts = {}
    if type(costs) == "table" and #costs > 0 then
        for _, cost in ipairs(costs) do
            local amount = tonumber(cost and cost.Coins)
            if not amount or amount <= 0 or amount ~= math.floor(amount) then
                log_error("FruitSlots platform Costs invalid, coins:{0}", amount or 0)
                return FRCloneTable(FRBetAmounts)
            end
            table.insert(amounts, amount)
        end
        return amounts
    end
    return FRCloneTable(FRBetAmounts)
end

function FruitSlotsIsValidBetAmount(betAmount)
    local amount = FRRoundInt(betAmount or 0)
    for _, allowed in ipairs(FruitSlotsGetBetAmounts()) do
        if amount == allowed then return true end
    end
    return false
end

function FruitSlotsBetAmountsMatch(clientAmounts)
    if type(clientAmounts) ~= "table" then return false end
    local serverAmounts = FruitSlotsGetBetAmounts()
    if #clientAmounts ~= #serverAmounts then return false end
    for index, amount in ipairs(serverAmounts) do
        if tonumber(clientAmounts[index]) ~= amount then return false end
    end
    return true
end

-- 安全获取数字配置值（nil返回默认值）
local function cfgNumber(value, default)
    local numberValue = tonumber(value)
    if numberValue ~= nil then
        return numberValue
    end
    return default
end

-- 从配置管理器获取指定名称的配置表
local function cfgTable(name)
    if gConfigMgr and gConfigMgr.getBaseConfig then
        return gConfigMgr:getBaseConfig(name) or {}
    end
    return {}
end

-- 获取配置表的第一行（id最小的行）
local function firstConfigRow(tab)
    if type(tab) ~= "table" then
        return {}
    end
    return tab[1] or tab["1"] or {}
end

-- 将配置表按id/sortId排序后返回有序列表
local function sortedRows(tab)
    local rows = {}
    for key, row in pairs(tab or {}) do
        local sortId = tonumber((type(row) == "table" and (row.id or row.reelIndex or row.symbolId or row.lineId)) or key) or 0
        table.insert(rows, {
            sortId = sortId,
            row = row,
        })
    end
    table.sort(rows, function(a, b)
        return a.sortId < b.sortId
    end)
    return rows
end

-- 从配置行中提取指定前缀的连续数字字段构建数组
-- 例如: prefix="symbol", startIndex=0, endIndex=7 -> {row.symbol0, row.symbol1, ..., row.symbol7}
local function buildNumericArrayByFields(row, prefix, startIndex, endIndex, default)
    local result = {}
    for index = startIndex, endIndex do
        table.insert(result, cfgNumber(row[prefix .. index], default or 0))
    end
    return result
end

-- 从配置表构建中奖线路径数组
local function buildLinePaths(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        table.insert(result, {
            cfgNumber(row.cell1, 1), -- 第1列格子索引
            cfgNumber(row.cell2, 1), -- 第2列格子索引
            cfgNumber(row.cell3, 1), -- 第3列格子索引
            cfgNumber(row.cell4, 1), -- 第4列格子索引
            cfgNumber(row.cell5, 1), -- 第5列格子索引
        })
    end
    return result
end

-- 从配置表构建转轮概率数组（5个转轮，每个转轮8个符号概率）
local function buildSlotProbabilitys(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local reelIndex = cfgNumber(row.reelIndex, nil)
        if reelIndex ~= nil then
            result[reelIndex + 1] = buildNumericArrayByFields(row, "symbol", 0, 7, 0)
        end
    end
    return result
end

-- 从配置表构建赔付表（符号ID -> {3连倍率, 4连倍率, 5连倍率}）
local function buildPaytable(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local symbolId = cfgNumber(row.symbolId, nil)
        if symbolId ~= nil then
            result[symbolId + 1] = {
                cfgNumber(row.match3, 0), -- 3连倍率
                cfgNumber(row.match4, 0), -- 4连倍率
                cfgNumber(row.match5, 0), -- 5连倍率
            }
        end
    end
    return result
end

-- 应用特性配置（免费游戏概率、Jackpot概率等）
local function applyFeatureConfig(tab)
    local row = firstConfigRow(tab)
    if next(row) == nil then
        return
    end
    FRFreeProbabilityDefault = tonumber(row.freeProbability) or FRFreeProbabilityDefault
    FRJackpotPoolIncrRate = tonumber(row.jackpotPoolIncrRate) or FRJackpotPoolIncrRate
    FRFreeCountProbability012 = buildNumericArrayByFields(row, "freeNormal", 0, 5, 0)
    FRFreeCountProbability345 = buildNumericArrayByFields(row, "freeHit", 0, 5, 0)
    FRFreeTimes = buildNumericArrayByFields(row, "freeTimes", 0, 5, 0)
    FRJackpotCountProbability012 = buildNumericArrayByFields(row, "jackpotNormal", 0, 5, 0)
    FRJackpotCountProbability345 = buildNumericArrayByFields(row, "jackpotHit", 0, 5, 0)
    FRJackpotPercentage = buildNumericArrayByFields(row, "jackpotPercent", 0, 5, 0)
end

-- 主配置加载函数：从配置管理器读取所有游戏配置并更新全局常量
function FruitSlotsLoadConfig()
    local globalConfig = firstConfigRow(cfgTable("FruitSlotsGlobal"))
    FRLineCount = cfgNumber(globalConfig.lineCount, FRLineCount)
    FRBigWinMultiple = cfgNumber(globalConfig.bigWinMultiple, FRBigWinMultiple)
    FRNewUserRoundDefault = cfgNumber(globalConfig.newUserRoundDefault, FRNewUserRoundDefault)
    FRJackpotPeriod = cfgNumber(globalConfig.jackpotPeriod, FRJackpotPeriod)
    FRJackpotRateDefault = {
        min = cfgNumber(globalConfig.jackpotRateMin, FRJackpotRateDefault.min),
        max = cfgNumber(globalConfig.jackpotRateMax, FRJackpotRateDefault.max),
    }
    FRDefaultRateType = cfgNumber(globalConfig.defaultRateType, FRDefaultRateType)
    FR_HEARTBEAT_INTERVAL = cfgNumber(globalConfig.heartbeatInterval, FR_HEARTBEAT_INTERVAL)

    -- 加载中奖线路径配置（存在则覆盖默认值）
    local linePaths = buildLinePaths(cfgTable("FruitSlotsLinePath"))
    if #linePaths > 0 then
        FRLinePaths = linePaths
        FRLineCount = #FRLinePaths
    end

    -- 加载转轮概率配置
    local slotProbabilitys = buildSlotProbabilitys(cfgTable("FruitSlotsSlotProbability"))
    if #slotProbabilitys > 0 then
        FRSlotProbabilitysDefault = slotProbabilitys
    end

    -- 加载赔付表配置
    local paytable = buildPaytable(cfgTable("FruitSlotsPaytable"))
    if next(paytable) ~= nil then
        FRConnectMultiples = paytable
    end

    -- 加载特性配置（免费游戏/Jackpot概率等）
    applyFeatureConfig(cfgTable("FruitSlotsFeature"))

    -- 更新场景中的默认游戏倍率配置
    local scene = SvrSystem and SvrSystem.FruitSlots and SvrSystem.FruitSlots.getScene and SvrSystem.FruitSlots:getScene() or nil
    if scene then
        scene.gameRateDefault = FruitSlotsDefaultGameRate()
    end
end

-- 确保配置已加载（懒加载入口，由各模块调用）
function FruitSlotsEnsureConfig()
    if (#FRLinePaths <= 0 or #FRSlotProbabilitysDefault <= 0 or next(FRConnectMultiples) == nil) and gConfigMgr ~= nil then
        FruitSlotsLoadConfig()
    end
end

-- 获取默认游戏倍率配置（供新玩家初始化用）
function FruitSlotsDefaultGameRate()
    return {
        rateType = FRDefaultRateType,
        slot = FRCloneTable(FRSlotProbabilitysDefault),
        free = FRFreeProbabilityDefault,
    }
end

-- 模块加载时自动执行首次配置加载
if gConfigMgr ~= nil then
    FruitSlotsLoadConfig()
end
