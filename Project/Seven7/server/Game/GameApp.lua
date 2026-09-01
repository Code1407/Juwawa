
require "GameBase.GameAppBase"
require "PlayerMsg"
require "GameMsg"
require "Seven7CfgMgr"
require "Rank.RankCfgMgr"

GameApp = class__(GameAppBase)

function GameApp:ctor__()
    GameAppBase.ctor__(self)
end

function GameApp:onLoadConfig(tag, name, tab)
    if name == "ZhuanPan" then
        Seven7CfgMgr:onLoadZhuanPanCfg(tag)
    elseif name == "Jackpot" then
        Seven7CfgMgr:onLoadJackpotCfg(tag)
    elseif name == "Constant" then
        Seven7CfgMgr:onLoadConstantCfg(tag)
    elseif name == "RankCommon" then
        RankCfgMgr:onLoadRankCfgMgr()
    end
end

function GameApp:onProjConfig()
    RankCfgMgr:onProjRankCfgMgr()
end

function GameApp:onClosing()
    log_info("***服务器准备停服更新***")

    if not gWorld:hasPlayer() then
        gApp:finishClosing()
        log_info("没人在线, 立即停服更新")
    end
end