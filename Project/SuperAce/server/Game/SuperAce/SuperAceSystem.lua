require "CommomDefine"
require "GameBase.SystemBase"
require "SuperAce.SuperAceMachine"

-- SuperAce 玩家系统：处理下注、结算、免费游戏、客户端协议推送、关服收尾等玩家侧逻辑。
-- 持有 SuperAceMachine 实例生成盘面，并通过 data 持久化 lastResult/totalFreeResults/activeRound 等。
-- 枚举统一引用 CommomDefine：ETradeCode / ECoinsOperateType / EGameOddsResult。
SuperAceSystem = class__(SystemBase)

-- 游戏状态机：Stop=空闲 Bet=可下注 Run=旋转中 Final=结算中 CoolDown=扣款中(防重入)
local EGameStatus = {
    Stop = 0,
    Bet = 1,
    Run = 2,
    Final = 4,
    CoolDown = 6
}

-- 工具函数区：round 四舍五入；safeNumber 安全数值转换(NaN/Inf 兜底)；
-- defaultData 返回玩家初始持久化数据；emptyResult 返回空盘面结果占位。
local function round(value)
    return math.floor(value + 0.5)
end

local function safeNumber(value, defaultValue)
    value = tonumber(value)
    if not value or value ~= value or value == math.huge or value == -math.huge then
        return defaultValue
    end
    return value
end

-- 玩家初始持久化数据：lastResult=上一局结果 totalFreeResults=待播放免费局队列
-- activeRound=进行中回合 lastSettledRoundId=最近完成回合(用于幂等 StopRound)
-- analysisSession=单控会话 playerSettings=客户端偏好。
local function defaultData()
    return {
        lastResult = nil,
        totalFreeResults = {},
        activeRound = nil,
        lastSettledRoundId = 0,
        analysisSession = nil,
        playerSettings = {
            soundVol = 1,
            lastBetAmountButton = 0,
            isSpeed = false
        }
    }
end

-- 空盘面结果占位：当无实际结果时用于填充协议响应，保证字段结构完整。
local function emptyResult()
    return {
        betAmount = 0,
        calculateAmount = 0,
        resultItems = {},
        multiple = 0,
        multiples = {},
        freeCount = 0,
        multipleKinds = {0, 0, 0, 0, 0, 0, 0, 0, 0}
    }
end

-- 构造玩家系统：初始化老虎机算法实例与回合状态机。
function SuperAceSystem:ctor__(player)
    SystemBase.ctor__(self, "SuperAce", player)
    self.machine = SuperAceMachine()
    self.machineStatus = EGameStatus.Stop
    self.runningRoundId = 0
    self.requestPending = false
end

-- 加载持久化数据并修复缺失字段；若存在进行中回合则进入 Run 状态，否则 Bet。
function SuperAceSystem:onLoad(data)
    data = type(data) == "table" and data or defaultData()
    data.totalFreeResults = type(data.totalFreeResults) == "table" and data.totalFreeResults or {}
    data.lastSettledRoundId = data.lastSettledRoundId or 0
    data.playerSettings = type(data.playerSettings) == "table" and data.playerSettings or {}
    if data.playerSettings.soundVol == nil then data.playerSettings.soundVol = 1 end
    if data.playerSettings.lastBetAmountButton == nil then data.playerSettings.lastBetAmountButton = 0 end
    if data.playerSettings.isSpeed == nil then data.playerSettings.isSpeed = false end
    SystemBase.onLoad(self, data)

    if data.activeRound then
        self.machineStatus = EGameStatus.Run
        self.runningRoundId = data.activeRound.roundId or 0
    else
        self.machineStatus = EGameStatus.Bet
        self.runningRoundId = 0
    end
end

-- 进入场景：绑定场景系统并注册玩家，再推送当前回合状态。
function SuperAceSystem:onEnter()
    SystemBase.onEnter(self)
    local sceneSystem = SvrSystem and SvrSystem.SuperAce
    self.scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if self.scene then
        self.scene:registerPlayer(self)
    end
    self:pushRoundStep()
end

-- 离开场景：先取消注册再走基类清理。
function SuperAceSystem:onLeave()
    if self.scene then
        self.scene:unregisterPlayer(self)
    end
    SystemBase.onLeave(self)
end

-- 清理：若有未结算回合(且不在请求中)则静默结算兜底。
function SuperAceSystem:onCleanup()
    local data = self:getData()
    if data and data.activeRound and not self.requestPending then
        self:settleRound(data.activeRound.roundId, false)
    end
    SystemBase.onCleanup(self)
end

-- 获取当前玩家对象。
function SuperAceSystem:_player()
    return self:getPlayer()
end

-- 是否仍有待播放的免费局(队列非空或上一局刚触发免费)。
function SuperAceSystem:hasPendingFreeRounds()
    local data = self:getData()
    if not data then return false end
    return #(data.totalFreeResults or {}) > 0 or
        (type(data.lastResult) == "table" and (tonumber(data.lastResult.freeCount) or 0) > 0)
end

-- 是否存在未结算回合(请求挂起/有进行中回合/有未播免费局)，供关服收尾使用。
function SuperAceSystem:hasUnsettledRounds()
    local data = self:getData()
    return self.requestPending == true or
        (data and data.activeRound ~= nil) or
        self:hasPendingFreeRounds()
end

-- 保留当前局和已经触发的免费次数，交由客户端继续按正常协议完成。
function SuperAceSystem:prepareServerClosing()
    if self:_isServerClosing() and not self:hasUnsettledRounds() then
        self.machineStatus = EGameStatus.Stop
        self.runningRoundId = 0
    end
end

-- 触发场景尝试完成关服。
function SuperAceSystem:_tryFinishServerClosing()
    if self.scene and self.scene.tryFinishServerClosing then
        self.scene:tryFinishServerClosing()
    end
end

-- 是否处于关服流程：场景标记或全局 gApp 待关闭。
function SuperAceSystem:_isServerClosing()
    if self.scene and self.scene.isClosing and self.scene:isClosing() then
        return true
    end
    return (gApp and gApp.isWaitClosing and gApp:isWaitClosing()) or false
end

-- 通过 Router.Client 推送协议消息；路由不存在时记录错误日志。
function SuperAceSystem:_send(name, msg)
    local route = Router.Client[name]
    if not route then
        log_error("SuperAce route not found: {}", name)
        return
    end
    route(msg, self:_player())
end

-- 组装统一的下注/结算响应消息：code+hasResult+result+roundId。
function SuperAceSystem:_resultMessage(code, result, roundId)
    return {
        code = code or ETradeCode.Success,
        hasResult = result ~= nil,
        result = result or emptyResult(),
        roundId = roundId or 0
    }
end

-- 顶号式重连时，旧 Player 实例的 onCleanup 可能正在异步结算，而新 Player
-- 实例已根据尚未清理的 activeRound 初始化成 Run。旧实例随后完成派彩并清掉
-- 共享持久化数据，但不会修改新实例的 machineStatus，最终形成：
-- activeRound=nil、lastSettledRoundId 已更新，但 machineStatus/runningRoundId 仍是旧局。
-- 所有对外同步都先以持久化回合为权威修复这组状态，避免客户端永久锁在 Run。
function SuperAceSystem:_reconcileRoundState()
    local data = self:getData()
    if not data then return end

    local activeRound = data.activeRound
    if activeRound then
        local activeRoundId = activeRound.roundId or 0
        if not self.requestPending and (
            self.machineStatus ~= EGameStatus.Run or
            tostring(self.runningRoundId or 0) ~= tostring(activeRoundId)
        ) then
            log_warn(
                "SuperAce repair active round state, uid={}, status={}, runningRound={}, activeRound={}",
                self:_player():getUid(), self.machineStatus, self.runningRoundId, activeRoundId
            )
            self.machineStatus = EGameStatus.Run
            self.runningRoundId = activeRoundId
        elseif self.runningRoundId == 0 then
            self.runningRoundId = activeRoundId
        end
        return
    end

    if not self.requestPending and (
        self.machineStatus == EGameStatus.Run or
        self.machineStatus == EGameStatus.Final or
        (self.machineStatus == EGameStatus.Bet and self.runningRoundId ~= 0)
    ) then
        log_warn(
            "SuperAce repair settled round state, uid={}, status={}, runningRound={}, lastSettledRound={}",
            self:_player():getUid(), self.machineStatus, self.runningRoundId, data.lastSettledRoundId or 0
        )
        self.machineStatus = EGameStatus.Bet
        self.runningRoundId = 0
    end
end

-- 组装进入游戏所需的初始化数据：账户信息、上一局结果、玩家设置、当前回合与状态。
function SuperAceSystem:getEnterData()
    self:_reconcileRoundState()
    local player = self:_player()
    local data = self:getData()
    return {
        account = {
            diamond = math.max(0, player:getCoins()),
            avatar = player:getAvatarUrl() or "",
            nickname = player:getName() or "",
            uid = player:getUid() or ""
        },
        hasLastResult = data.lastResult ~= nil,
        lastResult = data.lastResult or emptyResult(),
        playerSettings = data.playerSettings,
        runningRoundId = self.runningRoundId,
        machineStatus = self.machineStatus
    }
end

-- 推送进入游戏响应。
function SuperAceSystem:enterGame()
    self:_send("CsSuperAceEnterResp", self:getEnterData())
end

-- 与 SDK 同步账户信息后回送最新数据；SDK 不可用时返回 SdkDisconnect。
function SuperAceSystem:synchronize()
    local player = self:_player()
    player:refreshSdk(function(errCode, backPlayer)
        if not backPlayer then
            self:_send("CsSuperAceSynchronizeResp", {
                code = errCode or ETradeCode.SdkDisconnect,
                data = self:getEnterData()
            })
            return
        end
        self:_send("CsSuperAceSynchronizeResp", {
            code = errCode or ETradeCode.Success,
            data = self:getEnterData()
        })
    end)
end

-- 更新玩家偏好设置：soundVol(0-1) lastBetAmountButton(0-100) isSpeed(布尔)，并回写持久化。
function SuperAceSystem:updateSettings(settings)
    settings = type(settings) == "table" and settings or {}
    local saved = self:getData().playerSettings
    if settings.soundVol ~= nil then
        saved.soundVol = math.max(0, math.min(1, safeNumber(settings.soundVol, saved.soundVol)))
    end
    if settings.lastBetAmountButton ~= nil then
        saved.lastBetAmountButton = math.max(0, math.min(100, math.floor(safeNumber(
            settings.lastBetAmountButton, saved.lastBetAmountButton
        ))))
    end
    if settings.isSpeed ~= nil then
        saved.isSpeed = settings.isSpeed == true
    end
    self:_send("CsSuperAceUpdateSettingsResp", {code = ETradeCode.Success, playerSettings = saved})
end

-- 主动推送回合状态变更(回合ID+状态+余额)，客户端据此刷新 UI。
function SuperAceSystem:pushRoundStep()
    self:_send("ScSuperAceRoundStepPush", {
        runningRoundId = self.runningRoundId,
        status = self.machineStatus,
        accountDiamond = math.max(0, self:_player():getCoins())
    })
end

-- 修改状态机；断线清理使用 notifyClient=false 静默结算，避免旧实例的异步
-- 回调把状态/余额消息发送到刚登录的新实例连接。
function SuperAceSystem:_setStatus(status, roundId, notifyClient)
    self.machineStatus = status
    self.runningRoundId = roundId or 0
    if notifyClient ~= false then
        self:pushRoundStep()
    end
end

-- 生成新回合 ID：优先用全局生成器，否则退化为微秒时间戳。
function SuperAceSystem:_newRoundId()
    if gApp and gApp.genRoundId then
        return gApp:genRoundId()
    end
    return app__:time_micro_s()
end

-- 调用单控分析服务获取本回合的控奖参数(analyType/rerandomMax/rewardMax 等)，失败兜底为 nil。
function SuperAceSystem:_analyze(roundId)
    if not gAnaly or not gAnaly.singleAnaly then
        return nil
    end
    local ok, result = pcall(function()
        return gAnaly:singleAnaly(self:_player(), roundId)
    end)
    if not ok then
        log_error("SuperAce singleAnaly failed, uid={}, round={}, error={}", self:_player():getUid(), roundId, result)
        return nil
    end
    if type(result) ~= "table" then
        log_error("SuperAce singleAnaly returned invalid result, uid={}, round={}", self:_player():getUid(), roundId)
        return nil
    end
    return result
end

-- 提交本回合的最终派彩与结果码给分析服务，用于后续 RTP/杀分统计。
function SuperAceSystem:_commitAnalyze(roundId, reward, resultCode)
    if not gAnaly or not gAnaly.singleCommitAnaly then
        return
    end
    local ok, err = pcall(function()
        gAnaly:singleCommitAnaly(self:_player(), reward, roundId, resultCode)
    end)
    if not ok then
        log_error("SuperAce singleCommitAnaly failed, uid={}, round={}, error={}",
            self:_player():getUid(), roundId, err)
    end
end

-- 校验下注参数：必须为正整数且未超过 JS 安全整数上限(2^53-1)。
function SuperAceSystem:_validateBet(betAmount, calculateAmount)
    betAmount = safeNumber(betAmount, 0)
    calculateAmount = safeNumber(calculateAmount, 0)
    if betAmount <= 0 or calculateAmount <= 0 then
        return nil, nil, ETradeCode.Fail
    end
    if betAmount ~= math.floor(betAmount) or calculateAmount ~= math.floor(calculateAmount) then
        return nil, nil, ETradeCode.Fail
    end
    if betAmount > 9007199254740991 or calculateAmount > 9007199254740991 then
        return nil, nil, ETradeCode.Fail
    end
    return betAmount, calculateAmount, nil
end

-- 普通下注流程：前置校验(关服/参数/状态/SDK/余额) -> 扣款 -> 生成盘面 -> 落库 -> 推送。
-- 异步回调中处理扣款失败、生成结果与单控会话，并尝试关服收尾。
function SuperAceSystem:betNormal(betAmount, calculateAmount)
    local player = self:_player()
    local data = self:getData()
    local invalidCode
    if self:_isServerClosing() then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(ETradeCode.CloseServer))
        return
    end
    betAmount, calculateAmount, invalidCode = self:_validateBet(betAmount, calculateAmount)
    if invalidCode then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(invalidCode))
        return
    end
    if self.requestPending then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(ETradeCode.CoolDown))
        return
    end
    if self.machineStatus ~= EGameStatus.Bet or data.activeRound or #data.totalFreeResults > 0 then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(ETradeCode.MissTime))
        return
    end
    if not player:checkSdkIsValid() then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(ETradeCode.SdkDisconnect))
        return
    end
    if player:getCoins() < betAmount then
        self:_send("CsSuperAceBetNormalResp", self:_resultMessage(ETradeCode.Insufficient))
        return
    end

    local roundId = self:_newRoundId()
    self.requestPending = true
    self:_setStatus(EGameStatus.CoolDown, 0)
    player:subCoins(roundId, ECoinsOperateType.BetSub, betAmount, function(errCode, _, backPlayer)
        self.requestPending = false
        if errCode ~= ETradeCode.Success or not backPlayer then
            self:_setStatus(EGameStatus.Bet, 0)
            self:_send("CsSuperAceBetNormalResp", self:_resultMessage(errCode or ETradeCode.Fail, nil, roundId))
            self:_tryFinishServerClosing()
            return
        end

        local analysis = self:_analyze(roundId)
        local result, freeResults, gameResult = self.machine:getResults(betAmount, calculateAmount, analysis)
        data.lastResult = result
        data.totalFreeResults = freeResults
        data.analysisSession = analysis and {
            roundId = roundId,
            totalReward = 0,
            oddsType = analysis.oddsType or 0,
            resultCode = gameResult or EGameOddsResult.Success
        } or nil
        data.activeRound = {
            roundId = roundId,
            gameType = "normal",
            result = result,
            betPaid = betAmount,
            revenue = round(result.calculateAmount * result.multiple),
            oddsType = analysis and analysis.oddsType or 0
        }
        self:_setStatus(EGameStatus.Run, roundId)
        local response = self:_resultMessage(ETradeCode.Success, result, roundId)
        self:_send("CsSuperAceBetNormalResp", response)
        self:_tryFinishServerClosing()
    end, {calculateAmount = calculateAmount})
end

-- 免费局下注：从 totalFreeResults 队列弹出下一个免费结果作为本回合结果，无需扣款。
function SuperAceSystem:betFree()
    local data = self:getData()
    if self.requestPending then
        self:_send("CsSuperAceBetFreeResp", self:_resultMessage(ETradeCode.CoolDown))
        return
    end
    if self.machineStatus ~= EGameStatus.Bet or data.activeRound then
        self:_send("CsSuperAceBetFreeResp", self:_resultMessage(ETradeCode.MissTime))
        return
    end
    if not data.lastResult or data.lastResult.freeCount <= 0 or #data.totalFreeResults <= 0 then
        self:_send("CsSuperAceBetFreeResp", self:_resultMessage(ETradeCode.Fail))
        return
    end

    local result = table.remove(data.totalFreeResults, 1)
    local roundId = self:_newRoundId()
    data.lastResult = result
    data.activeRound = {
        roundId = roundId,
        gameType = "free",
        result = result,
        betPaid = 0,
        revenue = round(result.calculateAmount * result.multiple),
        oddsType = data.analysisSession and data.analysisSession.oddsType or 0
    }
    self:_setStatus(EGameStatus.Run, roundId)
    local response = self:_resultMessage(ETradeCode.Success, result, roundId)
    self:_send("CsSuperAceBetFreeResp", response)
end

-- 回合结算收尾：清理 activeRound、提交分析会话(免费局播完才提交)、
-- 统计回合、更新排行榜、推送余额变更与停止回合响应，最后尝试关服收尾。
function SuperAceSystem:_finishRound(activeRound, accountDiamond, notifyClient)
    local data = self:getData()
    local player = self:_player()
    data.activeRound = nil
    data.lastSettledRoundId = activeRound.roundId
    self.requestPending = false
    self:_setStatus(EGameStatus.Bet, 0, notifyClient)

    local analysisSession = data.analysisSession
    if analysisSession then
        analysisSession.totalReward = analysisSession.totalReward + activeRound.revenue
        if #data.totalFreeResults == 0 then
            self:_commitAnalyze(
                analysisSession.roundId,
                analysisSession.totalReward,
                analysisSession.resultCode or EGameOddsResult.Success
            )
            data.analysisSession = nil
        end
    end
    player:statisGameRound(
        activeRound.roundId,
        {[tostring(activeRound.result.betAmount)] = activeRound.betPaid},
        {[tostring(activeRound.result.betAmount)] = activeRound.revenue}
    )
    local rankPSys = player:getSystem("RankPSystem")
    local rankScore = activeRound.betPaid or 0
    if rankScore > 0 and rankPSys then
        rankPSys:updateRankList(rankScore)
    end

    if notifyClient ~= false then
        self:_send("ScSuperAceAccountUpdatePush", {
            value = accountDiamond,
            offset = activeRound.revenue
        })
        self:_send("CsSuperAceStopRoundResp", {
            code = ETradeCode.Success,
            accountDiamond = accountDiamond
        })
    end
    self:prepareServerClosing()
    self:_tryFinishServerClosing()
end

-- 结算进行中的回合(普通局/免费局统一入口)：核对 roundId 与状态后派彩。
-- 有收益则走 addCoins 异步派彩；无收益直接收尾。sendFailure 控制失败时是否回包。
function SuperAceSystem:settleRound(roundId, sendFailure)
    local data = self:getData()
    local activeRound = data.activeRound
    if not activeRound or tostring(activeRound.roundId) ~= tostring(roundId) then
        if sendFailure ~= false then
            -- StopRound 是幂等接口：成功响应丢失后客户端会使用同一个 roundId 重试。
            -- 已完成的同一回合直接返回当前余额，错误 roundId 才返回 RepeatOrder。
            local isSettledRound = not activeRound and roundId ~= nil and tostring(roundId) ~= "0" and
                tostring(data.lastSettledRoundId or 0) == tostring(roundId)
            -- 幂等成功同时必须修复新实例遗留的 Run 状态；否则客户端收到成功
            -- 后 synchronize 仍会看到旧局，继续无限恢复。
            if isSettledRound then
                self:_reconcileRoundState()
            end
            self:_send("CsSuperAceStopRoundResp", {
                code = isSettledRound and ETradeCode.Success or ETradeCode.RepeatOrder,
                accountDiamond = math.max(0, self:_player():getCoins())
            })
        end
        return
    end
    if self.requestPending then
        if sendFailure ~= false then
            self:_send("CsSuperAceStopRoundResp", {
                code = ETradeCode.CoolDown,
                accountDiamond = math.max(0, self:_player():getCoins())
            })
        end
        return
    end

    self.requestPending = true
    self:_setStatus(EGameStatus.Final, activeRound.roundId, sendFailure)
    if activeRound.revenue <= 0 then
        self:_finishRound(activeRound, math.max(0, self:_player():getCoins()), sendFailure)
        return
    end

    self:_player():addCoins(
        activeRound.roundId,
        activeRound.oddsType or 0,
        ECoinsOperateType.WinAdd,
        activeRound.revenue,
        function(errCode, _, backPlayer)
            -- 断线清理可能已经把同一 roundId 的派彩提交给 SDK，但回调后的
            -- activeRound 清理尚未来得及持久化。重连再次提交会得到 RepeatOrder；
            -- 这表示资金订单已成功落地，应按幂等成功完成本地回合，不能退回 Run 重试。
            if errCode == ETradeCode.RepeatOrder then
                local settledPlayer = backPlayer or self:_player()
                self:_finishRound(activeRound, math.max(0, settledPlayer:getCoins()), sendFailure)
                return
            end
            if errCode ~= ETradeCode.Success or not backPlayer then
                self.requestPending = false
                self:_setStatus(EGameStatus.Run, activeRound.roundId, sendFailure)
                if sendFailure ~= false then
                    self:_send("CsSuperAceStopRoundResp", {
                        code = errCode or ETradeCode.Fail,
                        accountDiamond = math.max(0, self:_player():getCoins())
                    })
                end
                self:_tryFinishServerClosing()
                return
            end
            self:_finishRound(activeRound, math.max(0, backPlayer:getCoins()), sendFailure)
        end,
        {multiples = activeRound.result.multiples}
    )
end

-- 客户端主动停止回合：转发到 settleRound 并始终回包。
function SuperAceSystem:stopRound(roundId)
    self:settleRound(roundId, true)
end

return SuperAceSystem
