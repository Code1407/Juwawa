-- ============================================================
-- 水果老虎机场景/全局系统模块
-- 继承自SvrSystemBase，管理所有玩家的全局状态：
-- Jackpot奖池、在线玩家列表、心跳定时器、回合ID分配等
-- ============================================================

require "GameBase.SvrSystemBase"
require "FruitSlots.FruitSlotsCommon"
require "FruitSlots.FruitSlotsConfig"

FruitSlotsScene = class__(SvrSystemBase)

-- 构造函数：初始化全局状态
function FruitSlotsScene:ctor__()
    SvrSystemBase.ctor__(self, FruitSlotsConst.gameName)
    self.playerList = {}         -- 在线玩家映射表 {uid -> playerSys}
    self.gameRates = {}          -- 玩家自定义倍率
    self.newUserResult = {}      -- 新手预置结果库
    self.gameRateDefault = FruitSlotsDefaultGameRate() -- 默认倍率
    self.gameStatus = FRGameStatus.bet
    self.heartbeatTimerId = 0
end

-- 场景数据加载：初始化Jackpot池、启动心跳定时器
function FruitSlotsScene:onLoad(data)
    data = data or {}
    data.todayRoundId = data.todayRoundId or 0
    data.todayDate = data.todayDate or os.date("%Y-%m-%d")
    data.jackpotAmountPool = data.jackpotAmountPool or {}
    SvrSystemBase.onLoad(self, data)
    self.todayDate = self:getData().todayDate
    self:initDefaultJackpotPools() -- 初始化默认奖池
    self:initHeartbeat()           -- 启动心跳定时器
end

-- 场景关闭：清理心跳定时器
function FruitSlotsScene:onClose()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
        self.heartbeatTimerId = 0
    end
    SvrSystemBase.onClose(self)
end

-- 初始化心跳定时器（定期同步状态给在线玩家）
function FruitSlotsScene:initHeartbeat()
    if self.heartbeatTimerId and self.heartbeatTimerId > 0 then
        gTimer:removeTimer(self.heartbeatTimerId)
    end
    self.heartbeatTimerId = gTimer:addTimer(FR_HEARTBEAT_INTERVAL, FR_HEARTBEAT_INTERVAL, -1, function()
        self:onHeartbeat()
    end)
end

-- 获取场景自身引用
function FruitSlotsScene:getScene()
    return self
end

-- 游戏是否已停止
function FruitSlotsScene:isStop()
    return self.gameStatus == FRGameStatus.stop
end

-- 启动游戏服务
function FruitSlotsScene:gameStart()
    self.gameStatus = FRGameStatus.bet
end

-- 停止游戏服务
function FruitSlotsScene:gameStop()
    self.gameStatus = FRGameStatus.stop
end

-- 注册在线玩家
function FruitSlotsScene:registerPlayer(playerSys)
    self.playerList[playerSys:getUid()] = playerSys
end

-- 取消注册离线玩家
function FruitSlotsScene:unregisterPlayer(uid)
    self.playerList[uid] = nil
end

-- 获取指定UID的玩家系统实例
function FruitSlotsScene:getPlayer(uid)
    return self.playerList[uid]
end

-- 向指定玩家发送消息（按路由名编码后发送）
function FruitSlotsScene:sendToUid(routeName, uid, msg)
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
function FruitSlotsScene:broadcast(routeName, msg)
    for uid, _ in pairs(self.playerList) do
        self:sendToUid(routeName, uid, msg)
    end
end

-- 初始化默认Jackpot奖池（按默认下注档位）
function FruitSlotsScene:initDefaultJackpotPools()
    local pool = self:getData().jackpotAmountPool or {}
    local defaultBets = FruitSlotsGetBetAmounts()
    for _, betAmount in ipairs(defaultBets) do
        local key = tostring(betAmount)
        if pool[key] == nil and pool[betAmount] == nil then
            pool[key] = betAmount * 17000 -- 初始奖池 = 下注 x 17000
        end
    end
    self:getData().jackpotAmountPool = pool
end

function FruitSlotsScene:refundJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    pool[key] = (tonumber(pool[key]) or 0) + math.max(0, tonumber(amount) or 0)
end

-- 同步下注金额对应的Jackpot奖池（为未初始化的档位补充默认值）
function FruitSlotsScene:syncBetAmountPools()
    local pool = self:getData().jackpotAmountPool or {}
    for _, betAmount in ipairs(FruitSlotsGetBetAmounts()) do
        betAmount = FRRoundInt(betAmount or 0)
        if betAmount > 0 then
            local key = tostring(betAmount)
            if pool[key] == nil and pool[betAmount] == nil then
                pool[key] = betAmount * 17000
            end
        end
    end
    self:getData().jackpotAmountPool = pool
end

-- 获取所有Jackpot奖池快照
function FruitSlotsScene:getAllJackpotPool()
    self:initDefaultJackpotPools()
    return self:getData().jackpotAmountPool or {}
end

-- 获取指定下注档位的Jackpot奖池金额
function FruitSlotsScene:getJackpotPoolAmount(poolIndex)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = (tonumber(poolIndex) or 0) * 17000
    end
    return tonumber(pool[key]) or 0
end

-- 向Jackpot奖池注入资金（带动态平衡：奖池过高减速、过低加速）
function FruitSlotsScene:increaseJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = 0
    end

    local incr = tonumber(amount) or 0
    local betAmount = tonumber(poolIndex) or 0
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
function FruitSlotsScene:decreaseJackpotPoolAmount(poolIndex, amount)
    local pool = self:getAllJackpotPool()
    local key = tostring(poolIndex or 0)
    if pool[key] == nil then
        pool[key] = 0
    end
    pool[key] = math.max((tonumber(pool[key]) or 0) - (tonumber(amount) or 0), 0)
end

-- 递增今日回合ID（跨天自动重置）
function FruitSlotsScene:incrTodayRoundID()
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
function FruitSlotsScene:onHeartbeat()
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
function FruitSlotsScene:onRoundStep2Player(uid, runningRoundID, status, accountDiamond, results)
    self:sendToUid("onRoundStep", uid, {
        runningRoundID = runningRoundID,
        status = status,
        accountDiamond = accountDiamond,
        jackpotPool = self:getAllJackpotPool(),
        results = results,
    })
end

-- 向所有在线玩家推送各自的回合步骤状态
function FruitSlotsScene:onRoundStep(roundStep)
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
function FruitSlotsScene:onResultHandler(uid, resp)
    self:sendToUid("onResultHandler", uid, resp)
end

-- 向指定玩家发送回合结算结果
function FruitSlotsScene:onStopRound(uid, roundResultResp)
    self:sendToUid("onStopRound", uid, roundResultResp)
end

-- 向指定玩家推送钻石更新
function FruitSlotsScene:onAccountDiamondUpdate(uid, amount)
    self:sendToUid("onAccountDiamondUpdate", uid, amount)
end

-- 全局广播Jackpot中奖提示
function FruitSlotsScene:onJackpotHint(hint)
    self:broadcast("onJackpotHint", hint or {})
end

-- 维护通知：可指定uid单推或全局广播
function FruitSlotsScene:onMaintenance(uid, msg)
    if uid then
        self:sendToUid("onMaintenance", uid, msg or {})
        return
    end
    self:broadcast("onMaintenance", msg or {})
end
