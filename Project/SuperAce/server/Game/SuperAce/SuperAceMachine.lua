require "CommomDefine"
local Config = require "SuperAce.SuperAceConfig"

-- SuperAce 老虎机核心算法：负责生成盘面、计算倍数、消除连消、控奖与免费游戏流程。
-- 输入：betAmount(下注额) calculateAmount(计奖基数) analysis(单控分析参数)。
-- 输出：主局结果 + 免费游戏结果列表 + EGameOddsResult 状态码。
-- 枚举统一引用 CommomDefine：EAnalyType / EGameOddsResult。
SuperAceMachine = class__()

-- 工具函数区：clone 深拷贝、arraySum 求和、round 四舍五入、contains 判包含、
-- unique 去重、difference 差集、randomInt 区间随机、rateRandom 按权重随机(下标从0起)。
local function clone(value, seen)
    if type(value) ~= "table" then
        return value
    end
    seen = seen or {}
    if seen[value] then
        return seen[value]
    end
    local out = {}
    seen[value] = out
    for key, item in pairs(value) do
        out[clone(key, seen)] = clone(item, seen)
    end
    return out
end

local function arraySum(values)
    local total = 0
    for i = 1, #(values or {}) do
        total = total + values[i]
    end
    return total
end

local function round(value)
    return math.floor(value + 0.5)
end

local function emptyMultipleKinds()
    return {0, 0, 0, 0, 0, 0, 0, 0, 0}
end

-- 客户端把 eliminateIndexs 非空视为“协议中一定还有下一盘面”。达到协议项数或
-- 倍数安全上限时，当前盘面只能作为终止盘面，不能留下一个无法播放的消除步骤。
local function makeTerminalResultItem(resultItem)
    resultItem.eliminateIndexs = {}
    resultItem.multiple = 0
    resultItem.multiples = {}
    resultItem.multipleKinds = emptyMultipleKinds()
end

local function contains(values, target)
    for i = 1, #values do
        if values[i] == target then
            return true
        end
    end
    return false
end

local function unique(values)
    local out, exists = {}, {}
    for i = 1, #values do
        local value = values[i]
        if not exists[value] then
            exists[value] = true
            out[#out + 1] = value
        end
    end
    return out
end

local function difference(values, excluded)
    local blocked, out = {}, {}
    for i = 1, #(excluded or {}) do
        blocked[excluded[i]] = true
    end
    for i = 1, #(values or {}) do
        if not blocked[values[i]] then
            out[#out + 1] = values[i]
        end
    end
    return out
end

local function randomInt(minValue, maxValue)
    if maxValue <= minValue then
        return minValue
    end
    return gRandom:gen_between_int(minValue, maxValue)
end

-- 返回值与 TS 的 rateRandom 一致，使用从 0 开始的概率下标。
local function rateRandom(weights)
    local total = arraySum(weights)
    if total <= 0 then
        return 0
    end
    local value = gRandom:gen_float() * total
    local cursor = 0
    for index = 1, #weights do
        cursor = cursor + weights[index]
        if value < cursor then
            return index - 1
        end
    end
    return #weights - 1
end

function SuperAceMachine:ctor__()
    local Config = require "SuperAce.SuperAceConfig"
    if type(Config) ~= "table" then
        Config = {
            slotProbabilitysDefault = {
                {0, 27, 10, 11, 15, 15, 7, 8, 7},
                {0, 10, 27, 15, 11, 7, 15, 7, 8},
                {0, 27, 10, 11, 15, 15, 7, 8, 7},
                {0, 10, 27, 15, 11, 7, 15, 7, 8},
                {0, 27, 10, 11, 15, 15, 7, 8, 7}
            },
            connectMultiples = {
                [0] = {0, 0, 0, 0, 0, 0},
                [1] = {0, 0, 0, 0.05, 0.15, 0.25},
                [2] = {0, 0, 0, 0.05, 0.15, 0.25},
                [3] = {0, 0, 0, 0.10, 0.30, 0.50},
                [4] = {0, 0, 0, 0.10, 0.30, 0.50},
                [5] = {0, 0, 0, 0.20, 0.60, 1.00},
                [6] = {0, 0, 0, 0.30, 0.90, 1.50},
                [7] = {0, 0, 0, 0.40, 1.20, 2.00},
                [8] = {0, 0, 0, 0.50, 1.50, 2.50}
            },
            freeProbabilityDefault = 0.003,
            freeCountProbability012 = {0.3, 0.4, 0.3, 0, 0, 0},
            freeCountProbability345 = {0, 0, 0, 0.9, 0.1, 0},
            changeGoldNumProbability = {0.8, 0.14, 0.05, 0.009, 0.001},
            starCardNumProbability = {0.8, 0.14, 0.05, 0.009, 0.001},
            bigWildCopyNumberProbability = {0, 0.75, 0.2, 0.05, 0},
            wildRate = {0.95, 0.05},
            regenerateCount = 1,
            regenerateRange = {min = 0, max = 10},
            normalEliminateMultiples = {1, 2, 3, 5, 10},
            freeEliminateMultiples = {2, 4, 6, 10, 20},
            baseBet = 20,
            bigWinMultiple = 200,
            killCount = 5,
            maxResultItemCount = 128,
            maxFreeQueueCount = 256,
            maxTotalMultiple = 10000,
            indexInColumns = {
                [0] = {0, 5, 10, 15},
                [1] = {1, 6, 11, 16},
                [2] = {2, 7, 12, 17},
                [3] = {3, 8, 13, 18},
                [4] = {4, 9, 14, 19}
            },
            columns234Indexs = {1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18},
        }
        Config.defaultGameRate = function()
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
    end
    self.gameRate = SuperAceDefaultGameRate()
end

-- 根据单控分析参数克隆并覆盖默认概率：放水/杀分模式以及额外大奖加成概率。
-- analysis=nil 时直接返回默认配置，避免无意义深拷贝（RandomTest 高频调用场景）。
function SuperAceMachine:_getGameRate(analysis)
    -- 概率配置可在运行中热更新。不要复用构造期快照，否则 freeRate 这类
    -- 标量字段会一直沿用旧值；每次下注都基于当前配置生成一个新快照。
    self.gameRate = SuperAceDefaultGameRate()
    if analysis == nil then
        return self.gameRate
    end
    local rate = clone(self.gameRate)
    local analyType = tonumber(analysis.analyType) or EAnalyType.NoLimit
    if analyType == EAnalyType.PlayerWin then
        rate.rateType = "water"
    elseif analyType == EAnalyType.PlayerLoss then
        rate.rateType = "kill"
    end
    rate.bigRewardAddRate = math.max(0, tonumber(analysis.bigRewardAddRate) or 0)
    return rate
end

-- 计算平台奖励硬上限：综合 rewardMax(绝对上限)、rewardRateMax(下注比例上限)、
-- waterRuler(控水分位) 三种约束取最严格者。返回 是否有限制, 上限值。
function SuperAceMachine:_controlLimit(betAmount, analysis)
    if type(analysis) ~= "table" then
        return false, 0
    end
    local rawRewardMax = tonumber(analysis.rewardMax) or 0
    -- 与平台/FruitSlots 约定一致：0 表示未配置，负数表示可派奖额度已经为 0。
    local hasLimit = rawRewardMax ~= 0
    local rewardMax = math.max(0, rawRewardMax)
    local rewardRateMax = math.max(0, tonumber(analysis.rewardRateMax) or 0)
    local rateLimit = rewardRateMax > 0 and round((betAmount or 0) * rewardRateMax / 10000) or 0
    if rateLimit > 0 and (not hasLimit or rateLimit < rewardMax) then
        hasLimit = true
        rewardMax = rateLimit
    end
    local waterRuler = math.max(0, tonumber(analysis.waterRuler) or 0)
    if waterRuler > 0 and (not hasLimit or waterRuler < rewardMax) then
        hasLimit = true
        rewardMax = waterRuler
    end
    return hasLimit, rewardMax
end

-- 生成可展示的零奖励盘面：每列使用不同符号，确保从第一列起无法形成连续三列中奖。
local function zeroRewardResult(betAmount, calculateAmount)
    local slotResult = {}
    for row = 1, 4 do
        for column = 1, 5 do
            slotResult[#slotResult + 1] = column
        end
    end
    return {
        betAmount = betAmount,
        calculateAmount = calculateAmount,
        resultItems = {{
            slotResult = slotResult,
            eliminateIndexs = {},
            multiple = 0,
            multiples = {},
            changeGoldenIndexs = {},
            copyWildIndexs = {},
            multipleKinds = {0, 0, 0, 0, 0, 0, 0, 0, 0}
        }},
        multiple = 0,
        multiples = {},
        freeCount = 0,
        multipleKinds = {0, 0, 0, 0, 0, 0, 0, 0, 0}
    }
end

-- 判断单局结果是否超出奖励上限：含大额下注保护(>1000 且 10 倍以上)与平台约束。
function SuperAceMachine:_isOverLimit(result, betAmount, analysis, totalRevenue)
    local revenue = totalRevenue or round(result.calculateAmount * result.multiple)
    if betAmount > 1000 and revenue > result.calculateAmount * 10 then
        return true
    end
    if analysis then
        if analysis.rewardMax and analysis.rewardMax > 0 and revenue > analysis.rewardMax then
            return true
        end
        if analysis.rewardRateMax and analysis.rewardRateMax > 0 then
            local maxRevenue = betAmount * analysis.rewardRateMax / 10000
            if revenue > maxRevenue then
                return true
            end
        end
    end
    return false
end

-- 判断整套(主局+免费)结果是否超上限：旧版只用免费局总奖励做大额下注二次收割，
-- 主局已在 generateResultsKill 中单独检查。
function SuperAceMachine:_isPackageOverLimit(mainResult, betAmount, analysis, freeRevenue, totalRevenue)
    if betAmount > 1000 and freeRevenue > mainResult.calculateAmount * 10 then
        return true
    end
    if analysis then
        if analysis.rewardMax and analysis.rewardMax > 0 and totalRevenue > analysis.rewardMax then
            return true
        end
        if analysis.rewardRateMax and analysis.rewardRateMax > 0 then
            local maxRevenue = betAmount * analysis.rewardRateMax / 10000
            if totalRevenue > maxRevenue then
                return true
            end
        end
    end
    return false
end

-- 判断倍数是否落在预期区间(预留接口，当前未在主流中被调用)。
function SuperAceMachine:_isExpected(multiple, range)
    return range and multiple > range.min and multiple <= range.max
end

-- 生成一整套结果：主局 + 所有免费局。返回 主结果, 免费结果列表, 总收益, 免费收益。
-- 单控的重随机次数由外层严格控制；这里仅保留旧版大额奖励保护。
function SuperAceMachine:_generatePackage(betAmount, calculateAmount, gameRate)
    local mainResult = self:generateResultsKill(betAmount, calculateAmount, gameRate, nil)
    local freeResults = {}
    local totalFreeRevenue = 0
    local totalFreeCount = mainResult.freeCount
    while totalFreeCount > 0 and #freeResults < Config.maxFreeQueueCount do
        local freeResult = self:generateResultsKill(
            betAmount, calculateAmount, gameRate, nil, totalFreeCount
        )
        freeResults[#freeResults + 1] = freeResult
        totalFreeRevenue = totalFreeRevenue + round(freeResult.calculateAmount * freeResult.multiple)
        totalFreeCount = freeResult.freeCount
    end
    local totalRevenue = round(mainResult.calculateAmount * mainResult.multiple) + totalFreeRevenue
    return mainResult, freeResults, totalRevenue, totalFreeRevenue
end

-- 对外主入口：根据是否传入 analysis 走两条路径。
-- 无 analysis：循环生成 killCount+1 次，选最小奖励或首个合规奖励。
-- 有 analysis：按放水/杀分/上限约束挑选最佳候选，必要时回退到零奖励盘面。
-- 返回：主结果, 免费结果列表, EGameOddsResult 状态码。
function SuperAceMachine:getResults(betAmount, calculateAmount, analysis)
    local gameRate = self:_getGameRate(analysis)
    if type(analysis) ~= "table" then
        local bestMain, bestFree, bestReward
        for _ = 1, Config.killCount + 1 do
            local mainResult, freeResults, reward, freeReward =
                self:_generatePackage(betAmount, calculateAmount, gameRate)
            if not bestReward or reward < bestReward then
                bestMain, bestFree, bestReward = mainResult, freeResults, reward
            end
            if not self:_isPackageOverLimit(mainResult, betAmount, nil, freeReward, reward) then
                return mainResult, freeResults, EGameOddsResult.Success
            end
        end
        return bestMain, bestFree or {}, EGameOddsResult.RulerMax
    end

    local analyType = tonumber(analysis.analyType) or EAnalyType.NoLimit
    local maxTimes = math.max(1, math.floor(tonumber(analysis.rerandomMax) or 1))
    local rerandomRate = math.max(0, tonumber(analysis.rerandomRate) or 0)
    local hasRewardLimit, rewardMax = self:_controlLimit(betAmount, analysis)
    local selectedMain, selectedFree, selectedReward, selectedFreeReward
    local sawWin = false

    for _ = 1, maxTimes do
        local candidateMain, candidateFree, reward, freeReward =
            self:_generatePackage(betAmount, calculateAmount, gameRate)
        sawWin = sawWin or reward > 0

        local better = selectedMain == nil
        if analyType == EAnalyType.PlayerLoss then
            better = better or reward < selectedReward
        elseif analyType == EAnalyType.PlayerWin then
            local within = not hasRewardLimit or reward <= rewardMax
            local oldWithin = selectedReward and (not hasRewardLimit or selectedReward <= rewardMax)
            better = better or (within and (not oldWithin or reward > selectedReward)) or
                (not within and not oldWithin and reward < selectedReward)
        elseif hasRewardLimit then
            better = better or (reward <= rewardMax and selectedReward > rewardMax) or
                (reward > rewardMax and selectedReward > rewardMax and reward < selectedReward)
        else
            local candidateOver = self:_isPackageOverLimit(
                candidateMain, betAmount, nil, freeReward, reward
            )
            local selectedOver = selectedMain and self:_isPackageOverLimit(
                selectedMain, betAmount, nil, selectedFreeReward or 0, selectedReward
            )
            better = better or (selectedOver and (not candidateOver or reward < selectedReward))
        end

        if better then
            selectedMain, selectedFree, selectedReward = candidateMain, candidateFree, reward
            selectedFreeReward = freeReward
        end

        local randomStop = rerandomRate > 0 and randomInt(1, 10000) > rerandomRate
        if (analyType == EAnalyType.PlayerLoss and selectedReward == 0) or
            (analyType == EAnalyType.PlayerWin and selectedReward > 0 and
                (not hasRewardLimit or selectedReward <= rewardMax)) or
            randomStop then
            break
        end
    end

    local exceededRewardLimit = hasRewardLimit and selectedReward and selectedReward > rewardMax
    if exceededRewardLimit then
        -- 平台奖励上限是硬约束；没有抽到合法候选时回退到可展示的零奖励盘面。
        selectedMain = zeroRewardResult(betAmount, calculateAmount)
        selectedFree = {}
        selectedReward = 0
    end

    local gameResult = EGameOddsResult.Success
    if exceededRewardLimit or
        (analyType == EAnalyType.PlayerWin and hasRewardLimit and rewardMax <= 0) then
        gameResult = EGameOddsResult.RulerMax
    elseif analyType == EAnalyType.PlayerWin and (not selectedReward or selectedReward <= 0) then
        gameResult = sawWin and EGameOddsResult.RulerMax or EGameOddsResult.RerandomMax
    end
    return selectedMain, selectedFree or {}, gameResult
end

-- 在 generateResults 之上叠加控奖：若首抽超限，则关闭 freeRate 重抽最多 killCount 次，
-- 取最小奖励或首个合规者。totalFreeCount 用于免费局剩余次数维护。
function SuperAceMachine:generateResultsKill(betAmount, calculateAmount, gameRate, analysis, totalFreeCount)
    local result = self:generateResults(betAmount, calculateAmount, gameRate, totalFreeCount or 0)
    local bestResult = result
    local bestRevenue = round(result.calculateAmount * result.multiple)
    if self:_isOverLimit(result, betAmount, analysis) then
        -- gameRate 使用字符串键（slot/freeRate 等），table.unpack 只会复制
        -- 连续的整数下标，导致控奖重抽时得到空表并在读取 slot 时崩溃。
        local killRate = clone(gameRate)
        killRate.freeRate = 0
        for _ = 1, Config.killCount do
            local candidate = self:generateResults(betAmount, calculateAmount, killRate, totalFreeCount or 0)
            local candidateRevenue = round(candidate.calculateAmount * candidate.multiple)
            if candidateRevenue < bestRevenue then
                bestResult = candidate
                bestRevenue = candidateRevenue
            end
            if not self:_isOverLimit(candidate, betAmount, analysis) then
                bestResult = candidate
                break
            end
        end
    end
    result = bestResult

    if totalFreeCount ~= nil then
        if result.freeCount > 0 then
            result.freeCount = math.max(0, totalFreeCount - 1 + 5)
        else
            result.freeCount = math.max(0, totalFreeCount - 1)
        end
    end
    return result
end

-- 生成单次旋转的完整结果：含初始盘面 + 连消链 + 触发的免费次数。
-- 多个倍数(multiples)累加得到总倍数；各类符号倍数分开统计(multipleKinds)。
-- 免费次数由最终盘面 scatter 数量 >=3 触发，固定为 10 次。
function SuperAceMachine:generateResults(betAmount, calculateAmount, gameRate, totalFreeCount)
    local multipleKinds = {0, 0, 0, 0, 0, 0, 0, 0, 0}
    local resultItems, multiples = {}, {}
    local isFreeGame = totalFreeCount > 0
    local giveFree = gRandom:gen_float() < gameRate.freeRate
    if not giveFree and (gameRate.bigRewardAddRate or 0) > 0 then
        giveFree = randomInt(1, 10000) <= gameRate.bigRewardAddRate
    end

    local scatterWeights = giveFree and gameRate.freeProbability345 or gameRate.freeProbability012
    local scatterCount = rateRandom(scatterWeights)
    local resultItem = self:generateResultItem(gameRate, 0, isFreeGame, scatterCount)
    local lastScatter = #self:countElement(resultItem.slotResult, 0)

    resultItems[#resultItems + 1] = resultItem
    for i = 1, #resultItem.multiples do
        multiples[#multiples + 1] = resultItem.multiples[i]
    end
    for i = 1, #multipleKinds do
        multipleKinds[i] = multipleKinds[i] + resultItem.multipleKinds[i]
    end

    -- 达到累计倍数阈值时仍保留本次可播放的中奖，再额外生成一个终止盘面；
    -- 若已经占到协议最后一个结果项，则当前项本身必须直接变成终止盘面。
    local terminateNextItem =
        arraySum(multiples) >= Config.maxTotalMultiple and #resultItem.eliminateIndexs > 0
    while #resultItem.eliminateIndexs > 0 and #resultItems < Config.maxResultItemCount do
        resultItem = self:generateEliminateResultItem(
            resultItem, gameRate, #resultItems, isFreeGame, math.max(0, scatterCount - lastScatter)
        )
        lastScatter = #self:countElement(resultItem.slotResult, 0)

        local reachesItemLimit = #resultItems + 1 >= Config.maxResultItemCount
        local isTerminalItem = terminateNextItem or reachesItemLimit
        if #resultItem.eliminateIndexs > 0 and isTerminalItem then
            makeTerminalResultItem(resultItem)
        end

        resultItems[#resultItems + 1] = resultItem
        for i = 1, #resultItem.multiples do
            multiples[#multiples + 1] = resultItem.multiples[i]
        end
        for i = 1, #multipleKinds do
            multipleKinds[i] = multipleKinds[i] + resultItem.multipleKinds[i]
        end
        if isTerminalItem then
            break
        end
        terminateNextItem =
            arraySum(multiples) >= Config.maxTotalMultiple and #resultItem.eliminateIndexs > 0
    end

    local freeCount = #self:countElement(resultItem.slotResult, 0) >= 3 and 10 or 0
    return {
        betAmount = betAmount,
        calculateAmount = calculateAmount,
        resultItems = resultItems,
        multiple = arraySum(multiples),
        multiples = multiples,
        freeCount = freeCount,
        multipleKinds = multipleKinds
    }
end

-- 生成单次盘面(非连消阶段)：先在 2/3/4 列随机生成金色符号，再逐列按权重抽符号，
-- 金色位置取负值；之后计算倍数和消除位置；最后按 scatterCount 在剩余位置填 scatter(0)。
function SuperAceMachine:generateResultItem(gameRate, eliminateCount, freeGame, scatterCount)
    local slotResult, goldenIndexes = {}, {}
    local candidates = {table.unpack(Config.columns234Indexs)}
    local goldenCount = rateRandom(gameRate.goldenRate)
    for _ = 1, math.min(goldenCount, #candidates) do
        local index = randomInt(1, #candidates)
        goldenIndexes[#goldenIndexes + 1] = candidates[index]
        table.remove(candidates, index)
    end

    for position = 0, 19 do
        local symbol = rateRandom(gameRate.slot[(position % 5) + 1])
        if symbol ~= 0 and contains(goldenIndexes, position) then
            symbol = -symbol
        end
        slotResult[position + 1] = symbol
    end

    local multipleResult = self:calculateMultiple(slotResult, eliminateCount, freeGame)
    local result = {
        slotResult = slotResult,
        eliminateIndexs = multipleResult.eliminateIndexs,
        multiple = multipleResult.multiple,
        multiples = multipleResult.multiples,
        changeGoldenIndexs = {},
        copyWildIndexs = {},
        multipleKinds = multipleResult.multipleKinds
    }

    local available = {}
    for position = 0, 19 do
        available[#available + 1] = position
    end
    if #result.eliminateIndexs > 0 then
        available = difference(available, result.eliminateIndexs)
        scatterCount = randomInt(0, math.min(scatterCount, #available))
    end
    scatterCount = math.min(scatterCount, #available)
    for _ = 1, scatterCount do
        local index = randomInt(1, #available)
        result.slotResult[available[index] + 1] = 0
        table.remove(available, index)
    end
    return result
end

-- 连消盘面生成：对上一轮消除位置填 Wild(9/10)，大 Wild 触发复制；
-- 再按 starCardRate 将部分普通符号转金色；最后计算倍数和补充 scatter。
function SuperAceMachine:generateEliminateResultItem(previous, gameRate, eliminateCount, freeGame, scatterCount)
    local slotResult = {table.unpack(previous.slotResult)}
    local hasBigWild = false
    local copyWildIndexes, changeGoldenIndexes, changeWildIndexes = {}, {}, {}

    for i = 1, #previous.eliminateIndexs do
        local position = previous.eliminateIndexs[i]
        local value = slotResult[position + 1]
        if value > 0 then
            slotResult[position + 1] = false
        else
            local wildIndex = rateRandom(gameRate.wildRate)
            slotResult[position + 1] = wildIndex + 9
            changeWildIndexes[#changeWildIndexes + 1] = position
            hasBigWild = hasBigWild or wildIndex == 1
        end
    end

    if hasBigWild then
        local copyCount = rateRandom(gameRate.wildCopyRates)
        for _ = 1, copyCount do
            local column = randomInt(1, 4)
            local positions = Config.indexInColumns[column]
            local position = positions[randomInt(1, #positions)]
            local value = slotResult[position + 1]
            if value ~= 0 and value ~= 9 and value ~= 10 then
                copyWildIndexes[#copyWildIndexes + 1] = position
                slotResult[position + 1] = 10
            end
        end
    end

    local candidates = {table.unpack(Config.columns234Indexs)}
    local goldenCount = eliminateCount == 1 and 0 or rateRandom(gameRate.starCardRate)
    if eliminateCount > 5 then
        local guard = 0
        while goldenCount == 0 and guard < 20 do
            goldenCount = rateRandom(gameRate.starCardRate)
            guard = guard + 1
        end
    end
    local unchanged = {}
    for position = 0, 19 do
        local value = slotResult[position + 1]
        if value ~= false and (value == 0 or value == 9 or value == 10 or value < 0) then
            unchanged[#unchanged + 1] = position
        end
    end
    candidates = difference(candidates, unchanged)
    local turnGoldenIndexes = {}
    for _ = 1, math.min(goldenCount, #candidates) do
        local index = randomInt(1, #candidates)
        turnGoldenIndexes[#turnGoldenIndexes + 1] = candidates[index]
        table.remove(candidates, index)
    end

    for position = 0, 19 do
        local value = slotResult[position + 1]
        if value == false then
            value = rateRandom(gameRate.slot[(position % 5) + 1])
        end
        if value > 0 and value ~= 9 and value ~= 10 and contains(turnGoldenIndexes, position) then
            value = -value
            changeGoldenIndexes[#changeGoldenIndexes + 1] = position
        end
        slotResult[position + 1] = value
    end

    local multipleResult = self:calculateMultiple(slotResult, eliminateCount, freeGame)
    local result = {
        slotResult = slotResult,
        eliminateIndexs = multipleResult.eliminateIndexs,
        multiple = multipleResult.multiple,
        multiples = multipleResult.multiples,
        changeGoldenIndexs = unique(changeGoldenIndexes),
        copyWildIndexs = unique(copyWildIndexes),
        multipleKinds = multipleResult.multipleKinds
    }

    local available = difference(previous.eliminateIndexs, result.eliminateIndexs)
    available = difference(available, changeGoldenIndexes)
    available = difference(available, copyWildIndexes)
    available = difference(available, changeWildIndexes)
    if #result.eliminateIndexs > 0 then
        scatterCount = randomInt(0, math.min(scatterCount, #available))
    end
    scatterCount = math.min(scatterCount, #available)
    for _ = 1, scatterCount do
        local index = randomInt(1, #available)
        result.slotResult[available[index] + 1] = 0
        table.remove(available, index)
    end
    return result
end

-- 倍数计算核心：从第 1 列符号出发，按 way 机制统计每列匹配数(普通/金色/Wild 都算)。
-- 连续到第 N 列时按 N 连派奖，ways = 各列匹配数乘积；倍数 = baseMultiple × cascadeMultiple。
-- 同时返回需要消除的位置(unique 后)和按符号分类的累计倍数。
function SuperAceMachine:calculateMultiple(results, eliminateCount, freeGame)
    local multipleKinds = {0, 0, 0, 0, 0, 0, 0, 0, 0}
    local columns = self:convertArrayDimension(results)
    local multiples, eliminateIndexes = {}, {}
    local cascadeRates = freeGame and Config.freeEliminateMultiples or Config.normalEliminateMultiples
    local rewardSymbols = unique(columns[1])

    for i = 1, #rewardSymbols do
        local rewardSymbol = math.abs(rewardSymbols[i])
        if rewardSymbol > 0 and rewardSymbol <= 8 then
            local columnCounts = {0, 0, 0, 0, 0}
            local matched = {}
            for column = 1, 5 do
                for row = 1, 4 do
                    local value = columns[column][row]
                    if value == rewardSymbol or value == -rewardSymbol or value == 9 or value == 10 then
                        columnCounts[column] = columnCounts[column] + 1
                        matched[#matched + 1] = (column - 1) + (row - 1) * 5
                    end
                end
                if columnCounts[column] < 1 then
                    break
                end
            end

            local uniqueMatched = unique(matched)
            if #uniqueMatched >= 3 and columnCounts[3] >= 1 then
                local ways, connectedColumns = 1, 0
                for column = 1, 5 do
                    if columnCounts[column] > 0 then
                        ways = ways * columnCounts[column]
                        connectedColumns = connectedColumns + 1
                    else
                        break
                    end
                end
                local paytable = Config.connectMultiples[rewardSymbol]
                local baseMultiple = paytable[math.min(connectedColumns, 5) + 1]
                local cascadeMultiple = cascadeRates[math.min(eliminateCount, 4) + 1]
                local wayMultiple = baseMultiple * cascadeMultiple
                for _ = 1, ways do
                    multiples[#multiples + 1] = wayMultiple
                    multipleKinds[rewardSymbol + 1] = multipleKinds[rewardSymbol + 1] + wayMultiple
                end
                for j = 1, #uniqueMatched do
                    eliminateIndexes[#eliminateIndexes + 1] = uniqueMatched[j]
                end
            end
        end
    end

    return {
        multiples = multiples,
        multiple = arraySum(multiples),
        eliminateIndexs = unique(eliminateIndexes),
        multipleKinds = multipleKinds
    }
end

-- 将 1D 盘面数组(20 元素)转换为 5 列 × 4 行的二维 columns 结构。
function SuperAceMachine:convertArrayDimension(values)
    local columns = {{}, {}, {}, {}, {}}
    for column = 0, 4 do
        for row = 0, 3 do
            columns[column + 1][row + 1] = values[column + row * 5 + 1]
        end
    end
    return columns
end

-- 统计 values 中等于 target 的元素下标(从 0 开始)，常用于查找 scatter(0) 位置。
function SuperAceMachine:countElement(values, target)
    local indexes = {}
    for index = 1, #values do
        if values[index] == target then
            indexes[#indexes + 1] = index - 1
        end
    end
    return indexes
end

return SuperAceMachine
