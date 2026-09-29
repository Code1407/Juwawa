-- ============================================================
-- 水果老虎机配置数据模块
-- 定义中奖线路径、概率表、赔付表等硬编码默认值
-- 以及从配置管理器加载运行时配置的逻辑
-- ============================================================

require "MageJackpot.MageJackpotCommon"

-- 中奖线路径配置（9条线，每条线由5个格子索引组成）
FRLinePaths = {
    {6, 7, 8, 9, 10},
    {1, 2, 3, 4, 5},
    {11, 12, 13, 14, 15},
    {1, 7, 13, 9, 5},
    {11, 7, 3, 9, 15},
    {6, 2, 3, 4, 10},
    {6, 12, 13, 14, 10},
    {1, 2, 8, 14, 15},
    {11, 12, 8, 4, 5},
}

-- 默认转轮概率表（5个转轮，每个转轮12个符号的概率分布）
FRSlotProbabilitysDefault = {
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0, 0, 0},
    {0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4, 0.4, 0.05, 0.05, 0.05},
    {0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4, 0.4, 0.05, 0.05, 0.05},
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05},
    {0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05},
}

-- 符号连线赔付倍率表 [符号ID][连续数-1] = 倍率
FRConnectMultiples = {
    {1, 6, 12, 36},     -- 符号0：二连起赔
    {2, 10, 20, 60},    -- 符号1：二连起赔
    {3, 12, 24, 72},    -- 符号2：二连起赔
    {5, 15, 30, 90},    -- 符号3：二连起赔
    {6, 20, 40, 120},   -- 符号4：二连起赔
    {0, 25, 50, 150},   -- 符号5：三连起赔
    {0, 40, 80, 240},   -- 符号6：三连起赔
    {0, 60, 120, 360},  -- 符号7：三连起赔
    {0, 100, 200, 600}, -- Wild：三连起赔
    {0, 0, 0, 0},       -- BONUS
    {0, 0, 0, 0},       -- FREESPINS
    {0, 0, 0, 0},       -- JACKPOT
}

-- 盘面图标按前端资源 sgtb_1..sgtb_9、BONUS、FREESPINS、JACKPOT 的 0-based 索引。
FRSymbol = {
    wild = 8,
    bonus = 9,
    free = 10,
    jackpot = 11,
}

FRBigWinMultiple = 100           -- 大赢倍数阈值（超过此倍数不再触发特殊玩法）
FRLineCount = 9                  -- 中奖线总数（与 MageJackpotLinePath 默认表一致）
FRNewUserRoundDefault = 20       -- 新玩家保护回合数
FRJackpotPeriod = 5000           -- Jackpot周期（每隔多少局重新计算Jackpot投放）
FRJackpotRateDefault = { min = 2, max = 2 } -- Jackpot每周期投放次数范围
FRJackpotPoolIncrRate = 0.02     -- Jackpot奖池增长率（从赢取金额中提取的比例）
FRFreeProbabilityDefault = 0.0496 -- 默认免费游戏触发概率
FRFreeCountProbability012 = {0.5, 0.3, 0.2, 0, 0, 0}   -- 普通模式下免费符号数量分布
FRFreeCountProbability345 = {0, 0, 0, 0.6, 0.3, 0.1}   -- 命中模式下免费符号数量分布
FRFreeTimes = {0, 0, 0, 5, 8, 12}                       -- N个免费符号对应的免费旋转次数
FRBonusProbabilityDefault = 0.0496 -- 默认幸运转盘触发概率
FRBonusCountProbability012 = {0.5, 0.3, 0.2, 0, 0, 0}  -- 未命中时BONUS符号数量分布
FRBonusCountProbability345 = {0, 0, 0, 0.6, 0.3, 0.1}  -- 命中时BONUS符号数量分布
-- 幸运转盘只会开奖以下六个固定倍率；权重等于各倍率在12个扇区中的出现次数。
FRBonusMultiplierValues = {1, 3, 5, 10, 15, 20}
FRBonusMultiplierWeights = {2, 3, 3, 2, 1, 1}
-- 转盘视觉奖格，从美术圆盘的0号扇区开始顺时针排列。
-- 该数组会在登录时下发，客户端不可自行随机或重排。
FRBonusWheelSegmentMultipliers = {3, 5, 3, 20, 15, 10, 1, 10, 1, 5, 3, 5}
FRJackpotCountProbability012 = {0.5, 0.3, 0.2, 0, 0, 0} -- 普通模式下Jackpot符号数量分布
FRJackpotCountProbability345 = {0, 0, 0, 0.7, 0.3, 0}   -- 命中模式下Jackpot符号数量分布
FRJackpotPercentage = {0, 0, 0, 0.05, 0.15, 0.5}        -- N个Jackpot符号对应的奖池提取比例
FRDefaultRateType = FRRateType.normal       -- 默认赔率类型
-- 服务端下发与校验的总下注档位。每项均为9条线的整数倍，对应的单线档位为
FRBetAmounts = {900, 2700, 9000, 27000, 90000}

FRJackpotPoolDefaultVersion = 3
FRInitJackpotAmountPool = {
    [1] = 1888,
    [5] = 8888,
    [10] = 18888,
    [20] = 38888,
    [50] = 88888,
    [100] = 188888,
    [200] = 388888,
    [500] = 888888,
    [1000] = 1888888,
    [5000] = 8888888,
}

FRInitJackpotLineBetAmounts = {1, 5, 10, 20, 50, 100, 200, 500, 1000, 5000}

function MageJackpotLineBetAmount(totalBetAmount)
    return (tonumber(totalBetAmount) or 0)
        / math.max(1, tonumber(FRLineCount) or 1)
end

function MageJackpotDefaultJackpotPoolAmount(totalBetAmount)
    local lineBetAmount = MageJackpotLineBetAmount(totalBetAmount)
    local exactLineBet = FRRoundInt(lineBetAmount)
    if math.abs(lineBetAmount - exactLineBet) > 0.000001 then
        return 0
    end

    local fallbackLineBet = 0
    for _, lineBet in ipairs(FRInitJackpotLineBetAmounts) do
        if lineBet <= exactLineBet then
            fallbackLineBet = lineBet
        else
            break
        end
    end
    return tonumber(FRInitJackpotAmountPool[fallbackLineBet]) or 0
end

function MageJackpotGetBetAmounts()
    local commonConfig = gApp and gApp.getProjCommon and gApp:getProjCommon() or nil
    local costs = type(commonConfig) == "table" and commonConfig.Costs or nil
    local amounts = {}
    if type(costs) == "table" and #costs > 0 then
        for _, cost in ipairs(costs) do
            local amount = tonumber(cost and cost.Coins)
            if not amount or amount <= 0 or amount ~= math.floor(amount)
                or amount % math.max(1, tonumber(FRLineCount) or 1) ~= 0 then
                log_error("MageJackpot platform Costs invalid or not a whole-line total, coins:{0}", amount or 0)
                return FRCloneTable(FRBetAmounts)
            end
            table.insert(amounts, amount)
        end
        return amounts
    end
    return FRCloneTable(FRBetAmounts)
end

function MageJackpotIsValidBetAmount(betAmount)
    local amount = FRRoundInt(betAmount or 0)
    for _, allowed in ipairs(MageJackpotGetBetAmounts()) do
        if amount == allowed then return true end
    end
    return false
end

function MageJackpotBetAmountsMatch(clientAmounts, serverAmounts)
    if type(clientAmounts) ~= "table" then return false end
    serverAmounts = serverAmounts or MageJackpotGetBetAmounts()
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

-- 读取单行配置，兼容“配置项 / 配置值”的逐行表结构。
local function configValues(tab)
    local firstRow = firstConfigRow(tab)
    if type(firstRow.configKey) ~= "string" then
        return firstRow
    end

    local values = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local key = row.configKey
        if type(key) == "string" and key ~= "" then
            values[key] = row.configValue
        end
    end
    return values
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
            result[reelIndex + 1] = buildNumericArrayByFields(row, "symbol", 0, 11, 0)
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
                cfgNumber(row.match2, 0), -- 2连倍率
                cfgNumber(row.match3, 0), -- 3连倍率
                cfgNumber(row.match4, 0), -- 4连倍率
                cfgNumber(row.match5, 0), -- 5连倍率
            }
        end
    end
    return result
end

-- 应用特性配置（免费游戏概率、Jackpot概率等）
local function applyFeatureConfigRow(row)
    row = row or {}
    if next(row) == nil or row.freeProbability == nil then
        return
    end
    FRFreeProbabilityDefault = tonumber(row.freeProbability) or FRFreeProbabilityDefault
    FRJackpotPoolIncrRate = tonumber(row.jackpotPoolIncrRate) or FRJackpotPoolIncrRate
    FRFreeCountProbability012 = buildNumericArrayByFields(row, "freeNormal", 0, 5, 0)
    FRFreeCountProbability345 = buildNumericArrayByFields(row, "freeHit", 0, 5, 0)
    FRFreeTimes = buildNumericArrayByFields(row, "freeTimes", 0, 5, 0)
    -- 全局配置表可不包含 BONUS 字段；此时保留 Feature 表或默认值，不能覆盖为0。
    if row.bonusProbability ~= nil then
        FRBonusProbabilityDefault = tonumber(row.bonusProbability) or FRBonusProbabilityDefault
        FRBonusCountProbability012 = buildNumericArrayByFields(row, "bonusNormal", 0, 5, 0)
        FRBonusCountProbability345 = buildNumericArrayByFields(row, "bonusHit", 0, 5, 0)
        FRBonusMultiplierValues = buildNumericArrayByFields(row, "bonusMultiplier", 0, 5, 0)
        FRBonusMultiplierWeights = buildNumericArrayByFields(row, "bonusMultiplierWeight", 0, 5, 0)
    end
    FRJackpotCountProbability012 = buildNumericArrayByFields(row, "jackpotNormal", 0, 5, 0)
    FRJackpotCountProbability345 = buildNumericArrayByFields(row, "jackpotHit", 0, 5, 0)
    FRJackpotPercentage = buildNumericArrayByFields(row, "jackpotPercent", 0, 5, 0)
end

local function applyFeatureConfig(tab)
    applyFeatureConfigRow(configValues(tab))
end

-- 主配置加载函数：从配置管理器读取所有游戏配置并更新全局常量
function MageJackpotLoadConfig()
    local globalConfig = configValues(cfgTable("MageJackpotGlobal"))
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
    local linePaths = buildLinePaths(cfgTable("MageJackpotLinePath"))
    if #linePaths > 0 then
        FRLinePaths = linePaths
        FRLineCount = #FRLinePaths
    end

    -- 加载转轮概率配置
    local slotProbabilitys = buildSlotProbabilitys(cfgTable("MageJackpotSlotProbability"))
    if #slotProbabilitys > 0 then
        FRSlotProbabilitysDefault = slotProbabilitys
    end

    -- 加载赔付表配置
    local paytable = buildPaytable(cfgTable("MageJackpotPaytable"))
    if next(paytable) ~= nil then
        FRConnectMultiples = paytable
    end

    -- 兼容旧版特性配置（免费游戏/Jackpot概率等）
    applyFeatureConfig(cfgTable("MageJackpotFeature"))

    -- 合并后的全局配置优先于旧版特性表。
    applyFeatureConfigRow(globalConfig)

    -- 更新场景中的默认游戏倍率配置
    local scene = SvrSystem and SvrSystem.MageJackpot and SvrSystem.MageJackpot.getScene and SvrSystem.MageJackpot:getScene() or nil
    if scene then
        scene.gameRateDefault = MageJackpotDefaultGameRate()
    end
end

-- 确保配置已加载（懒加载入口，由各模块调用）
function MageJackpotEnsureConfig()
    if (#FRLinePaths <= 0 or #FRSlotProbabilitysDefault <= 0 or next(FRConnectMultiples) == nil) and gConfigMgr ~= nil then
        MageJackpotLoadConfig()
    end
end

-- 登录时下发给客户端的幸运转盘布局。复制返回，避免外部修改运行时配置。
function MageJackpotGetBonusWheelSegmentMultipliers()
    MageJackpotEnsureConfig()
    return FRCloneTable(FRBonusWheelSegmentMultipliers or {})
end

-- 获取默认游戏倍率配置（供新玩家初始化用）
function MageJackpotDefaultGameRate()
    return {
        rateType = FRDefaultRateType,
        slot = FRCloneTable(FRSlotProbabilitysDefault),
        free = FRFreeProbabilityDefault,
    }
end

-- 模块加载时自动执行首次配置加载
if gConfigMgr ~= nil then
    MageJackpotLoadConfig()
end
