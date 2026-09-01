-- ============================================================
-- RankCfgMgr 模块：排行榜配置管理器
-- 负责加载与缓存排行榜相关配置，包括：
--   1. 奖励数值配置：日/周榜奖金倍率、最大兑换上限、奖励分配比例
--   2. 开关配置：排行榜总开关、平台排行榜开关
-- 配置来源：项目公共配置(projCommon.Custom)、服务器配置(projServer.Custom)、
--          基础配置表(RankCommon)，按优先级依次加载覆盖。
-- 加载结果存储在 RankCfgMgr 自身字段上，供 RankCommon/RankPSystem 查询。
-- ============================================================

RankCfgMgr = {}

-- 排行榜数值配置字段定义：从配置表读取这些字段并存入RankCfgMgr
local RANK_VALUE_FIELDS = {
    { key = "DayBonusRate", name = "DayBonusRate" },              -- 日榜奖金倍率
    { key = "WeekBonusRate", name = "WeekBonusRate" },            -- 周榜奖金倍率
    { key = "DayMaxBonusExchange", name = "DayMaxBonusExchange" },-- 日榜最大奖金兑换上限
    { key = "WeekMaxBonusExchange", name = "WeekMaxBonusExchange" },-- 周榜最大奖金兑换上限
    { key = "AwardRate", name = "AwardRate" },                    -- 奖励分配比例（前N名占比）
}

-- 布尔开关解析：将多种形式的真值统一转为boolean
-- 支持 true / 1 / "1" 三种形式，其他均视为false
local function applyBoolSwitch(value)
    if value == true or value == 1 or value == "1" then return true end
    return false
end

-- 应用排行榜数值配置：从rankConfig读取各字段并存入RankCfgMgr
-- 返回false表示配置无效或为空，调用方可记录日志
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

-- 应用排行榜开关配置：解析RankSwitch与PlatformSwitch
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

-- 从项目公共配置加载开关：projCommon.Custom.enableRank/enablePlatform
-- 项目级配置优先级最高，可覆盖服务器级配置
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

-- 排行榜功能是否开启：EnableRank为true时可用
function RankCfgMgr:isRankOpen()
    return self.EnableRank == true
end

-- 平台排行榜是否开启：EnablePlatform为true时使用跨服排行榜
function RankCfgMgr:isPlatformOpen()
    return self.EnablePlatform == true
end

-- 排行榜配置是否就绪：开关开启且所有数值字段已加载
-- 用于判断是否可以执行结算与奖励发放
function RankCfgMgr:isRankConfigReady()
    return self:isRankOpen()
        and self.AwardRate
        and self.DayBonusRate
        and self.WeekBonusRate
end

-- 项目级配置加载：从projCommon与projServer加载开关与数值配置
-- 加载顺序：先加载projCommon开关，再加载projServer数值配置
function RankCfgMgr:onProjRankCfgMgr()
    loadRankSwitches()
    local serverConfig = gApp:getProjServer()
    local serverCustom = serverConfig and serverConfig["Custom"]
    local rankConfig = serverCustom and serverCustom["1"]
    applyRankSwitchConfig(rankConfig)
    applyRankValueConfig(rankConfig)
end

-- 基础配置加载：从gConfigMgr.getBaseConfig("RankCommon")加载配置
-- 通常在GameApp.onLoadConfig中配置表加载时触发
function RankCfgMgr:onLoadRankCfgMgr()
    local rankCommonCfg = gConfigMgr:getBaseConfig("RankCommon")
    local rankConfig = rankCommonCfg and rankCommonCfg[1]
    applyRankSwitchConfig(rankConfig)
    if not applyRankValueConfig(rankConfig) then
        log_error("Rank configs not found RankCommon")
    end
end
