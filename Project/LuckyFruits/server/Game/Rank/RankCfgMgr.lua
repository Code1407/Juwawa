RankCfgMgr = {}

local RANK_VALUE_FIELDS = {
    { key = "DayBonusRate", name = "DayBonusRate" },
    { key = "WeekBonusRate", name = "WeekBonusRate" },
    { key = "DayMaxBonusExchange", name = "DayMaxBonusExchange" },
    { key = "WeekMaxBonusExchange", name = "WeekMaxBonusExchange" },
    { key = "AwardRate", name = "AwardRate" },
}

local function _applyRankValueConfig(rankConfig)
    if type(rankConfig) ~= "table" or not next(rankConfig) then
        return false
    end
    for i = 1, #RANK_VALUE_FIELDS do
        local field = RANK_VALUE_FIELDS[i]
        local value = rankConfig[field.key]
        if value then
            RankCfgMgr[field.key] = value
        else
            log_error("Rank configs not found " .. field.name)
        end
    end
    return true
end

local function _loadRankSwitches()
    local projCommon = gApp:getProjCommon()
    local commonCustom = projCommon and projCommon["Custom"]
    if type(commonCustom) == "table" then
        RankCfgMgr.EnableRank = commonCustom.enableRank == true
        RankCfgMgr.EnablePlatform = commonCustom.enablePlatform == true
    else
        RankCfgMgr.EnableRank = false
        RankCfgMgr.EnablePlatform = false
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
    _loadRankSwitches()
    local serverConfig = gApp:getProjServer()
    local serverCustom = serverConfig and serverConfig["Custom"]
    local rankConfig = serverCustom and serverCustom["1"]
    _applyRankValueConfig(rankConfig)
end

function RankCfgMgr:onLoadRankCfgMgr()
    local rankCommonCfg = gConfigMgr:getBaseConfig("RankCommon")
    local rankConfig = rankCommonCfg and rankCommonCfg[1]
    if not _applyRankValueConfig(rankConfig) then
        log_error("Rank configs not found RankCommon")
    end
end
