require "LuxuryCarR.LuxuryCarR"

local init = true

local LCBetAreaDisplayRates = { 100, 5, 8, 2, 50, 30, 20, 18, 88, 66 }
local LCBetAreaNames = {
    "布加迪",
    "奔驰",
    "大众",
    "宝马",
    "法拉利",
    "兰博基尼",
    "路虎",
    "保时捷",
    "宾利",
    "揽胜",
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
        LuxuryCarRLoadConfig()
    end

    price = normalizePrice(price)

    local bets, tag = createSingleAreaBets(price)
    local result = LCRandomResult()
    local rewardMultiple = LCRevenue(bets, result) / price

    return rewardMultiple, tag
end
