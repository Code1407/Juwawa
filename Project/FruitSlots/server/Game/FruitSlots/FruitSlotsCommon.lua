-- ============================================================
-- 水果老虎机通用常量与工具函数模块
-- 定义游戏状态、交易码、随机工具、协议编码等核心基础设施
-- ============================================================

-- 游戏名称常量
FruitSlotsConst = {
    gameName = "FruitSlots",
}

-- 游戏状态枚举
FRGameStatus = {
    stop = 0,        -- 停止
    bet = 1,         -- 下注阶段
    run = 2,         -- 运行中（旋转动画中）
    run2final = 3,   -- 运行转结算过渡
    final = 4,       -- 结算阶段
    ready = 5,       -- 就绪
    coolDown = 6,    -- 冷却中
    heartbeat = 7,   -- 心跳
    maintenance = 99998, -- 维护中
    unknow = 99999,  -- 未知状态
}

-- 交易结果码
FRTradeCode = {
    success = 0,          -- 成功
    insufficient = -1,    -- 余额不足
    missTime = -2,        -- 时间错误
    sdkDisconnect = -3,   -- SDK断开
    closeServer = -4,     -- 服务器关闭
    tokenInvalid = -5,    -- Token无效
    coolDown = -6,        -- 冷却中
    timeout = -7,         -- 超时
    fail = -8,            -- 失败
    betDone = -9,         -- 下注已完成
    betPassMax = -10,     -- 超过最大下注
    repeatOrder = -11,    -- 重复订单
    userStatusError = -12,-- 用户状态错误
    nothing = -99997,     -- 无操作
    userException = -99998,-- 用户异常
    unknow = -99999,      -- 未知
}

-- 游戏类型
FRGameType = {
    normal = 0, -- 普通游戏
    free = 1,   -- 免费游戏
}

-- 赔率类型（控制玩家输出倍率策略）
FRRateType = {
    normal = 0,   -- 正常
    water = 1,    -- 抽水（降低返还）
    kill = 2,     -- 杀率（让玩家输）
    new_user = 3, -- 新手保护
}

FR_HEARTBEAT_INTERVAL = 1000 -- 心跳间隔（毫秒）

-- ===== 通用工具函数 =====

-- 深拷贝表（递归复制）
function FRCloneTable(obj, visited)
    if type(obj) ~= "table" then
        return obj
    end
    visited = visited or {}
    if visited[obj] then
        return visited[obj]
    end
    local result = {}
    visited[obj] = result
    for key, value in pairs(obj) do
        result[FRCloneTable(key, visited)] = FRCloneTable(value, visited)
    end
    return result
end

-- 数组求和
function FRArraySum(arr)
    local sum = 0
    for _, value in ipairs(arr or {}) do
        sum = sum + (tonumber(value) or 0)
    end
    return sum
end

-- 四舍五入取整
function FRRoundInt(value)
    local num = tonumber(value) or 0
    if num >= 0 then
        return math.floor(num + 0.5)
    end
    return math.ceil(num - 0.5)
end

-- 生成[0,1)之间的随机浮点数
-- 优先使用框架的gRandom，降级使用lua原生random
function FRRandom01()
    if gRandom and gRandom.gen_float then
        return gRandom:gen_float()
    end
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(1, 1000000) / 1000000
    end
    return math.random()
end

-- 生成[min, max]范围内的随机整数
function FRRandomInt(min, max)
    min = math.floor(min or 0)
    max = math.floor(max or min)
    if max < min then
        min, max = max, min -- 确保min<=max
    end
    if gRandom and gRandom.gen_between_int then
        return gRandom:gen_between_int(min, max)
    end
    return math.random(min, max)
end

-- 按概率权重数组进行随机选择
-- probability: 权重数组
-- errorBegin/errorEnd: 权重和<=0时的兜底随机范围
-- 返回: 选中的索引（从0开始）
function FRRateRandom(probability, errorBegin, errorEnd)
    local probabilitySum = FRArraySum(probability)
    local length = probability and #probability or 0
    if probabilitySum <= 0 then
        return FRRandomInt(errorBegin or 0, errorEnd or math.max(length - 1, 0))
    end
    local rate = 0
    local randomValue = FRRandom01()
    for index, value in ipairs(probability or {}) do
        rate = rate + ((tonumber(value) or 0) / probabilitySum) -- 累加归一化权重
        if randomValue < rate then
            return index - 1 -- 返回0-based索引
        end
    end
    return FRRandomInt(errorBegin or 0, errorEnd or math.max(length - 1, 0))
end

-- 按概率权重返回0~6的结果（用于符号随机）
function FRRateRandomResult(probability)
    return FRRateRandom(probability, 0, 6)
end

-- 按概率权重返回0~(length-1)的结果
function FRRateRandomDefault(probability)
    return FRRateRandom(probability, 0, math.max((probability and #probability or 1) - 1, 0))
end

-- 检查数组中是否包含指定值
function FRListContains(arr, value)
    for _, item in ipairs(arr or {}) do
        if item == value then
            return true
        end
    end
    return false
end

-- 移除数组指定位置元素并返回该值
function FRRemoveAt(arr, index)
    local value = arr[index]
    table.remove(arr, index)
    return value
end

-- ===== 协议编码函数 =====

-- 构建账号信息
function FRBuildAccount(player)
    return {
        diamond = math.floor(player:getCoins() or 0),
        avatar = player:getAvatarUrl() or "",
        nickname = player:getName() or "",
        level = 0,
    }
end

-- 编码账号信息为协议格式
function FRProtoEncodeAccount(account)
    local data = account or {}
    return {
        diamond = math.floor(data.diamond or 0),
        avatar = tostring(data.avatar or ""),
        nickname = tostring(data.nickname or ""),
        level = FRRoundInt(data.level or 0),
    }
end

-- 编码玩家设置为协议格式
function FRProtoEncodePlayerSettings(settings)
    local data = settings or {}
    return {
        soundVol = FRRoundInt(data.soundVol or 1),
        lastBetAmountButton = FRRoundInt(data.lastBetAmountButton or 0),
        isSpeed = data.isSpeed and true or false,
    }
end

-- 编码单条中奖线结果为协议格式
function FRProtoEncodeLineSame(lineSame)
    local data = lineSame or {}
    return {
        lineNum = FRRoundInt(data.lineNum or 0),  -- 线号
        target = FRRoundInt(data.target or 0),     -- 中奖符号ID
        count = FRRoundInt(data.count or 0),       -- 连续数量
    }
end

-- 编码所有中奖线结果为协议格式
function FRProtoEncodeLineSames(lineSames)
    local result = {}
    for _, lineSame in ipairs(lineSames or {}) do
        table.insert(result, FRProtoEncodeLineSame(lineSame))
    end
    return result
end

function FRProtoEncodeHistory(history)
    local encoded = {}
    for _, item in ipairs(history or {}) do
        table.insert(encoded, {
            date = tostring(item.date or ""),
            round = FRRoundInt(item.round or 0),
            bet = math.floor(item.bet or 0),
            win = math.floor(item.win or 0),
            multiple = tonumber(item.multiple) or 0,
            gameType = FRRoundInt(item.gameType or 0),
            results = FRCloneTable(item.results or {}),
        })
    end
    return encoded
end

-- 编码Jackpot奖池为协议格式
function FRProtoEncodeJackpotPool(pool)
    local result = {}
    for key, value in pairs(pool or {}) do
        result[tostring(key)] = math.floor(value or 0)
    end
    return result
end

-- 编码结果集为协议格式
function FRProtoEncodeResults(result)
    if not result then
        return nil
    end
    return {
        betAmount = FRRoundInt(result.betAmount or 0),
        results = FRCloneTable(result.results or {}),
        lineSames = FRProtoEncodeLineSames(result.lineSames or {}),
        multiple = tonumber(result.multiple) or 0,
        multiples = FRCloneTable(result.multiples or {}),
        freeWinAmount = math.floor(result.freeWinAmount or 0),
        freeCount = FRRoundInt(result.freeCount or 0),
        jackpotAmount = math.floor(result.jackpotAmount or 0),
        jackpotAmountPool = FRProtoEncodeJackpotPool(result.jackpotAmountPool or {}),
    }
end

-- 编码进入游戏响应（返回完整游戏状态）
function FRProtoEncodeEnterGameResp(resp)
    local data = resp or {}
    return {
        account = FRProtoEncodeAccount(data.account or {}),
        jackpotAmountPool = FRProtoEncodeJackpotPool(data.jackpotAmountPool or {}),
        betAmountIndex = FRRoundInt(data.betAmountIndex or 0),
        lastResult = FRProtoEncodeResults(data.lastResult),
        playerSettings = FRProtoEncodePlayerSettings(data.playerSettings or {}),
        history = FRProtoEncodeHistory(data.history or {}),
    }
end

-- 编码下注响应
function FRProtoEncodeBetResp(resp)
    local data = resp or {}
    return {
        code = FRRoundInt(data.code or 0),
        result = FRProtoEncodeResults(data.result),
        roundId = FRRoundInt(data.roundId or 0),
    }
end

-- 编码回合步骤状态推送
function FRProtoEncodeRoundStep(roundStep)
    local data = roundStep or {}
    return {
        runningRoundID = FRRoundInt(data.runningRoundID or 0),
        status = FRRoundInt(data.status or 0),
        accountDiamond = math.floor(data.accountDiamond or 0),
        jackpotPool = FRProtoEncodeJackpotPool(data.jackpotPool or {}),
        results = FRProtoEncodeResults(data.results),
    }
end

-- 编码Jackpot中奖提示
function FRProtoEncodeHint(hint)
    local data = hint or {}
    return {
        userName = tostring(data.userName or ""),
        amount = math.floor(data.amount or 0),
    }
end

-- 编码停止回合响应
function FRProtoEncodeStopRoundResp(resp)
    local data = resp or {}
    return {
        accountDiamond = math.floor(data.accountDiamond or 0),
    }
end

-- 编码钻石变动推送
function FRProtoEncodeAccountDiamondUpdate(msg)
    local data = msg or {}
    return {
        value = math.floor(data.value or 0),
        offset = math.floor(data.offset or 0),
    }
end

-- 根据路由名称选择对应的协议编码器
-- 实现统一的协议编码分发
function FRProtoEncodeByRoute(routeName, msg)
    if routeName == "enterGame" or routeName == "synchronize" then
        return FRProtoEncodeEnterGameResp(msg)
    elseif routeName == "onResultHandler" then
        return FRProtoEncodeBetResp(msg)
    elseif routeName == "onRoundStep" then
        return FRProtoEncodeRoundStep(msg)
    elseif routeName == "onJackpotHint" then
        return FRProtoEncodeHint(msg)
    elseif routeName == "onStopRound" or routeName == "stopRound" then
        return FRProtoEncodeStopRoundResp(msg)
    elseif routeName == "onAccountDiamondUpdate" then
        return FRProtoEncodeAccountDiamondUpdate(msg)
    elseif routeName == "onMaintenance" then
        return {}
    end
    return msg
end
