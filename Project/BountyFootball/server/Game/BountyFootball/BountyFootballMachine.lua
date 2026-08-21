-- ============================================================
-- BountyFootballMachine 类
-- 功能：豪车（BountyFootball）多人竞速游戏的"受控开奖选择器"。
--
-- 游戏背景：
--   每回合所有玩家在 10 个下注区（10 辆豪车）下注，系统从 16 个轮盘位置
--   中随机开出一个结果。所有押中该位置对应下注区的玩家按赔率获得赔付。
--
-- 本模块职责：
--   根据 gAnaly 分析系统返回的"控场指令"（让某玩家赢/输、限制最大赔付、
--   控制抽水比例等），在随机生成的候选结果中筛选出最符合控场目标的开奖号码。
--
-- 与 FortuneSlot（单人老虎机）的区别：
--   - BountyFootball 是多人游戏，必须同时考虑所有在线玩家的下注分布；
--   - 使用 gAnaly:multiAnaly 而非单人分析 API；
--   - 所有玩家共享同一个开奖结果（共享轮盘）。
-- ============================================================

require "BountyFootball.BountyFootball"

BountyFootballMachine = class__()

-- 构造函数
-- @param scene        当前游戏场景对象
-- @param playerSystem 玩家系统对象，用于与其他系统交互
function BountyFootballMachine:ctor__(scene, playerSystem)
    self.scene = scene
    self.playerSystem = playerSystem
end

--- 从玩家系统获取玩家对象
--- @param system 玩家系统
--- @return player 对象或 nil
local function getSystemPlayer(system)
    return system and system.getPlayer and system:getPlayer() or nil
end

--- 从玩家系统获取 UID
--- @param system 玩家系统
--- @return uid 字符串或 nil
local function getSystemUid(system)
    return system and system.getUid and system:getUid() or nil
end

--- 判断某个玩家系统是否为控场目标玩家
--- 目标玩家通过 analy.analyPlayer 指定，可以是 pid 或 uid
--- @param system 玩家系统
--- @param targetPlayer 目标玩家标识（pid 或 uid 字符串）
--- @return boolean 是否为目标玩家
local function isTargetSystem(system, targetPlayer)
    if targetPlayer == "" or targetPlayer == "0" then return false end
    local player = getSystemPlayer(system)
    local pid = player and player.getPid and player:getPid() or nil
    local uid = player and player.getUid and player:getUid() or getSystemUid(system)
    return tostring(pid) == targetPlayer or tostring(uid) == targetPlayer or tostring(getSystemUid(system)) == targetPlayer
end

--- 生成 [0,1) 区间的随机浮点数
--- 优先使用引擎 gRandom 保证一致性，fallback 到 math.random()
--- @return number 0~1 之间的随机数
local function randomUnit()
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(0, 999999) / 1000000
    end
    return math.random()
end

--- 在候选结果集合中按配置概率加权随机选取一个结果
--- 用途：保底逻辑中，当受控筛选无法找到合格结果时使用
--- 保证即使在保底分支中也遵循 BountyFootballCore 配置的概率分布
--- @param candidates 候选结果信息数组
--- @return number 0 基开奖结果，或 nil
local function weightedResult(candidates, resultWeights)
    if #candidates == 0 then return nil end
    resultWeights = resultWeights or LCResultProbability or {}
    -- 计算所有候选项的权重总和（使用配置中的 LCResultProbability）
    local totalWeight = 0
    for _, info in ipairs(candidates) do
        totalWeight = totalWeight + math.max(0, tonumber(resultWeights[info.result + 1]) or 0)
    end
    -- 所有权重为 0 时退化为均匀随机
    if totalWeight <= 0 then
        local index = math.max(1, math.min(#candidates, math.floor(randomUnit() * #candidates) + 1))
        return candidates[index].result
    end

    -- 按权重累加进行加权随机
    local cursor = 0
    local roll = randomUnit() * totalWeight
    for _, info in ipairs(candidates) do
        cursor = cursor + math.max(0, tonumber(resultWeights[info.result + 1]) or 0)
        if roll < cursor then return info.result end
    end
    return candidates[#candidates].result
end

--- 选择受控开奖结果（核心方法）
---
--- 整体流程：
---   1. 解析 gAnaly 返回的控场参数（目标玩家、控场类型、赔付上限等）
---   2. 预计算所有候选结果的玩家盈亏分布（evaluate + 缓存）
---   3. 按控场类型（NoLimit / PlayerLoss / PlayerWin）进行多轮筛选
---   4. 若找不到合格结果，使用保底逻辑（fallbackResult）
---
--- @param playerSystems 所有在线玩家系统数组
--- @param analy gAnaly:multiAnaly 返回的控场数据
--- @param roundId 服务端全局唯一业务期号，仅用于调控日志
--- @return result number  0 基开奖结果索引（0~15）
--- @return status EGameOddsResult 状态枚举
function BountyFootballMachine:selectControlledResult(playerSystems, analy, roundId)
    analy = analy or {}
    playerSystems = playerSystems or {}

    if analy then
        self.analyType = analy.analyType                --全局调控类型
        self.oddsType = analy.oddsType                  --货币操作类型
        self.rerankType = analy.rerankType              --放水类型
        self.analyPlayer = analy.analyPlayer            --调控玩家Pid
        self.waterRuler = analy.waterRuler              --本局游戏放水上限
        self.rewardMax = analy.rewardMax                --本局游戏能获得的奖励上限(为0时表示没限制)
        self.rewardRateMax = analy.rewardRateMax        --本局游戏中奖倍率上限(万分比)
        self.jpPotStageMax = analy.jpPotStageMax        --jp或聚宝盆中奖时最大档位
        self.jpAddRate = analy.jpAddRate                --jp概率增加（万分比）
        self.potAddRate = analy.potAddRate              --聚宝盆概率增加（万分比）
        self.bigRewardAddRate = analy.bigRewardAddRate  --大奖概率增加（万分比）
        local log = "全局调控数据: roundId:{0}  全局调控类型:{1}  放水类型:{2} 放水上限:{3} 奖励值上限:{4} 中奖倍率上限:{5}  大奖概率增加:{6} 调控玩家:{7}"
        log_info(log ,roundId, self.analyType, self.rerankType, self.waterRuler, self.rewardMax, self.rewardRateMax, self.bigRewardAddRate, self.analyPlayer)
    end

    -- ---------- 解析控场参数 ----------
    -- 后续开奖逻辑统一使用上面保存的成员字段，避免定义值与实际使用值不一致。
    local analyType = tonumber(self.analyType) or EAnalyType.NoLimit      -- 控场类型：无限制/让输/让赢
    if analyType ~= EAnalyType.NoLimit and analyType ~= EAnalyType.PlayerLoss and
        analyType ~= EAnalyType.PlayerWin then
        log_error("BountyFootball invalid analyType, fallback to NoLimit. roundId:{0} analyType:{1}", roundId, analyType)
        analyType = EAnalyType.NoLimit
    end
    local targetPlayer = tostring(self.analyPlayer or "")                  -- 目标玩家 PID/UID
    local haveTarget = targetPlayer ~= "" and targetPlayer ~= "0"           -- 是否指定了目标玩家
    local rerankType = tonumber(self.rerankType)                           -- 让赢时的排序维度
    if rerankType == nil then rerankType = EAnalyPlayerWinType.Coins end
    local validRerankType = rerankType == EAnalyPlayerWinType.Coins or      -- 有效的排序维度
        rerankType == EAnalyPlayerWinType.Vip or                            -- Coins(按金额)/Vip(按VIP)/PlayerCount(按人数)
        rerankType == EAnalyPlayerWinType.PlayerCount
    if analyType == EAnalyType.PlayerWin and not validRerankType then
        log_error("BountyFootball invalid rerankType, fallback to Coins. roundId:{0} rerankType:{1}", roundId, rerankType)
        rerankType = EAnalyPlayerWinType.Coins
        validRerankType = true
    end
    local rateMax = tonumber(self.rewardRateMax) or 0                      -- 赔付比例上限（万分比，如5000=50%）
    local rewardCap = tonumber(self.rewardMax) or 0                        -- 全局奖励上限
    local waterRuler = tonumber(self.waterRuler) or 0



    -- Seven7 会通过 bigRewardAddRate 提升大奖概率。BountyFootball 没有独立的大奖ID，
    -- 因此将最高赔率的所有转盘位置视为大奖，并按万分比提升其总概率。
    local resultWeights = {}
    local totalWeight, bigWeight, maxMultiple = 0, 0, 0
    for i, weight in ipairs(LCResultProbability or {}) do
        resultWeights[i] = math.max(0, tonumber(weight) or 0)
        totalWeight = totalWeight + resultWeights[i]
        maxMultiple = math.max(maxMultiple, tonumber(LCWheelMultiple[i]) or 0)
    end
    for i, weight in ipairs(resultWeights) do
        if (tonumber(LCWheelMultiple[i]) or 0) == maxMultiple then
            bigWeight = bigWeight + weight
        end
    end
    local bigRewardAddRate = math.max(0, tonumber(self.bigRewardAddRate) or 0)
    if bigRewardAddRate > 0 and totalWeight > 0 and bigWeight > 0 and bigWeight < totalWeight then
        local oldRate = bigWeight / totalWeight
        local newRate = math.min(1, oldRate + bigRewardAddRate / 10000)
        local otherWeight = totalWeight - bigWeight
        for i, weight in ipairs(resultWeights) do
            if (tonumber(LCWheelMultiple[i]) or 0) == maxMultiple then
                resultWeights[i] = weight * (newRate * totalWeight / bigWeight)
            else
                resultWeights[i] = weight * ((1 - newRate) * totalWeight / otherWeight)
            end
        end
    end

    local weightedCandidates = {}
    for result = 0, #resultWeights - 1 do
        if resultWeights[result + 1] > 0 then
            weightedCandidates[#weightedCandidates + 1] = { result = result }
        end
    end
    local function randomResult()
        return weightedResult(weightedCandidates, resultWeights) or LCRandomResult()
    end

    -- ---------- evaluate 内部函数 ----------
    -- 预计算并缓存指定开奖结果下的全体玩家盈亏信息
    -- 由于多轮筛选中会反复查询同一 result，使用缓存避免重复计算
    local cache = {}
    local function evaluate(result)
        if cache[result] then return cache[result] end
        local info = {
            result = result,
            totalReward = 0,    -- 全体玩家总赔付（负数表示庄家盈利）
            totalBet = 0,       -- 全体玩家总下注
            targetReward = 0,  -- 目标玩家赔付
            targetBet = 0,     -- 目标玩家下注
            winnerCount = 0,   -- 中奖玩家数
            winnerVip = 0,     -- 中奖玩家 VIP 等级总和
            reliefReward = 0,  -- 当前亏损玩家的中奖总额（Seven7 放水目标）
            reliefWinnerCount = 0,
            reliefWinnerVip = 0,
        }

        -- 遍历所有玩家，计算各自在该结果下的盈亏
        for _, system in pairs(playerSystems) do
            local data = system and system.getData and system:getData() or nil
            local bets = type(data) == "table" and type(data.bets) == "table" and data.bets or LCEmptyBets()
            local bet = LCArraySum(bets)
            local reward = LCRevenue(bets, result)
            info.totalBet = info.totalBet + bet
            info.totalReward = info.totalReward + reward

            -- 累计目标玩家的下注和赔付
            if isTargetSystem(system, targetPlayer) then
                info.targetBet = info.targetBet + bet
                info.targetReward = info.targetReward + reward
            end

            -- 统计中奖玩家信息
            if bet > 0 and reward > 0 then
                local player = getSystemPlayer(system)
                info.winnerCount = info.winnerCount + 1
                local vipWeight = 0
                if player and player.getVipWeight then
                    vipWeight = tonumber(player:getVipWeight()) or 0
                elseif player and player.getVipLevel then
                    vipWeight = tonumber(player:getVipLevel()) or 0
                end
                info.winnerVip = info.winnerVip + vipWeight
                local isProfit = player and gAnaly and gAnaly.isPlayerProfit and gAnaly:isPlayerProfit(player) or false
                if not isProfit then
                    info.reliefReward = info.reliefReward + reward
                    info.reliefWinnerCount = info.reliefWinnerCount + 1
                    info.reliefWinnerVip = info.reliefWinnerVip + vipWeight
                end
            end
        end
        cache[result] = info
        return info
    end

    -- ---------- 辅助判断函数 ----------

    -- 有效赔付：有目标时返回目标玩家赔付，否则返回全体总赔付
    local function effectiveReward(info)
        return haveTarget and info.targetReward or info.reliefReward
    end

    -- 检查是否在约束范围内：
    --   1) 总赔付不超过 rewardCap
    --   2) 赔付比例不超过 rateMax（reward / bet <= rateMax / 10000）
    local function withinLimits(info)
        -- 0 表示不限制；负数表示当前没有正向派彩空间，按 0 上限处理。
        local effectiveRewardCap = math.max(0, rewardCap)
        if rewardCap ~= 0 and info.totalReward > effectiveRewardCap then return false end
        -- Seven7 的 rewardRateMax 是整局总赔付/整局总下注上限，
        -- 即使指定了 analyPlayer，也不能只计算目标玩家自身的倍率。
        local effectiveRateMax = math.max(0, rateMax)
        if rateMax ~= 0 and info.totalBet > 0 and
            info.totalReward * 10000 > info.totalBet * effectiveRateMax then
            return false
        end
        return true
    end

    -- 判断是否为"让赢"结果（有玩家中奖）
    local function isPlayerWinResult(info)
        if haveTarget then return info.targetReward > 0 end  -- 目标玩家中奖
        return info.reliefWinnerCount > 0                    -- 至少一个亏损玩家中奖
    end

    -- 判断是否为"让输"结果（庄家盈利）
    local function isHouseProfitResult(info)
        if haveTarget then return info.targetBet > info.targetReward end  -- 指定玩家亏损
        return info.totalBet > info.totalReward                           -- 庄家盈利
    end

    -- waterRuler 只约束放水金额，不参与 NoLimit/PlayerLoss 的普通结果上限。
    local function withinWaterRuler(info)
        return waterRuler <= 0 or effectiveReward(info) <= waterRuler
    end

    -- 在约束范围内随机抽取一个合法结果
    -- ---------- 构建全量候选集合（用于保底） ----------
    -- 过滤掉概率为 0 的位置，保证被禁用的位置不会被选中
    local allCandidates = {}
    local resultCount = math.max(#(LCResultProbability or {}), #(LCResultBetIndex or {}), #(LCWheelMultiple or {}))
    for result = 0, resultCount - 1 do
        if (tonumber(LCResultProbability[result + 1]) or 0) > 0 then
            allCandidates[#allCandidates + 1] = evaluate(result)
        end
    end

    -- The wheel has only 16 positions.  Enumerating all legal positions avoids
    -- a false fallback when repeated random sampling misses a low-weight result.
    local function randomValidResult()
        local candidates = {}
        for _, info in ipairs(allCandidates) do
            if withinLimits(info) then candidates[#candidates + 1] = info end
        end
        return weightedResult(candidates, resultWeights)
    end

    -- ---------- 保底逻辑 ----------
    -- 当多轮筛选都找不到合格结果时使用：
    --   1) 若仍有满足赔付约束的候选，则按配置权重随机
    --   2) 若完全没有合法候选，则选择总赔付最小的结果
    --   3) 候选配置为空时才重新随机
    local function fallbackResult()
        local constrained = {}
        local minimum = nil
        for _, info in ipairs(allCandidates) do
            if withinLimits(info) then
                constrained[#constrained + 1] = info
            end
            if not minimum or info.totalReward < minimum.totalReward then
                minimum = info
            end
        end
        local legal = weightedResult(constrained, resultWeights)
        if legal ~= nil then return legal end
        log_error("BountyFootball payout limits have no legal result. roundId:{0} rewardMax:{1} rewardRateMax:{2}", roundId, rewardCap, rateMax)
        return (minimum and minimum.result) or randomResult()
    end

    -- ---------- 分支1：无限制模式 ----------
    -- 只需要满足赔付上限约束，在限制范围内随机选一个
    if analyType == EAnalyType.NoLimit then
        local result = randomValidResult()
        if result ~= nil then return result, EGameOddsResult.Success end
        return fallbackResult(), EGameOddsResult.RulerMax
    end

    -- ---------- 分支2&3：受控模式主循环 ----------
    -- 多轮随机抽取结果，根据控场类型选择最优解
    local best = nil
    local lossCandidates = {}
    local targetWinCandidates = {}
    -- 受控模式枚举全部有效位置，避免带权重复抽样漏掉低概率但合法的结果。
    for _, info in ipairs(allCandidates) do

        if analyType == EAnalyType.PlayerLoss then
            if withinLimits(info) and isHouseProfitResult(info) then
                lossCandidates[#lossCandidates + 1] = info
            end

        elseif analyType == EAnalyType.PlayerWin and validRerankType and
            withinLimits(info) and withinWaterRuler(info) and isPlayerWinResult(info) then
            if haveTarget then
                targetWinCandidates[#targetWinCandidates + 1] = info
            end
            -- 让赢模式：选择"有玩家中奖"且"在赔付约束内"的结果
            -- 排序维度由 rerankType 决定：
            --   Coins:  赔付金额最大
            --   Vip:    中奖玩家 VIP 总和最大（偏向高 VIP 玩家）
            --   PlayerCount: 中奖人数最多
            local score
            if rerankType == EAnalyPlayerWinType.Vip then
                score = haveTarget and info.targetReward or info.reliefWinnerVip
            elseif rerankType == EAnalyPlayerWinType.PlayerCount then
                score = haveTarget and 1 or info.reliefWinnerCount
            else
                score = effectiveReward(info)
            end

            -- 与当前 best 比较，选择 score 更高者
            local bestScore = nil
            if best then
                if rerankType == EAnalyPlayerWinType.Vip then
                    bestScore = haveTarget and best.targetReward or best.reliefWinnerVip
                elseif rerankType == EAnalyPlayerWinType.PlayerCount then
                    bestScore = haveTarget and 1 or best.reliefWinnerCount
                else
                    bestScore = effectiveReward(best)
                end
            end

            if not best or score > bestScore or
                (score == bestScore and effectiveReward(info) > effectiveReward(best)) or
                (score == bestScore and effectiveReward(info) == effectiveReward(best) and info.totalReward < best.totalReward) then
                best = info
            end
        end
    end

    if analyType == EAnalyType.PlayerLoss and #lossCandidates > 0 then
        return weightedResult(lossCandidates, resultWeights), EGameOddsResult.Success
    end
    if analyType == EAnalyType.PlayerWin and haveTarget and #targetWinCandidates > 0 then
        return best.result, EGameOddsResult.Success
    end

    -- 未找到合格结果 → 使用保底逻辑
    if not best then
        return fallbackResult(), EGameOddsResult.RulerMax
    end

    return best.result, EGameOddsResult.Success
end
