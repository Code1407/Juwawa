require "Probability.Probability"

FootballLeagueCfgMgr = {}

local DEFAULT_SCENE_TYPE = 1

local function normalizeSceneType(sceneType)
    local value = tonumber(sceneType) or DEFAULT_SCENE_TYPE
    if EGameScene and (value < EGameScene.Normal or value > EGameScene.Master) then
        return EGameScene.Normal
    end
    if value < 1 or value > 3 then
        return DEFAULT_SCENE_TYPE
    end
    return value
end

local function normalizeNumberArray(values, fallback, length)
    local result = {}
    fallback = fallback or {}
    if type(values) ~= "table" then
        values = {}
    end
    for i = 1, length do
        local value = tonumber(values[i] or values[tostring(i)] or fallback[i])
        result[i] = value or 0
    end
    return result
end

local function arrayLength(values)
    if type(values) ~= "table" then
        return 0
    end
    local length = #values
    for key, _ in pairs(values) do
        local index = tonumber(key)
        if index and index > length then
            length = index
        end
    end
    return length
end

function FootballLeagueCfgMgr:reload(tag)
    self:onLoadZhuanPanCfg(tag or "base")
    self:onLoadSceneMultipleCfg()
    self:onLoadGlobalCfg(tag or "base")
end

-- JP 参数由独立全局表驱动；配置中心推送后可直接热更新。
function FootballLeagueCfgMgr:onLoadGlobalCfg(tag, tab)
    local config = tab
    if type(config) ~= "table" and gConfigMgr then
        if tag == "high" and gConfigMgr.getHighConfig then
            config = gConfigMgr:getHighConfig("FootballLeagueGlobal")
        elseif gConfigMgr.getBaseConfig then
            config = gConfigMgr:getBaseConfig("FootballLeagueGlobal")
        end
    end

    config = config or {}
    local row = config[1] or config["1"] or {}
    self.GlobalCfg = self.GlobalCfg or {}
    self.GlobalCfg[tag or "base"] = row
end

function FootballLeagueCfgMgr:getGlobalCfg(tag)
    tag = tag or "base"
    if not self.GlobalCfg or not self.GlobalCfg[tag] then
        self:onLoadGlobalCfg(tag)
    end
    return self.GlobalCfg and self.GlobalCfg[tag] or {}
end

function FootballLeagueCfgMgr:onLoadZhuanPanCfg(tag)
    local cfgZhuanPan = nil
    if tag == "base" then
        cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    elseif tag == "high" then
        cfgZhuanPan = gConfigMgr:getHighConfig("ZhuanPan")
    end
    self:setZhuanPanProb(cfgZhuanPan, tag)
    if tag == "base" then
        self:buildRewardZhuanPanIndex(cfgZhuanPan)
    end
end

function FootballLeagueCfgMgr:getZhuanPanWeight(cfg, sceneType)
    if not cfg then
        return 0
    end
    sceneType = normalizeSceneType(sceneType)
    local field = sceneType == 1 and "Weight" or ("Weight" .. sceneType)
    return tonumber(cfg[field] or cfg.Weight) or 0
end

function FootballLeagueCfgMgr:setZhuanPanProb(cfgZhuanPan, tag)
    local probMap = {}
    for sceneType = 1, 3 do
        local ids = {}
        local weights = {}
        for id, value in ipairs(cfgZhuanPan or {}) do
            table.insert(ids, id)
            table.insert(weights, self:getZhuanPanWeight(value, sceneType))
        end
        if #ids <= 0 then
            log_error("ZhuanPan cfg is empty, tag:{0}, sceneType:{1}", tostring(tag), sceneType)
            return
        end
        probMap[sceneType] = Probability(weights, ids)
    end

    if not self.ProbZhuanPan then
        self.ProbZhuanPan = {}
    end
    if tag == "base" then
        self.ProbZhuanPan.base = probMap
    elseif tag == "high" then
        self.ProbZhuanPan.high = probMap
    end
end

function FootballLeagueCfgMgr:buildRewardZhuanPanIndex(cfgZhuanPan)
    self.RewardZhuanPanIndex = {}
    self.ValidRewardIdMap = {}
    for zhuanPanId, cfg in ipairs(cfgZhuanPan or {}) do
        local rewards = cfg and cfg.Rewards or nil
        for _, rewardId in ipairs(rewards or {}) do
            rewardId = tonumber(rewardId)
            if rewardId then
                self.ValidRewardIdMap[rewardId] = true
                if not self.RewardZhuanPanIndex[rewardId] then
                    self.RewardZhuanPanIndex[rewardId] = zhuanPanId
                end
            end
        end
    end
end

function FootballLeagueCfgMgr:isValidRewardId(rewardId)
    rewardId = tonumber(rewardId)
    if not rewardId then
        return false
    end
    if not self.ValidRewardIdMap then
        self:buildRewardZhuanPanIndex(gConfigMgr:getBaseConfig("ZhuanPan"))
    end
    return self.ValidRewardIdMap and self.ValidRewardIdMap[rewardId] == true
end

function FootballLeagueCfgMgr:onLoadSceneMultipleCfg(tab)
    local config = tab
    if type(config) ~= "table" and gConfigMgr and gConfigMgr.getBaseConfig then
        config = gConfigMgr:getBaseConfig("SceneMultiple")
    end

    self.SceneWheelMultiple = {}

    if type(config) ~= "table" or next(config) == nil then
        log_error("SceneMultiple cfg is empty")
        return
    end

    local length = 0
    for sceneType = 1, 3 do
        local row = config[sceneType] or config[tostring(sceneType)] or {}
        length = math.max(length, arrayLength(row.wheelMultiple))
    end
    if length <= 0 then
        length = 8
    end

    for sceneType = 1, 3 do
        local row = config[sceneType] or config[tostring(sceneType)] or {}
        self.SceneWheelMultiple[sceneType] = normalizeNumberArray(row.wheelMultiple, nil, length)
    end
end

function FootballLeagueCfgMgr:getSceneWheelMultiple(sceneType)
    sceneType = normalizeSceneType(sceneType)
    if not self.SceneWheelMultiple then
        self:onLoadSceneMultipleCfg()
    end

    local result = {}
    for index, multiple in ipairs(self.SceneWheelMultiple and self.SceneWheelMultiple[sceneType] or {}) do
        result[index] = multiple
    end
    return result
end

--转盘表
function FootballLeagueCfgMgr:getRandZhuanPanId(isHigh, sceneType)
    sceneType = normalizeSceneType(sceneType)
    local probabilityMap = isHigh and self.ProbZhuanPan and self.ProbZhuanPan.high or self.ProbZhuanPan and self.ProbZhuanPan.base
    local probability = probabilityMap and probabilityMap[sceneType]
    if not probability then
        log_error("ZhuanPan probability is nil:{0}, sceneType:{1}", tostring(isHigh), sceneType)
        return nil
    end
    local zhuanPanId = probability:getRandId()
    if not zhuanPanId then
        log_error("zhuanPanId is nil:{0}", tostring(isHigh))
        return nil
    end
    return zhuanPanId
end

function FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    return cfgZhuanPan and cfgZhuanPan[zhuanPanId] and cfgZhuanPan[zhuanPanId].Rewards or nil
end

--常量表
function FootballLeagueCfgMgr:getCfgConstantValue(constantKey)
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

--场景倍率表
function FootballLeagueCfgMgr:getRewardMult(rewardID, sceneType, zhuanPanId)
    sceneType = normalizeSceneType(sceneType)
    zhuanPanId = tonumber(zhuanPanId)
    if not zhuanPanId or zhuanPanId <= 0 then
        if not self.RewardZhuanPanIndex then
            self:buildRewardZhuanPanIndex(gConfigMgr:getBaseConfig("ZhuanPan"))
        end
        zhuanPanId = self.RewardZhuanPanIndex and self.RewardZhuanPanIndex[rewardID] or nil
    end

    if not self.SceneWheelMultiple then
        self:onLoadSceneMultipleCfg()
    end
    local sceneMultiple = self.SceneWheelMultiple and self.SceneWheelMultiple[sceneType]
    local multiple = sceneMultiple and zhuanPanId and sceneMultiple[zhuanPanId] or nil
    if multiple and multiple > 0 then
        return multiple
    end

    log_error("SceneMultiple multiple is nil, rewardId:{0}, sceneType:{1}, zhuanPanId:{2}", rewardID, sceneType, zhuanPanId)
    return nil
end

---
function FootballLeagueCfgMgr:getZhuanPanIndexAry()
    local tb = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan or {}) do
        table.insert(tb, value.Rewards and value.Rewards[1] or 0)
    end
    return tb
end

function FootballLeagueCfgMgr:randomZhuanpanIndex(rewardId)
    local tb = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    for id, value in ipairs(cfgZhuanPan or {}) do
        if value.Rewards and value.Rewards[1] == rewardId then
            table.insert(tb, id)    
        end
    end
    local count = #tb
    local index = gRandom:gen_between_int(1, count)
    return tb[index]
end
