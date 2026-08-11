----------------------------------------------------------------------
-- BountyFootballScene 豪华赛车游戏场景类
-- 继承自 SvrSystemBase，是游戏的核心场景管理器
-- 职责：
--   1. 维护回合状态机（下注 → 开奖 → 结算 → 新回合）
--   2. 管理所有在线玩家的注册与注销
--   3. 通过心跳计时器（onHeartbeat）驱动整个游戏流程
--   4. 协调回合结算、结果选择、排行榜生成等业务逻辑
--   5. 处理每日跨日重置与周榜结算
----------------------------------------------------------------------

require "GameBase.SvrSystemBase"
require "BountyFootball.BountyFootball"
require "BountyFootball.BountyFootballMachine"

-- BountyFootballScene 场景类定义，继承自 SvrSystemBase
BountyFootballScene = class__(SvrSystemBase)

-- 构造函数：初始化玩家列表、回合下注、历史结果、游戏状态、心跳计时器
function BountyFootballScene:ctor__()
    SvrSystemBase.ctor__(self, BountyFootballConst.gameName)
    self.players, self.roundPlayers, self.roundBets, self.historyResults = {}, {}, LCEmptyBets(), {}
    self.gameStatus, self.heartbeatTimer = LCGameStatus.bet, nil
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
function BountyFootballScene:onLoad(data)
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
    state.roundStep = state.roundStep or { todayRound = state.todayRound, status = LCGameStatus.bet, remainSecond = BountyFootballConst.betSeconds, result = -1, hot = {}, roundRank = {}, timestamp = 0 }
    -- 客户端只使用当天自然期号；全局 roundId 不进入前端协议。
    state.roundStep.todayRound = state.todayRound
    self.roundBets = state.roundBets or LCEmptyBets()
    self.historyResults = state.historyResults or {}
    self.heartbeatTimer = gTimer:addTimer(BountyFootballConst.heartbeatMs, BountyFootballConst.heartbeatMs, -1, function() self:onHeartbeat() end)
end

-- 场景关闭时移除心跳定时器，防止内存泄漏
function BountyFootballScene:onClose()
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

function BountyFootballScene:getScene() return self end

-- 判断游戏是否已停止
function BountyFootballScene:isStop() 
    return self.gameStatus == LCGameStatus.stop 
end

-- 注册玩家系统到场景（玩家进入游戏时调用）
function BountyFootballScene:registerPlayer(system)
    local uid = system:getUid()
    self.players[uid] = system
    local count = 0
    for _ in pairs(self.players) do count = count + 1 end
    log_info("BountyFootball player enter: uid:{0} onlineCount:{1}", uid, count)
end

-- 从场景注销玩家（玩家退出游戏时调用）
function BountyFootballScene:unregisterPlayer(uid)
    self.players[uid] = nil
    local count = 0
    for _ in pairs(self.players) do count = count + 1 end
    log_info("BountyFootball player leave: uid:{0} onlineCount:{1}", uid, count)
end

-- 根据用户ID获取对应的玩家系统
function BountyFootballScene:getPlayerSystem(uid) 
    return self.players[uid] 
end

-- 参与过本局下注的玩家即使中途离线，也必须继续参与结算和统计。
function BountyFootballScene:recordRoundPlayer(system)
    self.roundPlayers[system:getUid()] = system
end

-- 生成下一个回合ID（自增今日回合数）
function BountyFootballScene:nextRoundId()
    local state = self:getData()
    state.todayRound = (state.todayRound or 0) + 1
    state.roundId = GenUnionIncrId(state.todayRound)
    return state.todayRound
end

-- 获取当前回合步骤的深拷贝（避免外部修改影响内部状态）
function BountyFootballScene:getRoundStep()
    return LCClone(self:getData().roundStep)
end

-- 获取仅供服务端交易、调控和统计使用的全局唯一期号。
function BountyFootballScene:getRoundId()
    return self:getData().roundId
end

----------------------------------------------------------------------
-- newRound 开启新回合
-- 流程：
--   1. 今日回合数 +1
--   2. 重置 roundStep 为下注态（bet），重置剩余时间为 betSeconds
--   3. 清空当前回合的总下注池 roundBets
--   4. 通知所有玩家 onNewRound，让客户端进入下注界面
----------------------------------------------------------------------
function BountyFootballScene:newRound()
    local state = self:getData()
    state.todayRound = (state.todayRound or 0) + 1
    state.roundId = GenUnionIncrId(state.todayRound)
    state.roundStep = { todayRound = state.todayRound, status = LCGameStatus.bet, remainSecond = BountyFootballConst.betSeconds, result = -1, hot = LCEmptyBets(), roundRank = {}, timestamp = app__:utc_milli_s() }
    self.roundBets, state.roundBets = LCEmptyBets(), LCEmptyBets()

    local onlineCount = 0
    for _ in pairs(self.players) do onlineCount = onlineCount + 1 end
    log_info("BountyFootball new round: round:{0} roundId:{1} betSeconds:{2} onlinePlayers:{3}",
        state.todayRound, state.roundId, BountyFootballConst.betSeconds, onlineCount)

    for _, player in pairs(self.roundPlayers) do
        player:onNewRound()
    end
    for uid, player in pairs(self.players) do
        if not self.roundPlayers[uid] then
            player:onNewRound()
        end
    end
    self.roundPlayers = {}
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
function BountyFootballScene:settleCurrentRound()
    local state = self:getData()
    local step, roundId, roundRank = state.roundStep, state.roundId, {}

    -- Move out of the run state before issuing SDK requests.  addCoins may
    -- throw synchronously after a request is queued; leaving the state as run
    -- makes the one-second heartbeat issue the same settlement repeatedly.
    step.status, step.remainSecond = LCGameStatus.final, BountyFootballConst.finalSeconds

    local control = self.roundControl or { oddsType = 0, result = EGameOddsResult.Unknown, playerTab = {} }
    local rewards, gamePayData, gameRewardData = {}, {}, {}

    local roundTotalBet = 0
    local roundTotalReward = 0
    local playerCount = 0

    log_info("BountyFootball round settle start: round:{0} roundId:{1} result:{2} oddsType:{3} playerCount:{4}",
        step.todayRound, roundId, step.result, control.oddsType, #self.roundPlayers)

    for _, player in pairs(self.roundPlayers) do
        local bets = LCClone(player:getData().bets or LCEmptyBets())
        local betTotal = LCArraySum(bets)
        local rankItem, reward = player:settleCurrentRound(roundId, step.todayRound, step.result, control.oddsType)
        if rankItem then
            table.insert(roundRank, rankItem)
        end
        if reward ~= nil then
            local playerId = getAnalyPlayerId(player)
            if playerId ~= nil then
                rewards[playerId] = reward
            end
            roundTotalReward = roundTotalReward + math.max(0, math.floor(tonumber(reward) or 0))
        end
        if betTotal > 0 then
            playerCount = playerCount + 1
            roundTotalBet = roundTotalBet + betTotal
            local uid = player:getUid()
            local rewardTotal = math.max(0, math.floor(tonumber(reward) or 0))
            local rewardMap = {}
            if rewardTotal > 0 then
                rewardMap[step.result] = rewardTotal
            end
            local payData = { betMap = bets, betTotal = betTotal }
            local rewardData = { rewardMap = rewardMap, rewardTotal = rewardTotal }
            gamePayData[uid], gameRewardData[uid] = payData, rewardData
            local rawPlayer = player:getPlayer()
            if rawPlayer and rawPlayer.statisGameRound then
                rawPlayer:statisGameRound(roundId, payData, rewardData)
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
    log_info("BountyFootball round settle done: round:{0} roundId:{1} result:{2} totalBet:{3} totalReward:{4} profit:{5} betPlayers:{6} winners:{7}",
        step.todayRound, roundId, step.result, roundTotalBet, roundTotalReward, roundProfit, playerCount, #roundRank)

    -- 输出排行榜前3名
    for i, rank in ipairs(roundRank) do
        log_info("BountyFootball round rank#{0}: uid:{1} name:{2} revenue:{3}", i, rank.uid, rank.name, rank.revenue)
    end

    -- 测试邮件功能：每局结算完成后，给当前在线的所有玩家发送一次测试邮件。  只能测试使用
    -- self:sendTestMailToPlayer()
end

----------------------------------------------------------------------
-- onHeartbeat 心跳回调，驱动整个游戏流程的核心引擎
-- 
-- 执行逻辑：
--   1.【跨日检测】比较当前日期与状态中存储的日期，若发生变化：
--      - 结算日榜（RankCommon:finalize day）
--      - 若为周一（%w == "1"），额外结算上周周榜
--      - 重置今日数据（todayRound=0, 清空下注池）
--      - 通知所有玩家 onNewDay
--      - 立即开启新回合
--   2.【倒计时推进】将当前回合的 remainSecond 减1
--   3.【状态机流转】当倒计时归零时：
--      - bet → run：调用 selectResult 选出开奖结果，切换到运行态
--      - run → final：调用 settleCurrentRound 进行结算
--      - final → 新回合：调用 newRound 开启下一轮下注
--   4.【广播状态】每次心跳都广播 onRoundStep，同步给所有客户端
-- 
-- 状态机流转图：
--   bet(下注) ──倒计时结束──► run(开奖) ──倒计时结束──► final(结算) ──倒计时结束──► bet(新回合)
----------------------------------------------------------------------
function BountyFootballScene:onHeartbeat()
    local today = os.date("%Y-%m-%d")
    local state = self:getData()
    -- 跨日检测：日期变更时触发日榜/周榜结算和数据重置
    if state.today ~= today then
        SvrSystem.RankCommon.finalize(state.today, "day")
        -- 周一额外结算周榜（因为周榜周期为周一至周日，周日结束后在周一触发结算）
        if os.date("%w") == "1" then 
            SvrSystem.RankCommon.finalize(state.today, "week")
        end
        state.today, state.todayRound, state.roundId, self.roundBets = today, 0, nil, LCEmptyBets()
        state.roundBets = self.roundBets
        for _, player in pairs(self.players) do 
            player:onNewDay()
        end
        self:newRound()
    end
    local step = state.roundStep
    step.remainSecond = (step.remainSecond or 0) - 1
    -- 倒计时归零：根据当前状态推进到下一阶段
    if step.remainSecond <= 0 then
        if step.status == LCGameStatus.bet then
            -- 下注阶段结束：选择开奖结果，切换到运行（开奖）阶段
            step.result, step.status, step.remainSecond = self:selectResult(), LCGameStatus.run, BountyFootballConst.runSeconds
            self:finishResult(step.result)
        elseif step.status == LCGameStatus.run then
            -- 开奖阶段结束：结算本回合
            self:settleCurrentRound()
        elseif step.status == LCGameStatus.final then
            -- 结算展示阶段结束：开启新回合
            self:newRound()
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
--   4. 创建 BountyFootballMachine 实例，调用 selectControlledResult 选择受控结果
--      - 普通模式按权重随机；受控模式遍历全部有效位置，选出符合条件的结果
--   5. 将开奖控制信息保存到 self.roundControl，供结算时使用
--   6. 返回选中的开奖结果（0-15，对应16个开奖号码）
----------------------------------------------------------------------
function BountyFootballScene:selectResult()
    local state = self:getData()
    local step, roundId, playerTab = state.roundStep, state.roundId, {}
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

    log_info("模拟全局调控数据  固定数据 ---  analy {0}", tableToString(analy))

    if gAnaly and gAnaly.multiAnaly then
        local ok, result = pcall(gAnaly.multiAnaly, gAnaly, playerTab, roundId)
        if ok and type(result) == "table" then
            analy = result
            analyzed = true
        end
    end

    -- 创建老虎机控制器并选择受控结果
    local machine = BountyFootballMachine(self, nil)
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
function BountyFootballScene:addRoundBets(bets)
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
function BountyFootballScene:finishResult(result)
    table.insert(self.historyResults, result)
    if #self.historyResults > 20 then 
        table.remove(self.historyResults, 1)
    end
    self:getData().historyResults = self.historyResults
end

-- 获取当前回合所有玩家的下注列表（用于客户端展示全员下注情况）
-- 返回每个有下注的玩家 uid、下注旗帜数组（0/1表示各位置是否有下注）
function BountyFootballScene:getRoundAllBetList()
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
function BountyFootballScene:broadcast(route, msg)
    for _, system in pairs(self.players) do
        local player = system:getPlayer()
        if player and player:isOnline() and Router.Client[route] then
            Router.Client[route](msg, player)
        end
    end
end


-- 获取排行榜列表（从 RankCommon 服务按日期查询）
-- 将原始数据转换为客户端需要的格式：uid、头像、昵称、收益、排名
function BountyFootballScene:rankList(dateStr, count)
    local raw, result = SvrSystem.RankCommon.getRankListByDateStrSync(dateStr or os.date("%Y-%m-%d"), count or 100) or {}, {}
    for _, item in ipairs(raw) do
        table.insert(result, { uid = item.uid, profile = item.avatar or "", name = item.name or "", revenue = item.score or 0, rank = item.rank or 0 })
    end
    return result
end


-- Send a test mail to one online player, or to every online player when
-- playerSystem is nil.  This is an explicit operation and is intentionally
-- not called from round settlement.
function BountyFootballScene:sendTestMailToPlayer(playerSystem, mailCfgId, rewardCoins, extraJson)
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
            log_error("BountyFootball send test mail failed: uid:{0} error:{1}", uId, tostring(err))
            return false, err
        end

        log_info("BountyFootball send test mail: uid:{0} mailCfgId:{1} rewardCoins:{2}",
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

    log_info("BountyFootball online test mail completed: sent:{0} skipped:{1} failed:{2}",
        sent, skipped, failed)
    return { sent = sent, skipped = skipped, failed = failed }
end