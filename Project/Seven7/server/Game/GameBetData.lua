GameBetData = class__()

function GameBetData:ctor__()
    self.globalBetData = {}
    self.playerBetData = {}

    self.betTotal = 0
    self.rewardTotal = 0

    self.playerRewardInfo = {}

    self.cfgReward = gConfigMgr:getBaseConfig("Reward")

end

function GameBetData:updateBetValue(pid, betid, betValue)
    if not self.cfgReward or not self.cfgReward[betid] then
        log_error("updateBet-cfgReward data is nil, rewardId:{0}", betid)
        return
    end

    if not self.playerBetData[pid] then
        self.playerBetData[pid] = {
            betInfo = {},
            betMap = {},
            betTotal = 0,  
            betCount = 0
        }
    end

    self.playerBetData[pid].betMap[betid] = (self.playerBetData[pid].betMap[betid] or 0) + betValue
    self.playerBetData[pid].betTotal = (self.playerBetData[pid].betTotal or 0) + betValue

    self.globalBetData[betid] = (self.globalBetData[betid] or 0) + betValue
    self.betTotal = self.betTotal + betValue
end

function GameBetData:updateReward(addReward)
    self.rewardTotal = self.rewardTotal + addReward
end

function GameBetData:updateBetInfo(pid, betInfo)
    if not self.playerBetData[pid] then
        self.playerBetData[pid] = {
            betInfo = {},
            betMap = {},
            fruits = {},
            betTotal = 0,    
        }
    end
    table.insert(self.playerBetData[pid].betInfo, betInfo)
end

function GameBetData:updatePlayerBetCount(pid)
    if not self.playerBetData[pid] then
        return
    end
    self.playerBetData[pid].betCount = self.playerBetData[pid].betCount + 1
end

function GameBetData:updatePlayerRewardMap(pid, rewardMap)
    if not self.playerRewardInfo[pid] then
        self.playerRewardInfo[pid] = {}
    end
    self.playerRewardInfo[pid].rewardMap = rewardMap
end

function GameBetData:updatePlayerRewardTotal(pid, reward)
    if not self.playerRewardInfo[pid] then
        self.playerRewardInfo[pid] = {}
    end
    self.playerRewardInfo[pid].rewardTotal = reward
end

function GameBetData:getPlayerRewardMap(pid)
    return self.playerRewardInfo[pid] and self.playerRewardInfo[pid].rewardMap or {}
end

function GameBetData:getPlayerRewardTotal(pid)
    return self.playerRewardInfo[pid] and self.playerRewardInfo[pid].rewardTotal or 0
end

function GameBetData:getPlayerBetCount(pid)
    return self.playerBetData[pid] and self.playerBetData[pid].betCount or 0
end

function GameBetData:getBetTotal()
    return self.betTotal
end

function GameBetData:getRewardTotal()
    return self.rewardTotal
end

function GameBetData:getGlobalBetData()
    return self.globalBetData
end

function GameBetData:getGlobalBetValue(betId)
    return self.globalBetData[betId] or 0
end

function GameBetData:getPlayersBetData()
    return self.playerBetData
end

function GameBetData:getPlayerBetData(pid)
    return self.playerBetData[pid]
end

function GameBetData:getScPlayerBetData(pid)
    local tb = {}
    if not self.playerBetData[pid] or not self.playerBetData[pid].betMap then
        return tb
    end
    for rewardId, betValue in pairs(self.playerBetData[pid].betMap) do
        tb[tostring(rewardId)] = betValue
    end
    return tb
end

function GameBetData:getPlayerBetTotal(pid)
    return self.playerBetData and self.playerBetData[pid] and self.playerBetData[pid].betTotal or 0
end

function GameBetData:getPlayerBetMap(pid)
    return self.playerBetData and self.playerBetData[pid] and self.playerBetData[pid].betMap or {} 
end

function GameBetData:getPlayerBetRewards(pid)
    local tb = {}
    local hadBetMap = self:getPlayerBetMap(pid)
    for betid, betValue in pairs(hadBetMap) do
        if betValue > 0 then
            table.insert(tb, betid)
        end
    end
    return tb
end

function GameBetData:getPlayerBetValue(pid, betId)
    return self.playerBetData[pid] and self.playerBetData[pid].betMap and self.playerBetData[pid].betMap[betId] or 0
end

function GameBetData:getScGlobalBetInfo()
    local tb = {
        betMap = {}
    }
    if not self.globalBetData then
        return tb
    end
    for rewardId, betValue in pairs(self.globalBetData) do
        local key = tostring(rewardId)
        tb.betMap[key] = betValue
    end
    return tb
end

--给平台一个bet_id
function GameBetData:getBetIdForPlatform(pid)
    if self.playerBetData[pid] and self.playerBetData[pid].betMap then
        for betId, _ in pairs(self.playerBetData[pid].betMap) do
            return { bet_id = betId }
        end
    end
    return {}
end

function GameBetData:checkHavePlayerBet()
    return next(self.playerBetData) ~= nil
end

function GameBetData:getNoBetReweards()
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    local tb = {}
    local rewards = {}
    for id, value in ipairs(cfgZhuanPan) do
        local reward = value.RewardID
        if not self.globalBetData[reward] and not tb[reward] then
            tb[reward] = true
            table.insert(rewards, reward)
        end
    end
    return rewards
end


