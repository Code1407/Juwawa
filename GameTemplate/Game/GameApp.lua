require "GameBase.GameAppBase"
require "GameMsg"
require "PlayerMsg"
require "Rank.RankCfgMgr"

GameApp = class__(GameAppBase)

function GameApp:ctor__()
    GameAppBase.ctor__(self)
end

function GameApp:onLoadConfig(tag, name, tab)
    if name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr()
    end
end

function GameApp:onProjConfig()
    RankCfgMgr:onProjRankCfgMgr()
end
