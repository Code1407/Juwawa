require "Seven7CfgMgr"
require "CommomDefine"
require "Probability.Probability"

GameAnalyData = class__()

function GameAnalyData:ctor__(gameBetData, roundId)
    self.havePlayerBet = gameBetData:checkHavePlayerBet()
    self.globalBetMap = gameBetData:getGlobalBetData()
    self.gameBetData = gameBetData
    self.roundId = roundId
    self.zhuanPanRewards = self:get_zhuanpan_rewards()
    self.playerTab = {}
    self.selfRadomCount = 100
    if self.havePlayerBet then
        local playersBetData = gameBetData:getPlayersBetData()
        for pid, _ in pairs(playersBetData) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                self.playerTab[pid] = player
            end
        end
      
        local analyData = gAnaly:multiAnaly(self.playerTab, roundId)
        if not analyData then
            log_error("调控数据为空 roundId:{0}", roundId)
        end

        if analyData then
            self.analyType = analyData.analyType                --全局调控类型
            self.oddsType = analyData.oddsType                  --货币操作类型
            self.rerankType = analyData.rerankType              --放水类型
            self.analyPlayer = analyData.analyPlayer            --调控玩家Pid
            self.waterRuler = analyData.waterRuler              --本局游戏放水上限
            self.rewardMax = analyData.rewardMax                --本局游戏能获得的奖励上限(为0时表示没限制)
            self.rewardRateMax = analyData.rewardRateMax        --本局游戏中奖倍率上限(万分比)
            self.jpPotStageMax = analyData.jpPotStageMax        --jp或聚宝盆中奖时最大档位
            self.jpAddRate = analyData.jpAddRate                --jp概率增加（万分比）
            self.potAddRate = analyData.potAddRate              --聚宝盆概率增加（万分比）
            self.bigRewardAddRate = analyData.bigRewardAddRate  --大奖概率增加（万分比）
            
            local log = "全局调控数据: roundId:{0}  全局调控类型:{1}  放水类型:{2} 放水上限:{3} 奖励值上限:{4} 中奖倍率上限:{5}  大奖概率增加:{6} 调控玩家:{7}"
            log_info(log ,roundId, self.analyType, self.rerankType, self.waterRuler, self.rewardMax, self.rewardRateMax, self.bigRewardAddRate, self.analyPlayer)
        end
    end

    self.rewardsWeight = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for _, cfg in ipairs(cfgZhuanPan) do
        local rewardId = cfg.RewardID
        if rewardId then
            if not self.rewardsWeight[rewardId] then
                self.rewardsWeight[rewardId] = 0
            end
            self.rewardsWeight[rewardId] = self.rewardsWeight[rewardId] + cfg.Weight
        end
    end

    --根据bigRewardAddRate来重新分配77权重
    if self.bigRewardAddRate and self.bigRewardAddRate > 0 then
        local addRate = self.bigRewardAddRate / 10000
        local totalWeight = 0 --总权重
        local otherWeight= 0  --除77外总权重
        for rewardId, weight in pairs(self.rewardsWeight) do
            totalWeight = totalWeight + weight
            if rewardId ~= 2 then
                otherWeight = otherWeight + weight
            end
        end
        local oldRate = self.rewardsWeight[2] / totalWeight
        local newARate = oldRate + addRate
        if newARate > 1 then
            newARate = 1
        end
        self.rewardsWeight[2] = math.floor(newARate * totalWeight + 0.5)
        log_info("大奖概率增加, 总权重:{0}, 原始概率:{1} 增加概率:{2} 增加后概率:{3} 新权重:{4}", totalWeight, oldRate, addRate, newARate, self.rewardsWeight[2])

        local remainRate = 1 - newARate
        for rewardId, weight in pairs(self.rewardsWeight) do
            if rewardId ~= 2 then
                local w = totalWeight * remainRate * weight / otherWeight
                self.rewardsWeight[rewardId] = math.floor(w + 0.5) 
            end
        end

        --修正取整误差，保证总权重不变
        local newTotal = 0
        for _, weight in pairs(self.rewardsWeight) do
            newTotal = newTotal + weight
        end
        local diff = totalWeight - newTotal
        if diff ~= 0 then
            log_info("权重修正误差:{0}", diff)
            self.rewardsWeight[3] = self.rewardsWeight[3] + diff
        end
    end
end

function GameAnalyData:get_odds_type()
    return self.oddsType or 0
end

function GameAnalyData:get_game_result()
    if not self.havePlayerBet then
        local result = self:get_game_result_by_weight()
        result.gameOddsResult = EGameOddsResult.Success
        log_info("没有人下注走老权重随机")
        return result
    end

    local firstResult = self:get_a_valid_result()
    if not firstResult then
        log_info("第一次随机没有随到, 走保底")
        firstResult = self:get_game_result_by_fallback()
    end

    if not firstResult then
        log_error("没有获取到result  round:{0}", self.roundId)
        return
    end

    if self.analyType == EAnalyType.NoLimit then
        log_info("调控类型为无限制, 取第一次结果")
        firstResult.gameOddsResult = EGameOddsResult.Success
        return firstResult
    end

    local openRewards = self:get_open_rewards(firstResult.rewardId, firstResult.jpId)
    local betTotal = self.gameBetData:getBetTotal()
    local rewardTotal = self:get_global_reward_by_rewards(openRewards)

    if self.analyPlayer and self.analyPlayer ~= 0 then
        local playerBet = self.gameBetData:getPlayerBetTotal(self.analyPlayer)
        if playerBet <= 0 then
            log_info("调控玩家押注为0 pid:{0}", self.analyPlayer)
        end

        local player = gWorld:findAllPlayer(self.analyPlayer)
        local uId = player:getUid()
        local playerReward = self:get_player_reward_by_rewards(self.analyPlayer, openRewards)
        local playerAnalyType = playerReward > 0 and EAnalyType.PlayerWin or EAnalyType.PlayerLoss

        --无限制时直接返回该结果
        if self.analyType == EAnalyType.NoLimit then
            self.oddsType = 0
            firstResult.gameOddsResult = EGameOddsResult.Success
            log_info("调控单个玩家 类型为无限制,直接取初次结果 RoundId:{0} zhuanPanId:{1} rewardId:{2} pId:{3} uId:{4}", self.roundId, firstResult.zhuanPanId, firstResult.rewardId, self.analyPlayer, uId)
            return firstResult
        end

        --调控类型相同直接返回该结果
        if playerAnalyType == self.analyType then
            self.oddsType = 0
            firstResult.gameOddsResult = EGameOddsResult.SameWithAnaly
            log_info("调控单个玩家 调控类型和初次结果一致,直接取初次结果 RoundId:{0} zhuanPanId:{1} rewardId:{2} pId:{3} uId:{4}", self.roundId, firstResult.zhuanPanId, firstResult.rewardId, self.analyPlayer, uId)
            return firstResult
        end

        --修改结果
        local rewards = self.analyType == EAnalyType.PlayerWin and self.gameBetData:getPlayerBetRewards(self.analyPlayer) or self:get_player_loss_rewards(self.analyPlayer)
        if rewards then
            local validRewards = {}
            for _, id in ipairs(rewards) do
                if self:check_result_valid(id) then
                    if self.analyType == EAnalyType.PlayerLoss then --收割
                        table.insert(validRewards, id)
                    else
                        local reward = self:get_player_reward_by_rewards(self.analyPlayer, {id})
                        if self:check_water_value_is_valid(reward) then --放水要满足放水阈值
                            table.insert(validRewards, id)
                        end
                    end
                end
            end

            if #validRewards > 0 then
                local rewardId = self:random_reward_by_rewards(validRewards)
                local jpId = nil
                if rewardId and self.analyType == EAnalyType.PlayerWin and Seven7CfgMgr:checkRewardIs77(rewardId) then
                    jpId = self:get_valid_jp_id(true)
                end
                local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
                local result = {zhuanPanId = zhuanPanId, rewardId = rewardId, jpId = jpId, gameOddsResult = EGameOddsResult.Success}
                if self.analyType == EAnalyType.PlayerWin then
                    log_info("调控单个玩家 放水调控修改初次结果 RoundId:{0} zhuanPanId:{1} rewardId:{2} pId:{3} uId:{4}", self.roundId, result.zhuanPanId, result.rewardId, self.analyPlayer, uId)
                elseif self.analyType == EAnalyType.PlayerLoss then
                    log_info("调控单个玩家 收割调控修改初次结果 RoundId:{0} zhuanPanId:{1} rewardId:{2} pId:{3} uId:{4}", self.roundId, result.zhuanPanId, result.rewardId, self.analyPlayer, uId)
                end
                firstResult.gameOddsResult = EGameOddsResult.Success
                return result
            end
        end
    end

    local analyResult = self:get_game_result_by_analy()
    if self.analyType == EAnalyType.PlayerWin and analyResult then
        log_info("获取到放水调控结果")
        if self:check_all_player_is_gainful(analyResult) then
            firstResult.gameOddsResult = EGameOddsResult.AllPlayerWin 
            log_info("调控放水时被放水的人都是盈利状态 取第一次结果 :RoundId:{0} zhuanPanId:{1} rewardId:{2}", self.roundId, firstResult.zhuanPanId, firstResult.rewardId)
           return firstResult
        end
    end

    if analyResult then
        analyResult.gameOddsResult = EGameOddsResult.Success
        log_info("调控到结果 :RoundId:{0} zhuanPanId:{1} rewardId:{2}", self.roundId, analyResult.zhuanPanId, analyResult.rewardId)
        return analyResult
    end

    log_info("最终保底取第一次结果:RoundId:{0} zhuanPanId:{1} rewardId:{2}", self.roundId, firstResult.zhuanPanId, firstResult.rewardId)
    firstResult.gameOddsResult = EGameOddsResult.RulerMax
    return firstResult
end

--权重随机结果
function GameAnalyData:get_game_result_by_weight(useNewWeight)
    if useNewWeight then
        return self:get_game_result_by_new_weight()
    end
    return self:get_game_result_by_old_weight()
end

function GameAnalyData:get_game_result_by_old_weight()
    local result = {
        zhuanPanId = nil,
        rewardId = nil,
        jpId = nil,
    }
    local zhuanPanId, rewardId = Seven7CfgMgr:getRandInfo()
    result.zhuanPanId = zhuanPanId
    result.rewardId = rewardId
    if Seven7CfgMgr:checkRewardIs77(rewardId) then
        local jpId, jpRewards = Seven7CfgMgr:getRandJackpotInfo()
        result.jpId = jpId
    end
    return result
end

function GameAnalyData:get_game_result_by_new_weight()
    local result = {
        zhuanPanId = nil,
        rewardId = nil,
        jpId = nil,
    }
    local ids = {}
    local weights = {}
    for id, weight in ipairs(self.rewardsWeight) do
        table.insert(ids, id)
        table.insert(weights, weight)
    end
    local probability = Probability(weights, ids)
    result.rewardId = probability:getRandId()
    result.zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(result.rewardId)
    if Seven7CfgMgr:checkRewardIs77(result.rewardId) then
        local jpId, jpRewards = Seven7CfgMgr:getRandJackpotInfo()
        result.jpId = jpId
    end
    return result
end

--权重随机一个结果(要符合RewardMax, rewardRateMax)
function GameAnalyData:get_a_valid_result()
    for i = 1, self.selfRadomCount do
        local result = self:get_game_result_by_weight(true)
        if result.zhuanPanId then
            if self:check_result_valid(result.rewardId, result.jpId) then
                return result
            end
        end
    end
end

--保底结果(老板不亏)
function GameAnalyData:get_game_result_by_fallback()
    local tb = {}
    local betTotal = self.gameBetData:getBetTotal()
    for _, rewardId in ipairs(self.zhuanPanRewards) do
        local reward = self:get_global_reward_by_reward(rewardId)
        if betTotal >= reward then
            table.insert(tb, rewardId)
        end
    end

    if #tb > 0 then
        local rewardId = self:random_reward_by_rewards(tb)
        local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
        return {
            zhuanPanId = zhuanPanId,
            rewardId = rewardId
        }
    end
    return nil
end

--调控结果
function GameAnalyData:get_game_result_by_analy()
    if self.analyType == EAnalyType.PlayerWin then
        return self:player_win()
    elseif self.analyType == EAnalyType.PlayerLoss then
        return self:player_loss()
    end
    return nil
end

--收割(老板要赚，赚多少无所谓)
function GameAnalyData:player_loss()
    local tb = {}
    local betTotal = self.gameBetData:getBetTotal()
    for _, rewardId in ipairs(self.zhuanPanRewards) do
        local reward = self:get_global_reward_by_reward(rewardId)
        if betTotal > reward then
            table.insert(tb, rewardId)
        end
    end
    if #tb > 0 then
        local rewardId = self:random_reward_by_rewards(tb)
        local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
        return {zhuanPanId = zhuanPanId, rewardId = rewardId}
    end
    return nil
end

--放水
function GameAnalyData:player_win()
    if self.rerankType == EAnalyPlayerWinType.Coins then
        return self:player_win_to_coin_max()
    elseif self.rerankType == EAnalyPlayerWinType.Vip then
        return self:player_win_to_vip_max()
    elseif self.rerankType == EAnalyPlayerWinType.PlayerCount then
        return self:player_win_to_player_count_max()
    end
    return nil
end

--亏损玩家盈利金额和最大
function GameAnalyData:player_win_to_coin_max()
    local function get_player_win_total(openRewards)
        local winTotal = 0
        for pid, _ in pairs(self.playerTab) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                local profit = gAnaly:isPlayerProfit(player)
                local reward = self:get_player_reward_by_rewards(pid, openRewards)
                if not profit and reward > 0 then
                    winTotal = winTotal + reward
                end
            end
        end
        return winTotal
    end

    local rewardId = nil
    local jpId = nil
    local winMax = nil
    local rewards = self:get_valid_rewards_in_zhuanpan()
    local cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
    if #rewards > 0 then
        for _, id in ipairs(rewards) do
            if self:check_result_valid(id, nil, true) then
                if id == 2 then
                    for jId, cfgJp in ipairs(cfgJackpot) do
                        local rewardJid = nil
                        local openRewards = {}
                        table.insert(openRewards, id)
                        if cfgJp.Rewards and #cfgJp.Rewards > 0 then
                            if self:check_result_valid(id, jId, true) then
                                rewardJid = jId
                                for _, jpReward in ipairs(cfgJp.Rewards) do
                                    table.insert(openRewards, jpReward)
                                end                           
                            end
                        end
                        local winTotal = get_player_win_total(openRewards)
                        if winTotal > 0 then
                            if winTotal > (winMax or 0) then
                                winMax, rewardId, jpId = winTotal, id, rewardJid
                            end
                        end
                    end
                else
                    local openRewards = {}
                    table.insert(openRewards, id)
                    local winTotal = get_player_win_total(openRewards)
                    if winTotal > 0 then
                        if winTotal > (winMax or 0) then
                            winMax, rewardId = winTotal, id
                            jpId = nil
                        end
                    end
                end
            end      
        end
    end
    if rewardId then
        local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
        return {zhuanPanId = zhuanPanId, rewardId = rewardId, jpId = jpId}
    end
    return nil
end

--亏损玩家盈利vip权重和最大
function GameAnalyData:player_win_to_vip_max()
    local function get_player_vip_weight_total(openRewards)
        local vipWeightSum = nil
        for pid, _ in pairs(self.playerTab) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                local profit = gAnaly:isPlayerProfit(player)
                local reward = self:get_player_reward_by_rewards(pid, openRewards)
                if not profit and reward > 0 then
                    local weight = player:getVipWeight()
                    vipWeightSum = vipWeightSum or 0
                    vipWeightSum = vipWeightSum + weight
                end
            end
        end
        return vipWeightSum
    end

    local rewardId = nil
    local jpId = nil
    local vipWeightMax = nil
    local rewards = self:get_valid_rewards_in_zhuanpan()
    local cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
    if #rewards > 0 then
        for _, id in ipairs(rewards) do
            if self:check_result_valid(id, nil, true) then
                if id == 2 then
                    for jId, cfgJp in ipairs(cfgJackpot) do
                        local rewardJid = nil
                        local openRewards = {}
                        table.insert(openRewards, id)
                        if cfgJp.Rewards and #cfgJp.Rewards > 0 then
                            if self:check_result_valid(id, jId, true) then
                                rewardJid = jId
                                for _, jpReward in ipairs(cfgJp.Rewards) do
                                    table.insert(openRewards, jpReward)
                                end
                            end
                        end
                        local vipWeightTotal = get_player_vip_weight_total(openRewards)
                        if vipWeightTotal then
                            if vipWeightTotal >= (vipWeightMax or 0) then
                                vipWeightMax, rewardId, jpId = vipWeightTotal, id, rewardJid
                            end
                        end
                    end
                else
                    local openRewards = {}
                    table.insert(openRewards, id)
                    local vipWeightTotal = get_player_vip_weight_total(openRewards)
                    if vipWeightTotal then
                        if vipWeightTotal >= (vipWeightMax or 0) then
                            vipWeightMax, rewardId = vipWeightTotal, id
                            jpId = nil
                        end
                    end
                end
            end
        end
    end
    if rewardId then
        local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
        return {zhuanPanId = zhuanPanId, rewardId = rewardId, jpId = jpId}
    end
    return nil
end

--亏损玩家盈利数量最多
function GameAnalyData:player_win_to_player_count_max()
    local function get_player_win_count(openRewards)
        local playerCount = 0
        for pid, _ in pairs(self.playerTab) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                local profit = gAnaly:isPlayerProfit(player)
                local reward = self:get_player_reward_by_rewards(pid, openRewards)
                if not profit and reward > 0 then
                    playerCount = playerCount + 1
                end
            end
        end
        return playerCount
    end

    local rewardId = nil
    local jpId = nil
    local playerCountMax = nil
    local rewards = self:get_valid_rewards_in_zhuanpan()
    local cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
    if #rewards > 0 then
        for _, id in ipairs(rewards) do
            if self:check_result_valid(id, nil, true) then
                if id == 2 then
                    for jId, cfgJp in ipairs(cfgJackpot) do
                        local rewardJid = nil
                        local openRewards = {}
                        table.insert(openRewards, id)
                        if cfgJp.Rewards and #cfgJp.Rewards > 0 then
                            if self:check_result_valid(id, jId, true) then
                                rewardJid = jId
                                for _, jpReward in ipairs(cfgJp.Rewards) do
                                    table.insert(openRewards, jpReward)
                                end
                            end
                        end
                        local playerTotal = get_player_win_count(openRewards)
                        if playerTotal > 0 then
                            if playerTotal > (playerCountMax or 0) then
                                playerCountMax, rewardId, jpId = playerTotal, id, rewardJid
                            end
                        end
                    end
                else
                    local openRewards = {}
                    table.insert(openRewards, id)
                    local playerTotal = get_player_win_count(openRewards)
                    if playerTotal > 0 then
                        if playerTotal > (playerCountMax or 0) then
                            playerCountMax, rewardId = playerTotal, id
                            jpId = nil
                        end
                    end
                end
            end
        end
    end
    if rewardId then
        local zhuanPanId = Seven7CfgMgr:randomZhuanpanIndex(rewardId)
        return {zhuanPanId = zhuanPanId, rewardId = rewardId, jpId = jpId}
    end
    return nil
end

function GameAnalyData:get_open_rewards(rewardId, jpId)
    local rewards = {}
    table.insert(rewards, rewardId)
    if jpId then
        local cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
        local cfg = cfgJackpot and cfgJackpot[jpId]
        if cfg and cfg.Rewards then
            for _, id in ipairs(cfg.Rewards) do
                table.insert(rewards, id)
            end
        end
    end
    return rewards
end

--根据押注获取奖励值
function GameAnalyData:get_global_reward_by_reward(rewardId)
    local betValue = self.globalBetMap[rewardId] or 0
    local mult = Seven7CfgMgr:getRewardMult(rewardId)
    if mult then
        return mult * betValue
    end
    return 0
end

--根据结果获取奖励总值
function GameAnalyData:get_global_reward_by_rewards(rewards)
    local rewardTotal = 0
    for _, id in ipairs(rewards) do
        local reward = self:get_global_reward_by_reward(id)
        rewardTotal = rewardTotal + reward
    end
    return rewardTotal
end

--根据结果获取玩家奖励总值
function GameAnalyData:get_player_reward_by_rewards(pid, rewards)
    local reward = 0
    for _, rewardId in pairs(rewards) do
        local betValue = self.gameBetData:getPlayerBetValue(pid, rewardId)
        local mult = Seven7CfgMgr:getRewardMult(rewardId)
        reward = reward + betValue * mult
    end
    return reward
end

--获取转盘上所有有效的奖励
function GameAnalyData:get_valid_rewards_in_zhuanpan()
    local rewards = {}
    for _, rewardID in ipairs(self.zhuanPanRewards) do
        if self:check_result_valid(rewardID) then
            table.insert(rewards, rewardID)
        end
    end
    return rewards
end

--获取玩家亏损的奖励
function GameAnalyData:get_player_loss_rewards(pid)
    local betTotal = self.gameBetData:getPlayerBetTotal(pid)
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    local temp = {}
    local rewards = {}
    for id, value in ipairs(cfgZhuanPan) do
        local rewardId = value.RewardID
        local tb = {}
        table.insert(tb, rewardId)
        local playerReward = self:get_player_reward_by_rewards(pid, tb)
        if playerReward < betTotal and not temp[rewardId] then
            temp[rewardId] = true
            table.insert(rewards, rewardId)
        end
    end
    return rewards
end

--检查结果是否符合rewardMax、rewardRateMax
function GameAnalyData:check_result_valid(rewardId, jpId, checkWaterRuler)
    if not self.havePlayerBet then
        return true
    end
    if self.rewardMax == 0 and self.rewardRateMax == 0 then
        return true
    end

    local openRewards = self:get_open_rewards(rewardId, jpId)
    local betTotal = self.gameBetData:getBetTotal()
    local rewardTotal = self:get_global_reward_by_rewards(openRewards)
    local getMonyRate = rewardTotal / betTotal
    local multMax = self.rewardRateMax / 10000
    local valid = rewardTotal <= self.rewardMax and getMonyRate <= multMax or false
    if checkWaterRuler then
        valid = valid and (self.waterRuler == 0 and true or rewardTotal <= self.waterRuler)  
    end
    return valid
end

--检测放水值是否合法
function GameAnalyData:check_water_value_is_valid(waterValue)
    if self.waterRuler == 0 then
        return true
    end
    return waterValue <= self.waterRuler
end

--被放水的人都是处于盈利状态，那么就放水失败，直接走随机
function GameAnalyData:check_all_player_is_gainful(result)
    local openRewards = self:get_open_rewards(result.rewardId, result.jpId)
    for pid, _ in pairs(self.playerTab) do
        local isWin = self:get_player_reward_by_rewards(pid, openRewards) > 0
        if isWin then
            local player = gWorld:findAllPlayer(pid)
            if player then
                local profit = gAnaly:isPlayerProfit(player)
                if not profit then
                    return false
                end
            end
        end
    end
    return true
end

--根据rewards,使用表权重随机
function GameAnalyData:random_reward_by_rewards(rewards)
    local ids = {}
    local weights = {}
    for _, rewardId in ipairs(rewards) do
        table.insert(ids, rewardId)
        table.insert(weights, self.rewardsWeight[rewardId])
    end
    local probability = Probability(weights, ids)
    local rewardId = probability:getRandId()
    return rewardId
end

--中了77后，获取所有符合RewardMax的jpId
function GameAnalyData:get_valid_jp_id(checkWaterRuler)
    local bet77Value = self.globalBetMap[2] or 0
    local ids = {}
    local weights = {}
    if bet77Value > 0 then
        local reward77 = self:get_global_reward_by_reward(2)
        local cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
        for jpId, cfgJp in ipairs(cfgJackpot) do
            if self:check_result_valid(2, jpId, checkWaterRuler) then
                table.insert(ids, jpId)
                table.insert(weights, cfgJp.Weight)
            end
        end
    end

    if #ids > 0 then
        local probability = Probability(weights, ids)
        return probability:getRandId()
    end
    return nil
end

--获取所有转盘上所有奖励
function GameAnalyData:get_zhuanpan_rewards()
    local tb = {}
    local map = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan) do
        if not map[value.RewardID] then
            map[value.RewardID] = true  
            table.insert(tb, value.RewardID)
        end
    end
    return tb
end

