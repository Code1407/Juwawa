require "GameBase.SystemBase"
require "FortuneSlot.FortuneSlotCommon"
require "FortuneSlot.FortuneSlotConfig"
require "FortuneSlot.FortuneSlotMachine"

local function defaultData()
    return {
        lastResult = nil,
        history = {},
        runningRounds = {},
        playerSettings = {
            soundVol = 1,
            lastBetAmountButton = 0,
            isSpeed = false,
        },
        browserUA = "",
    }
end

FortuneSlotPlayer = class__(SystemBase)

function FortuneSlotPlayer:ctor__(player)
    SystemBase.ctor__(self, FortuneSlotConst.gameName, player)
end

function FortuneSlotPlayer:onLoad(data)
    data = data or defaultData()
    data.history = data.history or {}
    data.runningRounds = data.runningRounds or {}
    data.playerSettings = data.playerSettings or {
        soundVol = 1,
        lastBetAmountButton = 0,
        isSpeed = false,
    }
    data.browserUA = data.browserUA or ""
    SystemBase.onLoad(self, data)
end

function FortuneSlotPlayer:onEnter()
    SystemBase.onEnter(self)
    self.scene = SvrSystem.FortuneSlot.getScene()
    self.machine = FortuneSlotMachine(self.scene, self)
    self.betRounds={}
    self.machineStatus = FOGameStatus.stop
    self.runningRoundID = 0
    self.scene:registerPlayer(self)
    self:changeMachineStatus(FOGameStatus.bet)
end

function FortuneSlotPlayer:onLeave()
    self:stopRunningRound()
    if self.scene then
        self.scene:unregisterPlayer(self:getUid())
    end
    SystemBase.onLeave(self)
end

function FortuneSlotPlayer:getUid()
    return tostring(self:getPlayer():getUid() or "")
end

function FortuneSlotPlayer:getDiamond()
    return math.floor(self:getPlayer():getCoins() or 0)
end

function FortuneSlotPlayer:getClientResp()
    local data = self:getData()
    return {
        account = FOBuildAccount(self:getPlayer()),
        playerSettings = data.playerSettings or {},
        lastResult = data.lastResult,
        history = data.history or {},
    }
end

function FortuneSlotPlayer:enterGame(msg)
    if msg and msg.ua then
        self:getData().browserUA = tostring(msg.ua)
    end
    return self:getClientResp()
end

function FortuneSlotPlayer:synchronize()
    return self:getClientResp()
end

function FortuneSlotPlayer:changeMachineStatus(machineStatus)
    self.machineStatus = machineStatus
    if machineStatus ~= FOGameStatus.run then
        self.runningRoundID = 0
    end
    self.scene:onRoundStep2Player(self:getUid(), self.runningRoundID, machineStatus, self:getDiamond())
end

function FortuneSlotPlayer:saveHistory(historyItem)
    if not historyItem then
        return
    end
    historyItem.date = tostring(app__:utc_milli_s())
    historyItem.round = self.runningRoundID or 0
    local history = self:getData().history or {}
    if #history >= 20 then
        table.remove(history, 1)
    end
    table.insert(history, historyItem)
    self:getData().history = history
end

function FortuneSlotPlayer:notifyBetFailure(code)
    self.scene:onResultHandler(self:getUid(), {
        code = code or FOTradeCode.fail,
        result = nil,
        roundId = 0,
    })
end

function FortuneSlotPlayer:betOrder(roundId, betAmount,calculateAmount, isExtra)
    if self.scene:isStop() then
        self.scene:onResultHandler(self:getUid(), {
            code = FOTradeCode.insufficient,
            result = nil,
            roundId = GenDayIncrId(roundId),
        })
        return log_error("FortuneSlotPlayer:betOrder  self.scene:isStop()")
    end
    betAmount = math.floor(betAmount or 0)
    if betAmount <= 0 then
        self.scene:onResultHandler(self:getUid(), {
            code = FOTradeCode.insufficient,
            result = nil,
            roundId = GenDayIncrId(roundId),
        })
        return log_error("FortuneSlotPlayer:betOrder  betAmount <= 0")
    end
    if not self:getPlayer():coinsEnough(betAmount) then
        self.scene:onResultHandler(self:getUid(), {
            code = FOTradeCode.insufficient,
            result = nil,
            roundId = GenDayIncrId(roundId),
        })
        return log_error("FortuneSlotPlayer:betOrder  self:getPlayer():coinsEnough(betAmount)")
    end
    self.betRounds[roundId]=betAmount
    self:getPlayer():subCoins(roundId, 0, betAmount,function (errorCode,orderid,backPlayer)
        if (errorCode == 0 and backPlayer) then
            local rankPSys = backPlayer:getSystem("RankPSystem")
            if rankPSys then
                rankPSys:updateRankList(betAmount)
            end
        end
        if not backPlayer then
            return log_error("self.player:subCoins backPlayer")
        end
        local FortuneeMain = backPlayer:getSystem("FortuneSlot")
        if not FortuneeMain then
           return  log_error("subCoins找不到玩家系统模块【FortuneSlot】")
        end
        local result = nil
        local oddsType=0
        local gameresult=0
        FortuneeMain.scene:onAccountDiamondUpdate(FortuneeMain:getUid(), { value = FortuneeMain:getDiamond() })
        if errorCode == FOTradeCode.success then
            FortuneeMain.runningRoundID = GenDayIncrId(roundId)
            result,oddsType,gameresult = FortuneeMain.machine:getResults(betAmount, calculateAmount, isExtra and true or false,FortuneeMain.player,roundId)
            FortuneeMain:runRound(roundId, FOGameType.normal, result,oddsType,gameresult)
        else
            if errorCode~=-12 then
                errorCode=-3
            end
        end
        FortuneeMain.scene:onResultHandler(FortuneeMain:getUid(), {
            code = errorCode,
            result = result,
            roundId = GenDayIncrId(roundId),
        })
    end)

    return FOTradeCode.success
end

function FortuneSlotPlayer:winOrder(roundId, winAmount, oddsType, callback)
    if self.scene:isStop() then
        return FOTradeCode.closeServer
    end
    winAmount = math.floor(winAmount or 0)
    if winAmount <= 0 then
        if callback then
            callback(FOTradeCode.nothing, nil, self:getPlayer())
        end
        return FOTradeCode.nothing
    end
    self:getPlayer():addCoins(roundId, oddsType, 2, winAmount, function(code, addOrderID, backPlayer)
        if callback then
            callback(code, addOrderID, backPlayer)
        end
    end)
    return FOTradeCode.success
end

function FortuneSlotPlayer:startRound(roundId, runningRound)
    self:getData().runningRounds[roundId] = runningRound
end

function FortuneSlotPlayer:endRound(roundId)
    if self.scene:isStop() then
        return nil
    end
    if not roundId or roundId == 0 then
        return nil
    end
    local runningRounds = self:getData().runningRounds or {}
    local roundCurrent = runningRounds[roundId]
    if roundCurrent == nil then
        return nil
    end
    runningRounds[roundId] = nil
    return roundCurrent
end

function FortuneSlotPlayer:settleResult(roundId)
    local runningRound = self:endRound(roundId)
    self.scene:GameOnclose()
    if not runningRound then
        return
    end
    local winAmount = runningRound.revenue2user or 0
    if winAmount <= 0 then
        self.scene:onAccountDiamondUpdate(self:getUid(), {
            value = self:getDiamond(),
            offset = 0,
        })
        gAnaly:singleCommitAnaly(self.player, 0,roundId,runningRound.gameresult)
        self.player:statisGameRound(roundId,  self.betRounds[roundId], 0)
        return
    end
    self:winOrder(roundId, winAmount, runningRound.oddsType, function(code, addOrderID, backPlayer)
        local player = backPlayer or self:getPlayer()

        if not backPlayer then
            return log_error("self.player:subCoins backPlayer")
        end
        local FortuneeMain = backPlayer:getSystem("FortuneSlot")
        if not FortuneeMain then
           return  log_error("subCoins找不到玩家系统模块【FortuneSlot】")
        end

        FortuneeMain.scene:onAccountDiamondUpdate(FortuneeMain:getUid(), {
            value = math.floor((player and player:getCoins()) or FortuneeMain:getDiamond() or 0),
            offset = winAmount,
        })
        if code~=0 then
            log_info("当前self:winOrder回调异常"..tostring(code))
            if backPlayer then
                gAnaly:singleCommitAnaly(player, 0,roundId,runningRound.gameresult)
                backPlayer:statisGameRound(roundId,  FortuneeMain.betRounds[roundId], 0)
                if code~=-12 then
                    code=-3
                end
                FortuneeMain:notifyBetFailure(code)
            end
        else
            gAnaly:singleCommitAnaly(player, winAmount,roundId,runningRound.gameresult)
            backPlayer:statisGameRound(roundId,  FortuneeMain.betRounds[roundId], winAmount)
        end
    end)
end

function FortuneSlotPlayer:stopRunningRound()
    local runningRounds = self:getData().runningRounds or {}
    local roundIds = {}
    for roundId, _ in pairs(runningRounds) do
        table.insert(roundIds, roundId)
    end
    table.sort(roundIds)
    for _, roundId in ipairs(roundIds) do
        self:settleResult(roundId)
    end
end

function FortuneSlotPlayer:incrTodayRoundID()
    local data = self:getData()
    local time = os.time()
    if data.NewGameTime==nil then
        data.NewGameTime=time
    end
    if isSameDay(time, data.NewGameTime) then
        data.todayRoundId=0
    end
    data.todayRoundId = (data.todayRoundId or 0) + 1
    data.todayserverID=GenUnionIncrId(data.todayRoundId)
    data.NewGameTime  = time
    return data.todayserverID
    
end
-- 判断两个时间戳是否是同一天
function isSameDay(time1, time2)
    local d1 = os.date("%Y%m%d", time1)
    local d2 = os.date("%Y%m%d", time2)
    return d1 ~= d2
end

function FortuneSlotPlayer:betNormal(betAmount, calculateAmount, isExtra)
    if self.scene:isStop() or self.machineStatus ~= FOGameStatus.bet then
        self:notifyBetFailure(FOTradeCode.fail)
        return { code = FOTradeCode.fail }
    end

    local data = self:getData()
    if next(data.runningRounds or {}) ~= nil then
        self:stopRunningRound()
    end

    local roundId = self:incrTodayRoundID()
    local linesBetAmount = FORoundInt(betAmount or 0)
    self:betOrder(roundId, linesBetAmount,calculateAmount, isExtra)
end

function FortuneSlotPlayer:betFree()
    self:notifyBetFailure(FOTradeCode.fail)
    return { code = FOTradeCode.fail }
end

function FortuneSlotPlayer:stopRound(round)
    local roundId=GenUnionIncrId(round)
    self:changeMachineStatus(FOGameStatus.final)
    local lastResult = FOCloneTable(self:getData().lastResult or {})
    local predictWinAmount = FORoundInt((lastResult.calculateAmount or 0) * (lastResult.multiple or 0))
    self:settleResult(roundId)
    self:changeMachineStatus(FOGameStatus.bet)
    local resp = {
        accountDiamond = self:getDiamond() + math.max(predictWinAmount, 0),
        history = self:getData().history or {},
    }
    self.scene:onStopRound(self:getUid(), resp)
    return resp
end

function FortuneSlotPlayer:runRound(roundId, gameType, result,oddsType,gameresult)
    self:changeMachineStatus(FOGameStatus.run)
    local data = self:getData()
    data.lastResult = result
    local revenue = 0
    if gameType == FOGameType.normal then
        revenue = FORoundInt((result.calculateAmount or 0) * (result.multiple or 0))
    end
    self:startRound(roundId, {
        gameType = gameType,
        revenue2user = revenue,
        oddsType = oddsType,
        gameresult=gameresult
    })
end

function FortuneSlotPlayer:setBetAmountButton(betAmountButtonIndex)
    local settings = self:getData().playerSettings or {}
    settings.lastBetAmountButton = betAmountButtonIndex or 0
    self:getData().playerSettings = settings
    return { code = 0 }
end

function FortuneSlotPlayer:updateSettings(config)
    local data = self:getData()
    local current = data.playerSettings or {}
    local isSpeed = current.isSpeed and true or false
    if config and config.isSpeed ~= nil then
        isSpeed = config.isSpeed and true or false
    end
    data.playerSettings = {
        soundVol = config and config.soundVol or current.soundVol or 1,
        lastBetAmountButton = config and config.lastBetAmountButton or current.lastBetAmountButton or 0,
        isSpeed = isSpeed,
    }
    return { code = 0 }
end

function FortuneSlotPlayer:test(betAmount, calculateAmount, isExtra)
    self.machine:test(betAmount, calculateAmount, isExtra)
    return { code = 0 }
end
function FortuneSlotPlayer:GameOnclose()
    local runningRounds = self:getData().runningRounds or {}
    for roundId, runningRound in pairs(runningRounds) do
        return false
    end
    return true
end