
require "GameBase.GameAppBase"
require "Rank.RankCfgMgr"
require "PlayerMsg"
require "GameMsg"

GameApp = class__(GameAppBase)

function GameApp:ctor__()
    GameAppBase.ctor__(self)
end

function GameApp:onLoadConfig(tag, name, tab)
    if GameAppBase.onLoadConfig then
        GameAppBase.onLoadConfig(self, tag, name, tab)
    end
    if name == "FortuneSlotGlobal"
        or name == "FortuneSlotLinePath"
        or name == "FortuneSlotPaytable"
        or name == "FortuneSlotRate"
    then
        FortuneSlotLoadConfig()
    end
    if name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr(true)
    end
end

function GameApp:onProjConfig()
    RankCfgMgr:onProjRankCfgMgr()
end
function GameApp:onClosing()
    local scenes=SvrSystem.FortuneSlot.getScene()
    scenes:GameOnclose()
end