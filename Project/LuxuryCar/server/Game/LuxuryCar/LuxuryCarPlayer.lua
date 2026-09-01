-- 依赖引入：系统基类、豪车游戏主模块、豪车游戏机（轮盘/转盘逻辑）
require "GameBase.SystemBase"
require "LuxuryCar.LuxuryCar"
require "LuxuryCar.LuxuryCarMachine"

-- LuxuryCarPlayer 类：继承自 SystemBase，封装单个玩家在豪车游戏中的全部状态与行为。
-- 每个进入豪车游戏的玩家都会拥有一个 LuxuryCarPlayer 实例，用于：
--   - 管理玩家在游戏桌上的个人数据（下注明细、今日盈亏、历史记录、偏好设置等）
--   - 处理下注请求 bet() 与回合结算 settleCurrentRound()
--   - 向客户端返回完整的游戏快照 getClientResp()
LuxuryCarPlayer = class__(SystemBase)

-- 默认数据工厂：为新玩家提供初始数据表。
-- 字段说明：
--   history              历史回合记录（最多保留 20 条）
--   todayRevenue         今日累计盈亏
--   bets                 当前回合的下注分布（10 个下注槽位）
--   lastBetAmountButton  上次选择的下注金额档位按钮索引
--   playerSettings       玩家个人偏好设置
local function defaultData()
    return { history = {}, todayRevenue = 0, bets = LCEmptyBets(), chipCounts = LCEmptyChipCounts(), lastBetAmountButton = 0, playerSettings = {} }
end

-- 构造函数：调用基类构造，注册到豪车游戏的玩家系统中。
function LuxuryCarPlayer:ctor__(player)
    SystemBase.ctor__(self, LuxuryCarConst.gameName, player)
end


-- 数据加载：从持久化数据恢复玩家状态；若无数据则使用 defaultData() 初始化。
function LuxuryCarPlayer:onLoad(data)
    data = data or defaultData()
    data.history, data.bets = data.history or {}, data.bets or LCEmptyBets()
    data.chipCounts = data.chipCounts or LCEmptyChipCounts()
    SystemBase.onLoad(self, data)
end

-- 玩家进入游戏（生命周期 onEnter）：
--   1. 通过基类 onEnter 完成系统级初始化
--   2. 获取当前场景（赌桌）引用
--   3. 创建 LuxuryCarMachine（轮盘/转盘控制器）绑定到本玩家
--   4. 将本玩家注册到场景中，使其参与场景广播与回合流转
function LuxuryCarPlayer:onEnter()
    SystemBase.onEnter(self)
    self.scene = SvrSystem.LuxuryCar:getScene()
    self.machine = LuxuryCarMachine(self.scene, self)
    self.scene:registerPlayer(self)
end

-- 玩家离开游戏（生命周期 onLeave）：
--   1. 从场景中注销本玩家（按 UID 移除），不再接收后续广播
--   2. 调用基类 onLeave 完成系统级清理与数据落盘
function LuxuryCarPlayer:onLeave()
    if self.scene then self.scene:unregisterPlayer(self:getUid()) end
    SystemBase.onLeave(self)
end

-- 获取玩家唯一标识：优先使用 UID，回退到 PID。
function LuxuryCarPlayer:getUid() 
    return tostring(self:getPlayer():getUid() or self:getPlayer():getPid())
end

-- 获取玩家钻石（金币）余额：向下取整。
function LuxuryCarPlayer:getDiamond() 
    return math.floor(self:getPlayer():getCoins() or 0)
end

-- getClientResp：构建并返回一份完整的客户端游戏状态快照。
-- 返回的 table 包含以下关键字段：
--   uid                     玩家唯一标识
--   roundStep               当前场景回合步骤（含回合号、阶段状态）
--   account                 玩家账户信息（LCAccount 封装）
--   todayRevenue            今日累计盈亏
--   wheelAmount             本玩家当前回合累计下注分布（10 个槽位）
--   totalWheelAmount        场景总池累计下注（所有玩家合计）
--   curRoundAllWheelAmount  当前回合所有玩家的下注列表
--   historyResults          场景历史开奖结果
--   rankList                场景排行榜
--   myHistory               本玩家个人历史回合记录
--   lastBetAmountButton     上次选择的下注金额按钮索引
--   playerSettings          玩家个人偏好设置
-- 该方法在 enterGame / synchronize 等场景被调用，用于全量同步客户端状态。
function LuxuryCarPlayer:getClientResp()
    local data = self:getData()
    return { uid = self:getUid(), roundStep = self.scene:getRoundStep(), account = LCAccount(self:getPlayer()), todayRevenue = data.todayRevenue or 0, wheelAmount = data.bets or LCEmptyBets(), wheelChipAmount = data.chipCounts or LCEmptyChipCounts(), totalWheelAmount = self.scene.roundBets, curRoundAllWheelAmount = self.scene:getRoundAllBetList(), historyResults = self.scene.historyResults, rankList = self.scene:rankList(), myHistory = data.history or {}, lastBetAmountButton = data.lastBetAmountButton or 0, playerSettings = data.playerSettings or {} }
end

-- enterGame：玩家进入游戏时调用，返回初始快照（委托给 getClientResp）。
function LuxuryCarPlayer:enterGame() 
    return self:getClientResp()
end

-- synchronize：玩家请求同步时调用，返回最新快照（委托给 getClientResp）。
function LuxuryCarPlayer:synchronize() 
    return self:getClientResp()
end

-- onNewDay：每日重置回调。将今日盈亏清零、下注分布重置为空。
function LuxuryCarPlayer:onNewDay()
    local data = self:getData()
    data.todayRevenue, data.bets, data.chipCounts = 0, LCEmptyBets(), LCEmptyChipCounts()
end

-- onNewRound：每回合开始回调。将本回合下注分布重置为空，为新一轮下注做准备。
function LuxuryCarPlayer:onNewRound()
    self:getData().bets = LCEmptyBets()
    self:getData().chipCounts = LCEmptyChipCounts()
end

-- saveHistory：保存单个历史回合记录。
-- 参数：
--   roundId  回合编号
--   bets     本回合的下注分布（会被深拷贝存入）
--   result   本回合开奖结果
-- 机制：
--   1. 在玩家 history 数组头部插入一条记录，包含时间戳、日期、回合号、下注快照与开奖结果
--   2. 历史记录最多保留 20 条，超出时移除最旧的一条（FIFO）
function LuxuryCarPlayer:saveHistory(roundId, bets, result)
    local history = self:getData().history
    table.insert(history, { timestamp = app__:utc_milli_s(), date = os.date("%x"), round = roundId, betDatails = LCClone(bets), roundResult = result })
    if #history > 20 then table.remove(history, 1) end
end

-- 使用服务端公共配置校验客户端上传的下注档位。
-- 每个下注位的金额必须严格等于 sum(档位金额 * 档位数量)，防止客户端篡改 betDiamonList。
local function validateBetGrades(betGrades, chipCounts, requestedBets)
    local cfg = gApp and gApp:getProjCommon() or nil
    local costs = cfg and cfg.Costs or nil
    if type(costs) ~= "table" or #costs <= 0 then
        --允许使用默认值，防止客户端篡改配置文件
        log_error("LuxuryCar costs cfg is nil")
        costs = {
            { Coins = 100 },
            { Coins = 1000 },
            { Coins = 10000 },
            { Coins = 100000 },
        }
    end

    if type(betGrades) ~= "table" or #betGrades ~= 10 or
       type(chipCounts) ~= "table" or #chipCounts ~= 10 or
       type(requestedBets) ~= "table" or #requestedBets ~= 10 then
        return false, "invalid bet array size"
    end

    local gradeAmounts = {}
    for gradeIndex, cost in ipairs(costs) do
        local amount = tonumber(cost and cost.Coins)
        if not amount or amount <= 0 or amount ~= math.floor(amount) then
            log_error("LuxuryCar costs cfg invalid: grade:{0} coins:{1}", gradeIndex, amount or 0)
            return false, "invalid costs config"
        end
        gradeAmounts[gradeIndex] = amount
    end

    for betIndex = 1, 10 do
        local row = chipCounts[betIndex]
        if type(row) ~= "table" or #row ~= #gradeAmounts then
            return false, "invalid grade count"
        end

        local expectedAmount = 0
        for gradeIndex, gradeAmount in ipairs(gradeAmounts) do
            local count = tonumber(row[gradeIndex])
            if not count or count < 0 or count ~= math.floor(count) then
                return false, "invalid chip count"
            end
            expectedAmount = expectedAmount + gradeAmount * count
        end

        local requestedAmount = tonumber(requestedBets[betIndex])
        local selected = tonumber(betGrades[betIndex])
        if not requestedAmount or requestedAmount < 0 or requestedAmount ~= math.floor(requestedAmount) or
           (selected ~= 0 and selected ~= 1) or
           requestedAmount ~= expectedAmount or
           selected ~= (expectedAmount > 0 and 1 or 0) then
            return false, "bet grade mismatch"
        end
    end

    return true
end

-- bet：玩家下注核心方法。
-- 执行流程：
--   1. 【验证阶段】检查场景是否已停止（isStop）→ 若停止则返回 closeServer 错误码
--   2. 【验证阶段】检查当前回合是否处于下注阶段（LCGameStatus.bet）且回合号匹配 → 否则返回 missTime 错误码
--   3. 【解析阶段】将 requestedBets（10 个槽位的请求下注值）逐一取整、校验，累加到 bets 与 total
--   4. 【验证阶段】若总下注 ≤ 0 或玩家余额不足 → 返回 insufficient 错误码
--   5. 【扣款阶段】调用 subCoins 执行原子扣款，成功后在回调中：
--      a. 将本次下注累加到玩家个人 bets 中
--      b. 通知场景更新总池（addRoundBets）
--      c. 更新排行榜（RankPSystem:updateRankList）
--      d. 通过场景广播 onBetListRound，通知其他玩家本玩家的下注动作（飞球动画等）
--      e. 向客户端返回下注成功的确认包
--   6. 立即返回一个"处理中"的成功响应（实际扣款结果以回调为准）
function LuxuryCarPlayer:bet(todayRound, betGrades, chipCounts, requestedBets, requestId)
    requestId = tonumber(requestId) or 0

    -- code供旧客户端读取；rawTradeCode透传平台原始交易码，供新客户端独立扩展提示。
    local function pushBetResp(system, resultCode, player, rawTradeCode)
        player = player or (system and system:getPlayer())
        if system and player and player:isOnline() then
            Router.Client.betResp({
                requestId = requestId,
                code = resultCode,
                rawTradeCode = rawTradeCode,
                accountDiamond = system:getDiamond(),
                wheelAmount = system:getData().bets,
                wheelChipAmount = system:getData().chipCounts,
            }, player)
        end
    end

    local step = self.scene:getRoundStep()
    local uid = self:getUid()
    -- 验证：场景已关闭
    if self.scene:isStop() then
        log_info("LuxuryCar bet rejected: scene stopped, uid:{0}", uid)
        return { requestId = requestId, code = LCTradeCode.closeServer, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets, wheelChipAmount = self:getData().chipCounts }
    end
    -- 验证：不在下注阶段或回合号不匹配
    if step.status ~= LCGameStatus.bet or tonumber(todayRound) ~= step.todayRound then
        log_info("LuxuryCar bet rejected: invalid time, uid:{0} requestRound:{1} currentRound:{2} status:{3}", uid, todayRound, step.todayRound, step.status)
        return { requestId = requestId, code = LCTradeCode.missTime, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets }
    end
    -- 服务端按公共档位配置重算下注金额；档位、数量、选中标记或金额不匹配时拒绝下注。
    local gradesValid, invalidReason = validateBetGrades(betGrades, chipCounts, requestedBets)
    if not gradesValid then
        log_error("LuxuryCar bet grade invalid: uid:{0} round:{1} reason:{2}", uid, step.todayRound, invalidReason)
        return {
            requestId = requestId,
            code = LCTradeCode.fail,
            accountDiamond = self:getDiamond(),
            wheelAmount = self:getData().bets,
            wheelChipAmount = self:getData().chipCounts
        }
    end
    -- 解析与累加 10 个槽位的下注
    local bets, total = LCEmptyBets(), 0
    for i = 1, 10 do
        bets[i] = math.max(0, math.floor(tonumber(requestedBets and requestedBets[i]) or 0));
        total = total + bets[i]
    end

    -- 验证：下注总额非法或余额不足
    if total <= 0 or not self:getPlayer():coinsEnough(total) then
        log_info("LuxuryCar bet rejected: insufficient, uid:{0} total:{1} balance:{2}", uid, total, self:getDiamond())
        return { requestId = requestId, code = LCTradeCode.insufficient, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets }
    end
    -- 捕获本局独立上下文；异步扣款回调始终使用这里固定的 roundId。
    local roundContext = self.scene:getRoundContext()
    local roundId = roundContext and roundContext.roundId or nil
    if not roundId or roundContext.todayRound ~= step.todayRound then
        log_error("LuxuryCar bet failed: round context mismatch, uid:{0} todayRound:{1} contextRound:{2} roundId:{3}",
            uid, step.todayRound, roundContext and roundContext.todayRound or -1, roundId or -1)
        return {
            requestId = requestId,
            code = LCTradeCode.fail,
            accountDiamond = self:getDiamond(),
            wheelAmount = self:getData().bets,
            wheelChipAmount = self:getData().chipCounts
        }
    end

    -- 扣款（异步回调）：扣款成功后更新下注、广播、通知客户端
    self.scene:beginPendingBet()
    local selectedBetIds = {}
    for index, selected in ipairs(betGrades) do
        if (tonumber(selected) or 0) > 0 then
            table.insert(selectedBetIds, tostring(index))
        end
    end
    local betId = table.concat(selectedBetIds, ",")
    self:getPlayer():subCoins(roundId, ECoinsOperateType.BetSub, total, function(code, _orderId, backPlayer)
        self.scene:endPendingBet()
        -- 玩家可能在 SDK 回调返回前断线；闭包中的 system 仍需记录已成功的扣款和下注。
        local system = backPlayer and backPlayer:getSystem(LuxuryCarConst.gameName) or self
        if not system then
            log_error("LuxuryCar bet callback failed: system not found, uid:{0}", uid)
            return
        end

        if code ~= 0 then
            log_error("LuxuryCar bet subCoins failed: uid:{0} code:{1} total:{2}", uid, code, total)

            local resultCode = code
            if resultCode ~= ETradeCode.UserStatusError and resultCode ~= ETradeCode.Insufficient and resultCode ~= ETradeCode.CoinFrozen then resultCode = ETradeCode.SdkDisconnect end
            if backPlayer then
                Router.Client.onResultHandler({ code = resultCode, rawTradeCode = code, roundId = todayRound }, backPlayer)
            end
            return pushBetResp(system, resultCode, backPlayer, code)
        end

        -- 验证：不在下注阶段或回合号不匹配
        local n_step = system.scene:getRoundStep()
        if n_step.status ~= LCGameStatus.bet
            or tonumber(todayRound) ~= n_step.todayRound
            or system.scene:getRoundId() ~= roundId then
            local outcome = system.scene:getRoundOutcome(roundId)
            local result = outcome and outcome.result or nil
            local oddsType = outcome and outcome.oddsType or 0
            local rewardCoins = result and result >= 0 and LCRevenue(bets, result) or 0
            local gameExt = { win_id = tostring(result or -1) }
            local rewardPlayer = backPlayer or system:getPlayer()
            if not rewardPlayer then
                log_error("LuxuryCar late bet delay reward failed: player nil, uid:{0} roundId:{1} orderId:{2}", uid, roundId, _orderId)
                return
            end
            rewardPlayer:subCoinsDelayReward(
                roundId,
                betId,
                _orderId,
                oddsType,
                ECoinsOperateType.WinAdd,
                total,
                rewardCoins,
                gameExt
            )
            log_error("LuxuryCar late bet delay reward: uid:{0} round:{1} roundId:{2} betId:{3} orderId:{4} result:{5} subCoins:{6} rewardCoins:{7} oddsType:{8}",
                uid, todayRound, roundId, betId, _orderId, result or -1, total, rewardCoins, oddsType)
            return pushBetResp(system, LCTradeCode.missTime, backPlayer)
        end


        -- 累加本次下注到玩家个人下注记录
        local data = system:getData()
        for i = 1, 10 do
            data.bets[i] = (data.bets[i] or 0) + bets[i]
        end
        data.chipCounts = LCMergeChipCounts(data.chipCounts, chipCounts)
        local callbackPlayer = backPlayer or system:getPlayer()
        if not system.scene:recordRoundPlayer(system, callbackPlayer) then
            log_error("LuxuryCar bet callback failed to record player identity: uid:{0} round:{1} roundId:{2}", uid, todayRound, roundId)
            return
        end
        -- 更新场景总池
        system.scene:addRoundBets(bets)
        -- 更新排行榜
        local rank = callbackPlayer and callbackPlayer:getSystem("RankPSystem")
        if rank then
            rank:updateRankList(total)
        end
        -- 广播下注动作（飞球动画等表现层）
        system.scene:broadcast("onBetListRound", { uid = system:getUid(), flyPlayerPos = 0, batIndex = betGrades or {}, num = chipCounts or {} })

        -- 向客户端返回成功确认
        pushBetResp(system, LCTradeCode.success, backPlayer)
    end)
    return { requestId = requestId, code = LCTradeCode.success, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets, wheelChipAmount = self:getData().chipCounts }
end

-- settleCurrentRound：回合结算核心方法。
-- 参数：
--   roundId   服务端全局唯一业务期号
--   todayRound 客户端显示的当天自然期号
--   result    开奖结果（中奖号码/颜色等）
--   oddsType 赔率类型（用于加币时区分操作类型）
-- 执行流程：
--   1. 深拷贝玩家当前回合的下注分布 bets
--   2. 计算总下注额 total 与本回合盈亏 revenue（通过 LCRevenue 函数结合 result 计算）
--   3. 若玩家本回合未下注（total ≤ 0），直接返回 nil（不参与结算）
--   4. 调用 saveHistory 保存回合历史记录（含下注快照与开奖结果）
--   5. 若 revenue > 0（中奖）：调用 addCoins 将赢奖金额加回玩家账户
--      a. 加币成功后更新今日盈亏 todayRevenue
--      b. 定向发送 onPlayerUpdate，同步该玩家自己的最新余额与下注信息
--   6. 返回结算条目（包含玩家 UID、头像、昵称、盈亏金额）以及 revenue 供场景排行榜使用
function LuxuryCarPlayer:settleCurrentRound(roundId, todayRound, result, oddsType, roundPlayerUid, roundPlayerPid)
    local bets = LCClone(self:getData().bets or LCEmptyBets())
    local total, revenue = LCArraySum(bets), LCRevenue(bets, result)
    local boundPlayer = self:getPlayer()
    local uid = tostring(roundPlayerUid or self:getUid())
    local pid = roundPlayerPid or (boundPlayer and boundPlayer.getPid and boundPlayer:getPid())
    local identityPlayer = pid and gWorld:findAllPlayer(pid) or nil
    identityPlayer = identityPlayer or boundPlayer
    -- 未参与下注，跳过结算
    if total <= 0 then
        return nil, nil
    end

    log_info("LuxuryCar settle: uid:{0} round:{1} roundId:{2} result:{3} betTotal:{4} revenue:{5} isWin:{6}",
        uid, todayRound, roundId, result, total, revenue, revenue > 0 and "yes" or "no")

    -- 保存历史记录
    self:saveHistory(todayRound, bets, result)
    -- 中奖派彩
    if revenue > 0 then
        -- 与 Seven7 一致：使用下注时固化的 pid，在派奖前重新从 gWorld 定位 Player。
        local rawPlayer = pid and gWorld:findAllPlayer(pid) or nil
        if not rawPlayer then
            log_error("LuxuryCar settle addCoins failed: player is nil, uid:{0} pid:{1} round:{2} revenue:{3}",
                uid, tostring(pid), todayRound, revenue)
            return { uid = uid, profile = "", name = "", revenue = revenue, rank = 0 }, revenue
        end
        -- 在此同样进行初始化，以便热重载的服务器能修复那些
        -- 在 Player:ctor__ 应用兼容性修复之前就已构造的玩家。
        rawPlayer.subCoinTypeTimeout = rawPlayer.subCoinTypeTimeout or {}
        local platformData = { win_id = tostring(result) }
        local expectedUid = uid
        local expectedPid = tostring(pid)
        local rawUid = rawPlayer.getUid and tostring(rawPlayer:getUid()) or "nil"
        local rawPid = rawPlayer.getPid and tostring(rawPlayer:getPid()) or "nil"
        local beforeCoins = rawPlayer.getCoins and rawPlayer:getCoins() or -1
        log_info("[BalanceTrace] LuxuryCar addCoins request: round:{0} roundId:{1} expectedUid:{2} systemUid:{3} rawUid:{4} rawPid:{5} revenue:{6} beforeCoins:{7} oddsType:{8} changeType:{9}",
            todayRound, roundId, expectedUid, tostring(uid), rawUid, rawPid, revenue, beforeCoins, oddsType or 0, ECoinsOperateType.WinAdd)
        if expectedUid ~= rawUid or expectedPid ~= rawPid then
            log_error("[BalanceTrace] LuxuryCar addCoins request identity mismatch, payout blocked: round:{0} roundId:{1} expectedUid:{2} expectedPid:{3} rawUid:{4} rawPid:{5}",
                todayRound, roundId, expectedUid, expectedPid, rawUid, rawPid)
            return { uid = uid, profile = identityPlayer and identityPlayer:getAvatarUrl() or "", name = identityPlayer and identityPlayer:getName() or "", revenue = revenue, rank = 0 }, revenue
        end
        rawPlayer:addCoins(roundId, oddsType or 0, ECoinsOperateType.WinAdd, revenue, function(code, orderId, backPlayer)
            local backUid = backPlayer and backPlayer.getUid and tostring(backPlayer:getUid()) or "nil"
            local backPid = backPlayer and backPlayer.getPid and tostring(backPlayer:getPid()) or "nil"
            local backCoins = backPlayer and backPlayer.getCoins and backPlayer:getCoins() or -1
            local rawCoinsAfter = rawPlayer.getCoins and rawPlayer:getCoins() or -1
            log_info("[BalanceTrace] LuxuryCar addCoins callback identity: round:{0} roundId:{1} expectedUid:{2} systemUid:{3} rawUid:{4} rawPid:{5} backUid:{6} backPid:{7} orderId:{8}",
                todayRound, roundId, expectedUid, tostring(uid), rawUid, rawPid, backUid, backPid, tostring(orderId))
            log_info("[BalanceTrace] LuxuryCar addCoins callback balance: round:{0} roundId:{1} orderId:{2} code:{3} revenue:{4} beforeCoins:{5} rawCoinsAfter:{6} backCoins:{7}",
                todayRound, roundId, tostring(orderId), code, revenue, beforeCoins, rawCoinsAfter, backCoins)
            if backPlayer and (expectedUid ~= backUid or expectedPid ~= backPid) then
                log_error("[BalanceTrace] LuxuryCar addCoins callback identity mismatch, player update blocked: round:{0} roundId:{1} expectedUid:{2} expectedPid:{3} backUid:{4} backPid:{5} orderId:{6} code:{7}",
                    todayRound, roundId, expectedUid, expectedPid, backUid, backPid, tostring(orderId), code)
                return
            end
            if code == 0 and backPlayer then
                local callbackSystem = backPlayer:getSystem(LuxuryCarConst.gameName) or self
                if tostring(callbackSystem:getUid()) ~= expectedUid then
                    log_error("[BalanceTrace] LuxuryCar callback system mismatch, player update blocked: round:{0} roundId:{1} expectedUid:{2} callbackSystemUid:{3} orderId:{4}",
                        todayRound, roundId, expectedUid, tostring(callbackSystem:getUid()), tostring(orderId))
                    return
                end
                -- 更新今日盈亏
                callbackSystem:getData().todayRevenue = (callbackSystem:getData().todayRevenue or 0) + revenue
                -- 个人余额和个人下注只允许定向通知所属玩家，禁止广播给全桌。
                Router.Client.onPlayerUpdate({ uid = uid, diamond = callbackSystem:getDiamond(), itemAmount = callbackSystem:getData().bets, todayRound = todayRound }, backPlayer)
                log_info("LuxuryCar settle success: uid:{0} round:{1} revenue:{2} todayRevenue:{3} balance:{4}",
                    uid, todayRound, revenue, callbackSystem:getData().todayRevenue, callbackSystem:getDiamond())
            else
                log_error("LuxuryCar settle addCoins failed: uid:{0} round:{1} revenue:{2} orderId:{3} code:{4} playerNil:{5}",
                    uid, todayRound, revenue, orderId, code, backPlayer == nil)
            end
        end, platformData)
    end
    -- 返回结算条目供场景排行榜汇总
    return { uid = uid, profile = identityPlayer and identityPlayer:getAvatarUrl() or "", name = identityPlayer and identityPlayer:getName() or "", revenue = revenue, rank = 0 }, revenue
end

-- setBetAmountButton：记录玩家最后选择的下注金额档位按钮索引，用于 UI 恢复。
function LuxuryCarPlayer:setBetAmountButton(index)
    self:getData().lastBetAmountButton = math.floor(tonumber(index) or 0)
    return { code = 0 }
end

-- updateSettings：更新玩家个人偏好设置（如音效开关、特效开关等），深拷贝存入数据。
function LuxuryCarPlayer:updateSettings(settings)
    self:getData().playerSettings = LCClone(settings or {})
    return { code = 0 }
end
