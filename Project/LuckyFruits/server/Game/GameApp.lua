-- ============================================================
-- GameApp 模块：游戏应用根对象
-- 继承自 GameAppBase，作为游戏服的核心应用对象。
-- 职责：
--   1. 加载业务模块（PlayerMsg/GameMsg/RankCfgMgr/LuckyFruitsConfig）
--   2. 配置加载分发：根据配置表名称路由到对应模块的加载函数
--   3. 优雅关服：通过场景系统判断是否需要等待当前回合结算
-- ============================================================

require "GameBase.GameAppBase"
require "PlayerMsg"
require "GameMsg"
require "Rank.RankCfgMgr"
require "LuckyFruits.LuckyFruitsConfig"

GameApp = class__(GameAppBase)

-- 构造函数：委托基类完成初始化
function GameApp:ctor__() GameAppBase.ctor__(self) end

-- 配置加载回调：根据配置表名分发到对应模块
-- name为配置表名称，tab为配置表数据
function GameApp:onLoadConfig(tag, name, tab)
    if GameAppBase.onLoadConfig then GameAppBase.onLoadConfig(self, tag, name, tab) end
    -- LuckyFruits核心配置：加载开奖概率、转盘倍率等
    if name == "LuckyFruitsCore" then LuckyFruitsLoadConfig(tab) end
    -- 排行榜配置：加载奖励比例、开关等
    if name == "RankCommon" then RankCfgMgr:onLoadRankCfgMgr(true) end
end

-- 项目公共配置加载完成回调：触发各模块的项目级配置加载
function GameApp:onProjConfig()
    LuckyFruitsLoadConfig()
    RankCfgMgr:onProjRankCfgMgr()
end

-- 关服回调：判断当前回合是否需要等待结算
-- 若场景无需等待结算（无进行中回合），直接完成关服
function GameApp:onClosing()
    local sceneSystem = SvrSystem and SvrSystem[LuckyFruitsConst.gameName]
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if not scene then
        log_info("LuckyFruits closing: scene unavailable, finish immediately")
        return self:finishClosing()
    end
    local needSettle = scene:prepareServerClosing()
    log_info("LuckyFruits closing: needSettle:{0}", needSettle and 1 or 0)
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

    local sceneSystem = SvrSystem and SvrSystem[LuckyFruitsConst.gameName]
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if scene and scene.broadcast then
        scene:broadcast("SvrNotifyMsg", {
            msgCode = 1,
            msgData = { stopSeconds = 5 },
        })
    end
    log_info("LuckyFruits closing: notify clients, stop in 5 seconds")

    if frameworkFinishClosing then
        return frameworkFinishClosing(self)
    end
    log_error("LuckyFruits closing: framework finishClosing unavailable")
end
