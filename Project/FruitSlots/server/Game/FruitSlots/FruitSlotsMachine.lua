-- ============================================================
-- 水果老虎机核心计算模块（随机引擎）
-- 负责生成符号结果、中奖线匹配、倍率计算、
-- Jackpot和免费游戏触发、单控策略等核心逻辑
-- ============================================================

require "FruitSlots.FruitSlotsCommon"
require "FruitSlots.FruitSlotsConfig"

FruitSlotsMachine = class__()

-- 构造函数：绑定场景和玩家系统
-- scene:     场景实例（管理Jackpot池、全局状态）
-- playerSys: 玩家系统实例（访问玩家数据）
function FruitSlotsMachine:ctor__(scene, playerSys)
    self.scene = scene
    self.playerSys = playerSys
    self.lastRoundRateType = FRRateType.normal -- 上一轮的倍率类型
end

-- 获取指定下注金额对应的游戏倍率配置
-- 优先读取场景中为该下注金额定制的倍率，否则使用默认倍率
function FruitSlotsMachine:getGameRate(betAmount)
    if self.scene.gameRates and self.scene.gameRates[betAmount] then
        return FRCloneTable(self.scene.gameRates[betAmount])
    end
    return FRCloneTable(self.scene.gameRateDefault or FruitSlotsDefaultGameRate())
end

-- 记录本轮使用的倍率类型
function FruitSlotsMachine:setLastRoundRateType(rateType)
    self.lastRoundRateType = rateType or FRRateType.normal
end

function FruitSlotsMachine:getLastRoundRateType()
    return self.lastRoundRateType or FRRateType.normal
end

-- 按转轮概率表生成15个格子的符号结果
-- 每个格子根据其所在转轮（0-4列）的概率分布随机选取符号
function FruitSlotsMachine:generateResultsByRate(slotProbabilitys)
    local results = {}
    for index = 1, 15 do
        local probability = slotProbabilitys[((index - 1) % 5) + 1] or {}
        table.insert(results, FRRateRandomResult(probability))
    end
    return results
end

-- 为新手玩家生成受控结果（从预设结果池中按倍率区间选取）
-- multiple: {min, max} 倍率区间
function FruitSlotsMachine:generateResultsByNewUser(multiple)
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
-- 规则：从每线第1个符号开始，符号7（万能）或后续与首符号相同的都算连续
-- 返回所有达到3连及以上的中奖线信息
function FruitSlotsMachine:lineSamesByResults(results)
    local lineSames = {}
    for lineIndex, linePath in ipairs(FRLinePaths or {}) do
        local target = results[linePath[1]]  -- 线的第一个符号
        if target == 7 then
            for pathIndex = 2, #linePath do
                local candidate = results[linePath[pathIndex]]
                if candidate ~= 7 then
                    target = candidate
                    break
                end
            end
        end
        local count = 1
        for pathIndex = 2, #linePath do
            local goods = results[linePath[pathIndex]]
            if goods == 7 or goods == target then  -- 符号7为万能符号（wild），匹配任意
                count = count + 1
            else
                break
            end
        end
        if count >= 3 then  -- 3连及以上才计入
            table.insert(lineSames, {
                lineNum = lineIndex - 1,       -- 线号（0-based）
                target = target or 0,           -- 中奖符号ID
                count = count,                  -- 连续数量
            })
        end
    end
    return lineSames
end

-- 根据中奖线结果计算各线的倍率
function FruitSlotsMachine:calculateMultiples(lineSames)
    local multiples = {}
    for _, lineSame in ipairs(lineSames or {}) do
        local symbolMultiples = FRConnectMultiples[(lineSame.target or 0) + 1] or {}
        local multiple = tonumber(symbolMultiples[(lineSame.count or 3) - 2]) or 0
        if multiple > 0 then
            table.insert(multiples, multiple)
        end
    end
    return multiples
end

-- 收集所有已中奖的格子索引（被中奖线覆盖的格子）
function FruitSlotsMachine:collectConnectedIndex(lineSames)
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
function FruitSlotsMachine:collectNotConnectedIndex(connectedIndex)
    local notConnectedIndex = {}
    for index = 0, 14 do
        if not FRListContains(connectedIndex, index) then
            table.insert(notConnectedIndex, index)
        end
    end
    return notConnectedIndex
end

-- 从未中奖格子中按概率随机选择N个位置（用于放置特殊符号）
function FruitSlotsMachine:randomNotConnectedIndex(probability, notConnectedIndex)
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
function FruitSlotsMachine:getFreeTime(count)
    return (count >= 0 and FRFreeTimes[count + 1]) or 0
end

-- 获取N个Jackpot符号对应的奖池提取比例
function FruitSlotsMachine:getJackpotPercentage(count)
    return (count >= 0 and FRJackpotPercentage[count + 1]) or 0
end

-- 在结果数组中统计指定值的出现次数
function FruitSlotsMachine:findTargetCount(arr, target)
    local count = 0
    for _, value in ipairs(arr or {}) do
        if value == target then
            count = count + 1
        end
    end
    return count
end

-- 核心结果生成函数
-- 根据下注金额、Jackpot标记、免费游戏状态生成完整的游戏结果
-- 包含：基础符号随机、中奖线匹配、Jackpot触发、免费游戏触发
function FruitSlotsMachine:generateResults(betAmount, jackpot, freeWinAmount, freeCount, control)
    control = control or {}
    local jpAddRate = math.max(0, tonumber(control.jpAddRate) or 0)
    local bigRewardAddRate = math.max(0, tonumber(control.bigRewardAddRate) or 0)
    if not jackpot and jpAddRate > 0 then
        jackpot = FRRandomInt(1, 10000) <= jpAddRate
    end
    local forceFree = bigRewardAddRate > 0 and FRRandomInt(1, 10000) <= bigRewardAddRate
    FruitSlotsEnsureConfig()
    local gameRate = self:getGameRate(betAmount) -- 获取当前下注的倍率配置
    self:setLastRoundRateType(gameRate.rateType or FRRateType.normal)

    local free = FRRandom01() < (tonumber(gameRate.free) or 0) -- 免费游戏是否"命中"
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
    local connectedIndex = self:collectConnectedIndex(lineSames)       -- 已中奖格子
    local notConnectedIndex = self:collectNotConnectedIndex(connectedIndex) -- 未中奖格子

    local jackpotPercentage = 0
    local jackpotAmount = 0
    -- 只有总倍率小于大赢阈值时，才会触发Jackpot和免费游戏
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
            local jackpotIndexs = self:randomNotConnectedIndex(jackpotCountProbability, notConnectedIndex)
            local stageMax = math.floor(tonumber(control.jpPotStageMax) or 0)
            if stageMax > 0 then
                while #jackpotIndexs > stageMax do table.remove(jackpotIndexs) end
            end
            -- 新玩家保护：限制Jackpot符号数量
            if self.playerSys:getBetDetail(betAmount).betCount < FRNewUserRoundDefault then
                while #jackpotIndexs > 3 do
                    table.remove(jackpotIndexs)
                end
            end
            -- 将Jackpot符号（9号）替换到选定位置
            local targetCount = self:findTargetCount(results, 9)
            for index = targetCount + 1, #jackpotIndexs do
                results[jackpotIndexs[index] + 1] = 9
            end
            jackpotPercentage = self:getJackpotPercentage(#jackpotIndexs)
            jackpotAmount = FRRoundInt(jackpotPoolAmount * jackpotPercentage)
            self.scene:decreaseJackpotPoolAmount(betAmount, jackpotAmount) -- 从奖池扣除
        end

        -- 免费游戏触发：未中Jackpot时才检查
        if (freeCount or 0) == 0 and jackpotAmount == 0 then
            local freeCountProbability = (free or forceFree) and FRFreeCountProbability345 or FRFreeCountProbability012
            local freeIndexs = self:randomNotConnectedIndex(freeCountProbability, notConnectedIndex)
            if self.playerSys:getBetDetail(betAmount).betCount < FRNewUserRoundDefault then
                while #freeIndexs > 3 do
                    table.remove(freeIndexs)
                end
            end
            -- 将免费符号（8号）替换到选定位置
            local targetCount = self:findTargetCount(results, 8)
            for index = targetCount + 1, #freeIndexs do
                results[freeIndexs[index] + 1] = 8
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

    -- 将赢取金额的一部分注入Jackpot奖池
    local winAmount = FRRoundInt((betAmount or 0) * multiple)
    self.scene:increaseJackpotPoolAmount(betAmount, winAmount * FRJackpotPoolIncrRate)

    return {
        betAmount = FRRoundInt(betAmount or 0),
        results = results,
        lineSames = lineSames,
        multiple = multiple,
        multiples = multiples,
        freeWinAmount = FRRoundInt((freeWinAmount or 0) + winAmount), -- 累计免费赢取
        freeCount = freeCount,
        jackpotAmount = jackpotAmount,
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
        log_info("FruitSlots singleAnaly result, roundId:{0}, analy:{1}",
            tostring(roundId), tostring(analy))
        return
    end

    local fields = {}
    for key, value in pairs(analy) do
        table.insert(fields, tostring(key) .. "=" .. tostring(value))
    end
    table.sort(fields)
    log_info("调控结果--FruitSlots singleAnaly result, roundId:{0}, analy:{{{1}}}",
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
        jackpotAmount = 0,
        jackpotAmountPool = FRCloneTable(poolBefore),
    }
end

function FruitSlotsMachine:generateControlledResults(betAmount, jackpot, freeWinAmount, freeCount, gamePlayer, roundId)
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
        and FRRoundInt((betAmount or 0) * FRLineCount * rewardRateMax / 10000) or 0
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

function FruitSlotsMachine:test(betAmount, count)
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
