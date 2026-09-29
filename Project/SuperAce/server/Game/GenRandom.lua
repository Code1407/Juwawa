-- SuperAce RandomTest 入口。
-- 直接复用正式服务器的随机、连消和免费游戏逻辑，避免测试口径与线上偏离。
local SuperAceMachine = require "SuperAce.SuperAceMachine"

local machine = nil

local function round(value)
    return math.floor(value + 0.5)
end

local function normalizePrice(price)
    return math.max(1, math.floor(tonumber(price) or 100))
end

-- RandomTest 要求返回“派彩 / 付费局下注”的倍率。
-- 一次付费局触发的所有免费局（包括免费局再触发）都归入该次下注的返奖。
function GenRandom(price)
    if not machine then
        machine = SuperAceMachine()
    end

    price = normalizePrice(price)
    local mainResult, freeResults = machine:getResults(price, price, nil)
    local totalReward = round(mainResult.calculateAmount * mainResult.multiple)

    for _, freeResult in ipairs(freeResults or {}) do
        totalReward = totalReward + round(freeResult.calculateAmount * freeResult.multiple)
    end

    local resultType = #(freeResults or {}) > 0 and "free" or "normal"
    return totalReward / price, resultType
end
