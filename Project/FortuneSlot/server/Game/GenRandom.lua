require "FortuneSlot.FortuneSlotConfig"

local init=true
local gameRate={}
local gameTemp1=nil
local gameTemp2=nil

function GenRandom(price)
    if init then
        init=false
        FortuneSlotLoadConfig()
        gameRate = FortuneSlotDefaultGameRate()
        gameTemp1=FOCloneTable(gameRate.slot)
        gameTemp2=FOCloneTable(gameRate.slotExtra)
    end
    local grandExtra=gRandom:gen_between_int(0,1)
    local stirng="当前为普通模式"
    local isExtra=grandExtra==1
    local slot = (isExtra and gameRate.slotExtra) or gameRate.slot
    local result=generateResults(1, 1, slot, isExtra)
    if isExtra then
        result=result/1.5
        stirng="当前为疯狂模式"
    end
    return result,stirng
end

function generateResults(betAmount, calculateAmount, slot, isExtra)
    local slotResults = {}
    local probability ={}
    probability=isExtra and gameTemp2 or gameTemp1
    for index = 1, 12 do
        local itemResult = FORateRandom(probability[((index - 1) % 4) + 1], 0, #(probability[((index - 1) % 4) + 1] or {}) - 1)
        table.insert(slotResults, itemResult)
    end

    local multipleResult = calculateMultiple(slotResults, betAmount, calculateAmount, isExtra)
    local wheelMultiple = multipleResult.wheelMultipleIndex < 0 and 0 or (tonumber(FOWheelMultiples[multipleResult.wheelMultipleIndex + 1]) or 0)
    local wheelExtraMultiple = multipleResult.wheelExtraIndex < 0 and 1 or (tonumber(FOWheelExtraMultiples[multipleResult.wheelExtraIndex + 1]) or 1)
    local specialIndex = (slotResults[8] or 0) + 1
    local specialMultiple = tonumber(FOSpecialMultiples[specialIndex]) or 1

    local lineMultipleSum = 0
    for _, lineMultiple in ipairs(multipleResult.multiples or {}) do
        lineMultipleSum = lineMultipleSum + (tonumber(lineMultiple) or 0)
    end

    local multiple = lineMultipleSum * specialMultiple + wheelMultiple * wheelExtraMultiple

    return multiple or 0
end

function calculateMultiple(results, betAmount, calculateAmount, isExtra)
    local multiples = {}
    for lineIndex, connectPaths in ipairs(FOConnectIndexs) do
        local target = results[(connectPaths[1] or 0) + 1]
        local count = 1
        for pathIndex = 2, #connectPaths do
            local resultIndex = (connectPaths[pathIndex] or 0) + 1
            if target == 7 then
                target = results[resultIndex]
            end
            if results[resultIndex] == target or results[resultIndex] == 7 then
                count = count + 1
            end
            if count == 3 then
                table.insert(multiples, FOGoodsMultiples[(target or 0) + 1] or 0)
            end
        end
    end

    local wheelSymbol = results[8] or 0
    return {
        multiples = multiples,
        specialWheel = FOSpecialMultiples[wheelSymbol + 1] or 1,
        wheelMultipleIndex = wheelSymbol == 6 and FORateRandom(gameRate.wheelRate, 0, #(gameRate.wheelRate or {}) - 1) or -1,
        wheelExtraIndex = isExtra and FORateRandom(gameRate.wheelExtraRate, 0, #(gameRate.wheelExtraRate or {}) - 1) or -1,
    }
end