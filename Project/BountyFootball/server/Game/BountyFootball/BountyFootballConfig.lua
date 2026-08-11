-- ============================================================
-- BountyFootballConfig.lua  —  豪车游戏（BountyFootball）核心配置模块
-- ============================================================
-- 本文件负责管理豪车小游戏的全部配置数据，包括：
--   1. 游戏常量（BountyFootballConst）：游戏名称、各阶段时长、排行榜大小等
--   2. 轮子结果与下注索引的映射（resultBetIndex）
--   3. 轮子各位置的赔率倍数（wheelMultiple）
--   4. 轮子各位置的中奖概率（resultProbability）
--
-- 配置数据来源：
--   默认值在 LCDefaultConfig 中定义，可通过 gConfigMgr 配置表 "BountyFootballCore"
--   进行热更覆盖。运行时通过 BountyFootballLoadConfig() 加载配置，
--   通过 BountyFootballGetCoreConfig() 对外暴露当前生效的配置快照。
-- ============================================================

--- 游戏全局常量表，存储游戏运行时所需的各项常量配置。
--- 字段说明见 LCDefaultConfig 中的注释。
BountyFootballConst = BountyFootballConst or {}

--- 深拷贝一个 Lua 表，用于在返回配置快照时防止外部修改污染内部数据。
--- @param value any 任意类型值
--- @return any 深拷贝后的值（table 会被递归拷贝，其他类型原样返回）
local function cloneTable(value)
    if type(value) ~= "table" then return value end
    local out = {}
    for key, item in pairs(value) do
        out[key] = cloneTable(item)
    end
    return out
end

--- 将任意类型的值安全转换为数字，转换失败时返回默认值。
--- @param value any 待转换的值
--- @param default number 转换失败时返回的默认值
--- @return number 转换后的数字，或默认值
local function cfgNumber(value, default)
    local numberValue = tonumber(value)
    if numberValue ~= nil then
        return numberValue
    end
    return default
end

--- 通过 gConfigMgr 配置管理器读取指定名称的配置表。
--- 优先使用 gConfigMgr:getBaseConfig(name) 获取配置；
--- 若配置管理器不可用或配置不存在，则返回空表。
--- @param name string 配置表名称（如 "BountyFootballCore"）
--- @return table 配置数据表，可能为空表
local function cfgTable(name)
    if gConfigMgr and gConfigMgr.getBaseConfig then
        return gConfigMgr:getBaseConfig(name) or {}
    end
    return {}
end

--- 从配置表中取出首行数据。
--- 由于配置表可能以数组形式（tab[1]）或键值对形式（tab["1"]）存储，
--- 也可能直接就是配置行本身（包含 resultBetIndex 等字段），
--- 此函数统一处理这三种情况，返回首个有效配置行。
--- @param tab table 配置数据表
--- @return table 首行配置数据，若无效则返回空表
local function firstConfigRow(tab)
    if type(tab) ~= "table" then return {} end
    if tab[1] ~= nil then return tab[1] end
    if tab["1"] ~= nil then return tab["1"] end
    if tab.resultBetIndex ~= nil or tab.wheelMultiple ~= nil or tab.resultProbability ~= nil then return tab end
    return {}
end

--- 将按球队分行的配置表按下注区编号排序为数组。
--- 配置表由 JSON 导入后通常使用字符串键（"1".."10"），这里同时兼容数字键。
--- @param tab table 配置数据表
--- @return table 按下注区编号升序排列的配置行
local function teamConfigRows(tab)
    local rows = {}
    if type(tab) ~= "table" then return rows end

    for key, row in pairs(tab) do
        if type(row) == "table" and
            (row.wheelPositions ~= nil or row.positionProbabilities ~= nil) then
            local betIndex = cfgNumber(row.id, cfgNumber(key, nil))
            if betIndex ~= nil then
                rows[#rows + 1] = {
                    betIndex = betIndex,
                    row = row,
                }
            end
        end
    end

    table.sort(rows, function(left, right)
        return left.betIndex < right.betIndex
    end)
    return rows
end

--- 将配置中的数组字段归一化为固定长度的数值数组。
--- 处理逻辑：
---   - 若原值不是 table，则回退到默认值的深拷贝；
---   - 按索引 1..length 逐项读取（兼容数字索引与字符串索引），
---     每项经 cfgNumber 转换为数字，缺失项用默认值填充；
---   - 若设置了 minValue，低于该值的项会被默认值替换，保证数据合法性。
--- @param value any 配置中读取的原始数组值
--- @param default table 默认数组，用于回退和填充
--- @param length number 数组的固定长度（豪车游戏为 16 个位置）
--- @param minValue number|nil 每项允许的最小值，低于此值则使用默认值
--- @return table 归一化后的数值数组
local function normalizeArray(value, default, length, minValue)
    local result = {}
    if type(value) ~= "table" then
        return cloneTable(default)
    end
    for index = 1, length do
        local item = value[index] or value[tostring(index)]
        result[index] = cfgNumber(item, default[index] or 0)
        if minValue ~= nil and result[index] < minValue then
            result[index] = default[index] or minValue
        end
    end
    return result
end

--- 计算数组中所有数值元素之和，用于校验概率总和是否大于 0。
--- @param values table 数值数组
--- @return number 总和
local function sumArray(values)
    local total = 0
    for _, value in ipairs(values or {}) do
        total = total + (tonumber(value) or 0)
    end
    return total
end

-- ============================================================
-- 默认配置表
-- ============================================================
-- 以下为豪车游戏的默认配置值，当外部配置缺失或异常时使用。
-- 游戏分为 16 个轮子位置（索引 1~16），各字段含义如下：
--   gameName          游戏名称标识
--   heartbeatMs       心跳间隔（毫秒），用于服务器与客户端同步
--   rankSize          排行榜显示的最大条目数
--   betSeconds        下注阶段持续时间（秒）
--   runSeconds        跑马灯/动画阶段持续时间（秒）
--   finalSeconds      结算阶段持续时间（秒）
--
--   resultBetIndex[16]    每个轮子位置对应的下注区域索引（1~10），
--                         决定了该位置命中时玩家赢得哪一区域的下注。
--                         例如位置 1 对应下注区 8，位置 2 对应下注区 2。
--
--   wheelMultiple[16]     每个轮子位置的赔率倍数，
--                         即命中该位置时，玩家下注金额乘以该倍数得到的赔付。
--                         例如位置 1 的倍数为 100（赔率最高），位置 4 为 50。
--
--   resultProbability[16]  每个轮子位置的中奖概率，所有位置之和应为 1.0。
--                         若配置后概率总和 ≤ 0，则回退使用默认概率。
-- ============================================================
LCDefaultConfig = {
    gameName = "BountyFootball",  -- 游戏名称标识
    heartbeatMs = 1000,  -- 心跳间隔（毫秒），用于服务器与客户端同步
    rankSize = 100,     -- 排行榜显示的最大条目数
    betSeconds = 17,  -- 下注阶段持续时间（秒）
    runSeconds = 5,  -- 跑马灯/动画阶段持续时间（秒）
    finalSeconds = 6,  -- 结算阶段持续时间（秒）
    resultBetIndex = { 8, 2, 10, 1, 4, 7, 6, 3, 5, 1, 7, 3, 9, 6, 10, 2 },  -- 每个轮子位置对应的下注区域索引（1~10）
    -- 决定了该位置命中时玩家赢得哪一区域的下注。
    -- 例如位置 1 对应下注区 8，位置 2 对应下注区 2。
    wheelMultiple = { 100, 5, 8, 2, 50, 30, 20, 18, 88, 2, 30, 18, 66, 20, 8, 5 },  -- 每个轮子位置的赔率倍数

    resultProbability = { 0.0097, 0.099, 0.062, 0.2425, 0.0198, 0.0165, 0.02475, 0.0275, 0.011, 0.2425, 0.0165, 0.0275, 0.015, 0.02475, 0.062, 0.099 },
}

--- 将一行配置数据应用到 BountyFootballConst 及全局数组变量。
--- 处理顺序：
---   1. 先使用传入的 row 中的字段覆盖 BountyFootballConst 对应字段；
---   2. 对 resultBetIndex、wheelMultiple、resultProbability 三个数组字段
---      进行归一化处理（normalizeArray），确保长度固定为 16 且值合法；
---   3. 最后校验概率总和，若 ≤ 0 则回退到默认概率表。
--- @param row table 一行配置数据（来自配置表或默认配置）
local function applyConfig(row)
    row = row or {}
    BountyFootballConst.gameName = tostring(row.gameName or BountyFootballConst.gameName or LCDefaultConfig.gameName)
    BountyFootballConst.heartbeatMs = cfgNumber(row.heartbeatMs, BountyFootballConst.heartbeatMs or LCDefaultConfig.heartbeatMs)
    BountyFootballConst.rankSize = cfgNumber(row.rankSize, BountyFootballConst.rankSize or LCDefaultConfig.rankSize)
    BountyFootballConst.betSeconds = cfgNumber(row.betSeconds, BountyFootballConst.betSeconds or LCDefaultConfig.betSeconds)
    BountyFootballConst.runSeconds = cfgNumber(row.runSeconds, BountyFootballConst.runSeconds or LCDefaultConfig.runSeconds)
    BountyFootballConst.finalSeconds = cfgNumber(row.finalSeconds, BountyFootballConst.finalSeconds or LCDefaultConfig.finalSeconds)

    LCResultBetIndex = normalizeArray(row.resultBetIndex, LCResultBetIndex or LCDefaultConfig.resultBetIndex, 16, 1)
    LCWheelMultiple = normalizeArray(row.wheelMultiple, LCWheelMultiple or LCDefaultConfig.wheelMultiple, 16, 0)
    LCResultProbability = normalizeArray(row.resultProbability, LCResultProbability or LCDefaultConfig.resultProbability, 16, 0)

    if sumArray(LCResultProbability) <= 0 then
        LCResultProbability = cloneTable(LCDefaultConfig.resultProbability)
    end
end

--- 应用按球队分行的新配置格式。
--- 每一行代表一个下注区（球队），通过 wheelPositions 指定其在 16 格转盘中的位置，
--- wheelMultiples 与 positionProbabilities 分别提供这些位置的倍数与开奖概率。
--- 未配置或配置非法的位置保留默认值，避免热更新异常导致运行时数组出现空洞。
--- @param tab table BountyFootballCore 多行配置表
--- @return boolean 是否识别并应用了新格式
local function applyCarRows(tab)
    local rows = teamConfigRows(tab)
    if #rows == 0 then return false end

    local resultBetIndex = cloneTable(LCDefaultConfig.resultBetIndex)
    local wheelMultiple = cloneTable(LCDefaultConfig.wheelMultiple)
    local resultProbability = cloneTable(LCDefaultConfig.resultProbability)

    for _, item in ipairs(rows) do
        local betIndex = item.betIndex
        local row = item.row
        local positions = row.wheelPositions
        local multiples = row.wheelMultiples
        local probabilities = row.positionProbabilities

        if betIndex >= 1 and betIndex <= 10 and type(positions) == "table" then
            for arrayIndex, rawPosition in ipairs(positions) do
                local position = cfgNumber(rawPosition, 0)
                if position >= 1 and position <= 16 then
                    resultBetIndex[position] = betIndex

                    if type(multiples) == "table" then
                        wheelMultiple[position] = cfgNumber(
                            multiples[arrayIndex] or multiples[tostring(arrayIndex)],
                            wheelMultiple[position]
                        )
                    end

                    if type(probabilities) == "table" then
                        resultProbability[position] = cfgNumber(
                            probabilities[arrayIndex] or probabilities[tostring(arrayIndex)],
                            resultProbability[position]
                        )
                    end
                end
            end
        end
    end

    if sumArray(resultProbability) <= 0 then
        resultProbability = cloneTable(LCDefaultConfig.resultProbability)
    end

    LCResultBetIndex = resultBetIndex
    LCWheelMultiple = wheelMultiple
    LCResultProbability = resultProbability
    return true
end

--- 从 gConfigMgr 加载 "BountyFootballCore" 配置表并应用到运行时。
--- 新格式调用链：配置表 → applyCarRows → 展开为 16 个转盘位置。
--- 旧格式调用链：配置表 → firstConfigRow → applyConfig。
--- 热更新时可直接传入回调收到的新配置，确保本次回调内立即生效；
--- 未传入时再从 gConfigMgr 读取当前基础配置。
--- 若配置表不存在，则使用 LCDefaultConfig 中的默认值。
--- @param tab table|nil 热更新回调传入的 BountyFootballCore 配置
function BountyFootballLoadConfig(tab)
    local config = tab
    if type(config) ~= "table" then
        config = cfgTable("BountyFootballCore")
    end

    if applyCarRows(config) then return end
    applyConfig(firstConfigRow(config))
end

--- 获取当前生效的核心配置快照（深拷贝，防止外部修改污染内部状态）。
--- 返回的 table 包含：
---   - gameName / heartbeatMs / rankSize / betSeconds / runSeconds / finalSeconds
---   - resultBetIndex  轮子位置 → 下注区域映射数组（长度 16）
---   - wheelMultiple   轮子位置 → 赔率倍数数组（长度 16）
---   - resultProbability 轮子位置 → 中奖概率数组（长度 16）
--- @return table 当前生效的核心配置（深拷贝副本）
function BountyFootballGetCoreConfig()
    return {
        gameName = BountyFootballConst.gameName,
        heartbeatMs = BountyFootballConst.heartbeatMs,
        rankSize = BountyFootballConst.rankSize,
        betSeconds = BountyFootballConst.betSeconds,
        runSeconds = BountyFootballConst.runSeconds,
        finalSeconds = BountyFootballConst.finalSeconds,
        resultBetIndex = cloneTable(LCResultBetIndex),
        wheelMultiple = cloneTable(LCWheelMultiple),
        resultProbability = cloneTable(LCResultProbability),
    }
end

-- 模块加载时立即使用默认配置初始化，确保即使未调用 BountyFootballLoadConfig
-- 也能正常使用游戏（之后可通过调用 BountyFootballLoadConfig() 热更配置）。
applyConfig(LCDefaultConfig)
