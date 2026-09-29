-- 拉霸类游戏（MageJackpot）随机结果生成器
-- 负责单局转动结果生成、连线倍率计算、Jackpot 大奖池调度与免费游戏触发
require "MageJackpot.MageJackpotConfig"

-- 模块内部状态：确保配置只加载一次
local initialized = false
-- 当前游戏全局概率配置（slot/free/jackpot 等概率集合）
local gameRate = nil
-- 已结算的付费局数，用于按周期触发 Jackpot 计划
local paidRound = 0
-- 当前周期内命中 Jackpot 的局号集合（按升序排列）
local jackpotRounds = {}
-- Jackpot 累积奖池初始值
local jackpotPool = 17000

-- 确保配置已完成初始化（懒加载，仅首次调用时加载）
local function ensureInitialized()
    if initialized then
        return
    end
    initialized = true
    MageJackpotLoadConfig()
    gameRate = MageJackpotDefaultGameRate()
end

-- 生成单局 3x5 的转轴结果
-- 屏幕共 15 个格子，5 列各使用独立概率表 slotProbabilitys[reelIndex]
local function generateSlotResults(slotProbabilitys)
    local results = {}
    for index = 1, 15 do
        -- index 从 1 开始，计算当前格子属于第几列（1~5）
        local reelIndex = ((index - 1) % 5) + 1
        local probability = slotProbabilitys[reelIndex] or {}
        results[index] = FRRateRandomResult(probability)
    end
    return results
end

-- 按正式机台规则计算所有中奖线的总倍率。
-- RandomTest 必须与 MageJackpotMachine 保持相同的 Wild、功能图标和二连赔付语义。
local function calculateMultiple(results)
    local totalMultiple = 0
    local function isFeatureSymbol(symbol)
        return symbol == FRSymbol.bonus
            or symbol == FRSymbol.free
            or symbol == FRSymbol.jackpot
    end

    local function hasLinePayout(symbol)
        if isFeatureSymbol(symbol) then return false end
        local multiples = FRConnectMultiples[(symbol or 0) + 1] or {}
        return (tonumber(multiples[1]) or 0) > 0
            or (tonumber(multiples[2]) or 0) > 0
            or (tonumber(multiples[3]) or 0) > 0
            or (tonumber(multiples[4]) or 0) > 0
    end

    for _, linePath in ipairs(FRLinePaths or {}) do
        local target = results[linePath[1]]
        if target == FRSymbol.wild then
            for pathIndex = 2, #linePath do
                local candidate = results[linePath[pathIndex]]
                if candidate ~= FRSymbol.wild then
                    target = candidate
                    break
                end
            end
        end

        if hasLinePayout(target) then
            local symbolMultiples = FRConnectMultiples[(target or 0) + 1] or {}
            local count = 1
            for pathIndex = 2, #linePath do
                local symbol = results[linePath[pathIndex]]
                if symbol == FRSymbol.wild or symbol == target then
                    count = count + 1
                else
                    break
                end
            end
            local minimumCount = (tonumber(symbolMultiples[1]) or 0) > 0 and 2 or 3
            if count >= minimumCount then
                totalMultiple = totalMultiple + (tonumber(symbolMultiples[count - 1]) or 0)
            end
        end
    end
    return totalMultiple
end

-- 依据概率表随机生成一个计数值（用于 Jackpot 个数、免费次数档位等）
local function randomCount(probability)
    return tonumber(FRRateRandomResult(probability or {})) or 0
end

-- 重新规划当前 Jackpot 周期内的中奖局号
-- 在新用户保护期过后，于一个周期内随机选取若干局作为 Jackpot 触发点
local function resetJackpotPlan()
    jackpotRounds = {}
    local rate = FRJackpotRateDefault or { min = 2, max = 2 }
    -- 本周期内安排的 Jackpot 次数
    local count = FRRandomInt(tonumber(rate.min) or 2, tonumber(rate.max) or 2)
    -- 新用户保护期：在前 N*3 局内不触发 Jackpot，避免开局即大奖
    local firstRound = math.max(1, (tonumber(FRNewUserRoundDefault) or 20) * 3)
    -- 在保护期之后、周期之内随机挑选不重复的局号
    while #jackpotRounds < count do
        local round = FRRandomInt(firstRound, tonumber(FRJackpotPeriod) or 5000)
        local exists = false
        for _, value in ipairs(jackpotRounds) do
            if value == round then
                exists = true
                break
            end
        end
        if not exists then
            table.insert(jackpotRounds, round)
        end
    end
    -- 升序排列，便于按命中顺序依次触发
    table.sort(jackpotRounds)
end

-- 推进一局付费局，判断本局是否命中 Jackpot 触发点
local function nextJackpotHit()
    paidRound = paidRound + 1
    local period = math.max(1, tonumber(FRJackpotPeriod) or 5000)
    -- 当前局在周期内的相对位置（1~period）
    local periodRound = ((paidRound - 1) % period) + 1
    -- 进入新周期时重新规划 Jackpot 触发点
    if periodRound == 1 then
        resetJackpotPlan()
    end
    -- 若当前局号已达到最早一个触发点，则命中并移除该点
    if #jackpotRounds > 0 and periodRound >= jackpotRounds[1] then
        table.remove(jackpotRounds, 1)
        return true
    end
    return false
end

-- 将本局中奖金额的一部分注入 Jackpot 累积奖池
-- 奖池过大时递减注入速度，避免无限膨胀
local function addJackpotPool(lineWin)
    local incr = lineWin * (tonumber(FRJackpotPoolIncrRate) or 0)
    if jackpotPool > 22000 then
        incr = incr / 4
    elseif jackpotPool > 20000 then
        incr = incr / 2
    end
    jackpotPool = jackpotPool + incr
end

-- 完整模拟一次转轴：生成结果并计算线赢倍率
local function spinLineMultiple()
    local results = generateSlotResults(gameRate.slot or FRSlotProbabilitysDefault)
    return calculateMultiple(results)
end

-- RandomTest 框架入口。返回本局相对总下注的派奖倍率。
-- price 参数由框架透传（此处保留兼容，未参与计算）
function GenRandom(price)
    ensureInitialized()
    -- 有效中奖线数，用于将总奖励折算为单线下注倍率
    local lineCount = math.max(1, tonumber(FRLineCount) or #(FRLinePaths or {}))
    -- 基础局（付费局）的线赢总倍率
    local totalReward = spinLineMultiple()
    local baseMultiple = totalReward
    local hasJackpot = false
    local hasBonus = false
    local freeTimes = 0

    -- 与线上一致：大赢局不触发特殊玩法；Jackpot、幸运转盘、免费游戏按该顺序互斥。
    if baseMultiple < (tonumber(FRBigWinMultiple) or 100) and nextJackpotHit() then
        -- 触发 Jackpot：按档位抽取个数，并按对应比例从奖池中派奖
        local jackpotCount = randomCount(FRJackpotCountProbability345)
        local percentage = tonumber((FRJackpotPercentage or {})[jackpotCount + 1]) or 0
        local jackpotReward = FRRoundInt(jackpotPool * percentage)
        jackpotPool = math.max(0, jackpotPool - jackpotReward)
        totalReward = totalReward + jackpotReward
        hasJackpot = jackpotReward > 0
    elseif baseMultiple < (tonumber(FRBigWinMultiple) or 100)
        and FRRandom01() < (tonumber(FRBonusProbabilityDefault) or 0) then
        local bonusMultiplier = tonumber(FRBonusMultiplierValues[
            FRRateRandomDefault(FRBonusMultiplierWeights) + 1]) or 0
        totalReward = totalReward + baseMultiple * math.max(0, bonusMultiplier)
        hasBonus = bonusMultiplier > 0
    elseif baseMultiple < (tonumber(FRBigWinMultiple) or 100)
        and FRRandom01() < (tonumber(gameRate.free) or tonumber(FRFreeProbabilityDefault) or 0) then
        -- 未触发 Jackpot 时，按概率触发免费游戏并抽取免费次数档位
        local freeCount = randomCount(FRFreeCountProbability345)
        freeTimes = tonumber((FRFreeTimes or {})[freeCount + 1]) or 0
    end

    -- 基础局奖励注入 Jackpot 累积奖池
    addJackpotPool(baseMultiple)
    -- 依次结算每一次免费游戏的线赢倍率
    for _ = 1, freeTimes do
        local freeMultiple = spinLineMultiple()
        totalReward = totalReward + freeMultiple
        addJackpotPool(freeMultiple)
    end

    -- 归类本局结果类型，便于上层统计
    local resultType = "normal"
    if hasJackpot then
        resultType = "jackpot"
    elseif hasBonus then
        resultType = "bonus"
    elseif freeTimes > 0 then
        resultType = "free"
    end
    -- 返回：相对总下注的派奖倍率、本局结果类型
    return totalReward / lineCount, resultType
end
