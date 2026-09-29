require "GameBase.SvrSystemBase"

-- SuperAce 房间/场景管理：维护在线玩家列表、心跳定时器、关服平滑收尾逻辑。
SuperAceScene = class__(SvrSystemBase)

local HEARTBEAT_INTERVAL = 1000  -- 关服收尾心跳检测间隔(毫秒)

-- 字段说明：playerList=在线玩家(uid->sys)；closingPlayers=关服期间需保留引用的玩家；
-- closing=是否进入关服流程；closingFinished=是否已完成关服；heartbeatTimerId=心跳定时器ID。
function SuperAceScene:ctor__()
    SvrSystemBase.ctor__(self, "SuperAce")
    self.playerList = {}
    self.closingPlayers = {}
    self.closing = false
    self.closingFinished = false
    self.heartbeatTimerId = 0
end

-- 加载场景并启动周期性心跳定时器，用于关服期间推动异步订单收尾。
function SuperAceScene:onLoad(data)
    SvrSystemBase.onLoad(self, data or {})
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
    end
    self.heartbeatTimerId = gTimer:addTimer(
        HEARTBEAT_INTERVAL,
        HEARTBEAT_INTERVAL,
        -1,
        function() self:onHeartbeat() end
    )
end

-- 关闭场景：先移除心跳定时器，再调用基类清理。
function SuperAceScene:onClose()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
        self.heartbeatTimerId = 0
    end
    SvrSystemBase.onClose(self)
end

function SuperAceScene:getScene()
    return self
end

-- 是否处于关服流程：本场景已标记 closing 或全局 gApp 处于待关闭状态。
function SuperAceScene:isClosing()
    return self.closing or
        (gApp and gApp.isWaitClosing and gApp:isWaitClosing()) or false
end

-- 玩家进入场景时注册；若正处于关服流程，立即通知玩家准备收尾。
function SuperAceScene:registerPlayer(playerSys)
    local uid = tostring(playerSys:getPlayer():getUid() or playerSys:getPlayer():getPid() or "")
    self.playerList[uid] = playerSys
    if self:isClosing() then
        self.closingPlayers[uid] = playerSys
        playerSys:prepareServerClosing()
    end
end

-- 玩家离开场景时取消注册；关服期间若有未结算回合则保留引用以便异步收尾。
function SuperAceScene:unregisterPlayer(playerSys)
    local uid = tostring(playerSys:getPlayer():getUid() or playerSys:getPlayer():getPid() or "")
    self.playerList[uid] = nil
    if self:isClosing() and playerSys:hasUnsettledRounds() then
        -- 离线后仍可能有扣款或派彩回调，保留引用直到异步订单收尾。
        self.closingPlayers[uid] = playerSys
    else
        self.closingPlayers[uid] = nil
    end
end

-- 检查是否仍有未结算的关服工作：合并在线玩家与 closingPlayers，逐个询问是否有未结算回合。
function SuperAceScene:hasPendingClosingWork()
    for uid, playerSys in pairs(self.playerList) do
        self.closingPlayers[uid] = playerSys
    end
    for uid, playerSys in pairs(self.closingPlayers) do
        if playerSys and playerSys:hasUnsettledRounds() then
            return true
        end
        self.closingPlayers[uid] = nil
    end
    return false
end


-- 进入关服准备：通知所有在线玩家准备收尾，返回是否仍有挂起工作。
function SuperAceScene:prepareServerClosing()
    if self.closingFinished then return false end
    self.closing = true
    for uid, playerSys in pairs(self.playerList) do
        self.closingPlayers[uid] = playerSys
        playerSys:prepareServerClosing()
    end
    return self:hasPendingClosingWork()
end

-- 尝试完成关服：所有挂起工作结算后调用 gApp.finishClosing 真正关闭服务。
function SuperAceScene:tryFinishServerClosing()
    if self.closingFinished or not self.closing then
        return false
    end
    if self:hasPendingClosingWork() then
        return false
    end
    self.closingFinished = true
    log_info("SuperAce closing: all active rounds settled")
    if gApp and gApp.finishClosing then
        gApp:finishClosing()
    end
    return true
end

-- 向场景内所有在线玩家广播消息；路由不存在时记录错误日志。
function SuperAceScene:broadcast(routeName, msg)
    local sender = Router.Client[routeName]
    if not sender then
        log_error("SuperAce broadcast route not found: {}", routeName)
        return
    end
    for _, playerSys in pairs(self.playerList) do
        local player = playerSys:getPlayer()
        if player then
            sender(msg, player)
        end
    end
end

-- 心跳回调：仅在关服期间工作，推动所有挂起玩家收尾并尝试完成关服。
function SuperAceScene:onHeartbeat()
    if not self.closing then return end
    for _, playerSys in pairs(self.closingPlayers) do
        playerSys:prepareServerClosing()
    end
    self:tryFinishServerClosing()
end

return SuperAceScene
