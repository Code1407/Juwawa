
require "FootballLeague.FootballLeagueCfgMgr"
require "FootballLeague.RandomTestStats"

local init = false
local SCENE_NORMAL = EGameScene and EGameScene.Normal or 1
local SCENE_ADVANCED = EGameScene and EGameScene.Advanced or 2
local SCENE_MASTER = EGameScene and EGameScene.Master or 3
local betRewards = {
    [1] = 1,
    [2] = 1,
    [3] = 1,
    [4] = 1,
    [5] = 1,
    [6] = 1,
    [7] = 1,
    [8] = 1,
}

local function getSceneWin(sceneType)
    local zhuanPanId = FootballLeagueCfgMgr:getRandZhuanPanId(false, sceneType)
    local openRewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    local win = 0
    for _, id in ipairs(openRewards or {}) do
        if betRewards[id] and betRewards[id] > 0 then
            win = win + (FootballLeagueCfgMgr:getRewardMult(id, sceneType, zhuanPanId) or 0)
        end
    end
    return win / 8, zhuanPanId
end

function GenRandom(price)
    if not init then
        init = true
        FootballLeagueCfgMgr:reload("base")
        RandomTestStats:init(price)
    end

    -- 保持原 RandomTest 总返奖率为 Normal 的口径，同时并行采样其余两个场景。
    local normalWin = getSceneWin(SCENE_NORMAL)
    RandomTestStats:record(SCENE_NORMAL, normalWin * price)

    local advancedWin = getSceneWin(SCENE_ADVANCED)
    RandomTestStats:record(SCENE_ADVANCED, advancedWin * price)

    local masterWin, masterZhuanPanId = getSceneWin(SCENE_MASTER)
    local masterPayout = masterWin * price
    RandomTestStats:record(SCENE_MASTER, masterPayout)
    -- Master 的 7、8 号转盘格是 JP 格；其奖励已纳入 Master 总返奖率，并单独留痕。
    if masterZhuanPanId == 7 or masterZhuanPanId == 8 then
        RandomTestStats:recordMasterJP(masterPayout)
    end
    RandomTestStats:finishIfNeeded()

    return normalWin
end
