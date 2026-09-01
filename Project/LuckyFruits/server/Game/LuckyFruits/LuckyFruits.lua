-- ============================================================
-- LuckyFruits 模块：游戏核心工具集
-- 提供开奖结果生成、奖励计算、数据克隆、筹码管理等基础能力，
-- 被 LuckyFruitsScene / LuckyFruitsPlayer / LuckyFruitsMachine 共用。
-- 全局变量：LFGameStatus/LFTradeCode/LFResultIndexes/LFResultProbability/LFWheelMultiple
-- ============================================================

require "LuckyFruits.LuckyFruitsConfig"

-- 游戏回合状态机：bet(下注)→run(开奖中)→final(结算)→bet(下一轮)
LFGameStatus = { stop = 0, bet = 1, run = 2, final = 4, heartbeat = 7, maintenance = 99998 }
-- 下注交易码：与平台SDK对齐，用于客户端展示下注失败原因
LFTradeCode = { success = 0, insufficient = -1, missTime = -2, closeServer = -4, fail = -8, repeatOrder = -11 }
-- 必须与前端 Common.ts 的 DEFAULT_BET_GRADE_AMOUNTS 保持一致。
-- 后台未下发 Costs 时，双方用此配置继续构造和校验下注。
local LFDefaultGradeAmounts = { 100, 1000, 10000, 100000 }

-- 开奖结果符号到转盘位置的映射：winPos(0-8)对应中奖位置数组
-- winPos=9为特殊"苹果时间"模式，结果由动态生成；10-14为固定结果序列
LFResultIndexes = {
    [0] = { 5 }, [1] = { 15 }, [2] = { 1 }, [3] = { 9 },
    [4] = { 0, 4, 8, 12 }, [5] = { 7, 11 }, [6] = { 3, 13 },
    [7] = { 10 }, [8] = { 2 },
}
-- 深拷贝表：递归复制所有层级，避免引用共享导致的数据污染
function LFClone(value)
    if type(value) ~= "table" then return value end
    local result = {}
    for key, item in pairs(value) do result[key] = LFClone(item) end
    return result
end

-- 数组求和：对每个元素向下取整并过滤负数，防止脏数据影响总额
function LFArraySum(values)
    local total = 0
    for _, value in ipairs(values or {}) do
        total = total + math.max(0, math.floor(tonumber(value) or 0))
    end
    return total
end

-- 空下注数组：5个下注位置（对应转盘5个区域）初始为0
function LFEmptyBets() return { 0, 0, 0, 0, 0 } end

-- 获取当前配置的筹码面额列表（从项目公共配置projCommon.Costs加载）
-- 用于校验下注筹码数量与金额的一致性，面额决定后注：gradeAmounts[i]为第i档筹码面额
-- 有效配置允许1～5档；后台未配置时使用与前端一致的默认档位。
function LFGetGradeAmounts()
    local common = gApp and gApp.getProjCommon and gApp:getProjCommon() or nil
    local costs = type(common) == "table" and common.Costs or nil
    local values, seen = {}, {}
    if type(costs) == "table" then
        for _, cost in ipairs(costs) do
            -- 只接受正整数的面额值（防止配置错误引入小数或负数）
            local coins = tonumber(cost and cost.Coins)
            if coins and coins > 0 and coins <= 9007199254740991
                and coins == math.floor(coins) and not seen[coins] then
                seen[coins] = true
                values[#values + 1] = coins
            end
            if #values >= 5 then break end
        end
    end
    if #values == 0 then
        for _, coins in ipairs(LFDefaultGradeAmounts) do
            values[#values + 1] = coins
        end
    end
    return values
end

-- 创建空筹码计数表：5个下注位置×gradeCount档面额，全部初始化为0
-- gradeCount默认取当前配置的筹码档数
function LFEmptyChipCounts(gradeCount)
    gradeCount = gradeCount or #LFGetGradeAmounts()
    local result = {}
    for i = 1, 5 do
        result[i] = {}
        for j = 1, gradeCount do result[i][j] = 0 end
    end
    return result
end

-- 合并两份筹码计数表：base + delta 逐位累加，用于累计本回合玩家下注
-- 对每个元素做向下取整与负数过滤，保证数据合法性
function LFMergeChipCounts(base, delta)
    local gradeCount = #LFGetGradeAmounts()
    local result = LFEmptyChipCounts(gradeCount)
    for i = 1, 5 do
        for j = 1, gradeCount do
            result[i][j] = math.max(0, math.floor(tonumber(base and base[i] and base[i][j]) or 0))
                + math.max(0, math.floor(tonumber(delta and delta[i] and delta[i][j]) or 0))
        end
    end
    return result
end

-- 生成[0,1)随机数：优先使用框架gRandom保证跨服一致性，回退math.random
local function randomUnit()
    if gRandom and gRandom.gen_between_int then return gRandom:gen_between_int(0, 999999) / 1000000 end
    return math.random()
end

-- 加权随机选择：按weights权重随机返回一个索引(0-based)
-- weights为空或全0时返回0；归一化处理负数权重为0
function LFWeightedResult(weights)
    weights = weights or LFResultProbability
    local total = 0
    for _, weight in ipairs(weights or {}) do total = total + math.max(0, tonumber(weight) or 0) end
    if total <= 0 then return 0 end
    local roll, cursor = randomUnit() * total, 0
    for i, weight in ipairs(weights) do
        cursor = cursor + math.max(0, tonumber(weight) or 0)
        if roll < cursor then return i - 1 end
    end
    return #weights - 1
end

-- 从数组中随机取一个元素：用于在中奖位置映射中随机选位置
function LFRandomIndex(values)
    if type(values) ~= "table" or #values == 0 then return nil end
    local index = math.floor(randomUnit() * #values) + 1
    return values[math.max(1, math.min(#values, index))]
end

-- 从尚未抽中过的位置中随机取一个，并立即标记为已使用。
-- 苹果时间按转盘格无放回抽取；同类水果可以命中不同格，但同一格不会重复命中。
local function randomUnusedIndex(values, usedPositions)
    local available = {}
    for _, value in ipairs(values or {}) do
        if not usedPositions[value] then available[#available + 1] = value end
    end
    local position = LFRandomIndex(available)
    if position ~= nil then usedPositions[position] = true end
    return position
end

-- 生成开奖结果详情：根据winPos返回resultDetail数组
-- winPos=9为"苹果时间"特殊模式：动态生成最多14个符号（含0/4苹果停止符）
-- winPos=10/11/12为预设固定结果序列（大额奖励场景）
-- winPos=13/14为特殊结果（无奖励）
function LFGenerateResultDetail(winPos, weights)
    if winPos == 9 then
        -- 苹果时间：counts限定各类符号出现次数上限
        local counts = { 1, 1, 1, 1, 4, 2, 2, 1, 1 }
        local detail = { 9 }
        repeat
            -- 计算各符号的可用权重（次数耗尽则权重为0）
            local available, availableTotal = {}, 0
            for i = 1, 9 do
                available[i] = counts[i] > 0 and math.max(0, tonumber(weights[i]) or 0) or 0
                availableTotal = availableTotal + available[i]
            end
            -- 高级配置可能会禁用苹果停止符号（0/4）。  
            -- 当所有已配置的权重用完后自动回退，可防止苹果时间的绘制无限循环，同时保持默认设置不变。
            local reward
            if availableTotal > 0 then
                -- 按权重随机抽取下一个符号
                reward = LFWeightedResult(available)
            elseif counts[1] > 0 then
                -- 配置禁用符号0但次数未用尽时强制停止
                reward = 0
            elseif counts[5] > 0 then
                -- 配置禁用符号4但次数未用尽时强制停止
                reward = 4
            else
                break
            end
            counts[reward + 1] = counts[reward + 1] - 1
            detail[#detail + 1] = reward
        until reward == 0 or reward == 4
        return detail
    elseif winPos == 10 then return { 10, 0, 1, 2, 4, 4, 6, 8 }
    elseif winPos == 11 then return { 11, 3, 4, 4, 5, 5, 6, 7 }
    elseif winPos == 12 then return { 12, 0, 1, 2, 3, 4, 4, 4, 4, 5, 5, 6, 6, 7, 8 }
    elseif winPos == 13 then return { 13 }
    elseif winPos == 14 then return { 14 }
    end
    return { winPos }
end

-- 生成完整开奖结果：随机选winPos + 生成对应resultDetail
function LFGenerateResult(weights)
    local winPos = LFWeightedResult(weights or LFResultProbability)
    return { winPos = winPos, resultDetail = LFGenerateResultDetail(winPos, weights or LFResultProbability) }
end

-- 计算奖励金额：遍历resultDetail中每个符号按LFWheelMultiple倍率累加
-- 符号0-3对应下注位置1-4（bets[1..4]），符号4-8对应下注位置1-5（bets[1..5]）
-- winPos=13/14为特殊结果无奖励，直接返回0
function LFRevenue(bets, resultDetail)
    if type(resultDetail) ~= "table" or resultDetail[1] == 13 or resultDetail[1] == 14 then return 0 end
    local total = 0
    for _, reward in ipairs(resultDetail) do
        if reward >= 0 and reward < 4 then
            -- 符号0-3：倍率取LFWheelMultiple[reward+1]，对应bets[reward+1]
            total = total + (tonumber(bets[reward + 1]) or 0) * (LFWheelMultiple[reward + 1] or 0)
        elseif reward >= 4 and reward < 9 then
            -- 符号4-8：倍率取LFWheelMultiple[reward+1]，对应bets[reward-3]（错位映射）
            total = total + (tonumber(bets[reward - 3]) or 0) * (LFWheelMultiple[reward + 1] or 0)
        end
    end
    return math.floor(total)
end

-- 计算中奖符号在转盘上的展示位置：用于客户端动画
-- winPos=9时为每个符号随机选位置；普通winPos仅一个位置
function LFResultPositions(result)
    local positions = {}
    if result.winPos == 9 then
        local usedPositions = {}
        for i = 2, #result.resultDetail do
            local pos = randomUnusedIndex(LFResultIndexes[result.resultDetail[i]], usedPositions)
            if pos ~= nil then positions[#positions + 1] = pos end
        end
    elseif result.winPos < 9 then
        local pos = LFRandomIndex(LFResultIndexes[result.winPos])
        if pos ~= nil then positions[1] = pos end
    end
    return positions
end

-- 计算开奖阶段的整数倒计时初值：协议 remainSecond 为 int32。
-- 返回值按 TS 版小数时长所占的心跳数量换算，避免直接向下取整少播放一拍。
function LFRunSeconds(result)
    local detailCount = #(result.resultDetail or {})
    if result.winPos == 9 then
        local baseSeconds = math.max(4, math.floor(detailCount / 3))
        local drawCount = math.max(0, detailCount - 1)
        local doubledSeconds = baseSeconds * 2 + drawCount * 3 + 8
        return math.floor((doubledSeconds + 1) / 2)
    elseif result.winPos >= 10 and result.winPos <= 12 then
        return math.floor(detailCount / 3) + 12
    end
    return 8
end

-- 构造玩家账号快照：用于推送给客户端展示资产与身份信息
function LFAccount(player)
    return {
        diamond = math.floor(player:getCoins() or 0),
        avatar = player:getAvatarUrl() or "",
        nickname = player:getName() or "",
        level = 0,
    }
end
