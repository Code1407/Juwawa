require "GameBase.GameAppBase"
require "GameMsg"
require "PlayerMsg"
require "Rank.RankCfgMgr"

GameApp = class__(GameAppBase)

function GameApp:ctor__()
    GameAppBase.ctor__(self)
    self.roundIdGen = nil
    self._finishClosingRequested = false
end

function GameApp:genRoundId()
    if not self.roundIdGen then
        self.roundIdGen = PureCore.SnowIDGen(self:getServerId())
    end
    return self.roundIdGen:gen_id()
end

function GameApp:onLoadConfig(tag, name, tab)
    if name == "SuperAceGlobal"
        or name == "SuperAceRate"
        or name == "SuperAcePaytable"
    then
        SuperAceLoadConfig()
    end
    if name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr()
    end
end

function GameApp:onProjConfig()
    RankCfgMgr:onProjRankCfgMgr()
end

-- 优雅关服：拒绝新付费局，等待已扣款回合、免费局和派彩回调完成。
function GameApp:onClosing()
    local sceneSystem = SvrSystem and SvrSystem.SuperAce
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if not scene then
        log_info("SuperAce closing: scene unavailable, finish immediately")
        return self:finishClosing()
    end

    local needSettle = scene:prepareServerClosing()
    log_info("SuperAce closing: needSettle:{}", needSettle and 1 or 0)
    if not needSettle then
        self:finishClosing()
    end
end

local frameworkFinishClosing = GameAppBase and GameAppBase.finishClosing

-- 清理完成时把框架的 50 秒提示刷新为 5 秒，再调用框架原始接口。
function GameApp:finishClosing()
    if self._finishClosingRequested then return end
    self._finishClosingRequested = true

    local sceneSystem = SvrSystem and SvrSystem.SuperAce
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if scene and scene.broadcast then
        scene:broadcast("SvrNotifyMsg", {
            msgCode = 1,
            msgData = {stopSeconds = 5}
        })
    end
    log_info("SuperAce closing: notify clients, stop in 5 seconds")

    if frameworkFinishClosing then
        return frameworkFinishClosing(self)
    end
    log_error("SuperAce closing: framework finishClosing unavailable")
end
