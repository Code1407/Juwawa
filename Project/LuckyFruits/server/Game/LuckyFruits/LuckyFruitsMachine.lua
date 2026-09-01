-- ============================================================
-- LuckyFruitsMachine 模块：AI调控开奖机
-- 根据gAnaly分析模块的调控指令（放水/收割/无限制）筛选符合
-- 调控目标的加权随机结果，同时受多重约束（奖励上限、赔率上限、放水水位、
-- 重抽次数）保护游戏经济平衡。失败时回退到最小奖励结果。
-- ============================================================

require "LuckyFruits.LuckyFruits"

LuckyFruitsMachine = class__()

-- 构造函数：scene为所属LuckyFruitsScene实例，oddsType记录本次调控的赔率类型
function LuckyFruitsMachine:ctor__(scene)
    self.scene = scene
    self.oddsType = 0
end

-- 从子系统获取玩家PID：用于标识调控目标玩家
local function playerId(system)
    local player = system and system.getPlayer and system:getPlayer() or nil
    return player and player.getPid and player:getPid() or nil
end

-- 判断某子系统是否为调控目标玩家：支持UID/PID多种匹配方式
-- target为空或"0"时表示无特定目标，返回false
local function isTarget(system, target)
    if target == nil or tostring(target) == "0" then return false end
    local player = system and system.getPlayer and system:getPlayer() or nil
    return tostring(playerId(system)) == tostring(target)
        or tostring(system:getUid()) == tostring(target)
        or (player and tostring(player:getUid()) == tostring(target))
end

-- 生成[0,1)随机数。优先使用框架随机数，保证与正式服随机源一致。
local function randomUnit()
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(0, 999999) / 1000000
    end
    return math.random()
end

-- 在候选结果中按配置权重随机。scoreFn用于放水排序：把排序分数作为
-- 权重增益，而不是直接选择最高分，避免低概率大奖在放水时被硬选并连续出现。
local function weightedInfo(candidates, weights, scoreFn)
    if type(candidates) ~= "table" or #candidates == 0 then return nil end
    local total, candidateWeights = 0, {}
    for i, info in ipairs(candidates) do
        local winPos = info.result and info.result.winPos or -1
        local weight = math.max(0, tonumber(weights[winPos + 1]) or 0)
        if scoreFn then
            weight = weight * math.max(0, tonumber(scoreFn(info)) or 0)
        end
        candidateWeights[i] = weight
        total = total + weight
    end
    -- VIP权重等可能全部为0；此时退回基础配置权重，仍保留候选多样性。
    if total <= 0 and scoreFn then return weightedInfo(candidates, weights) end
    if total <= 0 then
        local index = math.max(1, math.min(#candidates, math.floor(randomUnit() * #candidates) + 1))
        return candidates[index]
    end
    local roll, cursor = randomUnit() * total, 0
    for i, info in ipairs(candidates) do
        cursor = cursor + candidateWeights[i]
        if roll < cursor then return info end
    end
    return candidates[#candidates]
end

--- 选择带调控的开奖结果
-- 执行流程：解析调控参数→修改权重（可选）→按权重随机→返回首个符合调控目标的结果
-- @param systems table 当前回合所有玩家的LuckyFruitsPlayer子系统集合（key=UID）
-- @param analy table   gAnaly分析模块返回的调控参数
-- @param roundId number 本次回合唯一ID（供流水记录）
-- @return table  选中的开奖结果 {winPos, resultDetail}
-- @return number 调控结果状态码 EGameOddsResult
function LuckyFruitsMachine:selectControlledResult(systems, analy, roundId)
    systems, analy = systems or {}, analy or {}
    -- 与 LuxuryCar 一致：保存完整调控快照，并对枚举值做显式校验。
    self.oddsType = tonumber(analy.oddsType) or 0
    self.analyType = analy.analyType
    self.rerankType = analy.rerankType
    self.analyPlayer = analy.analyPlayer
    self.waterRuler = analy.waterRuler
    self.rewardMax = analy.rewardMax
    self.rewardRateMax = analy.rewardRateMax
    self.bigRewardAddRate = analy.bigRewardAddRate
    local controlLog = "全局调控数据: roundId:{0} 全局调控类型:{1} 放水类型:{2} 放水上限:{3} 奖励值上限:{4} 中奖倍率上限:{5} 大奖概率增加:{6} 调控玩家:{7}"
    log_info(controlLog, roundId, self.analyType, self.rerankType, self.waterRuler,
        self.rewardMax, self.rewardRateMax, self.bigRewardAddRate, self.analyPlayer)

    local analyType = tonumber(self.analyType) or EAnalyType.NoLimit
    if analyType ~= EAnalyType.NoLimit and analyType ~= EAnalyType.PlayerLoss
        and analyType ~= EAnalyType.PlayerWin then
        log_error("LuckyFruits invalid analyType, fallback to NoLimit. roundId:{0} analyType:{1}", roundId, analyType)
        analyType = EAnalyType.NoLimit
    end
    local rewardMax = tonumber(self.rewardMax) or 0
    local rateMax = tonumber(self.rewardRateMax) or 0
    local waterRuler = tonumber(self.waterRuler) or 0
    local rerankType = tonumber(self.rerankType)
    -- Invalid(0)是框架在没有更具体排序维度时的正常回退值，按Coins处理，
    -- 不再把它记录成配置错误。
    if rerankType == nil or rerankType == EAnalyPlayerWinType.Invalid then
        rerankType = EAnalyPlayerWinType.Coins
    end
    
    local validRerankType = rerankType == EAnalyPlayerWinType.Coins
        or rerankType == EAnalyPlayerWinType.Vip
        or rerankType == EAnalyPlayerWinType.PlayerCount
    if analyType == EAnalyType.PlayerWin and not validRerankType then
        log_error("LuckyFruits invalid rerankType, fallback to Coins. roundId:{0} rerankType:{1}", roundId, rerankType)
        rerankType = EAnalyPlayerWinType.Coins
    end
    local target = self.analyPlayer                                      -- 调控目标玩家UID/PID
    local hasTarget = target ~= nil and tostring(target) ~= "0"
    -- 克隆默认权重作为本次调控的基础权重
    local weights = LFClone(LFResultProbability)

    -- 与 LuxuryCar 一致：bigRewardAddRate 表示大奖总概率增加的万分点，
    -- 不是把大奖权重简单乘以 (1 + rate)。LuckyFruits 的 9~12 为大奖结果。
    local totalWeight, bigWeight = 0, 0
    for i, weight in ipairs(weights) do
        weight = math.max(0, tonumber(weight) or 0)
        weights[i] = weight
        totalWeight = totalWeight + weight
        if i >= 10 and i <= 13 then bigWeight = bigWeight + weight end
    end
    local bigRewardAddRate = math.max(0, tonumber(self.bigRewardAddRate) or 0)
    if bigRewardAddRate > 0 and totalWeight > 0 and bigWeight > 0 and bigWeight < totalWeight then
        local oldRate = bigWeight / totalWeight
        local newRate = math.min(1, oldRate + bigRewardAddRate / 10000)
        local otherWeight = totalWeight - bigWeight
        for i, weight in ipairs(weights) do
            if i >= 10 and i <= 13 then
                weights[i] = weight * (newRate * totalWeight / bigWeight)
            else
                weights[i] = weight * ((1 - newRate) * totalWeight / otherWeight)
            end
        end
    end

    -- 玩家是否盈利、VIP等信息与候选结果无关，提前缓存，避免每个候选重复查询。
    local participants, reliefPlayerCount = {}, 0
    for _, system in pairs(systems) do
        local data = system and system.getData and system:getData() or nil
        local bets = type(data) == "table" and type(data.bets) == "table" and data.bets or LFEmptyBets()
        local bet = LFArraySum(bets)
        local player = system and system.getPlayer and system:getPlayer() or nil
        local vipWeight = 0
        if player and player.getVipWeight then
            vipWeight = tonumber(player:getVipWeight()) or 0
        elseif player and player.getVipLevel then
            vipWeight = tonumber(player:getVipLevel()) or 0
        end
        local isProfit = player and gAnaly and gAnaly.isPlayerProfit
            and gAnaly:isPlayerProfit(player) or false
        local isRelief = bet > 0 and not isProfit
        if isRelief then reliefPlayerCount = reliefPlayerCount + 1 end
        participants[#participants + 1] = {
            system = system, bets = bets, bet = bet, player = player,
            vipWeight = vipWeight, isRelief = isRelief,
            isTarget = isTarget(system, target),
        }
    end

    -- 评估单次开奖结果：计算总下注、总奖励、目标玩家盈亏、救济玩家统计
    local function evaluate(result)
        local info = {
            result = result, totalBet = 0, totalReward = 0,
            targetBet = 0, targetReward = 0,
            winnerCount = 0, winnerVip = 0,
            reliefReward = 0, reliefCount = 0, reliefVip = 0,
        }
        for _, participant in ipairs(participants) do
            local reward = LFRevenue(participant.bets, result.resultDetail)
            info.totalBet = info.totalBet + participant.bet
            info.totalReward = info.totalReward + reward
            -- 累计目标玩家的下注与奖励
            if participant.isTarget then
                info.targetBet = info.targetBet + participant.bet
                info.targetReward = info.targetReward + reward
            end
            -- 救济统计：仅对有奖励且未盈利的玩家累计（放水模式选择救济对象的依据）
            if participant.bet > 0 and reward > 0 then
                info.winnerCount = info.winnerCount + 1
                info.winnerVip = info.winnerVip + participant.vipWeight
                if participant.isRelief then
                    info.reliefReward = info.reliefReward + reward
                    info.reliefCount = info.reliefCount + 1
                    info.reliefVip = info.reliefVip + participant.vipWeight
                end
            end
        end
        return info
    end

    local function effectiveReward(info)
        return hasTarget and info.targetReward or info.reliefReward
    end

    -- 与 LuxuryCar 一致：rewardRateMax 按整局总赔付/总下注计算，
    -- 使用整数交叉相乘，避免浮点除法造成边界误差。
    local function withinLimits(info)
        local effectiveRewardMax = math.max(0, rewardMax)
        if rewardMax ~= 0 and info.totalReward > effectiveRewardMax then return false end
        local effectiveRateMax = math.max(0, rateMax)
        if rateMax ~= 0 and info.totalBet > 0
            and info.totalReward * 10000 > info.totalBet * effectiveRateMax then return false end
        return true
    end

    -- waterRuler 仅约束放水对象的奖励，不约束 NoLimit/PlayerLoss 的全局结果。
    local function withinWaterRuler(info)
        return waterRuler <= 0 or effectiveReward(info) <= waterRuler
    end

    local function isLossResult(info)
        return hasTarget
            and info.targetBet > 0 and info.targetReward < info.targetBet
            or not hasTarget and info.totalBet > 0 and info.totalReward < info.totalBet
    end

    local function isWinResult(info)
        return hasTarget
            and info.targetBet > 0 and info.targetReward > 0
            or not hasTarget and info.reliefReward > 0
    end

    -- LuckyFruits只有15种结果，直接枚举可避免随机重抽漏掉低权重但合法的大奖。
    -- 苹果时刻的明细仍按配置随机生成，因此其内部抽取保持随机性。
    local legalCandidates = {}
    for winPos = 0, #weights - 1 do
        if (tonumber(weights[winPos + 1]) or 0) > 0 then
            local result = {
                winPos = winPos,
                resultDetail = LFGenerateResultDetail(winPos, weights),
            }
            local info = evaluate(result)
            if withinLimits(info) then legalCandidates[#legalCandidates + 1] = info end
        end
    end

    -- 13/14为零赔付结果。即使配置误把它们权重设为0，也可在所有配置结果
    -- 都突破赔付上限时作为最终安全兜底，保证绝不返回超限结果。
    local function safeInfo()
        for _, winPos in ipairs({ 13, 14 }) do
            local info = evaluate({ winPos = winPos, resultDetail = { winPos } })
            if withinLimits(info) then return info end
        end
        return nil
    end

    local function legalFallback(status)
        local info = weightedInfo(legalCandidates, weights)
        if info then
            log_info("LuckyFruits control target unavailable, use legal fallback. roundId:{0} analyType:{1} status:{2} winPos:{3}",
                roundId, analyType, status, info.result.winPos)
            return info.result, status
        end
        info = safeInfo()
        if info then
            log_error("LuckyFruits payout limits rejected every configured result, use zero-payout fallback. roundId:{0} rewardMax:{1} rewardRateMax:{2} winPos:{3}",
                roundId, rewardMax, rateMax, info.result.winPos)
            return info.result, EGameOddsResult.RulerMax
        end
        -- zero-payout结果按当前限制必然合法；保留防御分支，避免异常配置导致nil开奖。
        log_error("LuckyFruits has no safe result. roundId:{0}", roundId)
        return { winPos = 13, resultDetail = { 13 } }, EGameOddsResult.RulerMax
    end

    -- 无限制模式：在所有满足赔付约束的结果中保持配置权重。
    if analyType == EAnalyType.NoLimit then
        local info = weightedInfo(legalCandidates, weights)
        if info then return info.result, EGameOddsResult.Success end
        return legalFallback(EGameOddsResult.RulerMax)
    end

    if analyType == EAnalyType.PlayerLoss then
        local lossCandidates = {}
        for _, info in ipairs(legalCandidates) do
            if isLossResult(info) then lossCandidates[#lossCandidates + 1] = info end
        end
        local info = weightedInfo(lossCandidates, weights)
        if info then return info.result, EGameOddsResult.Success end
        -- 有合法结果但没有符合收割方向，属于方向重抽失败，不是尺度超限。
        return legalFallback(EGameOddsResult.RerandomMax)
    end

    local winCandidates = {}
    for _, info in ipairs(legalCandidates) do
        if withinWaterRuler(info) and isWinResult(info) then
            winCandidates[#winCandidates + 1] = info
        end
    end
    if #winCandidates > 0 then
        local function winScore(info)
            -- 指定了调控玩家时，VIP/人数维度已经由框架选人完成；固定目标下
            -- 继续按这两个维度排序没有意义，因此保持候选基础概率。
            if hasTarget then
                return rerankType == EAnalyPlayerWinType.Coins and info.targetReward or 1
            end
            if rerankType == EAnalyPlayerWinType.Vip then return info.reliefVip end
            if rerankType == EAnalyPlayerWinType.PlayerCount then return info.reliefCount end
            return info.reliefReward
        end
        -- 排序分数作为概率增益而不是硬取最大值：调控维度真正生效，同时避免
        -- Coins模式反复硬选“全中”等最高赔付结果。
        local info = weightedInfo(winCandidates, weights, winScore)
        if info then return info.result, EGameOddsResult.Success end
    end

    local failureStatus = not hasTarget and reliefPlayerCount == 0
        and EGameOddsResult.AllPlayerWin or EGameOddsResult.RerandomMax
    return legalFallback(failureStatus)
end
