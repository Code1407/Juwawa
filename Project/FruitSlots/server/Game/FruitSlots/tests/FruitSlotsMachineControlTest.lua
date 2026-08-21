local nativeRequire = require
require = function(name)
    if name == "FruitSlots.FruitSlotsCommon" or name == "FruitSlots.FruitSlotsConfig" then
        return true
    end
    return nativeRequire(name)
end

function class__()
    local class = {}
    class.__index = class
    return class
end

function FRRoundInt(value)
    return math.floor((tonumber(value) or 0) + 0.5)
end

function FRCloneTable(value)
    if type(value) ~= "table" then return value end
    local clone = {}
    for key, item in pairs(value) do clone[key] = FRCloneTable(item) end
    return clone
end

function FRRandomInt(minimum)
    return minimum
end

function log_info() end

FRLineCount = 30
EAnalyType = { NoLimit = 0, PlayerWin = 1, PlayerLoss = 2 }
EGameOddsResult = { Success = 1, RerandomMax = 2, RulerMax = 3 }

dofile("server/Game/FruitSlots/FruitSlotsMachine.lua")

local function assertEqual(actual, expected, message)
    if actual ~= expected then
        error(string.format("%s: expected %s, got %s", message, tostring(expected), tostring(actual)))
    end
end

local function runCase(analy, rewards)
    local pool = { main = 10000 }
    local scene = {
        getAllJackpotPool = function() return FRCloneTable(pool) end,
        getData = function() return { jackpotAmountPool = pool } end,
    }
    local nextReward = 0
    local machine = setmetatable({ scene = scene }, { __index = FruitSlotsMachine })
    machine.generateResults = function(_, betAmount)
        nextReward = nextReward + 1
        local reward = rewards[nextReward] or rewards[#rewards]
        return {
            betAmount = betAmount,
            multiple = reward / betAmount,
            jackpotAmount = 0,
            freeWinAmount = reward,
            freeCount = 0,
        }
    end
    gAnaly = { singleAnaly = function() return analy end }
    return machine:generateControlledResults(100, false, 0, 0, {}, 744)
end

local result, _, gameResult = runCase({
    analyType = EAnalyType.NoLimit,
    rewardMax = -753499,
    rewardRateMax = 501000,
    rerandomMax = 2,
}, { 800, 400 })
assertEqual(result.multiple, 0, "negative rewardMax must force a zero reward fallback")
assertEqual(gameResult, EGameOddsResult.RulerMax, "forced fallback must report the ruler limit")

result = runCase({
    analyType = EAnalyType.NoLimit,
    rewardMax = -1,
    rewardRateMax = 501000,
    rerandomMax = 3,
}, { 800, 0, 400 })
assertEqual(result.multiple, 0, "a sampled zero reward must be selected for a negative limit")

result = runCase({
    analyType = EAnalyType.NoLimit,
    rewardMax = 0,
    rewardRateMax = 501000,
    rerandomMax = 1,
}, { 800 })
assertEqual(result.multiple, 8, "rewardMax zero must retain the unset-limit behavior")

result = runCase({
    analyType = EAnalyType.NoLimit,
    rewardMax = 500,
    rerandomMax = 2,
}, { 800, 400 })
assertEqual(result.multiple, 4, "a positive rewardMax must select an in-limit reward")

print("FruitSlotsMachine control tests passed")
