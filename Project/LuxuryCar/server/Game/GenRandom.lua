require "LuxuryCar.LuxuryCar"

local init = true

local LCBetAreaDisplayRates = { 2, 5, 18, 50, 88, 20, 30, 100, 66, 8 }
local LCBetAreaNames = {
    "宝马",
    "奔驰",
    "保时捷",
    "法拉利",
    "宾利",
    "迈巴赫",
    "兰博基尼",
    "布加迪",
    "劳斯莱斯",
    "玛莎拉蒂",
}

local function normalizePrice(price)
    return math.max(1, math.floor(tonumber(price) or 100))
end

local function buildHitPositionText(betIndex)
    local positions = {}
    for position, mappedBetIndex in ipairs(LCResultBetIndex or {}) do
        if mappedBetIndex == betIndex then
            table.insert(positions, string.format("%02d", position))
        end
    end
    return table.concat(positions, "-")
end

local function createSingleAreaBets(price)
    local bets = LCEmptyBets()
    local betIndex = gRandom:gen_between_int(1, 10)
    bets[betIndex] = price
    return bets, string.format(
        "ID:%02d-%s-Odds:%dx-pos:%s-Bet:%d",
        betIndex,
        LCBetAreaNames[betIndex] or "unknown",
        LCBetAreaDisplayRates[betIndex] or 0,
        buildHitPositionText(betIndex),
        price
    )
end

function GenRandom(price)
    if init then
        init = false
        LuxuryCarLoadConfig()
    end

    price = normalizePrice(price)

    local bets, tag = createSingleAreaBets(price)
    local result = LCRandomResult()
    local rewardMultiple = LCRevenue(bets, result) / price

    return rewardMultiple, tag
end
