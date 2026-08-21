
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

-- 优雅关服：停止接收新回合，并等待在线玩家的扣款、开奖和派彩完成。
function GameApp:onClosing()
    local sceneSystem = SvrSystem and SvrSystem.FruitSlots
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if not scene then
        log_info("FruitSlots closing: scene unavailable, finish immediately")
        return self:finishClosing()
    end

    local needSettle = scene:prepareServerClosing()
    log_info("FruitSlots closing: needSettle:{0}", needSettle and 1 or 0)
    if not needSettle then
        self:finishClosing()
    end
end

-- 保存框架原始实现；自定义 finishClosing 广播完成后必须继续调用它。
local frameworkFinishClosing = GameAppBase and GameAppBase.finishClosing

-- 清理完成后通知客户端刷新为 5 秒倒计时，再交还框架关服。
function GameApp:finishClosing()
    if self._finishClosingRequested then return end
    self._finishClosingRequested = true

    local sceneSystem = SvrSystem and SvrSystem.FruitSlots
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if scene and scene.broadcast then
        scene:broadcast("SvrNotifyMsg", {
            msgCode = 1,
            msgData = { stopSeconds = 5 },
        })
    end
    log_info("FruitSlots closing: notify clients, stop in 5 seconds")

    if frameworkFinishClosing then
        return frameworkFinishClosing(self)
    end
    log_error("FruitSlots closing: framework finishClosing unavailable")
end


