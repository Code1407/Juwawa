local Config = {}

-- SuperAce 老虎机配置：符号编号约定 0=scatter(散布) 1=梅花 2=方块 3=红桃 4=黑桃
-- 5=J 6=Q 7=K 8=A 9=小Wild 10=大Wild(带复制)；负值表示金色符号(参与连线但不被消除)。
-- 每列符号出现权重(5列 × 9符号)，按 rateRandom 抽取。
Config.slotProbabilitysDefault = {
    {0, 27, 10, 11, 15, 15, 7, 8, 7},
    {0, 10, 27, 15, 11, 7, 15, 7, 8},
    {0, 27, 10, 11, 15, 15, 7, 8, 7},
    {0, 10, 27, 15, 11, 7, 15, 7, 8},
    {0, 27, 10, 11, 15, 15, 7, 8, 7}
}

-- 连线倍数表：键为符号编号(1-8)，值前3位为0(不足3连不派奖)，后3位为 3连/4连/5连 倍数。
Config.connectMultiples = {
    [0] = {0, 0, 0, 0, 0, 0},
    [1] = {0, 0, 0, 0.05, 0.15, 0.25},
    [2] = {0, 0, 0, 0.05, 0.15, 0.25},
    [3] = {0, 0, 0, 0.10, 0.30, 0.50},
    [4] = {0, 0, 0, 0.10, 0.30, 0.50},
    [5] = {0, 0, 0, 0.20, 0.60, 1.00},
    [6] = {0, 0, 0, 0.30, 0.90, 1.50},
    [7] = {0, 0, 0, 0.40, 1.20, 2.00},
    [8] = {0, 0, 0, 0.50, 1.50, 2.50}
}

Config.freeProbabilityDefault = 0.002             -- 单次旋转触发免费游戏的基础概率
Config.freeCountProbability012 = {0.3, 0.4, 0.3, 0, 0, 0}  -- 未触发免费时散布数量分布(偏0-2个)
Config.freeCountProbability345 = {0, 0, 0, 0.9, 0.1, 0}     -- 触发免费后散布数量分布(偏3-5个)
Config.changeGoldNumProbability = {0.8, 0.14, 0.05, 0.009, 0.001}  -- 初始盘面金色符号数量分布
Config.starCardNumProbability = {0.8, 0.14, 0.05, 0.009, 0.001}     -- 消除阶段转金色(星卡)数量分布
Config.bigWildCopyNumberProbability = {0, 0.75, 0.2, 0.05, 0}      -- 大Wild复制Wild的数量分布
Config.wildRate = {0.95, 0.05}                    -- Wild类型权重：[1]=小Wild(9) [2]=大Wild(10)
Config.regenerateCount = 1                        -- 预留字段(当前算法未直接使用)
Config.regenerateRange = {min = 0, max = 10}      -- 预留字段
Config.normalEliminateMultiples = {1, 2, 3, 5, 10}     -- 普通局消除倍数加成
Config.freeEliminateMultiples = {2, 4, 6, 10, 20}      -- 免费局消除倍数加成
Config.baseBet = 20                               -- 基础下注额
Config.bigWinMultiple = Config.baseBet * 10       -- 大奖阈值(供客户端动画/通知判定)
Config.killCount = 5                              -- 控奖(杀分)时最大重随机次数
-- Defs.proto 中 resultItems 最多 128 项；首项是初始盘面，所以这里限制的是
-- “可传输结果项总数”，不是额外连消次数，避免生成 129 项后协议截断末项。
Config.maxResultItemCount = 128
Config.maxFreeQueueCount = 256                    -- 免费游戏队列最大长度
Config.maxTotalMultiple = 10000                   -- 单局累计倍数上限

-- 列号(0-4)到该列4个位置索引的映射；布局为4行×5列，position = column + row*5。
Config.indexInColumns = {
    [0] = {0, 5, 10, 15},
    [1] = {1, 6, 11, 16},
    [2] = {2, 7, 12, 17},
    [3] = {3, 8, 13, 18},
    [4] = {4, 9, 14, 19}
}

-- 第2、3、4列的所有位置(共12个)；金色符号只能出现在这三列，首尾两列不出金色。
Config.columns234Indexs = {1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18}
local function cfgNumber(value, default)
    local numberValue = tonumber(value)
    if numberValue ~= nil then
        return numberValue
    end
    return default
end

local function cfgTable(name)
    if gConfigMgr and gConfigMgr.getBaseConfig then
        return gConfigMgr:getBaseConfig(name) or {}
    end
    return {}
end

local function firstConfigRow(tab)
    if type(tab) ~= "table" then
        return {}
    end
    if tab[1] ~= nil then
        return tab[1]
    end
    if tab["1"] ~= nil then
        return tab["1"]
    end
    if tab.baseBet ~= nil then
        return tab
    end
    return {}
end

local function sortedRows(tab)
    local rows = {}
    for key, row in pairs(tab or {}) do
        local sortId = tonumber((type(row) == "table" and (row.id or row.symbolId or row.section)) or key) or 0
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

local function compactNumericArray(tab, default)
    local result = {}
    local maxIndex = 0
    for index, _ in pairs(tab or {}) do
        if type(index) == "number" and index > maxIndex then
            maxIndex = index
        end
    end
    for index = 1, maxIndex do
        table.insert(result, cfgNumber(tab[index], default or 0))
    end
    return result
end

local function buildPaytable(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local symbolId = cfgNumber(row.symbolId, nil)
        if symbolId ~= nil then
            result[symbolId + 1] = {
                0, 0, 0,
                cfgNumber(row.multiple3, 0),
                cfgNumber(row.multiple4, 0),
                cfgNumber(row.multiple5, 0)
            }
        end
    end
    return result
end

local function applyRateConfig(tab)
    local rows = sortedRows(tab)
    if #rows == 0 then
        return
    end

    local slotRows = {}
    for _, item in ipairs(rows) do
        if item.row and item.row.section == "slotReel" then
            table.insert(slotRows, item.row)
        end
    end

    if #slotRows > 0 then
        local columns = {{}, {}, {}, {}, {}}
        for orderIndex, row in ipairs(slotRows) do
            local symbolId = cfgNumber(row.symbolId, nil)
            local index = symbolId ~= nil and (symbolId + 1) or orderIndex
            columns[1][index] = cfgNumber(row.column1, 0)
            columns[2][index] = cfgNumber(row.column2, 0)
            columns[3][index] = cfgNumber(row.column3, 0)
            columns[4][index] = cfgNumber(row.column4, 0)
            columns[5][index] = cfgNumber(row.column5, 0)
        end
        for i = 1, 5 do
            local column = compactNumericArray(columns[i], 0)
            if #column > 0 then
                Config.slotProbabilitysDefault[i] = column
            end
        end
    end

    for _, item in ipairs(rows) do
        if item.row and item.row.section == "freeTrigger" then
            Config.freeProbabilityDefault = cfgNumber(item.row.rate, Config.freeProbabilityDefault)
            break
        end
    end
end

function SuperAceLoadConfig()
    local globalConfig = firstConfigRow(cfgTable("SuperAceGlobal"))
    log_info("[SuperAceLoadConfig] globalConfig keys: {}", type(globalConfig) == "table" and next(globalConfig) and "yes" or "empty/nil")
    if type(globalConfig) == "table" then
        log_info("[SuperAceLoadConfig] baseBet={}, freeProbabilityDefault={}", tostring(globalConfig.baseBet), tostring(globalConfig.freeProbabilityDefault))
    end
    if next(globalConfig) ~= nil then
        Config.baseBet = cfgNumber(globalConfig.baseBet, Config.baseBet)
        Config.bigWinMultiple = cfgNumber(globalConfig.bigWinMultiple, Config.baseBet * 10)
        Config.killCount = cfgNumber(globalConfig.killCount, Config.killCount)
        Config.regenerateCount = cfgNumber(globalConfig.regenerateCount, Config.regenerateCount)
        Config.regenerateRange = {
            min = cfgNumber(globalConfig.regenerateMin, Config.regenerateRange.min),
            max = cfgNumber(globalConfig.regenerateMax, Config.regenerateRange.max),
        }
        Config.maxResultItemCount = cfgNumber(globalConfig.maxResultItemCount, Config.maxResultItemCount)
        Config.maxFreeQueueCount = cfgNumber(globalConfig.maxFreeQueueCount, Config.maxFreeQueueCount)
        Config.maxTotalMultiple = cfgNumber(globalConfig.maxTotalMultiple, Config.maxTotalMultiple)
        Config.freeProbabilityDefault = cfgNumber(globalConfig.freeProbabilityDefault, Config.freeProbabilityDefault)
    end

    applyRateConfig(cfgTable("SuperAceRate"))

    local paytable = buildPaytable(cfgTable("SuperAcePaytable"))
    if next(paytable) ~= nil then
        Config.connectMultiples = {}
        for i = 0, 8 do
            Config.connectMultiples[i] = paytable[i + 1] or {0, 0, 0, 0, 0, 0}
        end
    end

    local scene = SvrSystem and SvrSystem.SuperAce and SvrSystem.SuperAce.getScene and SvrSystem.SuperAce:getScene() or nil
    if scene then
        scene.gameRateDefault = SuperAceDefaultGameRate()
    end
    log_info("[SuperAceLoadConfig] applied freeProbabilityDefault={}", tostring(Config.freeProbabilityDefault))
end

function SuperAceEnsureConfig()
    if (#Config.slotProbabilitysDefault <= 0 or next(Config.connectMultiples) == nil) and gConfigMgr ~= nil then
        SuperAceLoadConfig()
    end
end

function SuperAceDefaultGameRate()
    return {
        rateType = "normal",
        slot = Config.slotProbabilitysDefault,
        goldenRate = Config.changeGoldNumProbability,
        starCardRate = Config.starCardNumProbability,
        wildRate = Config.wildRate,
        wildCopyRates = Config.bigWildCopyNumberProbability,
        regenerateCount = Config.regenerateCount,
        regenerateRange = Config.regenerateRange,
        freeRate = Config.freeProbabilityDefault,
        freeProbability012 = Config.freeCountProbability012,
        freeProbability345 = Config.freeCountProbability345
    }
end

if gConfigMgr ~= nil then
    SuperAceLoadConfig()
end

return Config
