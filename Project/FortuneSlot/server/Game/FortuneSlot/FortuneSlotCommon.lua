FortuneSlotConst = {
    gameName = "FortuneSlot",
}

FOGameStatus = {
    stop = 0,
    bet = 1,
    run = 2,
    run2final = 3,
    final = 4,
    ready = 5,
    coolDown = 6,
    heartbeat = 7,
    maintenance = 99998,
    unknow = 99999,
}

FOTradeCode = {
    success = 0,
    insufficient = -1,
    missTime = -2,
    sdkDisconnect = -3,
    closeServer = -4,
    tokenInvalid = -5,
    coolDown = -6,
    timeout = -7,
    fail = -8,
    betDone = -9,
    betPassMax = -10,
    repeatOrder = -11,
    userStatusError = -12,
    nothing = -99997,
    userException = -99998,
    unknow = -99999,
}

FOGameType = {
    normal = 0,
    free = 1,
}

FORateType = {
    normal = 0,
    water = 1,
    kill = 2,
}

FO_HEARTBEAT_INTERVAL = 1000

function FOCloneTable(obj)
    if type(obj) ~= "table" then
        return obj
    end
    local result = {}
    for key, value in pairs(obj) do
        result[key] = FOCloneTable(value)
    end
    return result
end

function FOArraySum(arr)
    local sum = 0
    for _, value in ipairs(arr or {}) do
        sum = sum + (tonumber(value) or 0)
    end
    return sum
end

function FORoundInt(value)
    local num = tonumber(value) or 0
    if num >= 0 then
        return math.floor(num + 0.5)
    end
    return math.ceil(num - 0.5)
end

function FOToSafeNumber(value, defaultValue)
    local num = tonumber(value)
    if num == nil then
        return defaultValue or 0
    end
    return num
end

function FORandom01()
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(1,1000)/1000
    end
    return math.random()
end

function FORandomInt(min, max)
    min = math.floor(min or 0)
    max = math.floor(max or min)
    if max < min then
        min, max = max, min
    end
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(min, max)
    end
    return math.random(min, max)
end

function FORateRandom(probability, errorBegin, errorEnd)
    local probabilitySum = FOArraySum(probability)
    local length = probability and #probability or 0
    if probabilitySum <= 0 then
        return FORandomInt(errorBegin or 0, errorEnd or math.max(length - 1, 0))
    end
    local rate = 0
    local randomValue = FORandom01()
    for index, value in ipairs(probability or {}) do
        rate = rate + ((tonumber(value) or 0) / probabilitySum)
        if randomValue < rate then
            return index - 1
        end
    end
    return FORandomInt(errorBegin or 0, errorEnd or math.max(length - 1, 0))
end

function FOBuildAccount(player)
    return {
        diamond = math.floor(player:getCoins() or 0),
        avatar = player:getAvatarUrl() or "",
        nickname = player:getName() or "",
        level = 0,
    }
end

function FOProtoEncodePlayerSettings(settings)
    local data = settings or {}
    return {
        soundVol = FORoundInt(data.soundVol or 1),
        lastBetAmountButton = FORoundInt(data.lastBetAmountButton or 0),
        isSpeed = data.isSpeed and true or false,
    }
end

function FOProtoEncodeAccount(account)
    local data = account or {}
    return {
        diamond = math.floor(data.diamond or 0),
        avatar = data.avatar or "",
        nickname = data.nickname or "",
        level = FORoundInt(data.level or 0),
    }
end

function FOProtoEncodeHistoryItem(item)
    local data = item or {}
    return {
        date = tostring(data.date or ""),
        round = FORoundInt(data.round or 0),
        betAmount = FORoundInt(data.betAmount or 0),
        lines = FOCloneTable(data.lines or {}),
        goods = FOCloneTable(data.goods or {}),
        win = FORoundInt(data.win or 0),
        wheelMultiple = FORoundInt(data.wheelMultiple or 0),
        isExtra = data.isExtra and true or false,
    }
end

function FOProtoEncodeHistoryArray(history)
    local result = {}
    for _, item in ipairs(history or {}) do
        table.insert(result, FOProtoEncodeHistoryItem(item))
    end
    return result
end

function FOProtoEncodeResults(result)
    local data = result or {}
    return {
        betAmount = FORoundInt(data.betAmount or 0),
        calculateAmount = FORoundInt(data.calculateAmount or 0),
        slotResults = FOCloneTable(data.slotResults or {}),
        multiple = tonumber(data.multiple) or 0,
        multiples = FOCloneTable(data.multiples or {}),
        wheelMultipleIndex = FORoundInt(data.wheelMultipleIndex or -1),
        wheelExtraIndex = FORoundInt(data.wheelExtraIndex or -1),
    }
end

function FOProtoEncodeEnterGameResp(resp)
    local data = resp or {}
    return {
        account = FOProtoEncodeAccount(data.account or {}),
        playerSettings = FOProtoEncodePlayerSettings(data.playerSettings or {}),
        lastResult = FOProtoEncodeResults(data.lastResult),
        history = FOProtoEncodeHistoryArray(data.history or {}),
    }
end

function FOProtoEncodeBetResp(resp)
    local data = resp or {}
    return {
        code = FORoundInt(data.code or 0),
        result = FOProtoEncodeResults(data.result),
        roundId = FORoundInt(data.roundId or 0),
    }
end

function FOProtoEncodeRoundStep(roundStep)
    local data = roundStep or {}
    return {
        runningRoundID = FORoundInt(data.runningRoundID or 0),
        status = FORoundInt(data.status or 0),
        accountDiamond = math.floor(data.accountDiamond or 0),
    }
end

function FOProtoEncodeHint(hint)
    local data = hint or {}
    return {
        userName = tostring(data.userName or ""),
        amount = math.floor(data.amount or 0),
    }
end

function FOProtoEncodeAccountDiamondUpdate(msg)
    local data = msg or {}
    return {
        value = math.floor(data.value or 0),
        offset = math.floor(data.offset or 0),
    }
end

function FOProtoEncodeStopRoundResp(resp)
    local data = resp or {}
    return {
        accountDiamond = math.floor(data.accountDiamond or 0),
        history = FOProtoEncodeHistoryArray(data.history or {}),
    }
end

function FOProtoEncodeByRoute(routeName, msg)
    if routeName == "enterGame" or routeName == "synchronize" then
        return FOProtoEncodeEnterGameResp(msg)
    elseif routeName == "onResultHandler" then
        return FOProtoEncodeBetResp(msg)
    elseif routeName == "onRoundStep" then
        return FOProtoEncodeRoundStep(msg)
    elseif routeName == "onJackpotHint" then
        return FOProtoEncodeHint(msg)
    elseif routeName == "onAccountDiamondUpdate" then
        return FOProtoEncodeAccountDiamondUpdate(msg)
    elseif routeName == "onStopRound" then
        return FOProtoEncodeStopRoundResp(msg)
    elseif routeName == "onMaintenance" then
        return {}
    elseif routeName == "stopRound" then
        return FOProtoEncodeStopRoundResp(msg)
    end
    return msg
end
