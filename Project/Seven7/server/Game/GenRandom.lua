
require "Seven7CfgMgr"

local betRewards = {
    [1] = 1,
    [2] = 1,
    [3] = 1
}

local cfgReward = gConfigMgr:getBaseConfig("Reward")
local init = false

function GenRandom(price)
    if not init then
        init = true
        Seven7CfgMgr:onLoadZhuanPanCfg("base")
        Seven7CfgMgr:onLoadJackpotCfg("base")
    end

    local result = {
        zhuanPanId = nil,
        rewardId = nil,
        jpId = nil,
        jpRewards = nil,
    }
    local zhuanPanId, rewardId = Seven7CfgMgr:getRandInfo(false)
    result.zhuanPanId = zhuanPanId
    result.rewardId = rewardId
    if Seven7CfgMgr:checkRewardIs77(rewardId) then
        local jpId, jpRewards = Seven7CfgMgr:getRandJackpotInfo(false)
        result.jpId = jpId
        result.jpRewards = jpRewards
    end 

    local openRewards = {}
    table.insert(openRewards, rewardId)
    if result.jpRewards then
        for _, id in ipairs(result.jpRewards) do
            table.insert(openRewards, id)
        end
    end

    local win = 0
    for _, id in ipairs(openRewards) do
        if betRewards[id] and betRewards[id] > 0 then
            win = win + cfgReward[id].Multiple
        end
    end

    --log_info("押注总金额:{0} 总盈利:{1}",betTotal, win)
    return win / 3
end