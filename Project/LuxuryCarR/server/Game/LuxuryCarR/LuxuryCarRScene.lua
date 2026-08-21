----------------------------------------------------------------------
-- LuxuryCarRScene 豪华赛车游戏场景类
-- 继承自 SvrSystemBase，是游戏的核心场景管理器
-- 职责：
--   1. 维护回合状态机（下注 → 开奖 → 结算 → 新回合）
--   2. 管理所有在线玩家的注册与注销
--   3. 通过心跳计时器（onHeartbeat）驱动整个游戏流程
--   4. 协调回合结算、结果选择、排行榜生成等业务逻辑
--   5. 处理每日跨日重置与周榜结算
----------------------------------------------------------------------

require "GameBase.SvrSystemBase"
require "LuxuryCarR.LuxuryCarR"
require "LuxuryCarR.LuxuryCarRMachine"

-- LuxuryCarRScene 场景类定义，继承自 SvrSystemBase
LuxuryCarRScene = class__(SvrSystemBase)

-- 构造函数：初始化玩家列表、回合下注、历史结果、游戏状态、心跳计时器
function LuxuryCarRScene:ctor__()
    SvrSystemBase.ctor__(self, LuxuryCarRConst.gameName)
    self.players, self.roundPlayers, self.roundPlayerPids, self.roundBets, self.historyResults = {}, {}, {}, LCEmptyBets(), {}
    self.gameStatus, self.heartbeatTimer = LCGameStatus.bet, nil
    self.pendingBetCount = 0
    self.closingFinished = false
    self.roundOutcomes, self.roundOutcomeIds = {}, {}
end

----------------------------------------------------------------------
-- onLoad 场景加载回调
-- 从持久化数据中恢复状态：
--   - today: 当前日期字符串（用于跨日检测）
--   - todayRound: 今日已进行的回合数
--   - roundStep: 当前回合步骤（含状态、剩余时间、结果等）
--   - roundBets: 当前回合所有玩家的总下注
--   - historyResults: 历史开奖结果（保留最近20条）
-- 启动心跳定时器，以 heartbeatMs（默认1000ms）为周期触发 onHeartbeat
----------------------------------------------------------------------
function LuxuryCarRScene:onLoad(data)
    SvrSystemBase.onLoad(self, data or {})
    local state = self:getData()
    state.today = state.today or os.date("%Y-%m-%d")
    state.todayRound = state.todayRound or 0
    -- Seven7 同款双期号模型：
    -- todayRound 只保存当天自增局数；roundId 是整局业务链路使用的全局唯一期号。
    -- roundId 缺失表示从旧数据升级，在加载时为当前局补生成一次。
    if not state.roundId and state.todayRound > 0 then
        state.roundId = GenUnionIncrId(state.todayRound)   --转义
    end
    state.roundStep = state.roundStep or { todayRound = state.todayRound, status = LCGameStatus.bet, remainSecond = LuxuryCarRConst.betSeconds, result = -1, hot = {}, roundRank = {}, timestamp = 0 }
    -- 客户端只使用当天自然期号；全局 roundId 不进入前端协议。
    state.roundStep.todayRound = state.todayRound
    -- 每局保存独立上下文。state.roundId 仅保留为旧数据兼容镜像，业务流程不再读取它。
    state.roundContext = state.roundContext or {
        date = state.today,
        todayRound = state.roundStep.todayRound,
        roundId = state.roundId,
    }
    state.roundContext.date = state.roundContext.date or state.today
    state.roundContext.todayRound = state.roundContext.todayRound or state.roundStep.todayRound
    state.roundContext.roundId = state.roundContext.roundId or state.roundId
    state.roundId = state.roundContext.roundId
    self.roundBets = state.roundBets or LCEmptyBets()
    self.historyResults = state.historyResults or {}
    self.heartbeatTimer = gTimer:addTimer(LuxuryCarRConst.heartbeatMs, LuxuryCarRConst.heartbeatMs, -1, function() self:onHeartbeat() end)
end

-- 场景关闭时移除心跳定时器，防止内存泄漏
function LuxuryCarRScene:onClose()
    if self.heartbeatTimer then
        gTimer:removeTimer(self.heartbeatTimer)
    end
    SvrSystemBase.onClose(self)
end

-- 获取自身场景引用
local function getAnalyPlayerId(system)
    if not system then return nil end
    local player = system.getPlayer and system:getPlayer() or nil
    if player and player.getPid then
        local pid = player:getPid()
        if pid ~= nil and pid ~= "" then return pid end
    end
    if player and player.getUid then
        local uid = player:getUid()
        if uid ~= nil and uid ~= "" then return uid end
    end
    if system.getUid then
        local uid = system:getUid()
        if uid ~= nil and uid ~= "" then return uid end
    end
    return nil
end

function LuxuryCarRScene:getScene() return self end

-- 判断游戏是否已停止
function LuxuryCarRScene:isStop() 
    return self.gameStatus == LCGameStatus.stop or
        self.gameStatus == LCGameStatus.maintenance or
        (gApp and gApp.isWaitClosing and gApp:isWaitClosing()) --加入停服检测
end

-- 进入优雅关服。返回 true 表示当前局已有下注，必须继续到结算完成。
function LuxuryCarRScene:prepareServerClosing()
    local step = self:getData().roundStep or {}
    local hasBets = LCArraySum(self.roundBets) > 0
    local hasPendingBets = (self.pendingBetCount or 0) > 0
    local needSettle = step.status == LCGameStatus.run or
        (step.status == LCGameStatus.bet and (hasBets or hasPendingBets))

    self.gameStatus = needSettle and LCGameStatus.maintenance or LCGameStatus.stop
    log_info("LuxuryCarR prepare closing: round:{0} status:{1} hasBets:{2} pendingBets:{3} needSettle:{4}",
        step.todayRound or 0, step.status or -1, hasBets and 1 or 0,
        self.pendingBetCount or 0, needSettle and 1 or 0)
    return needSettle
end

-- 当前局结算完成后停止状态机，并通知框架可以关闭进程。
function LuxuryCarRScene:finishServerClosing()
    if self.closingFinished then return end
    self.closingFinished = true
    self.gameStatus = LCGameStatus.stop
    log_info("LuxuryCarR closing: current round settled, stop creating new rounds")
    if gApp and gApp.finishClosing then
        gApp:finishClosing()
    end
end

-- 注册玩家系统到场景（玩家进入游戏时调用）
function LuxuryCarRScene:registerPlayer(system)
    local uid = system:getUid()
    self.players[uid] = system
    local count = 0
    for _ in pairs(self.players) do count = count + 1 end
    log_info("LuxuryCarR player enter: uid:{0} onlineCount:{1}", uid, count)
end

-- 从场景注销玩家（玩家退出游戏时调用）
function LuxuryCarRScene:unregisterPlayer(uid)
    self.players[uid] = nil
    local count = 0
    for _ in pairs(self.players) do count = count + 1 end
    log_info("LuxuryCarR player leave: uid:{0} onlineCount:{1}", uid, count)
end

-- 根据用户ID获取对应的玩家系统
function LuxuryCarRScene:getPlayerSystem(uid) 
    return self.players[uid] 
end

-- 参与过本局下注的玩家即使中途离线，也必须继续参与结算和统计。
function LuxuryCarRScene:recordRoundPlayer(system, rawPlayer)
    self.roundPlayerPids = self.roundPlayerPids or {}
    rawPlayer = rawPlayer or (system and system:getPlayer())
    if not system or not rawPlayer then
        log_error("LuxuryCarR record round player failed: system/player is nil")
        return false
    end

    local systemUid = tostring(system:getUid())
    local rawUid = rawPlayer.getUid and tostring(rawPlayer:getUid()) or "nil"
    local rawPid = rawPlayer.getPid and rawPlayer:getPid() or nil
    if systemUid ~= rawUid or rawPid == nil or rawPid == "" then
        log_error("[BalanceTrace] LuxuryCarR record round player identity mismatch: systemUid:{0} rawUid:{1} rawPid:{2}",
            systemUid, rawUid, tostring(rawPid))
        return false
    end

    self.roundPlayers[rawUid] = system
    self.roundPlayerPids[rawUid] = rawPid
    return true
end

function LuxuryCarRScene:beginPendingBet()
    self.pendingBetCount = (self.pendingBetCount or 0) + 1
end

function LuxuryCarRScene:endPendingBet()
    self.pendingBetCount = math.max(0, (self.pendingBetCount or 0) - 1)
end

-- 仅在创建新局的边界执行跨日重置，保证跨零点的上一局能完整开奖和结算。
function LuxuryCarRScene:rolloverDay(today)
    local state = self:getData()
    if state.today == today then return false end

    SvrSystem.RankCommon.finalize(state.today, "day")
    -- 与 Seven7 一致：周榜周期为周日至周六，在周日开启第一局前结算上一周。
    if os.date("%w") == "0" then
        SvrSystem.RankCommon.finalize(state.today, "week")
    end

    state.today, state.todayRound, state.roundId, state.roundContext = today, 0, nil, nil
    self.roundBets, state.roundBets = LCEmptyBets(), LCEmptyBets()
    for _, player in pairs(self.players) do
        player:onNewDay()
    end
    return true
end

-- 生成下一个回合ID，并保存本局不可变上下文。
function LuxuryCarRScene:nextRoundId()
    local state = self:getData()
    self:rolloverDay(os.date("%Y-%m-%d"))
    state.todayRound = (state.todayRound or 0) + 1
    local roundId = GenUnionIncrId(state.todayRound)
    local context = { date = state.today, todayRound = state.todayRound, roundId = roundId }
    state.roundContext = context
    state.roundId = roundId -- 旧存档字段兼容；本局链路统一使用 context/local roundId。
    return state.todayRound, roundId, context
end

-- 获取当前回合步骤的深拷贝（避免外部修改影响内部状态）
function LuxuryCarRScene:getRoundStep()
    return LCClone(self:getData().roundStep)
end

-- 获取仅供服务端交易、调控和统计使用的全局唯一期号。
function LuxuryCarRScene:getRoundId()
    local context = self:getData().roundContext
    return context and context.roundId or nil
end

function LuxuryCarRScene:getRoundContext()
    return LCClone(self:getData().roundContext)
end

-- 保存最近若干局开奖结果，供扣款回调跨阶段/跨局后进行延迟返奖。
function LuxuryCarRScene:recordRoundOutcome(roundId, result, oddsType)
    if not roundId then return end
    self.roundOutcomes = self.roundOutcomes or {}
    self.roundOutcomeIds = self.roundOutcomeIds or {}
    if not self.roundOutcomes[roundId] then
        table.insert(self.roundOutcomeIds, roundId)
    end
    self.roundOutcomes[roundId] = {
        result = tonumber(result) or -1,
        oddsType = tonumber(oddsType) or 0,
    }
    while #self.roundOutcomeIds > 20 do
        local expiredRoundId = table.remove(self.roundOutcomeIds, 1)
        self.roundOutcomes[expiredRoundId] = nil
    end
end

--
function LuxuryCarRScene:getRoundOutcome(roundId)
    return self.roundOutcomes and self.roundOutcomes[roundId] or nil
end

----------------------------------------------------------------------
-- newRound 开启新回合
-- 流程：
--   1. 今日回合数 +1
--   2. 重置 roundStep 为下注态（bet），重置剩余时间为 betSeconds
--   3. 清空当前回合的总下注池 roundBets
--   4. 通知所有玩家 onNewRound，让客户端进入下注界面
----------------------------------------------------------------------
function LuxuryCarRScene:newRound()
    if gApp and gApp.isWaitClosing and gApp:isWaitClosing() then
        self:finishServerClosing()
        return false
    end
    local state = self:getData()
    local todayRound, roundId = self:nextRoundId()
    state.roundStep = { todayRound = todayRound, status = LCGameStatus.bet, remainSecond = LuxuryCarRConst.betSeconds, result = -1, hot = LCEmptyBets(), roundRank = {}, timestamp = app__:utc_milli_s() }
    self.roundBets, state.roundBets = LCEmptyBets(), LCEmptyBets()
    self.roundControl = nil

    local onlineCount = 0
    for _ in pairs(self.players) do onlineCount = onlineCount + 1 end
    log_info("LuxuryCarR new round: round:{0} roundId:{1} betSeconds:{2} onlinePlayers:{3}",
        todayRound, roundId, LuxuryCarRConst.betSeconds, onlineCount)

    for _, player in pairs(self.roundPlayers) do
        player:onNewRound()
    end
    for uid, player in pairs(self.players) do
        if not self.roundPlayers[uid] then
            player:onNewRound()
        end
    end
    self.roundPlayers, self.roundPlayerPids = {}, {}
    return true
end

----------------------------------------------------------------------
-- 你。 结算当前回合
-- 工作流程：
--   1. 从 roundStep 获取当前回合信息（回合号、开奖结果）
--   2. 从 roundControl 获取开奖控制信息（赔率类型、结果、参与玩家）
--   3. 遍历所有玩家，逐个调用玩家的 settleCurrentRound 进行个人结算
--   4. 收集排行榜条目（rankItem）和奖励数据（rewards）
--   5. 若有 analy 分析结果，通过 gAnaly:multiCommitAnaly 提交分析数据
--   6. 按收益降序排列排行榜，仅保留前3名
--   7. 将回合状态切换为 final（结算展示阶段），倒计时设为 finalSeconds
----------------------------------------------------------------------
function LuxuryCarRScene:settleCurrentRound(roundId)
    local state = self:getData()
    local step, roundRank = state.roundStep, {}

    -- Move out of the run state before issuing SDK requests.  addCoins may
    -- throw synchronously after a request is queued; leaving the state as run
    -- makes the one-second heartbeat issue the same settlement repeatedly.
    step.status, step.remainSecond = LCGameStatus.final, LuxuryCarRConst.finalSeconds

    local control = self.roundControl or { oddsType = 0, result = EGameOddsResult.Unknown, playerTab = {} }
    local rewards, gamePayData, gameRewardData = {}, {}, {}

    local roundTotalBet = 0
    local roundTotalReward = 0
    local playerCount = 0

    log_info("LuxuryCarR round settle start: round:{0} roundId:{1} result:{2} oddsType:{3} playerCount:{4}",
        step.todayRound, roundId, step.result, control.oddsType, #self.roundPlayers)

    for roundPlayerUid, player in pairs(self.roundPlayers) do
        local bets = LCClone(player:getData().bets or LCEmptyBets())
        local betTotal = LCArraySum(bets)
        local roundPlayerPid = self.roundPlayerPids and self.roundPlayerPids[roundPlayerUid] or nil
        if (roundPlayerPid == nil or roundPlayerPid == "") and player:getPlayer() then
            roundPlayerPid = player:getPlayer():getPid()
            log_error("[BalanceTrace] LuxuryCarR settle missing stored pid, fallback to bound player: round:{0} roundId:{1} mapUid:{2} fallbackPid:{3}",
                step.todayRound, roundId, tostring(roundPlayerUid), tostring(roundPlayerPid))
        end
        local rawPlayer = roundPlayerPid and gWorld:findAllPlayer(roundPlayerPid) or nil
        local systemUid = player:getUid()
        local rawUid = rawPlayer and rawPlayer.getUid and rawPlayer:getUid() or "nil"
        local rawPid = rawPlayer and rawPlayer.getPid and rawPlayer:getPid() or "nil"
        local rawCoins = rawPlayer and rawPlayer.getCoins and rawPlayer:getCoins() or -1
        log_info("[BalanceTrace] LuxuryCarR settle dispatch: round:{0} roundId:{1} mapUid:{2} systemUid:{3} rawUid:{4} rawPid:{5} rawCoins:{6} betTotal:{7}",
            step.todayRound, roundId, tostring(roundPlayerUid), tostring(systemUid), tostring(rawUid), tostring(rawPid), rawCoins, betTotal)
        if tostring(roundPlayerUid) ~= tostring(systemUid) or tostring(systemUid) ~= tostring(rawUid) then
            log_error("[BalanceTrace] LuxuryCarR settle identity mismatch: round:{0} roundId:{1} mapUid:{2} systemUid:{3} rawUid:{4} rawPid:{5}",
                step.todayRound, roundId, tostring(roundPlayerUid), tostring(systemUid), tostring(rawUid), tostring(rawPid))
        end
        local rankItem, reward = player:settleCurrentRound(roundId, step.todayRound, step.result, control.oddsType, roundPlayerUid, roundPlayerPid)
        if rankItem then
            table.insert(roundRank, rankItem)
        end
        if reward ~= nil then
            local playerId = roundPlayerPid or getAnalyPlayerId(player)
            if playerId ~= nil then
                rewards[playerId] = reward
            end
            roundTotalReward = roundTotalReward + math.max(0, math.floor(tonumber(reward) or 0))
        end
        if betTotal > 0 then
            playerCount = playerCount + 1
            roundTotalBet = roundTotalBet + betTotal
            local uid = tostring(roundPlayerUid)
            local rewardTotal = math.max(0, math.floor(tonumber(reward) or 0))
            local rewardMap = {}
            if rewardTotal > 0 then
                rewardMap[step.result] = rewardTotal
            end
            local payData = { betMap = bets, betTotal = betTotal }
            local rewardData = { rewardMap = rewardMap, rewardTotal = rewardTotal }
            gamePayData[uid], gameRewardData[uid] = payData, rewardData
            local statisPlayer = roundPlayerPid and gWorld:findAllPlayer(roundPlayerPid) or player:getPlayer()
            if statisPlayer and statisPlayer.statisGameRound then
                statisPlayer:statisGameRound(roundId, payData, rewardData)
            end
        end
    end
    -- 模板要求：多人游戏必须同时上报全局局统计和每个参与玩家的局统计。
    if gApp and gApp.statisGameRound then
        gApp:statisGameRound(roundId, gamePayData, gameRewardData)
    end

    if control.analyzed and gAnaly then
        gAnaly:multiCommitAnaly(control.playerTab, rewards, roundId, control.result)
    end

    table.sort(roundRank, function(a, b) return a.revenue > b.revenue end)
    while #roundRank > 3 do
        table.remove(roundRank)
    end
    step.roundRank = roundRank

    local roundProfit = roundTotalBet - roundTotalReward
    log_info("LuxuryCarR round settle done: round:{0} roundId:{1} result:{2} totalBet:{3} totalReward:{4} profit:{5} betPlayers:{6} winners:{7}",
        step.todayRound, roundId, step.result, roundTotalBet, roundTotalReward, roundProfit, playerCount, #roundRank)

    -- 输出排行榜前3名
    for i, rank in ipairs(roundRank) do
        log_info("LuxuryCarR round rank#{0}: uid:{1} name:{2} revenue:{3}", i, rank.uid, rank.name, rank.revenue)
    end

    -- 测试邮件功能：每局结算完成后，给当前在线的所有玩家发送一次测试邮件。
    -- self:sendTestMailToPlayer()
end

----------------------------------------------------------------------
-- onHeartbeat 心跳回调，驱动整个游戏流程的核心引擎
-- 
-- 执行逻辑：
--   1.【倒计时推进】将当前回合的 remainSecond 减1
--   2.【状态机流转】当倒计时归零时：
--      - bet → run：调用 selectResult 选出开奖结果，切换到运行态
--      - run → final：调用 settleCurrentRound 进行结算
--      - final → 新回合：调用 newRound 开启下一轮下注
--   3.【回合边界跨日】newRound 创建下一局时才结算榜单并重置日数据，当前局不被零点打断
--   4.【广播状态】每次心跳都广播 onRoundStep，同步给所有客户端
-- 
-- 状态机流转图：
--   bet(下注) ──倒计时结束──► run(开奖) ──倒计时结束──► final(结算) ──倒计时结束──► bet(新回合)
----------------------------------------------------------------------
function LuxuryCarRScene:onHeartbeat()
    if self.closingFinished then return end
    local state = self:getData()
    local step = state.roundStep
    local context = state.roundContext
    local roundId = context and context.roundId or nil
    step.remainSecond = (step.remainSecond or 0) - 1
    -- 倒计时归零：根据当前状态推进到下一阶段
    if step.remainSecond <= 0 then
        if step.status == LCGameStatus.bet then
            -- 下注阶段结束：选择开奖结果，切换到运行（开奖）阶段
            step.result, step.status, step.remainSecond = self:selectResult(roundId), LCGameStatus.run, LuxuryCarRConst.runSeconds
            self:finishResult(roundId, step.result)
        elseif step.status == LCGameStatus.run then
            -- 开奖阶段结束：结算本回合
            self:settleCurrentRound(roundId)
            if gApp and gApp.isWaitClosing and gApp:isWaitClosing() then
                step.timestamp = app__:utc_milli_s()
                self:broadcast("onRoundStep", step)
                self:finishServerClosing()
                return
            end
        elseif step.status == LCGameStatus.final then
            -- 结算展示阶段结束：开启新回合
            if not self:newRound() then return end
            step = state.roundStep
        end
    end
    -- 更新时间戳并广播当前回合状态给所有客户端
    step.timestamp = app__:utc_milli_s()
    self:broadcast("onRoundStep", step)
end

----------------------------------------------------------------------
-- selectResult 选择开奖结果
-- 
-- 工作流程：
--   1. 收集所有有效下注玩家（下注金额大于0的玩家）
--   2. 构建默认的 analy 分析配置（NoLimit 模式，赔率类型0）
--   3. 若有活跃玩家且 gAnaly 服务可用，调用 gAnaly:multiAnaly 进行分析
--      - gAnaly 是外部风控/分析系统，用于根据玩家下注情况决定结果倾向
--      - multiAnaly 返回分析结果，包含 analyType（玩家胜负倾向）、赔率类型等
--   4. 创建 LuxuryCarRMachine 实例，调用 selectControlledResult 选择受控结果
--      - 普通模式按权重随机；受控模式遍历全部有效位置，选出符合条件的结果
--   5. 将开奖控制信息保存到 self.roundControl，供结算时使用
--   6. 返回选中的开奖结果（0-15，对应16个开奖号码）
----------------------------------------------------------------------
function LuxuryCarRScene:selectResult(roundId)
    local playerTab = {}
    -- 收集所有下注金额大于0的玩家
    for _, system in pairs(self.roundPlayers) do
        if LCArraySum(system:getData().bets) > 0 then
            local playerId = getAnalyPlayerId(system)
            local player = system.getPlayer and system:getPlayer() or nil
            if playerId ~= nil and player ~= nil then
                playerTab[playerId] = player
            end
        end
    end
    -- 默认分析配置：风控不可用或异常时安全降级为无限制开奖。
    local analy = { analyType = EAnalyType.NoLimit, oddsType = 0, rerandomMax = 1 }
    local analyzed = false

    --模拟全局调控数据
    --全局调控类型:1  放水类型:3 放水上限:16753598 奖励值上限:84767993 中奖倍率上限:501000  大奖概率增加:0 调控玩家:0
    analy.analyType = 1
    analy.rerankType = 3
    analy.waterRuler = 16753598
    analy.rewardMax = 84767993
    analy.rewardRateMax = 501000
    analy.bigRewardAddRate = 0
    analy.analyPlayer = 0

    --log_info("模拟全局调控数据  固定数据 ---  analy {0}", tableToString(analy))

    if gAnaly and gAnaly.multiAnaly then
        local ok, result = pcall(gAnaly.multiAnaly, gAnaly, playerTab, roundId)
        if ok and type(result) == "table" then
            analy = result
            analyzed = true
        end
    end

    -- 创建老虎机控制器并选择受控结果
    local machine = LuxuryCarRMachine(self, nil)
    -- 必须使用本局实际下注玩家。玩家下注后即使中途离线，其下注仍参与开奖控制与结算。
    local result, gameResult = machine:selectControlledResult(self.roundPlayers, analy, roundId)
    -- 保存开奖控制信息，供结算阶段使用
    self.roundControl = { oddsType = tonumber(machine.oddsType) or 0, result = gameResult, playerTab = playerTab, analyzed = analyzed and true or false }
    return result
end

----------------------------------------------------------------------
-- addRoundBets 添加回合下注
-- 将玩家的下注数据累加到总下注池中（10个下注槽位对应不同赔率）
-- 并广播下注池变化通知给所有客户端
----------------------------------------------------------------------
function LuxuryCarRScene:addRoundBets(bets)
    for i = 1, 10 do 
        self.roundBets[i] = (self.roundBets[i] or 0) + (bets[i] or 0)
    end
    self:getData().roundBets = self.roundBets
    self:broadcast("onBetNoticeAll", { wheelAmount = self.roundBets })
end

----------------------------------------------------------------------
-- finishResult 记录开奖结果到历史记录
-- 最多保留最近20条历史结果，用于客户端展示历史开奖轨迹
----------------------------------------------------------------------
function LuxuryCarRScene:finishResult(roundId, result)
    self:recordRoundOutcome(roundId, result, self.roundControl and self.roundControl.oddsType or 0)
    table.insert(self.historyResults, result)
    if #self.historyResults > 20 then 
        table.remove(self.historyResults, 1)
    end
    self:getData().historyResults = self.historyResults
end

-- 获取当前回合所有玩家的下注列表（用于客户端展示全员下注情况）
-- 返回每个有下注的玩家 uid、下注旗帜数组（0/1表示各位置是否有下注）
function LuxuryCarRScene:getRoundAllBetList()
    local list = {}
    for uid, player in pairs(self.roundPlayers) do
        local data = player:getData()
        local bets = data.bets or LCEmptyBets()
        if LCArraySum(bets) > 0 then
            local flags = LCEmptyBets()
            for i = 1, 10 do flags[i] = bets[i] > 0 and 1 or 0 end
            table.insert(list, { uid = uid, betGradeArr = flags, betGradeNum = data.chipCounts or LCEmptyChipCounts() })
        end
    end
    return list
end

----------------------------------------------------------------------
-- broadcast 广播消息给所有在线玩家
-- 遍历所有注册的玩家系统，检查在线状态和路由是否存在
-- 通过 Router.Client[route] 将消息推送给客户端
-- 参数：
--   route: 路由方法名（如 "onRoundStep"、"onBetNoticeAll"）
--   msg: 消息体，可以是任意类型
----------------------------------------------------------------------
function LuxuryCarRScene:broadcast(route, msg)
    for _, system in pairs(self.players) do
        local player = system:getPlayer()
        if player and player:isOnline() and Router.Client[route] then
            Router.Client[route](msg, player)
        end
    end
end


-- 获取排行榜列表（从 RankCommon 服务按日期查询）
-- 将原始数据转换为客户端需要的格式：uid、头像、昵称、收益、排名
function LuxuryCarRScene:rankList(dateStr, count)
    local raw, result = SvrSystem.RankCommon.getRankListByDateStrSync(dateStr or os.date("%Y-%m-%d"), count or 100) or {}, {}
    for _, item in ipairs(raw) do
        table.insert(result, { uid = item.uid, profile = item.avatar or "", name = item.name or "", revenue = item.score or 0, rank = item.rank or 0 })
    end
    return result
end


-- Send a test mail to one online player, or to every online player when
-- playerSystem is nil.  This is an explicit operation and is intentionally
-- not called from round settlement.
function LuxuryCarRScene:sendTestMailToPlayer(playerSystem, mailCfgId, rewardCoins, extraJson)
    local gameId = gApp:getServerId()
    mailCfgId = math.floor(tonumber(mailCfgId) or 1)
    rewardCoins = math.max(0, math.floor(tonumber(rewardCoins) or 8888))
    extraJson = extraJson or ""

    local function sendOne(system)
        if not system or not system.getPlayer or not system.getUid then
            return false, "invalid player system"
        end

        local player = system:getPlayer()
        local uId = system:getUid()
        if not player or not player:isOnline() or uId == nil or uId == "" then
            return false, "player offline"
        end

        local rewards = {}
        if rewardCoins > 0 then
            rewards[1] = {
                resType = EResourceType.Coins,
                resId = 1,
                resCount = rewardCoins,
                oddsType = 0,
                roundId = ESpecialRoundId.MailAward
            }
        end

        local ok, err = pcall(function()
            -- SvrSystem.MailSystem is a system proxy.  Its wrapper supplies
            -- the real system instance, so this must use the same dot-call
            -- convention as the rest of the mail module.
            SvrSystem.MailSystem.sendNewMail(
                uId,
                gameId,
                mailCfgId,
                rewards,
                extraJson
            )
        end)
        if not ok then
            log_error("LuxuryCarR send test mail failed: uid:{0} error:{1}", uId, tostring(err))
            return false, err
        end

        log_info("LuxuryCarR send test mail: uid:{0} mailCfgId:{1} rewardCoins:{2}",
            uId, mailCfgId, rewardCoins)
        return true
    end

    if playerSystem then
        return sendOne(playerSystem)
    end

    local sent, skipped, failed = 0, 0, 0
    for _, system in pairs(self.players) do
        local ok, reason = sendOne(system)
        if ok then
            sent = sent + 1
        elseif reason == "player offline" then
            skipped = skipped + 1
        else
            failed = failed + 1
        end
    end

    log_info("LuxuryCarR online test mail completed: sent:{0} skipped:{1} failed:{2}",
        sent, skipped, failed)
    return { sent = sent, skipped = skipped, failed = failed }
end
