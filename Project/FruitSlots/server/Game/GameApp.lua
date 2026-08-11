
-- ============================================================
-- 游戏应用主入口模块
-- 继承自GameAppBase，负责游戏应用的初始化和配置加载
-- ============================================================

require "GameBase.GameAppBase"
require "Rank.RankCfgMgr"
require "PlayerMsg"

-- 游戏应用类，继承自框架基类
GameApp = class__(GameAppBase)

-- 构造函数
function GameApp:ctor__()
    GameAppBase.ctor__(self)
end

-- 配置加载回调：当加载到FruitSlots相关配置时触发重载
-- FruitSlotsGlobal:     全局配置
-- FruitSlotsLinePath:   中奖线路径配置
-- FruitSlotsSlotProbability: 转轮概率配置
-- FruitSlotsPaytable:   赔付表配置
-- FruitSlotsFeature:    特性配置
function GameApp:onLoadConfig(tag, name, tab)
    if GameAppBase.onLoadConfig then
        GameAppBase.onLoadConfig(self, tag, name, tab)
    end
    if name == "FruitSlotsGlobal"
        or name == "FruitSlotsLinePath"
        or name == "FruitSlotsSlotProbability"
        or name == "FruitSlotsPaytable"
        or name == "FruitSlotsFeature"
    then
        FruitSlotsLoadConfig() -- 重新加载游戏配置
    end
    if name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr(true)
    end
end

function GameApp:onProjConfig()
    RankCfgMgr:onProjRankCfgMgr()
end


