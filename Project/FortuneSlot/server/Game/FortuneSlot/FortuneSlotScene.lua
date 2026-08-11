require "GameBase.SvrSystemBase"
require "FortuneSlot.FortuneSlotCommon"
require "FortuneSlot.FortuneSlotConfig"

FortuneSlotScene = class__(SvrSystemBase)

function FortuneSlotScene:ctor__()
    SvrSystemBase.ctor__(self, FortuneSlotConst.gameName)
    self.playerList = {}
    self.gameRates = {}
    self.gameRateDefault = FortuneSlotDefaultGameRate()
    self.gameStatus = FOGameStatus.bet
    self.heartbeatTimerId = 0
end

function FortuneSlotScene:onLoad(data)
    data = data or {}
    data.todayRoundId = data.todayRoundId or 0
    data.todayDate = data.todayDate or os.date("%Y-%m-%d")
    SvrSystemBase.onLoad(self, data)
    self.todayDate = self:getData().todayDate
    self:initHeartbeat()
end

function FortuneSlotScene:onClose()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
        self.heartbeatTimerId = 0
    end
    SvrSystemBase.onClose(self)
end

function FortuneSlotScene:initHeartbeat()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
    end
    self.heartbeatTimerId = gTimer:addTimer(FO_HEARTBEAT_INTERVAL, FO_HEARTBEAT_INTERVAL, -1, function()
        self:onHeartbeat()
    end)
end

function FortuneSlotScene:getScene()
    return self
end

function FortuneSlotScene:isStop()
    return self.gameStatus == FOGameStatus.stop
end

function FortuneSlotScene:gameStart()
    self.gameStatus = FOGameStatus.bet
end

function FortuneSlotScene:gameStop()
    self.gameStatus = FOGameStatus.stop
end

function FortuneSlotScene:registerPlayer(playerSys)
    self.playerList[playerSys:getUid()] = playerSys
end

function FortuneSlotScene:unregisterPlayer(uid)
    self.playerList[uid] = nil
end

function FortuneSlotScene:getPlayer(uid)
    return self.playerList[uid]
end

function FortuneSlotScene:todayRound()
    return self:getData().todayRoundId or 0
end


function FortuneSlotScene:sendToUid(routeName, uid, msg)
    local playerSys = self.playerList[uid]
    if not playerSys then
        return
    end
    local player = playerSys:getPlayer()
    local sender = Router.Client[routeName]
    if player and sender then
        sender(FOProtoEncodeByRoute(routeName, msg), player)
    end
end

function FortuneSlotScene:onHeartbeat()
    local todayKey = os.date("%Y-%m-%d")
    if todayKey ~= self.todayDate then
        self.todayDate = todayKey
        local data = self:getData()
        data.todayDate = todayKey
        data.todayRoundId = 0
    end
    self:onRoundStep({
        runningRoundID = 0,
        status = FOGameStatus.heartbeat,
        accountDiamond = 0,
    })
end

function FortuneSlotScene:onRoundStep2Player(uid, runningRoundID, status, accountDiamond)
    self:sendToUid("onRoundStep", uid, {
        runningRoundID = runningRoundID,
        status = status,
        accountDiamond = accountDiamond,
    })
end

function FortuneSlotScene:onRoundStep(roundStep)
    for uid, playerSys in pairs(self.playerList) do
        self:sendToUid("onRoundStep", uid, {
            runningRoundID = playerSys.runningRoundID or 0,
            status = playerSys.machineStatus or FOGameStatus.stop,
            accountDiamond = playerSys:getDiamond(),
        })
    end
end

function FortuneSlotScene:onResultHandler(uid, resp)
    self:sendToUid("onResultHandler", uid, resp)
end

function FortuneSlotScene:onAccountDiamondUpdate(uid, amount)
    self:sendToUid("onAccountDiamondUpdate", uid, amount)
end

function FortuneSlotScene:onStopRound(uid, roundResultResp)
    self:sendToUid("onStopRound", uid, roundResultResp)
end

function FortuneSlotScene:onJackpotHint(uid, hint)
    if uid then
        self:sendToUid("onJackpotHint", uid, hint or {})
        return
    end
    for playerUid, _ in pairs(self.playerList) do
        self:sendToUid("onJackpotHint", playerUid, hint or {})
    end
end

function FortuneSlotScene:onMaintenance(uid, msg)
    if uid then
        self:sendToUid("onMaintenance", uid, msg or {})
        return
    end
    for playerUid, _ in pairs(self.playerList) do
        self:sendToUid("onMaintenance", playerUid, msg or {})
    end
end
