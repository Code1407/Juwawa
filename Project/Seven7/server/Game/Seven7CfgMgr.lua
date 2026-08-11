require "Probability.Probability"

Seven7CfgMgr = {}

function Seven7CfgMgr:onLoadZhuanPanCfg(tag)
    local cfgZhuanPan = nil
    if tag == "base" then
        cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    elseif tag == "high" then
        cfgZhuanPan = gConfigMgr:getHighConfig("ZhuanPan")
    end
    self:setZhuanPanProb(cfgZhuanPan, tag)
end

function Seven7CfgMgr:onLoadJackpotCfg(tag)
    local cfgJackpot = nil
    if tag == "base" then
        cfgJackpot = gConfigMgr:getBaseConfig("Jackpot")
    elseif tag == "high" then
        cfgJackpot = gConfigMgr:getHighConfig("Jackpot")
    end
    self:setJackpotProb(cfgJackpot, tag)
end

function Seven7CfgMgr:onLoadConstantCfg(tag)
    if SvrSystem.Seven7Main then
        SvrSystem.Seven7Main.cfgConstantInit()
    end
end
   
function Seven7CfgMgr:setZhuanPanProb(cfgZhuanPan, tag)
    local ids = {}
    local weights = {}
    for id, value in ipairs(cfgZhuanPan) do
        table.insert(ids, id)
        table.insert(weights, value.Weight)
    end
    local probability = Probability(weights, ids)
    if not self.ProbZhuanPan then
        self.ProbZhuanPan = {}
    end
    if tag == "base" then
        self.ProbZhuanPan.base = probability
    elseif tag == "high" then
        self.ProbZhuanPan.high = probability
    end
end

function Seven7CfgMgr:setJackpotProb(cfgJackpot, tag)
    local ids = {}
    local weights = {}
    for id, value in ipairs(cfgJackpot) do
        table.insert(ids, id)
        table.insert(weights, value.Weight)
    end
    local probability = Probability(weights, ids)
    if not self.ProbJackpot then
        self.ProbJackpot = {}
    end
    if tag == "base" then
        self.ProbJackpot.base = probability
    elseif tag == "high" then
        self.ProbJackpot.high = probability
    end
end

function Seven7CfgMgr:getRandInfo(isHigh)
    local zhuanPanId = isHigh and self.ProbZhuanPan.high:getRandId() or self.ProbZhuanPan.base:getRandId()
    if not zhuanPanId then
        log_error("zhuanPanId is nil:{0}", tostring(isHigh))
        return nil
    end
    local cfgZhuanPan = isHigh and gConfigMgr:getHighConfig("ZhuanPan") or gConfigMgr:getBaseConfig("ZhuanPan")
    if not cfgZhuanPan then
        log_error("cfgZhuanPan is nil:{0}", tostring(isHigh))
        return nil
    end
    if not cfgZhuanPan[zhuanPanId] then
        log_error("cfgZhuanPan data is nil:{0}", zhuanPanId)
        return 
    end
    local rewardID = cfgZhuanPan[zhuanPanId].RewardID
    if not rewardID then
        log_error("RewardID is nil:{0}", zhuanPanId)
        return 
    end
    return zhuanPanId, rewardID
end

function Seven7CfgMgr:getRandJackpotInfo(isHigh)
    local jpId = isHigh and self.ProbJackpot.high:getRandId() or self.ProbJackpot.base:getRandId()
    if not jpId then
        log_error("jpId is nil")
        return nil
    end
    local cfgJackpot = isHigh and gConfigMgr:getHighConfig("Jackpot") or gConfigMgr:getBaseConfig("Jackpot")
    if not cfgJackpot then
        log_error("cfgMultRewards is nil")
        return nil
    end
    if not cfgJackpot[jpId] then
        log_error("cfgMultRewards data is nil:{0}", jpId)
        return nil
    end
    return jpId, cfgJackpot[jpId].Rewards
end

function Seven7CfgMgr:getJpRewards(jpId)
    local cfgMultRewards = gConfigMgr:getBaseConfig("Jackpot")
    if not cfgMultRewards[jpId] then
        log_error("cfgMultRewards data is nil:{0}", jpId)
        return nil
    end
    return cfgMultRewards[jpId].Rewards
end

function Seven7CfgMgr:getRewardMult(rewardID)
    local cfgReward = gConfigMgr:getBaseConfig("Reward")
    if not cfgReward then
        log_error("cfgReward is nil")
        return nil
    end
    return cfgReward[rewardID] and cfgReward[rewardID].Multiple
end

function Seven7CfgMgr:getCfgConstantValue(constantKey)
    local cfg = gConfigMgr:getBaseConfig("Constant")
    if not cfg then
        return log_error("CfgConstant is nil")
    end
    local data = cfg[constantKey]
    if not data then
        return log_error("CfgConstant Data is nil, key:{0}", constantKey)
    end
    return data.value
end

function Seven7CfgMgr:checkRewardIs77(rewardID)
    return rewardID == 2
end

function Seven7CfgMgr:getZhuanPanIndexAry()
    local tb = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan) do
        table.insert(tb, value.RewardID)
    end
    return tb
end

function Seven7CfgMgr:getRewardIdByZhuanPanId(zhuanPanId)
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    return cfgZhuanPan and cfgZhuanPan[zhuanPanId] and cfgZhuanPan[zhuanPanId].RewardID or nil
end

function Seven7CfgMgr:getMultIdAry()
    local tb = {}
    local cfgMult = gConfigMgr:getBaseConfig("Jackpot")
    for id, _ in ipairs(cfgMult) do
        table.insert(tb, id)
    end
    return tb
end

function Seven7CfgMgr:randomZhuanpanIndex(rewardId)
    local tb = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan) do
        if value.RewardID == rewardId then
            table.insert(tb, id)    
        end
    end
    local count = #tb
    local index = gRandom:gen_between_int(1, count)
    return tb[index]
end