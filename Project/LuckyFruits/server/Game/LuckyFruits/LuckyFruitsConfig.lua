-- ============================================================
-- LuckyFruitsConfig 模块：游戏核心配置加载器
-- 负责从配置表(LuckyFruitsCore)加载并归一化游戏参数：
-- 心跳间隔、下注/结算时长、排行榜容量、开奖结果概率、转盘倍率
-- 所有配置项均有默认值兜底，确保配置缺失或非法时服务仍可启动。
-- 加载结果写入全局：LuckyFruitsConst / LFResultProbability / LFWheelMultiple
-- ============================================================

LuckyFruitsConst = LuckyFruitsConst or {}

-- 开奖概率预设。当前启用TS原始权重；rtp97保留为可随时切回的均衡备选。
LuckyFruitsProbabilityPresets = {
    tsOriginal = { 1, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1 },
    rtp97 = { 8.69, 8.71, 8.55, 8.71, 24.22, 12.13, 8.93, 6.07, 2.79, 0.50, 0.30, 0.30, 0.10, 5.00, 5.00 },
}

-- 默认配置：配置表缺失或字段非法时回退使用，保证服务可用性
local defaults = {
    gameName = "LuckyFruits",
    heartbeatMs = 1000,        -- 心跳间隔（毫秒），驱动回合状态机
    betSeconds = 21,            -- 下注阶段时长（秒）
    finalSeconds = 6,          -- 结算阶段时长动画（秒）
    rankSize = 6,               -- 本回合排行榜容量
    -- 当前按TS原始相对权重开奖；均衡97%方案保存在LuckyFruitsProbabilityPresets.rtp97。
    resultProbability = LuckyFruitsProbabilityPresets.rtp97,
    wheelMultiple = { 2, 2, 2, 2, 3, 6, 8, 12, 30 },                       -- 转盘倍率（9档）
}

-- 深拷贝表：用于回退默认配置时复制，避免引用共享被后续修改污染
local function clone(value)
    if type(value) ~= "table" then return value end
    local result = {}
    for key, item in pairs(value) do result[key] = clone(item) end
    return result
end

-- 将哈希表转换为有序数组：按数字key升序排列，保证配置顺序确定性
-- 兼容单行配置：rows为空时回退为{tab}本身
local function orderedRows(tab)
    if type(tab) ~= "table" then return {} end
    local indexedRows = {}
    for key, row in pairs(tab) do
        local index = tonumber(key)
        if index and type(row) == "table" then
            indexedRows[#indexedRows + 1] = { index = index, row = row }
        end
    end
    table.sort(indexedRows, function(left, right) return left.index < right.index end)

    local rows = {}
    for _, item in ipairs(indexedRows) do rows[#rows + 1] = item.row end
    if #rows == 0 then rows[1] = tab end
    return rows
end

-- 取配置表的第一行：用于读取标量配置项（如gameName、betSeconds）
local function firstRow(tab)
    return orderedRows(tab)[1] or {}
end

-- 归一化数值数组：确保长度为length，所有值为非负数，总和>0；否则回退到fallback
-- 兼容配置以数组或哈希表两种形式存储（values[i]或values["i"]）
local function normalize(values, fallback, length)
    if type(values) ~= "table" then return clone(fallback) end
    local result, total = {}, 0
    for i = 1, length do
        -- 优先取数字索引，其次取字符串索引；非法值回退到fallback对应位置或0
        result[i] = math.max(0, tonumber(values[i] or values[tostring(i)]) or fallback[i] or 0)
        total = total + result[i]
    end
    -- 总权重为0会导致随机函数除零异常，此时直接回退到fallback默认配置
    return total > 0 and result or clone(fallback)
end

-- 从配置表收集指定字段并归一化为数组
-- 支持两种配置形式：字段值为数组（直接normalize）或多行单值（聚合后normalize）
local function collectColumn(tab, field, fallback, length)
    local rows = orderedRows(tab)
    local firstValue = rows[1] and rows[1][field]
    if type(firstValue) == "table" then
        -- 字段直接是数组形式：归一化即可
        return normalize(firstValue, fallback, length)
    end

    -- 字段为标量：从所有行收集该字段值后归一化
    local values = {}
    for _, row in ipairs(rows) do
        local value = row[field]
        if value ~= nil and value ~= "" then values[#values + 1] = value end
    end
    return normalize(values, fallback, length)
end

-- 加载LuckyFruits核心配置：从配置表或直接传入的tab读取并归一化
-- tab为空时从gConfigMgr.getBaseConfig("LuckyFruitsCore")获取
-- 所有字段均做边界校验与默认值兜底，保证配置合法
function LuckyFruitsLoadConfig(tab)
    local config = tab
    -- 未直接传入配置表时从配置管理器加载
    if type(config) ~= "table" and gConfigMgr and gConfigMgr.getBaseConfig then
        config = gConfigMgr:getBaseConfig("LuckyFruitsCore")
    end
    local row = firstRow(config)
    -- 标量配置：均做下限校验，防止0或负值导致逻辑异常
    LuckyFruitsConst.gameName = tostring(row.gameName or defaults.gameName)
    LuckyFruitsConst.heartbeatMs = math.max(100, tonumber(row.heartbeatMs) or defaults.heartbeatMs)
    LuckyFruitsConst.betSeconds = math.max(1, tonumber(row.betSeconds) or defaults.betSeconds)
    LuckyFruitsConst.finalSeconds = math.max(1, tonumber(row.finalSeconds) or defaults.finalSeconds)
    LuckyFruitsConst.rankSize = math.max(1, math.floor(tonumber(row.rankSize) or defaults.rankSize))
    -- 数组配置：归一化为定长数组并写入全局变量供其他模块使用
    LFResultProbability = collectColumn(config, "resultProbability", defaults.resultProbability, 15)
    LFWheelMultiple = collectColumn(config, "wheelMultiple", defaults.wheelMultiple, 9)
end

-- 获取当前生效的核心配置快照：用于运行时查询与诊断
-- 返回所有配置项的克隆副本，避免外部修改污染内部状态
function LuckyFruitsGetCoreConfig()
    return {
        gameName = LuckyFruitsConst.gameName,
        heartbeatMs = LuckyFruitsConst.heartbeatMs,
        betSeconds = LuckyFruitsConst.betSeconds,
        finalSeconds = LuckyFruitsConst.finalSeconds,
        rankSize = LuckyFruitsConst.rankSize,
        resultProbability = clone(LFResultProbability),
        wheelMultiple = clone(LFWheelMultiple),
    }
end

-- 模块加载时立即用默认配置初始化，确保后续require此模块的代码可用
-- 真实配置在GameApp.onLoadConfig/onProjConfig中被LuckyFruitsLoadConfig覆盖
LuckyFruitsLoadConfig(defaults)