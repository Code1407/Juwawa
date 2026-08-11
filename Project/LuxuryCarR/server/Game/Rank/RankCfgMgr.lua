RankCfgMgr = {}

local RANK_VALUE_FIELDS = {
    { key = "DayBonusRate", name = "DayBonusRate" },
    { key = "WeekBonusRate", name = "WeekBonusRate" },
    { key = "DayMaxBonusExchange", name = "DayMaxBonusExchange" },
    { key = "WeekMaxBonusExchange", name = "WeekMaxBonusExchange" },
    { key = "AwardRate", name = "AwardRate" },
}

local function applyBoolSwitch(value)
    if value == true or value == 1 or value == "1" then return true end
    return false
end

local function applyRankValueConfig(rankConfig)
    if type(rankConfig) ~= "table" or not next(rankConfig) then
        return false
    end
    for i = 1, #RANK_VALUE_FIELDS do
        local field = RANK_VALUE_FIELDS[i]
        local value = rankConfig[field.key]
        if value ~= nil then
            RankCfgMgr[field.key] = value
        else
            log_error("Rank configs not found " .. field.name)
        end
    end
    return true
end

local function applyRankSwitchConfig(rankConfig)
    if type(rankConfig) ~= "table" then
        return
    end
    if rankConfig.RankSwitch ~= nil then
        RankCfgMgr.EnableRank = applyBoolSwitch(rankConfig.RankSwitch)
    end
    if rankConfig.PlatformSwitch ~= nil then
        RankCfgMgr.EnablePlatform = applyBoolSwitch(rankConfig.PlatformSwitch)
    end
end

local function loadRankSwitches()
    local projCommon = gApp:getProjCommon()
    local commonCustom = projCommon and projCommon["Custom"]
    if type(commonCustom) == "table" then
        if commonCustom.enableRank ~= nil then
            RankCfgMgr.EnableRank = commonCustom.enableRank == true
        end
        if commonCustom.enablePlatform ~= nil then
            RankCfgMgr.EnablePlatform = commonCustom.enablePlatform == true
        end
    end
end

function RankCfgMgr:isRankOpen()
    return self.EnableRank == true
end

function RankCfgMgr:isPlatformOpen()
    return self.EnablePlatform == true
end

function RankCfgMgr:isRankConfigReady()
    return self:isRankOpen()
        and self.AwardRate
        and self.DayBonusRate
        and self.WeekBonusRate
end

function RankCfgMgr:onProjRankCfgMgr()
    loadRankSwitches()
    local serverConfig = gApp:getProjServer()
    local serverCustom = serverConfig and serverConfig["Custom"]
    local rankConfig = serverCustom and serverCustom["1"]
    applyRankSwitchConfig(rankConfig)
    applyRankValueConfig(rankConfig)
end

function RankCfgMgr:onLoadRankCfgMgr()
    local rankCommonCfg = gConfigMgr:getBaseConfig("RankCommon")
    local rankConfig = rankCommonCfg and rankCommonCfg[1]
    applyRankSwitchConfig(rankConfig)
    if not applyRankValueConfig(rankConfig) then
        log_error("Rank configs not found RankCommon")
    end
end
