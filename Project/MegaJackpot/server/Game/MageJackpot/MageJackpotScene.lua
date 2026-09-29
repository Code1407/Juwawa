-- ============================================================
-- 水果老虎机场景/全局系统模块
-- 继承自SvrSystemBase，管理所有玩家的全局状态：
-- Jackpot奖池、在线玩家列表、心跳定时器、回合ID分配等
-- ============================================================

require "GameBase.SvrSystemBase"
require "MageJackpot.MageJackpotCommon"
require "MageJackpot.MageJackpotConfig"

MageJackpotScene = class__(SvrSystemBase)

-- 构造函数：初始化全局状态
function MageJackpotScene:ctor__()
    SvrSystemBase.ctor__(self, MageJackpotConst.gameName)
    self.playerList = {}         -- 在线玩家映射表 {uid -> playerSys}
    self.gameRates = {}          -- 玩家自定义倍率
    self.newUserResult = {}      -- 新手预置结果库
    self.gameRateDefault = MageJackpotDefaultGameRate() -- 默认倍率
    self.gameStatus = FRGameStatus.bet
    self.heartbeatTimerId = 0
    self.closingFinished = false
    self.closingPlayers = {}
end

-- 场景数据加载：初始化Jackpot池、启动心跳定时器
function MageJackpotScene:onLoad(data)
    data = data or {}
    data.todayRoundId = data.todayRoundId or 0
    data.todayDate = data.todayDate or os.date("%Y-%m-%d")
    data.jackpotAmountPool = data.jackpotAmountPool or {}
    SvrSystemBase.onLoad(self, data)
    self.todayDate = self:getData().todayDate
    self:migrateDefaultJackpotPools() -- 迁移/初始化默认奖池
    self:initHeartbeat()           -- 启动心跳定时器
end

-- 场景关闭：清理心跳定时器
function MageJackpotScene:onClose()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
        self.heartbeatTimerId = 0
    end
    SvrSystemBase.onClose(self)
end

-- 初始化心跳定时器（定期同步状态给在线玩家）
function MageJackpotScene:initHeartbeat()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
    end
    self.heartbeatTimerId = gTimer:addTimer(FR_HEARTBEAT_INTERVAL, FR_HEARTBEAT_INTERVAL, -1, function()
        self:onHeartbeat()
    end)
end

-- 获取场景自身引用
function MageJackpotScene:getScene()
    return self
end

-- 游戏是否已停止
function MageJackpotScene:isStop()
    return self.gameStatus == FRGameStatus.stop or
        self.gameStatus == FRGameStatus.maintenance or
        (gApp and gApp.isWaitClosing and gApp:isWaitClosing())
end

-- 是否正在执行优雅关服。关服期间禁止开启普通付费局，但允许已经触发的
-- 免费次数继续完成。
function MageJackpotScene:isClosing()
    return self.gameStatus == FRGameStatus.maintenance or
        (gApp and gApp.isWaitClosing and gApp:isWaitClosing())
end

-- 启动游戏服务
function MageJackpotScene:gameStart()
    if gApp and gApp.isWaitClosing and gApp:isWaitClosing() then
        return false
    end
    self.gameStatus = FRGameStatus.bet
    return true
end

-- 停止游戏服务
function MageJackpotScene:gameStop()
    self.gameStatus = FRGameStatus.stop
end

-- 注册在线玩家
function MageJackpotScene:registerPlayer(playerSys)
    local uid = playerSys:getUid()
    self.playerList[uid] = playerSys
    if self.gameStatus == FRGameStatus.maintenance then
        self.closingPlayers[uid] = playerSys
    end
end

-- 取消注册离线玩家
function MageJackpotScene:unregisterPlayer(uid)
    local playerSys = self.playerList[uid]
    self.playerList[uid] = nil
    if self.gameStatus == FRGameStatus.maintenance and playerSys and playerSys:hasUnsettledRounds() then
        self.closingPlayers[uid] = playerSys
    else
        self.closingPlayers[uid] = nil
    end
end

-- 关服期间同时跟踪在线玩家和已经离线但仍有异步订单回调的玩家。
function MageJackpotScene:hasPendingClosingWork()
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

-- 拒绝新的普通付费局；当前回合和已经触发的免费次数仍按正常流程完成，
-- 异步扣款、开奖和派彩由各自回调继续收尾。
function MageJackpotScene:prepareServerClosing()
    if self.closingFinished then return false end
    self.gameStatus = FRGameStatus.maintenance
    for uid, playerSys in pairs(self.playerList) do
        self.closingPlayers[uid] = playerSys
        playerSys:prepareServerClosing()
    end
    return self:hasPendingClosingWork()
end

function MageJackpotScene:tryFinishServerClosing()
    if self.closingFinished or self.gameStatus ~= FRGameStatus.maintenance then
        return false
    end
    if self:hasPendingClosingWork() then
        return false
    end
    self.closingFinished = true
    self.gameStatus = FRGameStatus.stop
    log_info("MageJackpot closing: all active rounds settled")
    if gApp and gApp.finishClosing then
        gApp:finishClosing()
    end
    return true
end

-- 获取指定UID的玩家系统实例
function MageJackpotScene:getPlayer(uid)
    return self.playerList[uid]
end

-- 向指定玩家发送消息（按路由名编码后发送）
function MageJackpotScene:sendToUid(routeName, uid, msg)
    local playerSys = self.playerList[uid]
    if not playerSys then
        return
    end
    local player = playerSys:getPlayer()
    local sender = Router.Client[routeName]
    if player and sender then
        sender(FRProtoEncodeByRoute(routeName, msg), player)
    end
end

-- 广播消息给所有在线玩家
function MageJackpotScene:broadcast(routeName, msg)
    for uid, _ in pairs(self.playerList) do
        self:sendToUid(routeName, uid, msg)
    end
end

-- 初始化默认Jackpot奖池（按默认下注档位）
function MageJackpotScene:initDefaultJackpotPools()
    local pool = self:getData().jackpotAmountPool or {}
    local defaultBets = MageJackpotGetBetAmounts()
    for _, betAmount in ipairs(defaultBets) do
        local key = tostring(betAmount)
        if pool[key] == nil and pool[betAmount] == nil then
            pool[key] = MageJackpotDefaultJackpotPoolAmount(betAmount)
        end
    end
    self:getData().jackpotAmountPool = pool
end

-- 旧版本曾用“单线下注 * 17000”初始化奖池。首次加载新版时重置为TS原始默认表。
function MageJackpotScene:resetDefaultJackpotPools()
    local pool = self:getData().jackpotAmountPool or {}
    for _, betAmount in ipairs(MageJackpotGetBetAmounts()) do
        betAmount = FRRoundInt(betAmount or 0)
        if betAmount > 0 then
            pool[tostring(betAmount)] = MageJackpotDefaultJackpotPoolAmount(betAmount)
            pool[betAmount] = nil
        end
    end
    self:getData().jackpotAmountPool = pool
end

function MageJackpotScene:migrateDefaultJackpotPools()
    local data = self:getData()
    if data.jackpotAmountPoolDefaultVersion ~= FRJackpotPoolDefaultVersion then
        self:resetDefaultJackpotPools()
        data.jackpotAmountPoolDefaultVersion = FRJackpotPoolDefaultVersion
        return
    end
    self:initDefaultJackpotPools()
end

function MageJackpotScene:refundJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    pool[key] = (tonumber(pool[key]) or 0) + math.max(0, tonumber(amount) or 0)
end

-- 同步下注金额对应的Jackpot奖池（为未初始化的档位补充默认值）
function MageJackpotScene:syncBetAmountPools()
    local pool = self:getData().jackpotAmountPool or {}
    for _, betAmount in ipairs(MageJackpotGetBetAmounts()) do
        betAmount = FRRoundInt(betAmount or 0)
        if betAmount > 0 then
            local key = tostring(betAmount)
            if pool[key] == nil and pool[betAmount] == nil then
                pool[key] = MageJackpotDefaultJackpotPoolAmount(betAmount)
            end
        end
    end
    self:getData().jackpotAmountPool = pool
end

-- 获取所有Jackpot奖池快照
function MageJackpotScene:getAllJackpotPool()
    self:migrateDefaultJackpotPools()
    return self:getData().jackpotAmountPool or {}
end

-- 上报当前所有下注档位的 JP 奖池总额。奖池可能因动态注入产生小数，
-- 统计接口只接收积分整数，因此在汇总后统一向下取整。
function MageJackpotScene:statisRewardPool(roundId)
    if roundId == nil or not gApp or not gApp.statisRewardPool then
        return
    end
    local total = 0
    local pool = self:getAllJackpotPool()
    local counted = {}
    for _, betAmount in ipairs(MageJackpotGetBetAmounts()) do
        local poolIndex = FRRoundInt(betAmount or 0)
        local key = tostring(poolIndex)
        if poolIndex > 0 and not counted[key] then
            counted[key] = true
            local amount = pool[key] or pool[poolIndex]
            total = total + math.max(0, tonumber(amount) or 0)
        end
    end
    gApp:statisRewardPool(roundId, math.floor(total))
end

-- 获取指定下注档位的Jackpot奖池金额
function MageJackpotScene:getJackpotPoolAmount(poolIndex)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = MageJackpotDefaultJackpotPoolAmount(poolIndex)
    end
    return tonumber(pool[key]) or 0
end

-- 向Jackpot奖池注入资金（带动态平衡：奖池过高减速、过低加速）
function MageJackpotScene:increaseJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = 0
    end

    local incr = tonumber(amount) or 0
    local betAmount = MageJackpotLineBetAmount(poolIndex)
    local current = tonumber(pool[key]) or 0
    -- 动态平衡机制：
    if current > betAmount * 22000 then
        incr = incr / 4        -- 奖池过高，大幅减速注入
    elseif current > betAmount * 20000 then
        incr = incr / 2        -- 奖池偏高，半速注入
    elseif current < betAmount * 15000 and betAmount >= 1000 then
        incr = incr + incr    -- 奖池偏低（高档位），双倍注入
    elseif current < betAmount * 17000 and betAmount >= 100 then
        incr = incr + incr / 2 -- 奖池偏低（中档位），1.5倍注入
    end
    pool[key] = current + incr
end

-- 从Jackpot奖池扣减金额（中奖时）
function MageJackpotScene:decreaseJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = 0
    end
    pool[key] = math.max((tonumber(pool[key]) or 0) - (tonumber(amount) or 0), 0)
end

-- 递增今日回合ID（跨天自动重置）
function MageJackpotScene:incrTodayRoundID()
    local data = self:getData()
    local todayKey = os.date("%Y-%m-%d")
    if data.todayDate ~= todayKey then
        data.todayDate = todayKey
        data.todayRoundId = 0 -- 跨天重置
    end
    data.todayRoundId = (data.todayRoundId or 0) + 1
    return data.todayRoundId
end

-- 心跳回调：检查跨天重置，推送Jackpot池状态
function MageJackpotScene:onHeartbeat()
    if self.gameStatus == FRGameStatus.maintenance then
        for _, playerSys in pairs(self.closingPlayers) do
            playerSys:prepareServerClosing()
        end
        self:tryFinishServerClosing()
        return
    end
    if self.closingFinished then return end
    local todayKey = os.date("%Y-%m-%d")
    if todayKey ~= self.todayDate then
        self.todayDate = todayKey
        local data = self:getData()
        data.todayDate = todayKey
        data.todayRoundId = 0
    end
    self:onRoundStep({
        runningRoundID = 0,
        status = FRGameStatus.heartbeat,
        accountDiamond = 0,
        jackpotPool = self:getAllJackpotPool(),
        results = nil,
    })
end

-- 向指定玩家推送回合步骤状态
function MageJackpotScene:onRoundStep2Player(uid, runningRoundID, status, accountDiamond, results)
    self:sendToUid("onRoundStep", uid, {
        runningRoundID = runningRoundID,
        status = status,
        accountDiamond = accountDiamond,
        jackpotPool = self:getAllJackpotPool(),
        results = results,
    })
end

-- 向所有在线玩家推送各自的回合步骤状态
function MageJackpotScene:onRoundStep(roundStep)
    for uid, playerSys in pairs(self.playerList) do
        self:sendToUid("onRoundStep", uid, {
            runningRoundID = playerSys.runningRoundID or 0,
            status = playerSys.machineStatus or FRGameStatus.stop,
            accountDiamond = playerSys:getDiamond(),
            jackpotPool = self:getAllJackpotPool(),
            results = playerSys.runningResults,
        })
    end
end

-- 向指定玩家发送结果回调
function MageJackpotScene:onResultHandler(uid, resp)
    self:sendToUid("onResultHandler", uid, resp)
end

-- 向指定玩家发送回合结算结果
function MageJackpotScene:onStopRound(uid, roundResultResp)
    self:sendToUid("onStopRound", uid, roundResultResp)
end

-- 向指定玩家推送钻石更新
function MageJackpotScene:onAccountDiamondUpdate(uid, amount)
    self:sendToUid("onAccountDiamondUpdate", uid, amount)
end

-- 全局广播Jackpot中奖提示
function MageJackpotScene:onJackpotHint(hint)
    self:broadcast("onJackpotHint", hint or {})
end

-- 全局广播普通中奖提示
function MageJackpotScene:onWinHint(hint)
    self:broadcast("onWinHint", hint or {})
end

-- 维护通知：可指定uid单推或全局广播
function MageJackpotScene:onMaintenance(uid, msg)
    if uid then
        self:sendToUid("onMaintenance", uid, msg or {})
        return
    end
    self:broadcast("onMaintenance", msg or {})
end
