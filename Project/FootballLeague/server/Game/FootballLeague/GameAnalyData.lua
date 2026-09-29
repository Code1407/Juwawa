require "FootballLeague.FootballLeagueCfgMgr"
require "CommomDefine"
require "Probability.Probability"

GameAnalyData = class__()

function GameAnalyData:ctor__(gameBetData, roundId, sceneType)
    self.sceneType = sceneType or EGameScene.Normal
    self.havePlayerBet = gameBetData:checkHavePlayerBet(self.sceneType)
    self.globalBetMap = gameBetData:getGlobalBetData(self.sceneType)
    self.gameBetData = gameBetData
    self.roundId = roundId
    self.playerTab = {}
    -- 调控计算会针对多个候选盘面反复扫描玩家。缓存玩家对象，并按需缓存盈亏和 VIP，
    -- 避免候选盘面循环内重复查询世界对象；不需要放水策略时不会额外查询盈亏状态。
    self.playerAnalyTab = {}
    self.selfRadomCount = 100
    if self.havePlayerBet then
        local playersBetData = gameBetData:getPlayersBetData(self.sceneType)
        for pid, _ in pairs(playersBetData) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                self.playerTab[pid] = player
                self.playerAnalyTab[pid] = {
                    player = player
                }
            end
        end
      
        local analyData = gAnaly:multiAnaly(self.playerTab, roundId)
        if not analyData then
            log_error("not analyData data")
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

            local log = "全局调控数据: roundId:{0} 全局调控类型:{1} 放水类型:{2} 放水上限:{3} 奖励值上限:{4} 中奖倍率上限:{5} 大奖概率增加:{6} 调控玩家:{7}"
            log_info(log ,roundId, self.analyType, self.rerankType, self.waterRuler, self.rewardMax, self.rewardRateMax, self.bigRewardAddRate, self.analyPlayer)
        end
    end

    --当前场景最高倍率视为大奖，调控加权时优先调整该格子。
    self.zhuanpansWeight = {}
    local bigRewardId = 0     --大奖Id
    local repairWeightId = 0  --重新分配权重补权重Id,补到倍率最低的
    local totalWeight = 0 --总权重
    local otherWeight= 0  --除大奖外总权重
    local maxMultiple = nil
    local minMultiple = nil

    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, cfg in ipairs(cfgZhuanPan or {}) do
        self.zhuanpansWeight[id] = FootballLeagueCfgMgr:getZhuanPanWeight(cfg, self.sceneType)
        local weight = self.zhuanpansWeight[id]
        if cfg.Rewards then
            local multiple = cfg.Rewards[1] and FootballLeagueCfgMgr:getRewardMult(cfg.Rewards[1], self.sceneType, id) or 0
            if not maxMultiple or multiple > maxMultiple then
                maxMultiple = multiple
                bigRewardId = id
            end
            if not minMultiple or multiple < minMultiple then
                minMultiple = multiple
                repairWeightId = id
            end
        end
        totalWeight = totalWeight + weight
    end

    for id, weight in pairs(self.zhuanpansWeight) do
        if id ~= bigRewardId then
            otherWeight = otherWeight + weight
        end
    end
 
    local needAllotWeight = false
    --根据bigRewardAddRate来重新分配最高倍率格子的权重
    if self.bigRewardAddRate and self.bigRewardAddRate > 0 and bigRewardId > 0 and totalWeight > 0 and otherWeight > 0 then
        local addRate = self.bigRewardAddRate / 10000
        local oldRate_bigReward = self.zhuanpansWeight[bigRewardId] / totalWeight
        local newRate_bigReward = oldRate_bigReward + addRate
        if newRate_bigReward > 1 then
            newRate_bigReward = 1
        end
        self.zhuanpansWeight[bigRewardId] = math.floor(newRate_bigReward * totalWeight + 0.5)
        needAllotWeight = true
        log_info("大奖概率增加, 总权重:{0}, 原始概率:{1} 增加概率:{2} 增加后概率:{3} 新权重:{4}", totalWeight, oldRate_bigReward, addRate, newRate_bigReward, self.zhuanpansWeight[bigRewardId])
    end
    --重新分配普通奖励权重
    if needAllotWeight then
        local rate_bigReward = self.zhuanpansWeight[bigRewardId] / totalWeight
        local remainRate = 1 - rate_bigReward
        for zhuanpanId, weight in pairs(self.zhuanpansWeight) do
            if zhuanpanId ~= bigRewardId then
                local w = totalWeight * remainRate * weight / otherWeight
                self.zhuanpansWeight[zhuanpanId] = math.floor(w + 0.5) 
            end
        end

        --修正取整误差，保证总权重不变
        if repairWeightId > 0 then
            local newTotal = 0
            for _, weight in pairs(self.zhuanpansWeight) do
                newTotal = newTotal + weight
            end
            local diff = totalWeight - newTotal
            if diff ~= 0 then
                self.zhuanpansWeight[repairWeightId] = self.zhuanpansWeight[repairWeightId] + diff
                log_info("权重修正误差:修正ID:{0} 修正值:{1}", repairWeightId, diff)
            end
        end
    end
end

function GameAnalyData:is_cached_player_profit(pid)
    local playerInfo = self.playerAnalyTab[pid]
    if not playerInfo then
        return nil
    end
    if playerInfo.isProfit == nil then
        playerInfo.isProfit = gAnaly:isPlayerProfit(playerInfo.player)
    end
    return playerInfo.isProfit
end

function GameAnalyData:get_cached_player_vip_weight(pid)
    local playerInfo = self.playerAnalyTab[pid]
    if not playerInfo then
        return nil
    end
    if playerInfo.vipWeight == nil then
        playerInfo.vipWeight = playerInfo.player:getVipWeight()
    end
    return playerInfo.vipWeight
end

function GameAnalyData:get_odds_type()
    return self.oddsType or 0
end

function GameAnalyData:get_game_result()
    if not self.havePlayerBet then
        local zhuanPanId = self:get_game_result_by_weight()
        log_info("没有人下注走老权重随机")
        return zhuanPanId, EGameOddsResult.Success
    end

    local zhuanPanId = self:get_a_valid_result()
    if not zhuanPanId then
        log_info("第一次随机没有随到, 走保底")
        zhuanPanId = self:get_game_result_by_fallback()
    end

    if not zhuanPanId then
        log_error("没有获取到result round:{0}", self.roundId)
        return
    end

    local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    if self.analyPlayer and self.analyPlayer ~= 0 then
        local playerBet = self.gameBetData:getPlayerBetTotal(self.analyPlayer, self.sceneType)
        if playerBet <= 0 then
            log_info("调控玩家押注为0 pid:{0}", self.analyPlayer)
        end
        local player = gWorld:findAllPlayer(self.analyPlayer)
        local uId = player:getUid()
        local playerReward = self:get_player_reward_by_rewards(self.analyPlayer, openRewards, zhuanPanId)
        local playerAnalyType = playerReward > 0 and EAnalyType.PlayerWin or EAnalyType.PlayerLoss

        --无限制时直接返回该结果
        if self.analyType == EAnalyType.NoLimit then
            self.oddsType = 0
            log_info("调控单个玩家 类型为无限制,直接取初次结果 RoundId:{0} zhuanPanId:{1} pId:{2} uId:{3}", self.roundId, zhuanPanId, self.analyPlayer, uId)
            return zhuanPanId, EGameOddsResult.Success
        end

        --调控类型相同直接返回该结果
        if playerAnalyType == self.analyType then
            self.oddsType = 0
            log_info("调控单个玩家 调控类型和初次结果一致,直接取初次结果 RoundId:{0} zhuanPanId:{1} pId:{2} uId:{3}", self.roundId, zhuanPanId, self.analyPlayer, uId)
            return zhuanPanId, EGameOddsResult.SameWithAnaly
        end

        --修改结果
        local zhuanpanIds = self:get_zhuanpan_ids(self.analyPlayer, self.analyType)
        if zhuanpanIds then
            local validZhuanpans = {}
            for _, id in ipairs(zhuanpanIds) do
                if self.analyType == EAnalyType.PlayerLoss then
                    if self:check_result_valid(id) then
                        table.insert(validZhuanpans, id)
                    end
                else
                    if self:check_result_valid(id, true) then
                        table.insert(validZhuanpans, id)
                    end
                end
            end

            if #validZhuanpans > 0 then
                zhuanPanId = self:random_zhuanpan_by_zhuanpans(validZhuanpans)
                if self.analyType == EAnalyType.PlayerWin then
                    log_info("调控单个玩家 防水调控修改初次结果 RoundId:{0} zhuanPanId:{1} pId:{2} uId:{3}", self.roundId, zhuanPanId, self.analyPlayer, uId)
                elseif self.analyType == EAnalyType.PlayerLoss then
                    log_info("调控单个玩家 收割调控修改初次结果 RoundId:{0} zhuanPanId:{1} pId:{2} uId:{3}", self.roundId, zhuanPanId, self.analyPlayer, uId)
                end
                return zhuanPanId, EGameOddsResult.Success
            end
        end
    end

    local analyZhuanPanId = self:get_game_result_by_analy()
    if self.analyType == EAnalyType.PlayerWin and analyZhuanPanId then
        if self:check_all_player_is_gainful(analyZhuanPanId) then
            log_info("调控放水时被放水的人都是盈利状态 取第一次结果 :RoundId:{0} zhuanPanId:{1}", self.roundId, analyZhuanPanId)
           return zhuanPanId, EGameOddsResult.AllPlayerWin 
        end
    end

    if analyZhuanPanId then
        log_info("调控到结果 :RoundId:{0} zhuanPanId:{1}", self.roundId, analyZhuanPanId)
        return analyZhuanPanId, EGameOddsResult.Success
    end

    log_info("最终保底取第一次结果:RoundId:{0} zhuanPanId:{1}", self.roundId, zhuanPanId)
    return zhuanPanId, EGameOddsResult.RulerMax
end

--权重随机结果(要符合RewardMax, rewardRateMax)
function GameAnalyData:get_a_valid_result()
    for i = 1, self.selfRadomCount do
        local zhuanPanId = self:get_game_result_by_weight(true) --FootballLeagueCfgMgr:getRandZhuanPanId()
        if zhuanPanId then
            if self:check_result_valid(zhuanPanId) then
                return zhuanPanId
            end
        end
    end
    return nil
end

--权重随机结果
function GameAnalyData:get_game_result_by_weight(useNewWeight)
    if useNewWeight then
        return self:get_game_result_by_new_weight()
    end
    return self:get_game_result_by_old_weight()
end

function GameAnalyData:get_game_result_by_old_weight()
    return FootballLeagueCfgMgr:getRandZhuanPanId(false, self.sceneType)
end

function GameAnalyData:get_game_result_by_new_weight()
    local ids = {}
    local weights = {}
    for id, weight in ipairs(self.zhuanpansWeight) do
        table.insert(ids, id)
        table.insert(weights, weight)
    end
    local probability = Probability(weights, ids)
    return probability:getRandId()
end

--保底结果(老板不亏)
function GameAnalyData:get_game_result_by_fallback()
    local tb = {}
    local betTotal = self.gameBetData:getBetTotal(self.sceneType)
    for zhuanPanId, _ in ipairs(self.zhuanpansWeight) do
        local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
        local rewardTotal = self:get_global_reward_by_rewards(openRewards, zhuanPanId)
        -- 保底路径也必须遵守调控上限；此前随机路径未命中时会绕过
        -- rewardMax/rewardRateMax，导致实际结算仍可能超限。
        if betTotal >= rewardTotal and self:check_result_valid(zhuanPanId) then
            table.insert(tb, zhuanPanId)
        end
    end

    if #tb > 0 then
        local zhuanPanId = self:random_zhuanpan_by_zhuanpans(tb)
        return zhuanPanId
    end
    return nil
end

--检查ZhuanPanId是否符合rewardMax、rewardRateMax
function GameAnalyData:check_result_valid(zhuanPanId, checkWaterRuler)
    if not self.havePlayerBet then
        return true
    end
    local rewardMax = tonumber(self.rewardMax) or 0
    local rewardRateMax = tonumber(self.rewardRateMax) or 0
    if rewardMax == 0 and rewardRateMax == 0 then
        return true
    end

    local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    local betTotal = self.gameBetData:getBetTotal(self.sceneType)
    local rewardTotal = self:get_global_reward_by_rewards(openRewards, zhuanPanId)
    local getMonyRate = betTotal > 0 and rewardTotal / betTotal or 0
    local valid = true
    -- multiAnaly 的负值是内部盈亏状态，不是可执行的派奖预算；只有正值才是
    -- 实际 rewardMax。若把负值当 0，玩家覆盖全部落点时会没有任何可开奖盘面。
    if rewardMax > 0 then
        valid = valid and rewardTotal <= rewardMax
    end
    if rewardRateMax > 0 then
        valid = valid and getMonyRate <= rewardRateMax / 10000
    end
    if checkWaterRuler then
        valid = valid and (self.waterRuler == 0 and true or rewardTotal <= self.waterRuler)
    end
    return valid
end

--根据押注获取奖励值
function GameAnalyData:get_global_reward_by_reward(rewardId, zhuanPanId)
    local betValue = self.gameBetData:getGlobalBetValue(rewardId, self.sceneType)
    local mult = FootballLeagueCfgMgr:getRewardMult(rewardId, self.sceneType, zhuanPanId) or 0
    if mult then
        return mult * betValue
    end
    return 0
end

--根据结果获取奖励总值
function GameAnalyData:get_global_reward_by_rewards(rewards, zhuanPanId)
    local rewardTotal = 0
    for _, id in ipairs(rewards or {}) do
        local reward = self:get_global_reward_by_reward(id, zhuanPanId)
        rewardTotal = rewardTotal + reward
    end
    return rewardTotal
end

--根据结果获取玩家奖励总值
function GameAnalyData:get_player_reward_by_rewards(pid, rewards, zhuanPanId)
    local reward = 0
    for _, rewardId in pairs(rewards or {}) do
        local betValue = self.gameBetData:getPlayerBetValue(pid, rewardId, self.sceneType)
        local mult = FootballLeagueCfgMgr:getRewardMult(rewardId, self.sceneType, zhuanPanId) or 0
        reward = reward + betValue * mult
    end
    return reward
end

function GameAnalyData:get_all_valid_zhuanpan()
    local zhuanPans = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan") or {}
    for zhuanPanId, _ in ipairs(cfgZhuanPan) do
        if self:check_result_valid(zhuanPanId, true) then
            table.insert(zhuanPans, zhuanPanId)
        end
    end
    return zhuanPans
end

function GameAnalyData:get_zhuanpan_ids(pid, analyType)
    local betTotal = self.gameBetData:getPlayerBetTotal(pid, self.sceneType)
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    local ids = {}
    for id, value in ipairs(cfgZhuanPan) do
        local rewards = value.Rewards
        if rewards then
            local rewardTotal = self:get_global_reward_by_rewards(rewards, id)
            if analyType == EAnalyType.PlayerWin then
                if rewardTotal > 0 then
                    table.insert(ids, id)
                end
            else
                if rewardTotal == 0 or rewardTotal < betTotal then
                    table.insert(ids, id)
                end
            end
        end
    end
    return ids
end

--根据zhuanpans,使用表权重随机
function GameAnalyData:random_zhuanpan_by_zhuanpans(zhuanpans)
    local ids = {}
    local weights = {}
    for _, zhuanpanId in ipairs(zhuanpans) do
        table.insert(ids, zhuanpanId)
        table.insert(weights, self.zhuanpansWeight[zhuanpanId])
    end
    local probability = Probability(weights, ids)
    local zhuanpanId = probability:getRandId()
    return zhuanpanId
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
    local betTotal = self.gameBetData:getBetTotal(self.sceneType)
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan) do
        if value.Rewards then
            local reward = self:get_global_reward_by_rewards(value.Rewards, id)
            if betTotal > reward then
                table.insert(tb, id)
            end
        end
    end
    if #tb > 0 then
        local zhuanPanId = self:random_zhuanpan_by_zhuanpans(tb)
        return zhuanPanId
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
    local function get_player_win_total(openRewards, zhuanPanId)
        local winTotal = 0
        for pid, _ in pairs(self.playerTab) do
            local playerInfo = self.playerAnalyTab[pid]
            if playerInfo then
                local reward = self:get_player_reward_by_rewards(pid, openRewards, zhuanPanId)
                if not self:is_cached_player_profit(pid) and reward > 0 then
                    winTotal = winTotal + reward
                end
            end
        end
        return winTotal
    end

    local zhuanPanId = nil
    local winMax = nil
    local zhuanPans = self:get_all_valid_zhuanpan()
    if #zhuanPans > 0 then
        for _, id in ipairs(zhuanPans) do         
            local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(id)
            local winTotal = get_player_win_total(openRewards, id)
            if winTotal > 0 then
                 if winTotal > (winMax or 0) then
                    winMax, zhuanPanId = winTotal, id
                end
            end
        end
    end
    return zhuanPanId
end

--亏损玩家盈利vip权重和最大
function GameAnalyData:player_win_to_vip_max()
    local function get_player_vip_weight_total(openRewards, zhuanPanId)
        local vipWeightSum = nil
        for pid, _ in pairs(self.playerTab) do
            local playerInfo = self.playerAnalyTab[pid]
            if playerInfo then
                local reward = self:get_player_reward_by_rewards(pid, openRewards, zhuanPanId)
                if not self:is_cached_player_profit(pid) and reward > 0 then
                    local weight = self:get_cached_player_vip_weight(pid)
                    vipWeightSum = vipWeightSum or 0
                    vipWeightSum = vipWeightSum + weight
                end
            end
        end
        return vipWeightSum
    end

    local zhuanPanId = nil
    local vipWeightMax = nil
    local zhuanPans = self:get_all_valid_zhuanpan()
    if #zhuanPans > 0 then
        for _, id in ipairs(zhuanPans) do            
           local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(id)
           local vipWeightTotal = get_player_vip_weight_total(openRewards, id)
           if vipWeightTotal then
                if vipWeightTotal >= (vipWeightMax or 0) then
                    vipWeightMax, zhuanPanId = vipWeightTotal, id
                end
            end
        end
    end
    return zhuanPanId
end

--亏损玩家盈利数量最多
function GameAnalyData:player_win_to_player_count_max()
    local function get_player_win_count(openRewards, zhuanPanId)
        local playerCount = 0
        for pid, _ in pairs(self.playerTab) do
            local playerInfo = self.playerAnalyTab[pid]
            if playerInfo then
                local reward = self:get_player_reward_by_rewards(pid, openRewards, zhuanPanId)
                if not self:is_cached_player_profit(pid) and reward > 0 then
                    playerCount = playerCount + 1
                end
            end
        end
        return playerCount
    end

    local zhuanPanId = nil
    local playerCountMax = nil
    local zhuanPans = self:get_all_valid_zhuanpan()
    if #zhuanPans > 0 then
        for _, id in ipairs(zhuanPans) do             
            local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(id)
            local playerTotal = get_player_win_count(openRewards, id)
            if playerTotal > 0 then
                if playerTotal > (playerCountMax or 0) then
                    playerCountMax, zhuanPanId = playerTotal, id
                end
            end
        end
    end
    return zhuanPanId
end

function GameAnalyData:check_all_player_is_gainful(zhuanPanId)
    local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    for pid, _ in pairs(self.playerTab) do
        local isWin = self:get_player_reward_by_rewards(pid, openRewards, zhuanPanId) > 0
        if isWin then
            local playerInfo = self.playerAnalyTab[pid]
            if playerInfo and not self:is_cached_player_profit(pid) then
                return false
            end
        end
    end
    return true
end






