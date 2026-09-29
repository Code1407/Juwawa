-- ============================================================
-- LuckyFruitsScene 模块：游戏场景与回合生命周期控制
-- 继承自 SvrSystemBase，作为整个游戏服的单例场景系统。
-- 核心职责：
--   1. 通过心跳定时器驱动回合状态机（bet→run→final→bet循环）
--   2. 管理在线玩家、本回合参与玩家、回合下注聚合
--   3. 调用LuckyFruitsMachine生成开奖结果并广播
--   4. 结算玩家奖励、更新排行榜、记录历史
--   5. 优雅关服：等待当前回合结算完成后再关闭
-- ============================================================

require "GameBase.SvrSystemBase"
require "LuckyFruits.LuckyFruits"
require "LuckyFruits.LuckyFruitsMachine"

LuckyFruitsScene = class__(SvrSystemBase)

-- 获取今日日期字符串：用于日切判断
local function todayString() return os.date("%Y-%m-%d") end

local TIMELINE_VERSION = 2
local function serverNowMs() return os.time() * 1000 end

local function normalizeWheelPos(value)
    local pos = math.floor(tonumber(value) or 0) % 16
    if pos < 0 then pos = pos + 16 end
    return pos
end

-- 客户端动画结束时指针最终停留的位置，作为下一局的权威起点。
local function resultFinalStopPos(step)
    local winPos = tonumber(step and step.winPos) or -1
    local resultPos = step and step.resultPos or {}
    if winPos == 9 then
        return normalizeWheelPos(resultPos[#resultPos] or 6)
    elseif winPos >= 0 and winPos < 9 then
        return normalizeWheelPos(resultPos[1])
    elseif winPos == 10 or winPos == 13 then
        return 6
    elseif winPos == 11 or winPos == 12 or winPos == 14 then
        return 14
    end
    return normalizeWheelPos(step and step.rollStartPos)
end

-- 保留旧倒计时“递减到-1才切换”的总时长，同时为客户端提供可定位的绝对时间轴。
local function enterPhase(step, status, remainSecond, nowMs)
    nowMs = nowMs or serverNowMs()
    local durationMs = math.max(0, math.ceil((tonumber(remainSecond) or 0) + 1)) * 1000
    step.status = status
    step.remainSecond = remainSecond
    step.serverNowMs = nowMs
    step.phaseStartedAtMs = nowMs
    step.phaseEndsAtMs = nowMs + durationMs
    step.timelineVersion = TIMELINE_VERSION
end

local function refreshPhaseClock(step, nowMs)
    nowMs = nowMs or serverNowMs()
    step.serverNowMs = nowMs
    step.timelineVersion = tonumber(step.timelineVersion) or TIMELINE_VERSION
    if (tonumber(step.phaseEndsAtMs) or 0) > 0 then
        step.remainSecond = math.ceil((step.phaseEndsAtMs - nowMs) / 1000) - 1
    end
end

-- 从子系统获取玩家PID：用于调控分析时标识玩家
local function analyPlayerId(system)
    local player = system and system.getPlayer and system:getPlayer() or nil
    return player and player.getPid and player:getPid() or nil
end

-- 构造函数：初始化玩家表、回合数据、待处理下注计数、关服标记
function LuckyFruitsScene:ctor__()
    SvrSystemBase.ctor__(self, LuckyFruitsConst.gameName)
    self.players, self.roundPlayers, self.roundPlayerPids = {}, {}, {}
    self.roundBets, self.roundChipCounts = LFEmptyBets(), LFEmptyChipCounts()
    self.pendingBetCount, self.closingFinished = 0, false
    self.pendingBetAmounts = {}
    self.roundOutcomes, self.roundOutcomeIds = {}, {}
end

-- 场景数据加载：恢复或初始化回合上下文、回合步骤、历史记录
-- 启动心跳定时器驱动回合状态机
function LuckyFruitsScene:onLoad(data)
    SvrSystemBase.onLoad(self, data or {})
    local state = self:getData()
    state.today = state.today or todayString()
    state.todayRound = math.max(1, tonumber(state.todayRound) or 1)
    state.lastStopPos = normalizeWheelPos(state.lastStopPos)
    -- 回合上下文：日期+今日回合序号+全局唯一roundId
    state.roundContext = state.roundContext or {
        date = state.today,
        todayRound = state.todayRound,
        roundId = GenUnionIncrId(state.todayRound),
    }
    -- 回合步骤：状态机当前状态、剩余秒数、开奖结果
    state.roundStep = state.roundStep or {
        todayRound = state.todayRound,
        status = LFGameStatus.bet,
        remainSecond = LuckyFruitsConst.betSeconds,
        serverNowMs = 0,
        phaseStartedAtMs = 0,
        phaseEndsAtMs = 0,
        timelineVersion = TIMELINE_VERSION,
        rollStartPos = state.lastStopPos,
        winPos = -1,
        resultDetail = {},
        resultPos = {},
    }
    -- 旧存档没有时间锚点：以加载时刻和旧剩余秒数平滑恢复当前阶段。
    if (tonumber(state.roundStep.phaseEndsAtMs) or 0) <= 0 then
        enterPhase(state.roundStep, state.roundStep.status, state.roundStep.remainSecond, serverNowMs())
    else
        refreshPhaseClock(state.roundStep)
    end
    -- 兼容旧存档；开奖位置必须随回合持久化，供中途进入和断线重连恢复。
    if type(state.roundStep.resultPos) ~= "table" then
        if (state.roundStep.status == LFGameStatus.run or state.roundStep.status == LFGameStatus.final)
            and (tonumber(state.roundStep.winPos) or -1) >= 0 then
            state.roundStep.resultPos = LFResultPositions({
                winPos = state.roundStep.winPos,
                resultDetail = state.roundStep.resultDetail or {},
            })
        else
            state.roundStep.resultPos = {}
        end
    end
    state.roundStep.rollStartPos = normalizeWheelPos(state.roundStep.rollStartPos or state.lastStopPos)
    state.roundStep.timelineVersion = TIMELINE_VERSION
    if state.roundStep.status == LFGameStatus.run or state.roundStep.status == LFGameStatus.final then
        state.lastStopPos = resultFinalStopPos(state.roundStep)
    end
    state.gameHistory = state.gameHistory or {}
    self.roundBets = state.roundBets or LFEmptyBets()
    self.roundChipCounts = state.roundChipCounts or LFEmptyChipCounts()
    -- stop 只用于优雅关服，不能作为可恢复的游戏阶段。服务重启后直接
    -- 开启新回合，避免心跳永久停在 status=0 且倒计时持续变成负数。
    if state.roundStep.status == LFGameStatus.stop then
        self.closingRequested, self.closingFinished = false, false
        self:newRound()
    end
    -- 启动心跳定时器：固定间隔触发onHeartbeat驱动回合状态流转
    self.heartbeatTimer = gTimer:addTimer(
        LuckyFruitsConst.heartbeatMs,
        LuckyFruitsConst.heartbeatMs,
        -1,
        function() self:onHeartbeat() end
    )
end

-- 场景关闭：移除心跳定时器并交由基类清理
function LuckyFruitsScene:onClose()
    if self.heartbeatTimer then gTimer:removeTimer(self.heartbeatTimer) end
    SvrSystemBase.onClose(self)
end

function LuckyFruitsScene:getScene() return self end

-- 判断是否停止服务：关服标记、维护状态、或GameApp正在等待关闭
function LuckyFruitsScene:isStop()
    local status = self:getData().roundStep.status
    return status == LFGameStatus.stop or status == LFGameStatus.maintenance
        or self.closingRequested
        or (gApp and gApp.isWaitClosing and gApp:isWaitClosing())
end

-- 准备关服：判断当前回合是否需要等待结算
-- 需结算条件：开奖中，或下注阶段且有玩家下注/有待处理下注
-- 返回true表示需要等待当前回合结算完成
function LuckyFruitsScene:prepareServerClosing()
    local step = self:getData().roundStep
    local needSettle = step.status == LFGameStatus.run
        or (step.status == LFGameStatus.bet and (LFArraySum(self.roundBets) > 0 or self.pendingBetCount > 0))
    self.closingRequested = true
    if not needSettle then step.status = LFGameStatus.stop end
    return needSettle
end

-- 完成关服：标记已关闭并通知GameApp完成关闭流程
-- 幂等设计：closingFinished防止重复触发
function LuckyFruitsScene:finishServerClosing()
    if self.closingFinished then return end
    self.closingFinished = true
    self:getData().roundStep.status = LFGameStatus.stop
    if gApp and gApp.finishClosing then gApp:finishClosing() end
end

-- 注册在线玩家到场景：玩家进入时调用
function LuckyFruitsScene:registerPlayer(system)
    local uid = system:getUid()
    local roundPlayer = self.roundPlayers[uid]
    if roundPlayer and roundPlayer ~= system then
        -- 离线玩家仍保留在本局参与列表中；重新登录创建的新对象必须接回
        -- 已确认的下注，否则入场快照为空，继续下注还会覆盖旧的结算对象。
        local data, roundData = system:getData(), roundPlayer:getData()
        data.bets = LFClone(roundData.bets or LFEmptyBets())
        data.chipCounts = LFClone(roundData.chipCounts or LFEmptyChipCounts())
        self:recordRoundPlayer(system)
    elseif not roundPlayer then
        -- 存储中的下注可能属于已经结束的回合，以场景参与列表为准。
        system:onNewRound()
    end
    self.players[uid] = system
end

-- 注销玩家：玩家离开时调用
function LuckyFruitsScene:unregisterPlayer(uid)
    self.players[tostring(uid)] = nil
end

-- 记录本回合参与玩家：用于结算时遍历
-- 校验systemUid与rawPlayer的uid一致性，防止身份错乱
function LuckyFruitsScene:recordRoundPlayer(system, rawPlayer)
    rawPlayer = rawPlayer or (system and system:getPlayer())
    if not system or not rawPlayer then return false end
    local uid = tostring(system:getUid())
    local rawUid = rawPlayer.getUid and tostring(rawPlayer:getUid()) or ""
    local pid = rawPlayer.getPid and rawPlayer:getPid() or nil
    if uid ~= rawUid or not pid then
        log_error("LuckyFruits round player identity mismatch: systemUid:{0} rawUid:{1} pid:{2}", uid, rawUid, tostring(pid))
        return false
    end
    self.roundPlayers[uid], self.roundPlayerPids[uid] = system, pid
    return true
end

-- 待处理下注计数：用于关服时判断是否还有异步扣币未完成
-- 按全局回合ID和UID预占额度，避免异步扣款期间的并发请求绕过单局上限。
-- 放在场景中，使玩家断线重连后仍能读取在途金额；旧回合回调只释放旧额度。
function LuckyFruitsScene:getPendingBetAmount(roundId, uid)
    local amounts = self.pendingBetAmounts[roundId]
    return amounts and amounts[tostring(uid)] or 0
end

function LuckyFruitsScene:beginPendingBet(roundId, uid, amount)
    local amounts = self.pendingBetAmounts[roundId] or {}
    self.pendingBetAmounts[roundId] = amounts
    uid = tostring(uid)
    amounts[uid] = (amounts[uid] or 0) + amount
    self.pendingBetCount = self.pendingBetCount + 1
end

function LuckyFruitsScene:endPendingBet(roundId, uid, amount)
    local amounts = self.pendingBetAmounts[roundId]
    if amounts then
        uid = tostring(uid)
        local remaining = (amounts[uid] or 0) - amount
        amounts[uid] = remaining > 0 and remaining or nil
        if next(amounts) == nil then self.pendingBetAmounts[roundId] = nil end
    end
    self.pendingBetCount = math.max(0, self.pendingBetCount - 1)
end

-- 日切处理：若日期已变更则按排行榜模块规则结算/清理奖励，并重置今日回合序号
function LuckyFruitsScene:rolloverDay()
    local state, current = self:getData(), todayString()
    if state.today == current then return end
    local rankCommon = GameSystem and GameSystem.RankCommon
    if rankCommon and rankCommon.onOClock then
        rankCommon:onOClock(0)
    end
    state.today, state.todayRound = current, 0
    -- 通知所有在线玩家新一天开始：清零今日收益
    for _, system in pairs(self.players) do system:onNewDay() end
end

-- 开始新回合：若正在关服则完成关闭，否则日切检查后初始化新回合
-- 返回false表示无法开始新回合（正在关服）
function LuckyFruitsScene:newRound()
    if gApp and gApp.isWaitClosing and gApp:isWaitClosing() then
        self:finishServerClosing()
        return false
    end
    self:rolloverDay()
    local state = self:getData()
    -- 回合序号+1并生成新的全局roundId
    state.todayRound = (state.todayRound or 0) + 1
    state.roundContext = {
        date = state.today,
        todayRound = state.todayRound,
        roundId = GenUnionIncrId(state.todayRound),
    }
    -- 重置回合步骤为下注阶段
    state.roundStep = {
        todayRound = state.todayRound,
        status = LFGameStatus.bet,
        remainSecond = LuckyFruitsConst.betSeconds,
        serverNowMs = 0,
        phaseStartedAtMs = 0,
        phaseEndsAtMs = 0,
        timelineVersion = TIMELINE_VERSION,
        rollStartPos = normalizeWheelPos(state.lastStopPos),
        winPos = -1,
        resultDetail = {},
        resultPos = {},
    }
    enterPhase(state.roundStep, LFGameStatus.bet, LuckyFruitsConst.betSeconds)
    -- 清空本回合下注数据
    self.roundBets, self.roundChipCounts = LFEmptyBets(), LFEmptyChipCounts()
    state.roundBets, state.roundChipCounts = self.roundBets, self.roundChipCounts
    -- 通知所有玩家新回合开始：清空本回合下注
    for _, system in pairs(self.roundPlayers) do system:onNewRound() end
    for uid, system in pairs(self.players) do
        if not self.roundPlayers[uid] then system:onNewRound() end
    end
    self.roundPlayers, self.roundPlayerPids, self.roundControl = {}, {}, nil
    return true
end

function LuckyFruitsScene:getRoundStep()
    local step = self:getData().roundStep
    refreshPhaseClock(step)
    return LFClone(step)
end
function LuckyFruitsScene:getRoundContext() return LFClone(self:getData().roundContext) end

-- 获取当前回合ID：用于绑定下注与回合
function LuckyFruitsScene:getRoundId()
    local context = self:getData().roundContext
    return context and context.roundId or nil
end

-- 记录回合开奖结果：用于跨回合延迟奖励查询
-- 最多保留20条历史结果，超出则淘汰最旧的
function LuckyFruitsScene:recordRoundOutcome(roundId, result, oddsType)
    if not roundId then return end
    if not self.roundOutcomes[roundId] then self.roundOutcomeIds[#self.roundOutcomeIds + 1] = roundId end
    self.roundOutcomes[roundId] = { result = LFClone(result), oddsType = tonumber(oddsType) or 0 }
    while #self.roundOutcomeIds > 20 do
        self.roundOutcomes[table.remove(self.roundOutcomeIds, 1)] = nil
    end
end

-- 查询历史回合结果：用于跨回合下注的延迟奖励计算
function LuckyFruitsScene:getRoundOutcome(roundId) return self.roundOutcomes[roundId] end

-- 选择开奖结果：收集本回合下注玩家→调用gAnaly获取调控参数→调用Machine选择结果
function LuckyFruitsScene:selectResult(roundId)
    local playerTab = {}
    for _, system in pairs(self.roundPlayers) do
        if LFArraySum(system:getData().bets) > 0 then
            local pid, player = analyPlayerId(system), system:getPlayer()
            if pid and player then playerTab[pid] = player end
        end
    end
    -- 默认无限制调控参数
    local analy, analyzed = { analyType = EAnalyType.NoLimit, oddsType = 0, rerandomMax = 100 }, false
    -- 调用gAnaly多玩家分析：获取放水/收割调控指令
    if gAnaly and gAnaly.multiAnaly then
        local ok, result = pcall(gAnaly.multiAnaly, gAnaly, playerTab, roundId)
        if ok and type(result) == "table" then analy, analyzed = result, true end
    end
    -- 调用调控机选择结果
    local machine = LuckyFruitsMachine(self)
    local result, gameOddsResult = machine:selectControlledResult(self.roundPlayers, analy, roundId)
    -- 记录调控信息：供结算时上报与审计
    self.roundControl = {
        oddsType = machine.oddsType,
        result = gameOddsResult,
        playerTab = playerTab,
        analyzed = analyzed,
    }
    return result
end

-- 累加回合下注并广播：携带下注者UID，供客户端区分自己与其他玩家的下注
function LuckyFruitsScene:addRoundBets(bets, chipCounts, uid)
    for i = 1, 5 do self.roundBets[i] = (self.roundBets[i] or 0) + (bets[i] or 0) end
    self.roundChipCounts = LFMergeChipCounts(self.roundChipCounts, chipCounts)
    local state = self:getData()
    state.roundBets, state.roundChipCounts = self.roundBets, self.roundChipCounts
    self:broadcast("onbatNoticeAll", { uid = tostring(uid), wheelAmount = self.roundChipCounts })
end

-- 获取本回合所有玩家下注列表：用于客户端展示其他玩家下注
function LuckyFruitsScene:getRoundAllBetList()
    local list = {}
    for uid, system in pairs(self.roundPlayers) do
        local data, flags = system:getData(), LFEmptyBets()
        if LFArraySum(data.bets) > 0 then
            for i = 1, 5 do flags[i] = (data.bets[i] or 0) > 0 and 1 or 0 end
            list[#list + 1] = {
                uid = uid,
                betGradeArr = flags,
                betGradeNum = data.chipCounts or LFEmptyChipCounts(),
            }
        end
    end
    return list
end

-- 保存游戏历史：记录每回合开奖结果，最多20条
function LuckyFruitsScene:saveGameHistory(step)
    local history = self:getData().gameHistory
    history[#history + 1] = { date = os.date("%x"), round = step.todayRound, roundResult = step.winPos }
    while #history > 20 do table.remove(history, 1) end
end

-- 结算当前回合：遍历所有参与玩家计算奖励并异步入账
-- 同时记录历史、上报统计数据
function LuckyFruitsScene:settleCurrentRound(roundId, nowMs)
    local state = self:getData()
    local step = state.roundStep
    local control = self.roundControl or { oddsType = 0, result = EGameOddsResult.Unknown, playerTab = {} }
    local rewards, gamePayData, gameRewardData = {}, {}, {}

    -- 设置结算阶段状态
    enterPhase(step, LFGameStatus.final, LuckyFruitsConst.finalSeconds, nowMs)
    for uid, system in pairs(self.roundPlayers) do
        local bets = LFClone(system:getData().bets or LFEmptyBets())
        local pid = self.roundPlayerPids[uid]
        -- 调用玩家子系统结算：返回奖励金额
        local _, reward = system:settleCurrentRound(
            roundId, step.todayRound, step.winPos, step.resultDetail, control.oddsType, uid, pid
        )
        if reward ~= nil then
            if pid then rewards[pid] = reward end
            -- 构造统计上报数据：按符号细分奖励
            local betTotal = LFArraySum(bets)
            local rewardMap = {}
            for _, rewardId in ipairs(step.resultDetail) do
                local one = LFRevenue(bets, { rewardId })
                if one > 0 then rewardMap[tostring(rewardId)] = (rewardMap[tostring(rewardId)] or 0) + one end
            end
            gamePayData[uid] = { betMap = bets, betTotal = betTotal }
            gameRewardData[uid] = { rewardMap = rewardMap, rewardTotal = reward }
            -- 玩家级统计上报
            local player = pid and gWorld:findAllPlayer(pid) or system:getPlayer()
            if player and player.statisGameRound then
                player:statisGameRound(roundId, gamePayData[uid], gameRewardData[uid])
            end
        end
    end
    -- 服务器级统计上报
    if next(gamePayData) and gApp and gApp.statisGameRound then
        gApp:statisGameRound(roundId, gamePayData, gameRewardData)
    end
    -- 调控结果提交：将实际奖励与调控目标回传给gAnaly用于模型优化
    if control.analyzed and gAnaly and gAnaly.multiCommitAnaly then
        gAnaly:multiCommitAnaly(control.playerTab, rewards, roundId, control.result)
    end

    self:saveGameHistory(step)
    -- 广播开奖结果；排行榜统一走独立 RankPSystem/RankCommon 异步链路。
    self:broadcast("onRewardHandler", { winCard = tostring(step.winPos), resultDetail = step.resultDetail })
end

-- 心跳回调：驱动回合状态机流转
-- bet→run(开奖)→final(结算)→bet(下一轮)，每秒触发一次
function LuckyFruitsScene:onHeartbeat()
    if self.closingFinished then return end
    local state = self:getData()
    local step = state.roundStep
    local nowMs = serverNowMs()
    -- stop/maintenance 以及未知状态都不是可推进的回合阶段；保持当前
    -- 倒计时不变，等待关服完成、维护解除或重启恢复。
    if step.status ~= LFGameStatus.bet
        and step.status ~= LFGameStatus.run
        and step.status ~= LFGameStatus.final then
        refreshPhaseClock(step, nowMs)
        self:broadcast("onRoundStep", step)
        return
    end
    local roundId = self:getRoundId()
    refreshPhaseClock(step, nowMs)
    -- 阶段结束帧仍会下发remainSecond=-1，ReadyView依赖它完成旧界面收尾。
    self:broadcast("onRoundStep", step)
    if nowMs < step.phaseEndsAtMs then return end

    if step.status == LFGameStatus.bet then
        -- 下注阶段结束：生成开奖结果，并按协议写入整数倒计时初值。
        local result = self:selectResult(roundId)
        step.winPos, step.resultDetail = result.winPos, result.resultDetail
        step.resultPos = LFResultPositions(result)
        state.lastStopPos = resultFinalStopPos(step)
        local runSeconds = LFRunSeconds(result)
        self:recordRoundOutcome(roundId, result, self.roundControl and self.roundControl.oddsType or 0)
        enterPhase(step, LFGameStatus.run, runSeconds, nowMs)
        -- 先同步run阶段的绝对时间锚点，随后结果事件即可立即按时间轴启动。
        self:broadcast("onRoundStep", step)
        self:broadcast("onResultHandler", {
            todayRound = step.todayRound,
            rollStartPos = step.rollStartPos,
            winPos = step.winPos,
            resultDetail = step.resultDetail,
            resultPos = step.resultPos,
        })
    elseif step.status == LFGameStatus.run then
        -- 开奖阶段结束：结算玩家奖励
        self:settleCurrentRound(roundId, nowMs)
        self:broadcast("onRoundStep", step)
        -- 关服中：结算完成后直接关闭
        if gApp and gApp.isWaitClosing and gApp:isWaitClosing() then
            return self:finishServerClosing()
        end
    elseif step.status == LFGameStatus.final then
        -- 结算阶段结束：开始新回合并立即同步新的下注时间轴。
        self:newRound()
        self:broadcast("onRoundStep", self:getData().roundStep)
    end
end

-- 广播消息给场景内所有在线玩家
-- route为Router.Client中的消息名，message为消息体
function LuckyFruitsScene:broadcast(route, message)
    for _, system in pairs(self.players) do
        local player = system:getPlayer()
        if player and player:isOnline() and Router.Client[route] then Router.Client[route](message, player) end
    end
end
