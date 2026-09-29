-- ============================================================
-- 水果老虎机核心计算模块（随机引擎）
-- 负责生成符号结果、中奖线匹配、倍率计算、
-- Jackpot和免费游戏触发、单控策略等核心逻辑
-- ============================================================

require "MageJackpot.MageJackpotCommon"
require "MageJackpot.MageJackpotConfig"

MageJackpotMachine = class__()

-- 构造函数：绑定场景和玩家系统
-- scene:     场景实例（管理Jackpot池、全局状态）
-- playerSys: 玩家系统实例（访问玩家数据）
function MageJackpotMachine:ctor__(scene, playerSys)
    self.scene = scene
    self.playerSys = playerSys
    self.lastRoundRateType = FRRateType.normal -- 上一轮的倍率类型
end

-- 获取指定下注金额对应的游戏倍率配置
-- 优先读取场景中为该下注金额定制的倍率，否则使用默认倍率
function MageJackpotMachine:getGameRate(betAmount)
    if self.scene.gameRates and self.scene.gameRates[betAmount] then
        return FRCloneTable(self.scene.gameRates[betAmount])
    end
    return FRCloneTable(self.scene.gameRateDefault or MageJackpotDefaultGameRate())
end

-- 记录本轮使用的倍率类型
function MageJackpotMachine:setLastRoundRateType(rateType)
    self.lastRoundRateType = rateType or FRRateType.normal
end

function MageJackpotMachine:getLastRoundRateType()
    return self.lastRoundRateType or FRRateType.normal
end

-- 按转轮概率表生成15个格子的符号结果
-- 每个格子根据其所在转轮（0-4列）的概率分布随机选取符号
function MageJackpotMachine:generateResultsByRate(slotProbabilitys)
    local results = {}
    for index = 1, 15 do
        local probability = slotProbabilitys[((index - 1) % 5) + 1] or {}
        table.insert(results, FRRateRandomResult(probability))
    end
    return results
end

-- 为新手玩家生成受控结果（从预设结果池中按倍率区间选取）
-- multiple: {min, max} 倍率区间
function MageJackpotMachine:generateResultsByNewUser(multiple)
    if not multiple or not self.scene.newUserResult then
        return {}
    end
    local tempResults = {}
    for key, results in pairs(self.scene.newUserResult or {}) do
        local keyNumber = tonumber(key) or 0
        if keyNumber >= (multiple.min or 0) and keyNumber <= (multiple.max or 0) then
            for _, result in ipairs(results or {}) do
                table.insert(tempResults, result)
            end
        end
    end
    if #tempResults > 0 then
        return FRCloneTable(tempResults[FRRandomInt(1, #tempResults)])
    end
    return {}
end

-- 根据符号结果检测所有中奖线
-- 规则：从每线第1个符号开始，Wild 可替代一个普通赔付符号；
-- BONUS（转盘）、FREESPINS、JACKPOT 是功能符号，既不能被 Wild 替代，
-- 也不能作为连线目标。若整条有效连线均为 Wild，则按 Wild 自身赔付。
-- 二连倍率大于0的符号可二连起赔，其余符号仍需三连起赔。
function MageJackpotMachine:lineSamesByResults(results)
    local lineSames = {}
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

    for lineIndex, linePath in ipairs(FRLinePaths or {}) do
        local target = results[linePath[1]]  -- 线的第一个符号
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
                local goods = results[linePath[pathIndex]]
                if goods == FRSymbol.wild or goods == target then  -- Wild 符号匹配任意图标
                    count = count + 1
                else
                    break
                end
            end
            local minimumCount = (tonumber(symbolMultiples[1]) or 0) > 0 and 2 or 3
            if count >= minimumCount then
                table.insert(lineSames, {
                    lineNum = lineIndex - 1,       -- 线号（0-based）
                    target = target or 0,           -- 中奖符号ID
                    count = count,                  -- 连续数量
                })
            end
        end
    end
    return lineSames
end

-- 根据中奖线结果计算各线的倍率
function MageJackpotMachine:calculateMultiples(lineSames)
    local multiples = {}
    for _, lineSame in ipairs(lineSames or {}) do
        local symbolMultiples = FRConnectMultiples[(lineSame.target or 0) + 1] or {}
        local multiple = tonumber(symbolMultiples[(lineSame.count or 3) - 1]) or 0
        if multiple > 0 then
            table.insert(multiples, multiple)
        end
    end
    return multiples
end

-- 收集所有已中奖的格子索引（被中奖线覆盖的格子）
function MageJackpotMachine:collectConnectedIndex(lineSames)
    local connectedIndex = {}
    for _, lineSame in ipairs(lineSames or {}) do
        local linePath = FRLinePaths[(lineSame.lineNum or 0) + 1] or {}
        for index = 1, lineSame.count or 0 do
            local pathIndex = (linePath[index] or 1) - 1
            if not FRListContains(connectedIndex, pathIndex) then
                table.insert(connectedIndex, pathIndex)
            end
        end
    end
    return connectedIndex
end

-- 收集未中奖的格子索引（用于投放Jackpot/免费符号）
function MageJackpotMachine:collectNotConnectedIndex(connectedIndex)
    local notConnectedIndex = {}
    for index = 0, 14 do
        if not FRListContains(connectedIndex, index) then
            table.insert(notConnectedIndex, index)
        end
    end
    return notConnectedIndex
end

-- 从未中奖格子中按概率随机选择N个位置（用于放置特殊符号）
function MageJackpotMachine:randomNotConnectedIndex(probability, notConnectedIndex)
    local indexs = {}
    local count = FRRateRandomDefault(probability)
    count = math.min(count, #notConnectedIndex)
    for _ = 1, count do
        local index = FRRandomInt(1, #notConnectedIndex)
        table.insert(indexs, FRRemoveAt(notConnectedIndex, index))
    end
    return indexs
end

-- 获取N个免费符号对应的免费旋转次数
function MageJackpotMachine:getFreeTime(count)
    return (count >= 0 and FRFreeTimes[count + 1]) or 0
end

-- 获取N个Jackpot符号对应的奖池提取比例
function MageJackpotMachine:getJackpotPercentage(count)
    return (count >= 0 and FRJackpotPercentage[count + 1]) or 0
end

-- 按运营配置的权重确定幸运转盘倍率；客户端只使用该结果播放动画。
function MageJackpotMachine:randomBonusMultiplier()
    local index = FRRateRandomDefault(FRBonusMultiplierWeights) + 1
    return math.max(0, tonumber(FRBonusMultiplierValues[index]) or 0)
end

-- 在结果数组中统计指定值的出现次数
function MageJackpotMachine:findTargetCount(arr, target)
    local count = 0
    for _, value in ipairs(arr or {}) do
        if value == target then
            count = count + 1
        end
    end
    return count
end

local function jackpotCountByStage(stage)
    return math.max(0, math.floor(tonumber(stage) or 0)) + 3
end

local function jackpotStageByCount(count)
    count = math.floor(tonumber(count) or 0)
    if count < 3 then return nil end
    return count - 3
end

local function normalizeJackpotStageMax(value)
    local stageMax = tonumber(value)
    if stageMax == nil then return nil end
    return math.max(0, math.floor(stageMax))
end

local function getRewardLimit(control, betAmount)
    control = control or {}
    local rawRewardMax = tonumber(control.rewardMax) or 0
    local hasRewardLimit = rawRewardMax ~= 0
    local rewardMax = math.max(0, rawRewardMax)
    local rewardRateMax = math.max(0, tonumber(control.rewardRateMax) or 0)
    local waterRuler = math.max(0, tonumber(control.waterRuler) or 0)

    local rateLimit = rewardRateMax > 0
        and FRRoundInt((betAmount or 0) * rewardRateMax / 10000) or 0
    if rateLimit > 0 and (not hasRewardLimit or rateLimit < rewardMax) then
        rewardMax = rateLimit
        hasRewardLimit = true
    end
    if waterRuler > 0 and (not hasRewardLimit or waterRuler < rewardMax) then
        rewardMax = waterRuler
        hasRewardLimit = true
    end
    return hasRewardLimit, rewardMax
end

local function trimJackpotIndexs(jackpotIndexs, targetCount)
    targetCount = math.max(0, math.floor(tonumber(targetCount) or 0))
    while #jackpotIndexs > targetCount do
        table.remove(jackpotIndexs)
    end
end

local function removeIndexs(arr, values)
    for _, value in ipairs(values or {}) do
        for index = #arr, 1, -1 do
            if arr[index] == value then
                table.remove(arr, index)
                break
            end
        end
    end
end

function MageJackpotMachine:selectJackpotStage(jackpotIndexs, jackpotPoolAmount, lineWinAmount, betAmount, control)
    local stage = jackpotStageByCount(#jackpotIndexs)
    if stage == nil then
        return #jackpotIndexs, 0, 0
    end

    local stageMax = normalizeJackpotStageMax(control and control.jpPotStageMax)
    if stageMax ~= nil and stage > stageMax then
        stage = stageMax
    end

    local hasRewardLimit, rewardMax = getRewardLimit(control, betAmount)
    while stage >= 0 do
        local jackpotCount = jackpotCountByStage(stage)
        local jackpotPercentage = self:getJackpotPercentage(jackpotCount)
        local jackpotAmount = FRRoundInt((jackpotPoolAmount or 0) * jackpotPercentage)
        if jackpotAmount > 0 and (not hasRewardLimit or (lineWinAmount or 0) + jackpotAmount <= rewardMax) then
            return jackpotCount, jackpotPercentage, jackpotAmount
        end
        stage = stage - 1
    end

    return 0, 0, 0
end

-- 核心结果生成函数
-- 根据下注金额、Jackpot标记、免费游戏状态生成完整的游戏结果
-- 包含：基础符号随机、中奖线匹配、Jackpot触发、免费游戏触发
function MageJackpotMachine:generateResults(betAmount, jackpot, freeWinAmount, freeCount, control)
    control = control or {}
    local jpAddRate = math.max(0, tonumber(control.jpAddRate) or 0)
    local bigRewardAddRate = math.max(0, tonumber(control.bigRewardAddRate) or 0)
    if not jackpot and jpAddRate > 0 then
        jackpot = FRRandomInt(1, 10000) <= jpAddRate
    end
    local forceFree = bigRewardAddRate > 0 and FRRandomInt(1, 10000) <= bigRewardAddRate
    MageJackpotEnsureConfig()
    local gameRate = self:getGameRate(betAmount) -- 获取当前下注的倍率配置
    self:setLastRoundRateType(gameRate.rateType or FRRateType.normal)

    local free = FRRandom01() < (tonumber(gameRate.free) or 0) -- 免费游戏是否"命中"
    local bonus = FRRandom01() < (tonumber(FRBonusProbabilityDefault) or 0)
    local results = {}
    -- 新手玩家使用预设结果池
    if (gameRate.rateType or FRRateType.normal) == FRRateType.new_user then
        results = self:generateResultsByNewUser(gameRate.mutiple)  --目前为0  全部按普通结果  按概率生成
    end
    -- 普通结果：按转轮概率生成
    if #results == 0 then
        results = self:generateResultsByRate(gameRate.slot or FRSlotProbabilitysDefault)
    end

    local lineSames = self:lineSamesByResults(results)  -- 检测中奖线结果
    local multiples = self:calculateMultiples(lineSames) -- 计算各线倍率
    local multiple = FRArraySum(multiples)                -- 总倍率
    local baseWinAmount = FRRoundInt(MageJackpotLineBetAmount(betAmount) * multiple)
    local winAmount = baseWinAmount
    local connectedIndex = self:collectConnectedIndex(lineSames)       -- 已中奖格子
    local notConnectedIndex = self:collectNotConnectedIndex(connectedIndex) -- 未中奖格子

    local jackpotPercentage = 0
    local jackpotAmount = 0
    local jackpotPoolBefore = 0
    local bonusTriggered = false
    local bonusSymbolCount = 0
    local bonusMultiplier = 0
    local bonusWinAmount = 0
    local bonusSegmentIndex = -1
    -- 只有基础总倍率小于大赢阈值时，才会触发Jackpot、幸运转盘和免费游戏。
    if multiple < FRBigWinMultiple then
        local jackpotPoolAmount = self.scene:getJackpotPoolAmount(betAmount)
        local minJackpotPoolAmount = 0
        local firstJackpotPercent = tonumber(FRJackpotPercentage[4]) or 0
        if firstJackpotPercent > 0 then
            minJackpotPoolAmount = 1 / firstJackpotPercent
        end

        -- Jackpot触发：奖池金额足够时才检查
        if (freeCount or 0) == 0 and jackpotPoolAmount > minJackpotPoolAmount then
            local jackpotCountProbability = jackpot and FRJackpotCountProbability345 or FRJackpotCountProbability012
            local jackpotIndexs = self:randomNotConnectedIndex(jackpotCountProbability, FRCloneTable(notConnectedIndex))
            local jackpotCount = #jackpotIndexs
            -- 新玩家保护：限制Jackpot符号数量
            if self.playerSys:getBetDetail(betAmount).betCount < FRNewUserRoundDefault then
                jackpotCount = math.min(jackpotCount, 3)
            end

            trimJackpotIndexs(jackpotIndexs, jackpotCount)
            jackpotCount, jackpotPercentage, jackpotAmount =
                self:selectJackpotStage(jackpotIndexs, jackpotPoolAmount, winAmount, betAmount, control)
            if jackpotAmount > 0 then
                -- 保留扣款前奖池，供开奖日志计算玩家实际分走比例。
                jackpotPoolBefore = jackpotPoolAmount
            end
            trimJackpotIndexs(jackpotIndexs, jackpotCount)
            removeIndexs(notConnectedIndex, jackpotIndexs)
            -- 将Jackpot符号替换到选定位置
            local targetCount = self:findTargetCount(results, FRSymbol.jackpot)
            for index = targetCount + 1, #jackpotIndexs do
                results[jackpotIndexs[index] + 1] = FRSymbol.jackpot
            end
            self.scene:decreaseJackpotPoolAmount(betAmount, jackpotAmount) -- 从奖池扣除
        end

        -- 幸运转盘触发：未中Jackpot时才检查，优先级高于免费游戏。
        if (freeCount or 0) == 0 and jackpotAmount == 0 then
            local bonusCountProbability = bonus
                and FRBonusCountProbability345 or FRBonusCountProbability012
            local bonusIndexs = self:randomNotConnectedIndex(
                bonusCountProbability, FRCloneTable(notConnectedIndex))
            if self.playerSys:getBetDetail(betAmount).betCount < FRNewUserRoundDefault then
                while #bonusIndexs > 3 do
                    table.remove(bonusIndexs)
                end
            end
            bonusSymbolCount = #bonusIndexs
            local targetCount = self:findTargetCount(results, FRSymbol.bonus)
            for index = targetCount + 1, #bonusIndexs do
                results[bonusIndexs[index] + 1] = FRSymbol.bonus
            end
            removeIndexs(notConnectedIndex, bonusIndexs)
            if bonusSymbolCount >= 3 then
                bonusMultiplier = self:randomBonusMultiplier()
                local matchingSegments = {}
                for index, multiplier in ipairs(FRBonusWheelSegmentMultipliers or {}) do
                    if tonumber(multiplier) == bonusMultiplier then
                        table.insert(matchingSegments, index - 1)
                    end
                end
                -- 同一倍率可出现在多个扇区，服务端随机决定具体停靠格并随结果下发。
                if #matchingSegments > 0 then
                    bonusSegmentIndex = matchingSegments[FRRandomInt(1, #matchingSegments)]
                end
                bonusWinAmount = FRRoundInt(baseWinAmount * bonusMultiplier)
                winAmount = FRRoundInt(baseWinAmount + bonusWinAmount)
                bonusTriggered = true
            end
        end

        -- 免费游戏触发：未中Jackpot或幸运转盘时才检查。
        if (freeCount or 0) == 0 and jackpotAmount == 0 and not bonusTriggered then
            local freeCountProbability = (free or forceFree) and FRFreeCountProbability345 or FRFreeCountProbability012
            local freeIndexs = self:randomNotConnectedIndex(freeCountProbability, notConnectedIndex)
            if self.playerSys:getBetDetail(betAmount).betCount < FRNewUserRoundDefault then
                while #freeIndexs > 3 do
                    table.remove(freeIndexs)
                end
            end
            -- 将免费符号替换到选定位置
            local targetCount = self:findTargetCount(results, FRSymbol.free)
            for index = targetCount + 1, #freeIndexs do
                results[freeIndexs[index] + 1] = FRSymbol.free
            end
            freeCount = self:getFreeTime(#freeIndexs) + 1
        end
    end

    -- 扣除当前这一次免费旋转
    if (freeCount or 0) > 0 then
        freeCount = freeCount - 1
    else
        freeCount = 0
    end

    -- 仅将基础连线奖励的一部分注入Jackpot奖池；特殊玩法奖金不二次注池。
    self.scene:increaseJackpotPoolAmount(betAmount, baseWinAmount * FRJackpotPoolIncrRate)

    return {
        betAmount = FRRoundInt(betAmount or 0),
        results = results,
        lineSames = lineSames,
        multiple = (betAmount or 0) > 0 and winAmount / betAmount or 0, -- 相对整局总下注的实际派奖倍率
        multiples = multiples,
        freeWinAmount = FRRoundInt((freeWinAmount or 0) + winAmount), -- 累计免费赢取
        freeCount = freeCount,
        bonusTriggered = bonusTriggered,
        bonusSymbolCount = bonusSymbolCount,
        bonusMultiplier = bonusMultiplier,
        bonusWinAmount = bonusWinAmount,
        bonusSegmentIndex = bonusSegmentIndex,
        jackpotAmount = jackpotAmount,
        jackpotPoolBefore = jackpotPoolBefore,
        jackpotAmountPool = self.scene:getAllJackpotPool(),
    }
end

-- 带单控策略的结果生成（多次重随机取最优）
-- 根据平台单控分析系统（gAnaly）的指令，在最多maxTimes次重随机中
-- 选择最符合单控目标的结果。每次重随机的Jackpot池操作是事务性的。
-- gamePlayer: 平台层的GamePlayer对象
-- roundId:    回合ID
local function logAnalyResult(analy, roundId)
    if type(analy) ~= "table" then
        log_info("MageJackpot singleAnaly result, roundId:{0}, analy:{1}",
            tostring(roundId), tostring(analy))
        return
    end

    local fields = {}
    for key, value in pairs(analy) do
        table.insert(fields, tostring(key) .. "=" .. tostring(value))
    end
    table.sort(fields)
    log_info("调控结果--MageJackpot singleAnaly result, roundId:{0}, analy:{{{1}}}",
        tostring(roundId), table.concat(fields, ", "))
end

-- 构造一个无连线、无Jackpot、无新增免费次数的零奖励结果。
-- 当所有重随机结果都超过硬性奖励上限时使用，避免把超限奖励提交给平台。
local function buildZeroRewardResult(betAmount, freeWinAmount, freeCount, poolBefore)
    local results = {}
    for index = 1, 15 do
        -- 同一列使用相同符号、相邻列使用不同符号；标准线路无法形成3连。
        results[index] = (index - 1) % 5
    end

    return {
        betAmount = FRRoundInt(betAmount or 0),
        results = results,
        lineSames = {},
        multiple = 0,
        multiples = {},
        freeWinAmount = FRRoundInt(freeWinAmount or 0),
        freeCount = math.max(0, (tonumber(freeCount) or 0) - 1),
        bonusTriggered = false,
        bonusSymbolCount = 0,
        bonusMultiplier = 0,
        bonusWinAmount = 0,
        bonusSegmentIndex = -1,
        jackpotAmount = 0,
        jackpotAmountPool = FRCloneTable(poolBefore),
    }
end

function MageJackpotMachine:generateControlledResults(betAmount, jackpot, freeWinAmount, freeCount, gamePlayer, roundId)
    -- 调用平台单控分析获取控制策略
    local analy = gAnaly:singleAnaly(gamePlayer, roundId)
    logAnalyResult(analy, roundId) --打印日志
    local maxTimes = math.max(1, math.floor(tonumber(analy.rerandomMax) or 1))     -- 最大尝试次数
    local analyType = tonumber(analy.analyType) or EAnalyType.NoLimit               -- 控制类型
    local rawRewardMax = tonumber(analy.rewardMax) or 0                            -- 平台原始奖励上限
    -- rewardMax=0沿用平台的“未设置”语义；负数表示本局已无可派奖额度，上限必须为0。
    local hasRewardLimit = rawRewardMax ~= 0
    local rewardMax = math.max(0, rawRewardMax)
    local rerandomRate = math.max(0, tonumber(analy.rerandomRate) or 0)             -- 提前退出概率
    local poolBefore = FRCloneTable(self.scene:getAllJackpotPool())                 -- 备份奖池状态
    local rewardRateMax = math.max(0, tonumber(analy.rewardRateMax) or 0)
    local waterRuler = math.max(0, tonumber(analy.waterRuler) or 0)

    local rateLimit = rewardRateMax > 0
        and FRRoundInt((betAmount or 0) * rewardRateMax / 10000) or 0
    if rateLimit > 0 and (not hasRewardLimit or rateLimit < rewardMax) then
        rewardMax = rateLimit
        hasRewardLimit = true
    end
    if waterRuler > 0 and (not hasRewardLimit or waterRuler < rewardMax) then
        rewardMax = waterRuler
        hasRewardLimit = true
    end
    local selected, selectedPool, selectedReward, sawWin

    -- 最多尝试maxTimes次，选择最优结果
    for _ = 1, maxTimes do
        -- 回滚奖池到备份状态
        self.scene:getData().jackpotAmountPool = FRCloneTable(poolBefore)
        local candidate = self:generateResults(betAmount, jackpot, freeWinAmount, freeCount, analy)
        local reward = FRRoundInt((candidate.betAmount or 0) * (candidate.multiple or 0)) + FRRoundInt(candidate.jackpotAmount or 0)
        local candidatePool = FRCloneTable(self.scene:getAllJackpotPool())
        sawWin = sawWin or reward > 0

        local better = selected == nil
        if analyType == EAnalyType.PlayerLoss then
            -- 控输：选奖励最小的
            better = better or reward < selectedReward
        elseif analyType == EAnalyType.PlayerWin then
            -- 控赢：选在rewardMax内奖励最大的
            local within = not hasRewardLimit or reward <= rewardMax
            local oldWithin = selectedReward and (not hasRewardLimit or selectedReward <= rewardMax)
            better = better or (within and (not oldWithin or reward > selectedReward)) or
                (not within and not oldWithin and reward < selectedReward)
        elseif hasRewardLimit then
            better = better or (reward <= rewardMax and selectedReward > rewardMax) or
                (reward > rewardMax and selectedReward > rewardMax and reward < selectedReward)
        end
        if better then
            selected, selectedPool, selectedReward = candidate, candidatePool, reward
        end

        -- 提前退出条件：
        -- 1. 控输且已找到零奖励结果
        -- 2. 控赢且已找到有效奖励结果
        -- 3. 随机概率触发停止
        local randomStop = rerandomRate > 0 and FRRandomInt(1, 10000) > rerandomRate
        if (analyType == EAnalyType.PlayerLoss and selectedReward == 0) or
            (analyType == EAnalyType.PlayerWin and selectedReward > 0 and
                (not hasRewardLimit or selectedReward <= rewardMax)) or
            randomStop then
            break
        end
    end

    local exceededRewardLimit = hasRewardLimit and selectedReward and selectedReward > rewardMax
    if exceededRewardLimit then
        -- 重随机次数耗尽仍没有合法结果时，硬性上限优先，回退为零奖励。
        self.scene:getData().jackpotAmountPool = FRCloneTable(poolBefore)
        selected = buildZeroRewardResult(betAmount, freeWinAmount, freeCount, poolBefore)
        selectedPool = FRCloneTable(poolBefore)
        selectedReward = 0
    end

    -- 提交最终选中的奖池状态
    self.scene:getData().jackpotAmountPool = selectedPool or poolBefore
    local gameResult = EGameOddsResult.Success
    if exceededRewardLimit or
        (analyType == EAnalyType.PlayerWin and hasRewardLimit and rewardMax <= 0) then
        gameResult = EGameOddsResult.RulerMax
    elseif analyType == EAnalyType.PlayerWin and (not selectedReward or selectedReward <= 0) then
        gameResult = sawWin and EGameOddsResult.RulerMax or EGameOddsResult.RerandomMax
    end
    return selected, tonumber(analy.oddsType) or 0, gameResult
end

function MageJackpotMachine:test(betAmount, count)
    local total = math.max(1, math.min(100000, math.floor(tonumber(count) or 1)))
    local poolBefore = FRCloneTable(self.scene:getAllJackpotPool())
    local totalMultiple, winCount = 0, 0
    for _ = 1, total do
        self.scene:getData().jackpotAmountPool = FRCloneTable(poolBefore)
        local result = self:generateResults(tonumber(betAmount) or 1, false, 0, 0)
        totalMultiple = totalMultiple + (result.multiple or 0)
        if (result.multiple or 0) > 0 then winCount = winCount + 1 end
    end
    self.scene:getData().jackpotAmountPool = poolBefore
    return { count = total, winCount = winCount, averageMultiple = totalMultiple / total }
end
