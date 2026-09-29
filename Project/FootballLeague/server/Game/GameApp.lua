
require "GameBase.GameAppBase"
require "GameMsg"
require "PlayerMsg"
require "Rank.RankCfgMgr"
require "FootballLeague.FootballLeagueCfgMgr"

GameApp = class__(GameAppBase)

function GameApp:ctor__()
    GameAppBase.ctor__(self, GameMsg)
end

function GameApp:onLoadConfig(tag, name, tab)
    if GameAppBase.onLoadConfig then
        GameAppBase.onLoadConfig(self, tag, name, tab)
    end
    if name == "ZhuanPan" then
        FootballLeagueCfgMgr:reload(tag)
    elseif name == "SceneMultiple" then
        FootballLeagueCfgMgr:onLoadSceneMultipleCfg(tab)
    elseif name == "FootballLeagueGlobal" then
        FootballLeagueCfgMgr:onLoadGlobalCfg(tag, tab)
    elseif name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr()
    end
end

function GameApp:onProjConfig()
    FootballLeagueCfgMgr:reload("base")
    RankCfgMgr:onProjRankCfgMgr()
end

function GameApp:onClosing()
    log_info("***服务器准备停服更新***")

    if not gWorld:hasPlayer() then
        gApp:finishClosing()
        log_info("没人在线, 立即停服更新")
    end
end
