-- ============================================================
-- 水果老虎机玩家系统模块
-- 继承自SystemBase，管理单个玩家的：游戏数据持久化、
-- 下注/赢取流程、回合生命周期、Jackpot触发、机器状态等
-- ============================================================

require "GameBase.SystemBase"
require "FruitSlots.FruitSlotsCommon"
require "FruitSlots.FruitSlotsConfig"
require "FruitSlots.FruitSlotsMachine"

-- 玩家默认数据结构
local function defaultData()
    return {
        jackpot = {
            rate = FRCloneTable(FRJackpotRateDefault), -- Jackpot投放频率配置
            dict = {}, -- 按下注金额分组的Jackpot轮次数据
        },
        lastBetAmountButton = 0,
        lastResult = nil,     -- 上次游戏结果快照
        runningRounds = {},   -- 当前进行中的回合
        pendingBets = {},     -- 已发起扣款、等待平台回调的订单
        balance = {
            betDetail = {},   -- 下注统计数据
        },
        playerSettings = {
            soundVol = 1,
            lastBetAmountButton = 0,
            isSpeed = false,
        },
        browserUA = "",
        history = {},
        todayRoundId = 0,
        newGameTime = 0,
    }
end

FruitSlotsPlayer = class__(SystemBase)

-- 构造函数：注册为FruitSlots系统的玩家组件
function FruitSlotsPlayer:ctor__(player)
    SystemBase.ctor__(self, FruitSlotsConst.gameName, player)
end

-- 玩家数据加载：补全缺失字段的默认值
function FruitSlotsPlayer:onLoad(data)
    data = data or defaultData()
    data.jackpot = data.jackpot or { rate = FRCloneTable(FRJackpotRateDefault), dict = {} }
    data.jackpot.rate = data.jackpot.rate or FRCloneTable(FRJackpotRateDefault)
    data.jackpot.dict = data.jackpot.dict or {}
    data.runningRounds = data.runningRounds or {}
    data.pendingBets = data.pendingBets or {}
    for pendingRoundId, _ in pairs(data.pendingBets) do
        if data.runningRounds[tostring(pendingRoundId)] then
            data.pendingBets[pendingRoundId] = nil
        end
    end
    -- 进程重启后不存在仍在执行的异步回调，持久化的settling必须允许重试。
    for _, runningRound in pairs(data.runningRounds) do
        if type(runningRound) == "table" and runningRound.state == "settling" then
            runningRound.state = "payout_failed"
        elseif type(runningRound) == "table" and runningRound.state == "generating_result" then
            runningRound.state = "result_failed"
        end
    end
    data.balance = data.balance or { betDetail = {} }
    data.balance.betDetail = data.balance.betDetail or {}
    data.playerSettings = data.playerSettings or { soundVol = 1, lastBetAmountButton = 0, isSpeed = false }
    data.browserUA = data.browserUA or ""
    data.history = data.history or {}
    data.todayRoundId = data.todayRoundId or 0
    data.newGameTime = data.newGameTime or 0
    if data.lastBetAmountButton == nil then
        data.lastBetAmountButton = data.playerSettings.lastBetAmountButton or 0
    end
    SystemBase.onLoad(self, data)
end

-- 玩家进入：初始化场景引用、机器实例，注册到场景
function FruitSlotsPlayer:onEnter()
    SystemBase.onEnter(self)
    self.scene = SvrSystem.FruitSlots.getScene()
    self.machine = FruitSlotsMachine(self.scene, self) -- 创建计算引擎
    self.machineStatus = FRGameStatus.stop
    self.runningRoundID = 0
    self.runningResults = nil
    self.pendingBet = nil
    self.scene:registerPlayer(self)
    -- A persisted pending debit belongs to an older process. Its asynchronous
    -- callback cannot still be running after a restart, so keep it for
    -- reconciliation but do not use it as a permanent player lock.
    for pendingRoundId, pending in pairs(self:getDataSafe().pendingBets or {}) do
        if type(pending) == "table" then
            pending.state = "unknown"
        end
        log_error("FruitSlots unresolved debit retained without blocking player, uid:{0}, roundId:{1}",
            self:getUid(), pendingRoundId)
    end
    if next(self:getDataSafe().runningRounds or {}) ~= nil then
        self.machineStatus = FRGameStatus.final
        self:stopRunningRound()
    end
    if next(self:getDataSafe().runningRounds or {}) == nil then
        self:changeMachineStatus(FRGameStatus.bet)
    else
        self:changeMachineStatus(FRGameStatus.final)
    end
    if self.scene:isStop() then
        self:prepareServerClosing()
    end
end

-- 玩家离开：结算所有运行中回合，取消注册
function FruitSlotsPlayer:onLeave()
    self:stopRunningRound()
    if self.scene then
        self.scene:unregisterPlayer(self:getUid())
    end
    self.machine = nil
    SystemBase.onLeave(self)
end

-- 获取玩家UID
function FruitSlotsPlayer:getUid()
    return tostring(self:getPlayer():getUid() or self:getPlayer():getPid() or "")
end

-- 获取玩家钻石数量
function FruitSlotsPlayer:getDiamond()
    return math.floor(self:getPlayer():getCoins() or 0)
end

-- 安全获取玩家数据（自动补全默认值）
function FruitSlotsPlayer:getDataSafe()
    local data = self:getData()
    if not data then
        data = defaultData()
    end
    data.jackpot = data.jackpot or { rate = FRCloneTable(FRJackpotRateDefault), dict = {} }
    data.jackpot.rate = data.jackpot.rate or FRCloneTable(FRJackpotRateDefault)
    data.jackpot.dict = data.jackpot.dict or {}
    data.runningRounds = data.runningRounds or {}
    data.pendingBets = data.pendingBets or {}
    data.balance = data.balance or { betDetail = {} }
    data.balance.betDetail = data.balance.betDetail or {}
    data.playerSettings = data.playerSettings or { soundVol = 1, lastBetAmountButton = 0, isSpeed = false }
    data.history = data.history or {}
    return data
end

-- 免费次数属于触发它的普通局；次数耗尽且最终派彩完成后，整局才算结束。
function FruitSlotsPlayer:hasPendingFreeRounds()
    local lastResult = self:getDataSafe().lastResult
    return type(lastResult) == "table" and (tonumber(lastResult.freeCount) or 0) > 0
end

-- 是否还有必须在关服前完成的扣款回调、运行中回合或免费次数。
function FruitSlotsPlayer:hasUnsettledRounds()
    return self.pendingBet ~= nil or
        next(self:getDataSafe().runningRounds or {}) ~= nil or
        self:hasPendingFreeRounds()
end

function FruitSlotsPlayer:prepareServerClosing()
    -- 不在这里强制结算正在展示的回合。客户端会按正常流程 stopRound，
    -- 免费次数之间仍可继续调用 betFree；普通付费下注由 betNormal 拒绝。
    if not self:hasUnsettledRounds() then
        self.machineStatus = FRGameStatus.maintenance
        self.runningRoundID = 0
        self.runningResults = nil
    end
end

-- 构建返回给客户端的完整游戏状态
function FruitSlotsPlayer:getClientResp()
    local data = self:getDataSafe()
    return {
        account = FRBuildAccount(self:getPlayer()),
        jackpotAmountPool = self.scene:getAllJackpotPool(),
        betAmountIndex = data.lastBetAmountButton or data.playerSettings.lastBetAmountButton or 0,
        lastResult = data.lastResult,
        playerSettings = data.playerSettings or {},
        history = data.history or {},
    }
end

function FruitSlotsPlayer:saveHistory(result, roundId, gameType)
    if not result then return end
    local data = self:getDataSafe()
    local history = data.history or {}
    if #history >= 20 then table.remove(history, 1) end
    table.insert(history, {
        date = tostring(app__:utc_milli_s()),
        round = roundId or 0,
        bet = FRRoundInt((result.betAmount or 0) * FRLineCount),
        win = FRRoundInt((result.betAmount or 0) * (result.multiple or 0)) + FRRoundInt(result.jackpotAmount or 0),
        multiple = result.multiple or 0,
        gameType = gameType or FRGameType.normal,
        results = FRCloneTable(result.slotResults or {}),
    })
    data.history = history
end

function FruitSlotsPlayer:incrTodayRoundID()
    local data = self:getDataSafe()
    local now = app__:time_s()
    local old = tonumber(data.newGameTime) or 0
    if old <= 0 or os.date("%Y%m%d", old) ~= os.date("%Y%m%d", now) then
        data.todayRoundId = 0
    end
    data.newGameTime = now
    repeat
        data.todayRoundId = (data.todayRoundId or 0) + 1
    until data.pendingBets[tostring(data.todayRoundId)] == nil and
          data.runningRounds[tostring(data.todayRoundId)] == nil
    return data.todayRoundId
end

-- 进入游戏消息处理（同步浏览器UA信息）
function FruitSlotsPlayer:enterGame(msg)
    if msg and msg.ua then
        self:getDataSafe().browserUA = tostring(msg.ua)
    end
    return self:getClientResp()
end

-- 同步游戏状态（断线重连等场景）
function FruitSlotsPlayer:synchronize()
    return self:getClientResp()
end

-- 切换机器状态并通知场景推送状态变化
function FruitSlotsPlayer:changeMachineStatus(machineStatus, results)
    self.machineStatus = machineStatus
    self.runningResults = results
    if machineStatus ~= FRGameStatus.run then
        self.runningRoundID = 0
    end
    self.scene:onRoundStep2Player(self:getUid(), self.runningRoundID, machineStatus, self:getDiamond(), results)
end

-- 获取指定下注按钮的统计数据（懒初始化）
function FruitSlotsPlayer:getBetDetail(button)
    local data = self:getDataSafe()
    local key = tostring(button or 0)
    data.balance.betDetail[key] = data.balance.betDetail[key] or {
        betCount = 0,
        betTotal = 0,
        revenueTotal = 0,
        sp = {
            nBigwin = 0,
            nJackpot = 0,
            nFree = 0,
        },
    }
    local detail = data.balance.betDetail[key]
    detail.sp = detail.sp or { nBigwin = 0, nJackpot = 0, nFree = 0 }
    return detail
end

-- 记录一次下注统计
function FruitSlotsPlayer:incrBetCount(button, betAmount, revenue)
    local detail = self:getBetDetail(button)
    detail.betCount = (detail.betCount or 0) + 1
    detail.betTotal = (detail.betTotal or 0) + (betAmount or 0)
    detail.revenueTotal = (detail.revenueTotal or 0) + (revenue or 0)
    return detail
end

-- 下注订单：扣减金币
function FruitSlotsPlayer:betOrder(roundId, betAmount, callback)
    if self.scene:isStop() then
        return FRTradeCode.closeServer
    end
    betAmount = FRRoundInt(betAmount or 0)
    if betAmount <= 0 then
        return FRTradeCode.nothing
    end
    if self:getDiamond() < betAmount then
        return FRTradeCode.insufficient
    end
    self:getPlayer():subCoins(roundId, self.machine and self.machine:getLastRoundRateType() or 0, betAmount,
        function(code, _orderId, backPlayer)
            local system = backPlayer and backPlayer:getSystem("FruitSlots") or self
            if code == FRTradeCode.success then
                local rankSys = backPlayer and backPlayer:getSystem("RankPSystem") or nil
                if rankSys then rankSys:updateRankList(betAmount) end
                if callback then callback(code, _orderId, backPlayer, system) end
                return
            end
            local resultCode = code
            if resultCode ~= -12 then resultCode = FRTradeCode.fail end
            if callback then
                callback(resultCode, _orderId, backPlayer, system)
            else
                system:notifyBetFailure(resultCode)
            end
        end)
    return FRTradeCode.success
end

-- 获胜订单：发放奖励金币（异步回调）
function FruitSlotsPlayer:winOrder(roundId, winAmount, oddsType, callback)
    winAmount = FRRoundInt(winAmount or 0)
    if winAmount <= 0 then
        if callback then
            callback(FRTradeCode.nothing, nil, self:getPlayer())
        end
        return FRTradeCode.nothing
    end
    self:getPlayer():addCoins(roundId, oddsType or 0, ECoinsOperateType.WinAdd, winAmount, function(code, addOrderID, backPlayer)
        if callback then
            callback(code, addOrderID, backPlayer)
        end
    end)
    return FRTradeCode.success
end

-- 记录一个正在运行的回合
function FruitSlotsPlayer:startRound(roundId, runningRound)
    self:getDataSafe().runningRounds[tostring(roundId)] = runningRound
end

-- 结束一个回合：从runningRounds中取出回合数据
function FruitSlotsPlayer:endRound(roundId)
    if not roundId or roundId == 0 then
        return nil
    end
    local runningRounds = self:getDataSafe().runningRounds or {}
    local key = tostring(roundId)
    local roundCurrent = runningRounds[key]
    if roundCurrent == nil then
        return nil
    end
    runningRounds[key] = nil
    return roundCurrent
end

-- 结算所有运行中的回合
function FruitSlotsPlayer:stopRunningRound()
    local runningRounds = self:getDataSafe().runningRounds or {}
    local roundIds = {}
    for roundId, _ in pairs(runningRounds) do
        table.insert(roundIds, tonumber(roundId) or 0)
    end
    table.sort(roundIds)
    for _, roundId in ipairs(roundIds) do
        local runningRound = runningRounds[tostring(roundId)]
        if runningRound and (runningRound.state == "paid_pending_result" or runningRound.state == "result_failed") then
            self:completePaidBet(roundId, runningRound.betAmount, runningRound.roundBet)
        else
            self:settleResult(roundId)
        end
    end
end

-- 递增Jackpot计数并检查是否命中投放周期
-- 返回当前周期内的累计下注次数
function FruitSlotsPlayer:incrJackpotCount(betAmount)
    local data = self:getDataSafe()
    local jackpotRate = FRCloneTable(FRJackpotRateDefault)
    if not jackpotRate.min or not jackpotRate.max then
        jackpotRate = { min = 2, max = 2 }
    end

    -- 如果投放频率变化，重置投放记录
    if jackpotRate.min ~= data.jackpot.rate.min or jackpotRate.max ~= data.jackpot.rate.max then
        data.jackpot.dict = {}
    end
    data.jackpot.rate = FRCloneTable(jackpotRate)

    local key = tostring(betAmount or 0)
    data.jackpot.dict[key] = data.jackpot.dict[key] or { betRound = 0, jackpotRound = {} }
    local jackpotItem = data.jackpot.dict[key]
    jackpotItem.betRound = (jackpotItem.betRound or 0) + 1
    local betRound = jackpotItem.betRound

    -- 每个JackpotPeriod周期重新随机投放计划
    if betRound % FRJackpotPeriod == 1 then
        jackpotItem.jackpotRound = {}
        local jackpotCount = FRRandomInt(jackpotRate.min, jackpotRate.max)
        local guard = 0
        -- 在周期内随机分布jackpotCount个投放点
        while #jackpotItem.jackpotRound < jackpotCount and guard < jackpotCount * 20 do
            guard = guard + 1
            local round = FRRandomInt(FRNewUserRoundDefault * 3, FRJackpotPeriod)
            if not FRListContains(jackpotItem.jackpotRound, round) then
                table.insert(jackpotItem.jackpotRound, round)
            end
        end
        table.sort(jackpotItem.jackpotRound)
    end

    return betRound
end

-- 通知客户端下注失败
function FruitSlotsPlayer:notifyBetFailure(code)
    self.scene:onResultHandler(self:getUid(), {
        code = code or FRTradeCode.fail,
        result = nil,
        roundId = 0,
    })
end

-- 扣款已经成功后的结果生成阶段。先持久化paid_pending_result，再生成盘面；
-- 任意异常都会回滚本阶段对玩家数据和Jackpot的修改，并保留回合供重试。
function FruitSlotsPlayer:completePaidBet(roundId, betAmount, linesBetAmount)
    local data = self:getDataSafe()
    local key = tostring(roundId)
    local paidRound = data.runningRounds[key]
    if not paidRound then
        paidRound = {
            state = "paid_pending_result",
            betAmount = betAmount,
            roundBet = linesBetAmount,
        }
        data.runningRounds[key] = paidRound
    end
    if paidRound.state ~= "paid_pending_result" and paidRound.state ~= "result_failed" then
        return false
    end

    paidRound.state = "generating_result"
    local poolBefore = FRCloneTable(self.scene:getAllJackpotPool())
    local jackpotBefore = FRCloneTable(data.jackpot)
    local lastResultBefore = FRCloneTable(data.lastResult)
    local ok, err = xpcall(function()
        if data.lastResult then
            data.lastResult.freeWinAmount = 0
            data.lastResult.freeCount = 0
        end
        local jackpotCount = self:incrJackpotCount(betAmount)
        local jackpotItem = data.jackpot.dict[tostring(betAmount)] or { jackpotRound = {} }
        local jackpotRound = jackpotItem.jackpotRound or {}
        local jackpot = false
        if #jackpotRound > 0 and jackpotCount >= jackpotRound[1] then
            table.remove(jackpotRound, 1)
            jackpot = true
        end
        local result, oddsType, gameResult = self.machine:generateControlledResults(
            betAmount, jackpot, 0, 0, self:getPlayer(), roundId)
        if type(result) ~= "table" then error("generateControlledResults returned nil") end
        result.freeWinAmount = 0
        self.runningRoundID = roundId
        self:runRound(roundId, FRGameType.normal, result, oddsType, gameResult, linesBetAmount)
        self.scene:onResultHandler(self:getUid(), {
            code = FRTradeCode.success, result = result, roundId = roundId,
        })
    end, function(message)
        return debug and debug.traceback and debug.traceback(tostring(message), 2) or tostring(message)
    end)

    if not ok then
        self.scene:getData().jackpotAmountPool = poolBefore
        data.jackpot = jackpotBefore
        data.lastResult = lastResultBefore
        data.runningRounds[key] = paidRound
        paidRound.state = "result_failed"
        self.runningRoundID = 0
        self:changeMachineStatus(FRGameStatus.final)
        log_error("FruitSlots paid bet result generation failed, roundId:{0}, error:{1}", roundId, tostring(err))
        self:notifyBetFailure(FRTradeCode.fail)
        self.scene:tryFinishServerClosing()
        return false
    end
    if self.scene:isClosing() then
        self.scene:tryFinishServerClosing()
    end
    return true
end

-- 普通下注流程：扣款 -> 生成单控结果 -> 启动回合
function FruitSlotsPlayer:betNormal(betAmount)
    if self.scene:isStop() then
        self:notifyBetFailure(FRTradeCode.closeServer)
        return { code = FRTradeCode.closeServer, result = nil, roundId = 0 }
    end
    if self.machineStatus ~= FRGameStatus.bet then
        self:notifyBetFailure(FRTradeCode.fail)
        return { code = FRTradeCode.fail, result = nil, roundId = 0 }
    end

    local data = self:getDataSafe()
    -- 仅此进程的内存请求才构成有效的借记锁定。
    -- 持久化的未知订单将保留以进行对账，且不得
    -- 永久阻止玩家开始一个具有唯一密钥的新回合。
    if self.pendingBet ~= nil then
        self:notifyBetFailure(FRTradeCode.fail)
        return { code = FRTradeCode.fail, result = nil, roundId = 0 }
    end
    -- 先结算上一个未完成的回合
    if next(data.runningRounds or {}) ~= nil then
        self:stopRunningRound()
        if next(data.runningRounds or {}) ~= nil then
            self:notifyBetFailure(FRTradeCode.fail)
            return { code = FRTradeCode.fail, result = nil, roundId = 0 }
        end
    end

    -- 清除上次残存的免费游戏状态
    betAmount = FRRoundInt(betAmount or 0)
    if not FruitSlotsIsValidBetAmount(betAmount) then
        self:notifyBetFailure(FRTradeCode.fail)
        return { code = FRTradeCode.fail, result = nil, roundId = 0 }
    end
    local linesBetAmount = betAmount * FRLineCount -- 总下注 = 单线下注 x 线数
    local roundId = self:incrTodayRoundID()
    data.pendingBets[tostring(roundId)] = {
        state = "subtracting",
        betAmount = betAmount,
        roundBet = linesBetAmount,
        createdAt = app__:utc_milli_s(),
    }
    self.pendingBet = { roundId = roundId, betAmount = betAmount, linesBetAmount = linesBetAmount }
    self:changeMachineStatus(FRGameStatus.ready)
    local code = self:betOrder(roundId, linesBetAmount, function(payCode, _orderId, backPlayer, system)
        local systemData = system and system:getDataSafe() or nil
        local persistedPending = systemData and systemData.pendingBets[tostring(roundId)] or nil
        if not system or not persistedPending then
            log_error("FruitSlots bet callback ignored, pending bet not found, roundId:{0}", roundId)
            if system and system.pendingBet and system.pendingBet.roundId == roundId then
                system.pendingBet = nil
                system.scene:tryFinishServerClosing()
            end
            return
        end
        system.pendingBet = nil
        if payCode ~= FRTradeCode.success then
            systemData.pendingBets[tostring(roundId)] = nil
            system:changeMachineStatus(FRGameStatus.bet)
            system:notifyBetFailure(payCode)
            system.scene:tryFinishServerClosing()
            return
        end
        system.scene:onAccountDiamondUpdate(system:getUid(), { value = system:getDiamond(), offset = -linesBetAmount })
        system:startRound(roundId, {
            state = "paid_pending_result",
            betAmount = betAmount,
            roundBet = linesBetAmount,
        })
        systemData.pendingBets[tostring(roundId)] = nil
        system:completePaidBet(roundId, betAmount, linesBetAmount)
    end)
    if code ~= FRTradeCode.success then
        data.pendingBets[tostring(roundId)] = nil
        self.pendingBet = nil
        self:changeMachineStatus(FRGameStatus.bet)
        self.scene:tryFinishServerClosing()
    end

    return {
        code = code,
        result = nil,
        roundId = roundId,
    }
end

-- 免费游戏下注：不扣款，使用上次的结果配置，生成免费旋转结果
function FruitSlotsPlayer:betFree()
    -- 优雅关服只允许消费本局已经获得的免费次数，不能开启新的付费局。
    local canFinishFreeMode = self.scene:isClosing() and self:hasPendingFreeRounds()
    if self.scene:isStop() and not canFinishFreeMode then
        self:notifyBetFailure(FRTradeCode.closeServer)
        return { code = FRTradeCode.closeServer, result = nil, roundId = 0 }
    end
    if self.machineStatus ~= FRGameStatus.bet then
        self:notifyBetFailure(FRTradeCode.fail)
        return { code = FRTradeCode.fail, result = nil, roundId = 0 }
    end

    local data = self:getDataSafe()
    if not data.lastResult then
        return { code = FRTradeCode.success, result = nil, roundId = 0 }
    end

    -- 读取上次结果中的免费游戏参数
    local freeCount = data.lastResult.freeCount or 0
    local betAmount = data.lastResult.betAmount or 0
    if freeCount <= 0 or betAmount <= 0 then
        return { code = FRTradeCode.success, result = nil, roundId = 0 }
    end

    if next(data.runningRounds or {}) ~= nil then
        self:stopRunningRound()
        if next(data.runningRounds or {}) ~= nil then
            self:notifyBetFailure(FRTradeCode.fail)
            return { code = FRTradeCode.fail, result = nil, roundId = 0 }
        end
    end

    local freeWinAmount = data.lastResult.freeWinAmount or 0
    local roundId = self:incrTodayRoundID()
    local result, oddsType, gameResult = self.machine:generateControlledResults(betAmount, false, freeWinAmount, freeCount, self:getPlayer(), roundId)
    self.runningRoundID = roundId
    self:runRound(roundId, FRGameType.free, result, oddsType, gameResult, 0)

    return {
        code = FRTradeCode.success,
        result = result,
        roundId = roundId,
    }
end

-- 停止回合：切换到结算状态 -> 结算 -> 切回可下注状态
function FruitSlotsPlayer:stopRound(roundId)
    local runningRound = self:getDataSafe().runningRounds[tostring(roundId or 0)]
    if not runningRound then
        return { accountDiamond = self:getDiamond() }
    end
    self:changeMachineStatus(FRGameStatus.final)
    local predictAccountDiamond = self:getDiamond() + math.max(0, tonumber(runningRound.revenue2user) or 0)
    self:settleResult(roundId) -- 实际结算
    if (runningRound.revenue2user or 0) <= 0 or runningRound.state == "settled" then
        self:changeMachineStatus(FRGameStatus.bet)
    end
    local resp = {
        accountDiamond = predictAccountDiamond,
    }
    self.scene:onStopRound(self:getUid(), resp)
    return resp
end

-- 回合结算：发放赢取金额，提交单控分析
function FruitSlotsPlayer:settleResult(roundId)
    local rounds = self:getDataSafe().runningRounds or {}
    local key = tostring(roundId or 0)
    local result = rounds[key]
    if not result then
        log_error("FruitSlots settleResult failed, running round not found, roundId:{0}", roundId)
        return
    end
    local winAmount = result.revenue2user or 0
    if winAmount <= 0 then
        result.state = "settled"
        rounds[key] = nil
        -- 无赢取：只提交统计数据
        local player = self:getPlayer()
        self.scene:onAccountDiamondUpdate(self:getUid(), {
            value = self:getDiamond(),
            offset = 0,
        })
        if gAnaly and gAnaly.singleCommitAnaly then
            pcall(gAnaly.singleCommitAnaly, gAnaly, player, 0, roundId, result.gameResult or EGameOddsResult.Success)
        end
        if player and player.statisGameRound then
            player:statisGameRound(roundId, result.roundBet or 0, 0)
        end
        self.scene:tryFinishServerClosing()
        return
    end

    if result.state == "settling" or result.state == "settled" then
        return
    end
    result.state = "settling"

    -- 调用平台层发放奖励（异步）
    self:winOrder(roundId, winAmount, result.oddsType, function(code, addOrderID, backPlayer)
        local system = backPlayer and backPlayer:getSystem("FruitSlots") or self
        local player = backPlayer or system:getPlayer()
        local success = code == FRTradeCode.success
        system.scene:onAccountDiamondUpdate(system:getUid(), {
            value = math.floor((player and player:getCoins()) or system:getDiamond() or 0),
            offset = success and winAmount or 0,
        })
        local committed = success and winAmount or 0
        if success then
            result.state = "settled"
            system:getDataSafe().runningRounds[key] = nil
            system:changeMachineStatus(FRGameStatus.bet)
            system.scene:onStopRound(system:getUid(), { accountDiamond = system:getDiamond() })
        else
            result.state = "payout_failed"
            system:changeMachineStatus(FRGameStatus.bet)
            log_error("FruitSlots payout failed, retained for retry, roundId:{0}, code:{1}", roundId, code)
            system.scene:onStopRound(system:getUid(), { accountDiamond = system:getDiamond() })
        end
        -- 失败回合会保留并重试，只有成功后才提交一次最终统计。
        if success then
            if gAnaly and gAnaly.singleCommitAnaly then
                pcall(gAnaly.singleCommitAnaly, gAnaly, player, committed, roundId, result.gameResult or EGameOddsResult.Success)
            end
            if player and player.statisGameRound then
                player:statisGameRound(roundId, result.roundBet or 0, committed)
            end
        end
        system.scene:tryFinishServerClosing()
    end)
end

-- 启动一个游戏回合：记录回合数据、更新统计、处理特殊事件通知
-- gameType: FRGameType.normal或FRGameType.free
-- result:   生成的游戏结果
function FruitSlotsPlayer:runRound(roundId, gameType, result, oddsType, gameResult, roundBet)
    self:changeMachineStatus(FRGameStatus.run, result) -- 切换到运行状态
    local data = self:getDataSafe()
    data.lastResult = result
    self:saveHistory(result, roundId, gameType)

    local revenue = FRRoundInt((result.betAmount or 0) * (result.multiple or 0)) + FRRoundInt(result.jackpotAmount or 0)
    local revenue2user = 0
    if gameType == FRGameType.normal then
        revenue2user = revenue
    elseif gameType == FRGameType.free and (result.freeCount or 0) == 0 then
        revenue2user = result.freeWinAmount or 0 -- 免费游戏结束才结算
    end

    self:startRound(roundId, {
        gameType = gameType,
        revenue2user = revenue2user,
        jackpotAmount = result.jackpotAmount or 0,
        jackpotReserved = result.jackpotAmount or 0,
        betAmount = result.betAmount or 0,
        state = "running",
        oddsType = oddsType or 0,
        gameResult = gameResult or EGameOddsResult.Success,
        roundBet = roundBet or 0,
    })

    -- 更新统计
    local roundBet = gameType == FRGameType.normal and ((result.betAmount or 0) * FRLineCount) or 0
    local detail = self:incrBetCount(result.betAmount, roundBet, revenue)
    -- 大赢标记
    if (result.multiple or 0) >= FRBigWinMultiple then
        detail.sp.nBigwin = (detail.sp.nBigwin or 0) + 1
    end
    -- Jackpot中奖广播
    if (result.jackpotAmount or 0) > 0 then
        detail.sp.nJackpot = (detail.sp.nJackpot or 0) + 1
        self.scene:onJackpotHint({
            userName = self:getPlayer():getName() or "",
            amount = result.jackpotAmount,
        })
    end
    -- 免费游戏完成标记
    if gameType == FRGameType.free and (result.freeCount or 0) == 0 then
        detail.sp.nFree = (detail.sp.nFree or 0) + 1
    end
end

-- 设置下注按钮索引
function FruitSlotsPlayer:setBetAmountButton(betAmountButtonIndex)
    local data = self:getDataSafe()
    data.lastBetAmountButton = betAmountButtonIndex or 0
    data.playerSettings = data.playerSettings or {}
    data.playerSettings.lastBetAmountButton = betAmountButtonIndex or 0
    return { code = FRTradeCode.success }
end

-- 更新玩家设置（音量、加速等）
function FruitSlotsPlayer:updateSettings(config)
    local data = self:getDataSafe()
    local current = data.playerSettings or {}
    local isSpeed = current.isSpeed and true or false
    if config and config.isSpeed ~= nil then
        isSpeed = config.isSpeed and true or false
    end
    local soundVol = current.soundVol
    if soundVol == nil then soundVol = 1 end
    if config and config.soundVol ~= nil then soundVol = config.soundVol end
    soundVol = math.max(0, math.min(1, tonumber(soundVol) or 1))
    soundVol = math.floor(soundVol * 100 + 0.5) / 100

    local lastBetAmountButton = current.lastBetAmountButton
    if lastBetAmountButton == nil then lastBetAmountButton = data.lastBetAmountButton or 0 end
    if config and config.lastBetAmountButton ~= nil then
        lastBetAmountButton = config.lastBetAmountButton
    end
    lastBetAmountButton = math.floor(tonumber(lastBetAmountButton) or 0)
    local maxIndex = math.max(#FruitSlotsGetBetAmounts() - 1, 0)
    lastBetAmountButton = math.max(0, math.min(lastBetAmountButton, maxIndex))

    data.playerSettings = {
        soundVol = soundVol,
        lastBetAmountButton = lastBetAmountButton,
        isSpeed = isSpeed,
    }
    data.lastBetAmountButton = data.playerSettings.lastBetAmountButton
    return { code = FRTradeCode.success }
end
