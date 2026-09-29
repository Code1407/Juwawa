require "GameBase.SvrSystemBase"
require "GameError"
require "CommomDefine"
require "FootballLeague.FootballLeagueCfgMgr"
require "FootballLeague.GameBetData"
require "FootballLeague.GameAnalyData"
require "FootballLeague.GameUtils"

FootballLeagueMain = class__(SvrSystemBase)

local function normalizeSceneType(sceneType)
    sceneType = tonumber(sceneType) or EGameScene.Normal
    if sceneType < EGameScene.Normal or sceneType > EGameScene.Master then
        return EGameScene.Normal
    end
    return sceneType
end

local function getSceneChipRate(sceneType)
    local betMultiple = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetMultiple) or {}
    local chipRate = betMultiple[sceneType] or 1
    return chipRate
end

local DEFAULT_JACKPOT_POOL_INCR_RATE = 0.02
-- 高频下注期间合并热度广播，避免每笔下注都向全服重复序列化同一份三场数据。
local HOT_BET_PUSH_INTERVAL_MS = 200
-- JP 为全服单池；沿用已有奖池 map 的字符串 key 约定，0 不会与任何实际下注档位冲突。
local JACKPOT_POOL_KEY = "0"
-- 开发阶段单池改造的首次加载会清除旧分档奖池；版本写入后不会再次重置。
-- 20260918: bump 到 2 手动重置 JP 奖池，下次 getAllJackpotPool 时重置为初始默认值。
local JACKPOT_POOL_FORMAT_VERSION = 2
-- 投放计划规则变更时，用此版本废弃旧计划，避免热更新后继续沿用“只在最后一局”的遗留计划。
local JACKPOT_PLAN_FORMAT_VERSION = 2
local DEFAULT_JACKPOT_PERCENTAGES = {0.05, 0.15}

FRInitJackpotAmountPool = {
    [1] =       888,
    [5] =       1888,
    [10] =      2888,
    [20] =      5888,
    [50] =      8888,
    [100] =     18888,
    [200] =     28888,
    [500] =     58888,
    [1000] =    88888,
    [5000] =    188888,
}

local function roundInt(value)
    return math.floor((tonumber(value) or 0) + 0.5)
end

local function wheelGlobalCfg()
    return FootballLeagueCfgMgr:getGlobalCfg("base") or {}
end

local function numberArray(values, fallback)
    local result = {}
    values = type(values) == "table" and values or fallback or {}
    for index, value in ipairs(values) do
        result[index] = tonumber(value) or 0
    end
    return result
end

local function jackpotPercentages()
    local cfg = wheelGlobalCfg()
    if type(cfg.jackpotPercentages) == "table" then
        return numberArray(cfg.jackpotPercentages, DEFAULT_JACKPOT_PERCENTAGES)
    end
    -- 兼容旧的独立字段配置。按连续档位读取，新增档位无需再改服务端代码。
    local result = {}
    for stage = 1, 99 do
        local value = cfg["jackpotPercentage" .. stage]
        if value == nil then
            break
        end
        result[stage] = tonumber(value) or 0
    end
    return #result > 0 and result or DEFAULT_JACKPOT_PERCENTAGES
end

local function jackpotPercentageForStage(stage, stageMax)
    if not stage or (stageMax ~= nil and stageMax < 0) then
        return 0
    end
    if stageMax ~= nil then
        stage = math.min(stage, math.floor(stageMax) + 1)
    end
    return jackpotPercentages()[stage] or 0
end

-- JP 档位与盘面落点解耦。按调控档位和可支付额度过滤后随机选取，
-- 奖池过高时会自然回退到较低的百分比档位，而不是丢弃整次 JP 计划。
local function randomJackpotStage(stageMax, jackpotPoolAmount, maxJackpotAmount)
    local stages = {}
    local percentages = jackpotPercentages()
    local maxStage = #percentages
    if stageMax ~= nil then
        maxStage = math.min(maxStage, math.max(0, math.floor(stageMax) + 1))
    end
    for stage = 1, maxStage do
        local percentage = percentages[stage] or 0
        local jackpotAmount = math.floor((tonumber(jackpotPoolAmount) or 0) * percentage)
        if percentage > 0 and (maxJackpotAmount == nil or jackpotAmount <= maxJackpotAmount) then
            table.insert(stages, {stage = stage, amount = jackpotAmount})
        end
    end
    if #stages <= 0 then
        return nil
    end
    local selected = stages[gRandom:gen_between_int(1, #stages)]
    return selected.stage, selected.amount
end

local function firstBetChip()
    local cfgChips = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetChips) or {}
    return tonumber(cfgChips[1]) or 0
end

local function lastSceneChipRate()
    local betMultiple = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetMultiple) or {}
    return tonumber(betMultiple[#betMultiple]) or 1
end

-- 初始 JP：第一下注档 × 最后场景倍率 ÷ 10，再在 FR 初始池表中向下匹配档位。
local function defaultJackpotPoolAmount()
    local matchValue = firstBetChip() * lastSceneChipRate() / 10
    local matchedKey = 0
    for key, _ in pairs(FRInitJackpotAmountPool) do
        key = tonumber(key) or 0
        if key <= matchValue and key > matchedKey then
            matchedKey = key
        end
    end
    return tonumber(FRInitJackpotAmountPool[matchedKey]) or 0
end

local function wheelResultMultiple(sceneType, zhuanPanId, rewards)
    local total = 0
    for _, rewardId in ipairs(rewards or {}) do
        total = total + (tonumber(FootballLeagueCfgMgr:getRewardMult(rewardId, sceneType, zhuanPanId)) or 0)
    end
    return total
end

function FootballLeagueMain:ctor__()
    SvrSystemBase.ctor__(self, "FootballLeagueMain")

    self.betTime = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetTime) + 2
    self.openRawardTime = 12

    self.gameState = EGameState.Final
    self.roundOrders = {} --每局游戏订单记录

    self.settlemenTimerId = nil
    self.prepareTimerId = nil
    self.dalayPrepareTimerId = nil
    self.hotBetPushTimerId = nil

    self.roundResult = {
        round = 0,
        roundId = 0,
        prepareTime = 0,
        rewardIds = nil,
        zhuanPanId = nil
    }
    -- 一局的统计只能提交一次。派奖回调与兜底计时器都可能在结算后抵达，
    -- 不能让它们再次上报同一个 roundId。
    self.statisReportedRoundId = nil
    self.statisReportedPlayerPids = {}
end

--数据加载回调
function FootballLeagueMain:onLoad(data)
    if not data then
        data = {
        curGameInfo = {round = 0, prepareTime = 0, roundId = 0},
        resultHistory = {},
        jackpotAmountPool = {},
        resetRoundTime = 0
        }
    end
    SvrSystemBase.onLoad(self, data)
end

function FootballLeagueMain:clearData()
    self.roundOrders = {}
    self.gameBetData = nil
    self.statisReportedRoundId = nil
    self.statisReportedPlayerPids = {}

    if self.settlemenTimerId then
        gTimer:removeTimer(self.settlemenTimerId)
        self.settlemenTimerId = nil
    end

    if self.prepareTimerId then
        gTimer:removeTimer(self.prepareTimerId)
        self.prepareTimerId = nil
    end

    if self.dalayPrepareTimerId then
        gTimer:removeTimer(self.dalayPrepareTimerId)
        self.dalayPrepareTimerId = nil
    end

    if self.hotBetPushTimerId then
        gTimer:removeTimer(self.hotBetPushTimerId)
        self.hotBetPushTimerId = nil
    end
end

function FootballLeagueMain:checkNeedResetRound(lastTime, nowTime)
    if not lastTime or lastTime == 0 then
        return true
    end
    local date1 = os.date("*t", lastTime)
    local date2 = os.date("*t", nowTime)
    local isSameDay = date1.year == date2.year and date1.month == date2.month and date1.day == date2.day
    return not isSameDay
end

-- 每个周期随机安排固定次数。配置的 jackpotRateMin/Max 表示本周期的 JP 次数，
-- 投放局从整个周期中无放回抽取；不要复用新手局数作为禁投放局数，否则短周期会被钳到最后一局。
-- 计划保存到场景数据，热更新/进程恢复均不会重置已走过的周期。
function FootballLeagueMain:resetJackpotPlan(data)
    local cfg = wheelGlobalCfg()
    local period = math.max(1, math.floor(tonumber(cfg.jackpotPeriod) or 5000))
    local minRate = math.max(0, math.floor(tonumber(cfg.jackpotRateMin) or 2))
    local maxRate = math.max(minRate, math.floor(tonumber(cfg.jackpotRateMax) or minRate))
    local firstRound = 1
    local available = period
    local count = math.min(available, gRandom:gen_between_int(minRate, maxRate))
    local plan, selected = {}, {}
    while #plan < count do
        local round = gRandom:gen_between_int(firstRound, period)
        if not selected[round] then
            selected[round] = true
            table.insert(plan, round)
        end
    end
    table.sort(plan)
    data.jackpotPlanRounds = plan
    data.jackpotPlanFormatVersion = JACKPOT_PLAN_FORMAT_VERSION
end

-- JP 是单人奖：在本次 JP 盘面实际中奖的下注玩家中随机选择一人。
-- 排序后再抽取，避免 Lua pairs 遍历顺序影响随机序列的可复现性。
function FootballLeagueMain:getJackpotWinnerPid(rewards)
    local candidates = {}
    local playersBetData = self.gameBetData:getPlayersBetData(EGameScene.Master) or {}
    for pid, pbetInfo in pairs(playersBetData) do
        if self:getJackpotPoolIndexByBetMap(pbetInfo.betMap, rewards) > 0 then
            table.insert(candidates, pid)
        end
    end
    if #candidates <= 0 then
        return nil
    end
    table.sort(candidates, function(a, b) return tostring(a) < tostring(b) end)
    return candidates[gRandom:gen_between_int(1, #candidates)]
end

-- 推进 JP 周期并检查本局是否轮到待投放计划；仅检查，不消费计划。
-- 若本局没有同时满足下注和调控条件的盘面，计划会保留到后续可投放局。
function FootballLeagueMain:isJackpotHitDue()
    local data = self:getData()
    data.jackpotPaidRound = (tonumber(data.jackpotPaidRound) or 0) + 1
    local period = math.max(1, math.floor(tonumber(wheelGlobalCfg().jackpotPeriod) or 5000))
    local periodRound = ((data.jackpotPaidRound - 1) % period) + 1
    if data.jackpotPlanFormatVersion ~= JACKPOT_PLAN_FORMAT_VERSION then
        -- 老版本计划可能已经被错误地锁到周期末尾；中途不补发，下一周期按新规则完整重新排期。
        data.jackpotPlanFormatVersion = JACKPOT_PLAN_FORMAT_VERSION
        if periodRound ~= 1 then
            data.jackpotPlanRounds = {}
            return false
        end
    end
    if periodRound == 1 or type(data.jackpotPlanRounds) ~= "table" then
        self:resetJackpotPlan(data)
    end
    local plan = data.jackpotPlanRounds or {}
    if #plan > 0 and periodRound >= plan[1] then
        return true
    end
    return false
end

function FootballLeagueMain:consumeJackpotHit()
    local data = self:getData()
    local plan = data.jackpotPlanRounds
    if type(plan) ~= "table" or #plan <= 0 then
        log_info("JP计划消费失败：没有待投放计划")
        return false
    end
    table.remove(plan, 1)
    return true
end

function FootballLeagueMain:getScheduledJackpotZhuanPanId(gameAnalyData, maxReward)
    if not self:isJackpotHitDue() then
        return nil
    end

    local candidates = {}
    local stageMax = gameAnalyData and tonumber(gameAnalyData.jpPotStageMax) or nil
    local jackpotPoolAmount = self:getJackpotPoolAmount()
    -- JP 是本局附加奖励，仅从本场景已有下注、
    -- 且通过原有调控校验的格子中选择，避免命中 JP 后无人能领取。
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan") or {}
    for zhuanPanId, _ in ipairs(cfgZhuanPan) do
        local rewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
        local hasBet = false
        for _, rewardId in ipairs(rewards or {}) do
            if self.gameBetData:getGlobalBetValue(rewardId, EGameScene.Master) > 0 then
                hasBet = true
                break
            end
        end
        local reward = gameAnalyData and gameAnalyData:get_global_reward_by_rewards(rewards, zhuanPanId) or 0
        -- 保持现有调控约束，不因 JP 而放宽奖励、倍率、放水或整局奖励上限。
        if hasBet
            and (not gameAnalyData or gameAnalyData:check_result_valid(zhuanPanId, true))
            and (maxReward == nil or reward <= maxReward) then
            local maxJackpotAmount = nil
            if maxReward ~= nil then
                maxJackpotAmount = maxReward - reward
            end
            local jackpotStage, jackpotAmount = randomJackpotStage(stageMax, jackpotPoolAmount, maxJackpotAmount)
            if jackpotStage then
                table.insert(candidates, {
                    zhuanPanId = zhuanPanId,
                    jackpotStage = jackpotStage,
                    jackpotAmount = jackpotAmount
                })
            end
        end
    end
    if #candidates <= 0 then
        log_info("JP计划待投放，但当前控制额度内没有可支付的投注盘面或 JP 档位；保留计划等待后续场次")
        return nil
    end
    local selected = candidates[gRandom:gen_between_int(1, #candidates)]
    return selected.zhuanPanId, selected.jackpotStage, selected.jackpotAmount
end

--------------------------------------------

function FootballLeagueMain:playerEnterOrLeave(state)
    if state == 1 then    --有玩家进入
        if self.gameState == EGameState.Final then
            self:betPrepare()
        end
    elseif state == 0 then --有玩家离开 
        if not gWorld:hasPlayer() and self.gameState ~= EGameState.Bet then
            self.gameState = EGameState.Final
            self:clearData()
        end

        if gApp:isWaitClosing() then
            gApp:finishClosing()
            log_info("没人游戏服务器开始更新关闭")
        end
    end
end

function FootballLeagueMain:betPrepare()
    self:clearData();

    if gApp:isWaitClosing() then
        gApp:finishClosing()
        log_info("服务器在更新关闭过程中,停止下一局押注")
        return
    end

    if not gWorld:hasPlayer() then
        self.gameState = EGameState.Final
        return
    end

    self.gameBetData = GameBetData()

    local data = self:getData() 
    self.gameState = EGameState.Bet

    local lastTime = data.curGameInfo.prepareTime or 0
    local nowTime = app__:utc_s()
    if self:checkNeedResetRound(lastTime, nowTime) then
        data.curGameInfo.round = 0
    end

    local round = data.curGameInfo.round + 1
    local roundId = GenUnionIncrId(round)

    data.curGameInfo.round = round
    data.curGameInfo.roundId = roundId
    data.curGameInfo.prepareTime = nowTime

    self.roundResult = {
        round = round,
        roundId = roundId,
        prepareTime = nowTime
    }

    self:betPrepareCountDown()
    Router.Client.ScGamePreparePush({prepareTime = nowTime, round = data.curGameInfo.roundId}, gWorld)
    log_info("开始押注 时间:{0} 期数:{1}", nowTime, round)
end

-- 下注成功后合帧推送最新全服下注数据；不使用轮询，静止时不会产生网络消息。
function FootballLeagueMain:pushHotBetUpdate()
    if self.hotBetPushTimerId then
        return
    end
    self.hotBetPushTimerId = gTimer:addOnceTimer(HOT_BET_PUSH_INTERVAL_MS, function()
        self.hotBetPushTimerId = nil
        if self.gameState == EGameState.Bet then
            self:doPushHotBetUpdate()
        end
    end)
end

function FootballLeagueMain:doPushHotBetUpdate()
    if not self.gameBetData then
        return
    end

    local sceneInfos = {}
    local normalRewards = {}
    local normalHotBetMap = {}
    local normalBetTotal = 0
    for sceneType = EGameScene.Normal, EGameScene.Master do
        self.gameBetData:getBetHotRank3(sceneType)
        local rank3, hotBetMap = self.gameBetData:getInitHotRank3(sceneType)
        local betTotal = self.gameBetData:getBetTotal(sceneType)
        if sceneType == EGameScene.Normal then
            normalRewards = rank3
            normalHotBetMap = hotBetMap
            normalBetTotal = betTotal
        end
        table.insert(sceneInfos, {
            sceneType = sceneType,
            zhuanPanId = 0,
            rewards = rank3,
            wheelMultiple = FootballLeagueCfgMgr:getSceneWheelMultiple(sceneType),
            winNum = 0,
            betSelf = {},
            hotBetMap = hotBetMap,
            hotTeamId = self.gameBetData:getMostBetTeamId(sceneType),
            betTotal = betTotal,
            roundRank3 = {},
            jackpot = sceneType == EGameScene.Master and self:getJackpotAmount() or 0,
            jackpotAmount = 0,
            jackpotAmountPool = sceneType == EGameScene.Master and self:getAllJackpotPool() or {}
        })
    end
    Router.Client.ScHotBetRewardPush({
        rewards = normalRewards,
        hotBetMap = normalHotBetMap,
        betTotal = normalBetTotal,
        sceneInfos = sceneInfos
    }, gWorld)
end

--25s+2s(留2s网络延时缓冲)倒计时开始(下注)
function FootballLeagueMain:betPrepareCountDown()
   self.prepareTimerId = gTimer:addOnceTimer(self.betTime * 1000, function ()
        self:countDownEndCallback()
    end)
end

-- 倒计时不足 3 秒时不再接收下注，避免请求在开奖结算阶段才抵达。
function FootballLeagueMain:canBetWithRemainingTime()
    local prepareTime = self.roundResult and self.roundResult.prepareTime or 0
    local remainingTime = prepareTime + self.betTime - app__:utc_s()
    return remainingTime >= 3
end

--25s倒计时结束(开奖、结算)
function FootballLeagueMain:countDownEndCallback()
    self:checkHaveSdkOrderId(function ()
        self:betSettlement()
    end)
end

--判断sdk是否还有订单未处理
function FootballLeagueMain:checkHaveSdkOrderId(callback)
    if next(self.roundOrders) ~= nil then
        gTimer:addOnceTimer(2000, function ()
            callback()
        end)
    else
        callback()
    end
end

function FootballLeagueMain:getAllJackpotPool()
    local data = self:getData()
    if data.jackpotPoolFormatVersion ~= JACKPOT_POOL_FORMAT_VERSION then
        data.jackpotAmountPool = {
            [JACKPOT_POOL_KEY] = defaultJackpotPoolAmount()
        }
        data.jackpotPoolFormatVersion = JACKPOT_POOL_FORMAT_VERSION
    end
    data.jackpotAmountPool = data.jackpotAmountPool or {}
    local pool = data.jackpotAmountPool

    if pool[JACKPOT_POOL_KEY] == nil then
        pool[JACKPOT_POOL_KEY] = defaultJackpotPoolAmount()
    end
    -- 旧档位 key 不再参与服务端计算或下发，避免客户端按切换档位显示不同数值。
    for key, _ in pairs(pool) do
        if tostring(key) ~= JACKPOT_POOL_KEY then
            pool[key] = nil
        end
    end
    return pool
end

function FootballLeagueMain:getJackpotPoolAmount(_)
    local pool = self:getAllJackpotPool()
    return tonumber(pool[JACKPOT_POOL_KEY]) or 0
end

function FootballLeagueMain:getJackpotAmount()
    local pool = self:getAllJackpotPool()
    local amount = 0
    for _, value in pairs(pool) do
        amount = math.max(amount, tonumber(value) or 0)
    end
    return amount
end

-- 足球联赛使用全服单 JP 池；按统计接口要求推送该局结束时的池总额。
function FootballLeagueMain:statisRewardPool(roundId)
    if roundId == nil or not gApp or not gApp.statisRewardPool then
        return
    end
    gApp:statisRewardPool(roundId, math.floor(self:getJackpotPoolAmount()))
end

function FootballLeagueMain:increaseJackpotPoolAmount(_, amount)
    if not amount or amount <= 0 then
        return
    end
    local pool = self:getAllJackpotPool()
    local incr = tonumber(amount) or 0
    local current = tonumber(pool[JACKPOT_POOL_KEY]) or 0
    local baseAmount = math.max(1, defaultJackpotPoolAmount()) 

    --999W上限  
    if current > 3999999 then
        incr = incr / 4
    elseif current > 1999999 then
        incr = incr / 2
    elseif current < 200000 then
        incr = incr + incr
    elseif current < 500000 then
        incr = incr + incr / 2
    end
    -- 兜底上限，防止奖池超出 9999999
    pool[JACKPOT_POOL_KEY] = math.min(current + incr, 9999999)
end

function FootballLeagueMain:decreaseJackpotPoolAmount(_, amount)
    local pool = self:getAllJackpotPool()
    pool[JACKPOT_POOL_KEY] = math.max((tonumber(pool[JACKPOT_POOL_KEY]) or 0) - (tonumber(amount) or 0), 0)
end

function FootballLeagueMain:refundJackpotPoolAmount(_, amount)
    if not amount or amount <= 0 then
        return
    end
    local pool = self:getAllJackpotPool()
    pool[JACKPOT_POOL_KEY] = (tonumber(pool[JACKPOT_POOL_KEY]) or 0) + math.max(0, tonumber(amount) or 0)
end

function FootballLeagueMain:refreshMasterJackpotInfo(sceneInfos)
    if not sceneInfos or not sceneInfos[EGameScene.Master] then
        return
    end
    sceneInfos[EGameScene.Master].jackpot = self:getJackpotAmount()
    sceneInfos[EGameScene.Master].jackpotAmountPool = self:getAllJackpotPool()
end

function FootballLeagueMain:getPlayerJackpotPoolIndex(pid, rewards)
    local poolIndex = 0
    for _, rewardId in ipairs(rewards or {}) do
        local betValue = self.gameBetData:getPlayerBetValue(pid, rewardId, EGameScene.Master)
        if betValue and betValue > poolIndex then
            poolIndex = betValue
        end
    end
    return poolIndex
end

function FootballLeagueMain:getJackpotPoolIndexByBetMap(betMap, rewards)
    local poolIndex = 0
    for _, rewardId in ipairs(rewards or {}) do
        local betValue = betMap and betMap[rewardId] or 0
        if betValue and betValue > poolIndex then
            poolIndex = betValue
        end
    end
    return poolIndex
end

function FootballLeagueMain:getJackpotWinAmount(pid, sceneInfo, gameAnalyData)
    if not sceneInfo or sceneInfo.sceneType ~= EGameScene.Master or not sceneInfo.isJackpot then
        return 0, 0
    end
    if sceneInfo.jackpotWinnerPid == nil or tostring(pid) ~= tostring(sceneInfo.jackpotWinnerPid) then
        return 0, 0
    end

    local stageMax = gameAnalyData and tonumber(gameAnalyData.jpPotStageMax) or nil
    -- FruitSlots 的 jpPotStageMax 以 0 为最低档；高档被限制时向下回退派奖比例。
    local percentage = jackpotPercentageForStage(sceneInfo.jackpotStage, stageMax)
    if percentage <= 0 then
        return 0, 0
    end

    local poolIndex = self:getPlayerJackpotPoolIndex(pid, sceneInfo.rewards)
    if poolIndex <= 0 then
        return 0, 0
    end

    -- 记录扣款前奖池，派发日志需反映实际分走比例（取整后可能与配置比例略有差异）。
    local jackpotPoolBefore = self:getJackpotPoolAmount(poolIndex)
    local jackpotAmount = math.floor(jackpotPoolBefore * percentage)
    if jackpotAmount <= 0 then
        return 0, poolIndex
    end
    self:decreaseJackpotPoolAmount(poolIndex, jackpotAmount)
    return jackpotAmount, poolIndex, jackpotPoolBefore
end

-- 三个场景共用同一轮调控预算。multiAnaly 会按场景返回调控数据，
-- 因此 rewardMax、rewardRateMax 都必须按整轮总投注、总派奖校验，不能各场独立消耗。
local function getRoundRewardCap(analyDataMap, roundBetTotal)
    local rewardMax = nil
    local rewardRateMax = nil
    local preferLowestReward = false
    for sceneType = EGameScene.Normal, EGameScene.Master do
        -- analyDataMap 保存的是 { gameAnalyData = ... }；不能直接读取外层表。
        local item = analyDataMap[sceneType]
        local gameAnalyData = item and item.gameAnalyData
        local maxValue = gameAnalyData and tonumber(gameAnalyData.rewardMax) or 0
        local rateValue = gameAnalyData and tonumber(gameAnalyData.rewardRateMax) or 0
        if maxValue < 0 then
            -- 调控服务用负值表示收紧到最小赔付，而不是可直接比较的金额上限。
            preferLowestReward = true
        end
        if maxValue > 0 and (not rewardMax or maxValue < rewardMax) then
            rewardMax = maxValue
        end
        if rateValue > 0 and (not rewardRateMax or rateValue < rewardRateMax) then
            rewardRateMax = rateValue
        end
    end

    -- multiAnaly 的负 rewardMax 不是限额，只有正值参与整局预算。
    local cap = rewardMax
    if rewardRateMax then
        local rateCap = math.floor((roundBetTotal or 0) * rewardRateMax / 10000)
        cap = cap and math.min(cap, rateCap) or rateCap
    end
    return cap, rewardMax or 0, rewardRateMax or 0, preferLowestReward
end

local function getSceneResultReward(gameAnalyData, zhuanPanId)
    local rewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
    return gameAnalyData:get_global_reward_by_rewards(rewards, zhuanPanId)
end

-- 保留本场既有调控校验，并在此基础上筛掉会耗尽整局剩余额度的盘面。
local function getRoundValidZhuanpanIds(gameAnalyData, remainingReward)
    local validIds = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan") or {}
    for zhuanPanId, _ in ipairs(cfgZhuanPan) do
        local reward = getSceneResultReward(gameAnalyData, zhuanPanId)
        if reward <= remainingReward and gameAnalyData:check_result_valid(zhuanPanId) then
            table.insert(validIds, zhuanPanId)
        end
    end
    return validIds
end

-- 收紧态没有可用的正金额 rewardMax 时，逐场选真实派奖最小的盘面。
-- 三场的奖励互不交叉，分别取最小值即为整局总赔付最小值。
local function getLowestRewardZhuanpanIds(gameAnalyData)
    local lowestReward = nil
    local lowestIds = {}
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan") or {}
    for zhuanPanId, _ in ipairs(cfgZhuanPan) do
        if gameAnalyData:check_result_valid(zhuanPanId) then
            local reward = getSceneResultReward(gameAnalyData, zhuanPanId)
            if not lowestReward or reward < lowestReward then
                lowestReward = reward
                lowestIds = {zhuanPanId}
            elseif reward == lowestReward then
                table.insert(lowestIds, zhuanPanId)
            end
        end
    end
    return lowestIds, lowestReward
end

function FootballLeagueMain:buildRoundSceneInfos(roundId)
    local sceneInfos = {}
    local analyDataMap = {}

    -- 先获取全部场景的调控数据，再统一计算本局预算；不能在逐场开奖后才确定上限。
    for sceneType = EGameScene.Normal, EGameScene.Master do
        local gameAnalyData = GameAnalyData(self.gameBetData, roundId, sceneType)
        analyDataMap[sceneType] = {
            gameAnalyData = gameAnalyData
        }
    end

    local roundBetTotal = self.gameBetData:getBetTotal()
    local roundRewardMax, rawRewardMax, roundRewardRateMax, preferLowestReward = getRoundRewardCap(analyDataMap, roundBetTotal)
    local roundRewardTotal = 0
    for sceneType = EGameScene.Normal, EGameScene.Master do
        local gameAnalyData = analyDataMap[sceneType].gameAnalyData
        local zhuanPanId, gameOddsResult = gameAnalyData:get_game_result()
        if not zhuanPanId then
            return nil, nil
        end

        if preferLowestReward then
            local lowestIds, lowestReward = getLowestRewardZhuanpanIds(gameAnalyData)
            if #lowestIds <= 0 then
                log_error("收紧态没有可用的最低赔付盘面, round:{0}, scene:{1}", roundId, sceneType)
                return nil, nil
            end
            zhuanPanId = gameAnalyData:random_zhuanpan_by_zhuanpans(lowestIds)
            gameOddsResult = EGameOddsResult.RulerMax
            log_info("收紧态选择最低赔付盘面, round:{0}, scene:{1}, reward:{2}, zhuanPanId:{3}", roundId, sceneType, lowestReward, zhuanPanId)
        end

        if roundRewardMax ~= nil then
            local remainingReward = roundRewardMax - roundRewardTotal
            local reward = getSceneResultReward(gameAnalyData, zhuanPanId)
            if reward > remainingReward then
                local validIds = getRoundValidZhuanpanIds(gameAnalyData, remainingReward)
                if #validIds <= 0 then
                    log_error("整局奖励上限内没有可用开奖结果, round:{0}, scene:{1}, rewardMax:{2}, used:{3}", roundId, sceneType, roundRewardMax, roundRewardTotal)
                    return nil, nil
                end
                zhuanPanId = gameAnalyData:random_zhuanpan_by_zhuanpans(validIds)
                gameOddsResult = EGameOddsResult.RulerMax
                reward = getSceneResultReward(gameAnalyData, zhuanPanId)
                log_info("整局奖励上限重选开奖结果, round:{0}, scene:{1}, rewardMax:{2}, used:{3}, reward:{4}, zhuanPanId:{5}", roundId, sceneType, roundRewardMax, roundRewardTotal, reward, zhuanPanId)
            end
            roundRewardTotal = roundRewardTotal + reward
        end

        local rewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
        local isJackpot = false
        local jackpotStage = nil
        local jackpotWinnerPid = nil
        -- FruitSlots 规则：仅非大赢局参与 JP 周期投放，命中周期时可落在任意合法盘面格。
        if sceneType == EGameScene.Master and not preferLowestReward then
            local bigWinMultiple = tonumber(wheelGlobalCfg().bigWinMultiple) or 100
            if wheelResultMultiple(sceneType, zhuanPanId, rewards) < bigWinMultiple then
                local currentReward = getSceneResultReward(gameAnalyData, zhuanPanId)
                -- Master 盘面会替换当前结果，故可用额度应包含当前 Master 已占用的部分。
                local maxScheduledReward = nil
                if roundRewardMax ~= nil then
                    maxScheduledReward = roundRewardMax - roundRewardTotal + currentReward
                end
                local scheduledZhuanPanId, scheduledJackpotStage, scheduledJackpotAmount = self:getScheduledJackpotZhuanPanId(gameAnalyData, maxScheduledReward)
                if scheduledZhuanPanId then
                    local scheduledReward = getSceneResultReward(gameAnalyData, scheduledZhuanPanId)
                    local canUseScheduledResult = roundRewardMax == nil
                        or roundRewardTotal - currentReward + scheduledReward + (scheduledJackpotAmount or 0) <= roundRewardMax
                    if canUseScheduledResult and self:consumeJackpotHit() then
                        if roundRewardMax ~= nil then
                            roundRewardTotal = roundRewardTotal - currentReward + scheduledReward + (scheduledJackpotAmount or 0)
                        end
                        zhuanPanId = scheduledZhuanPanId
                        rewards = FootballLeagueCfgMgr:getRewardsByZhuanPanId(zhuanPanId)
                        isJackpot = true
                        jackpotStage = scheduledJackpotStage
                        jackpotWinnerPid = self:getJackpotWinnerPid(rewards)
                        if not jackpotWinnerPid then
                            -- 防御性兜底：盘面下注数据在本局内变化时不发空 JP。
                            isJackpot = false
                            jackpotStage = nil
                        end
                        gameOddsResult = EGameOddsResult.Success
                        log_info("JP plan hit, round:{0}, zhuanPanId:{1}, stage:{2}, jackpotAmount:{3}, winnerPid:{4}", roundId, zhuanPanId, jackpotStage, scheduledJackpotAmount or 0, jackpotWinnerPid)
                    else
                        log_error("JP计划盘面未消费，保留原开奖结果, round:{0}, rewardMax:{1}, used:{2}, scheduledReward:{3}", roundId, roundRewardMax, roundRewardTotal, scheduledReward)
                    end
                end
            end
        end
        sceneInfos[sceneType] = {
            sceneType = sceneType,
            zhuanPanId = zhuanPanId,
            rewards = rewards,
            wheelMultiple = FootballLeagueCfgMgr:getSceneWheelMultiple(sceneType),
            winNum = 0,
            betSelf = {},
            betTotal = self.gameBetData:getBetTotal(sceneType),
            roundRank3 = {},
            isJackpot = isJackpot,
            jackpotStage = jackpotStage,
            jackpotWinnerPid = jackpotWinnerPid,
            jackpot = sceneType == EGameScene.Master and self:getJackpotAmount() or 0,
            jackpotAmount = 0,
            jackpotAmountPool = sceneType == EGameScene.Master and self:getAllJackpotPool() or {}
        }
        analyDataMap[sceneType].gameOddsResult = gameOddsResult
    end
    if roundRewardMax ~= nil or preferLowestReward then
        log_info("整局开奖结果奖励汇总, round:{0}, bet:{1}, reward:{2}, cap:{3}, rewardMax:{4}, rewardRateMax:{5}", roundId, roundBetTotal, roundRewardTotal, roundRewardMax, rawRewardMax, roundRewardRateMax)
    end
    return sceneInfos, analyDataMap
end

function FootballLeagueMain:cloneSceneInfosForPlayer(sceneInfos, sceneWins, sceneJackpotWins)
    self:refreshMasterJackpotInfo(sceneInfos)
    local infos = {}
    for sceneType = EGameScene.Normal, EGameScene.Master do
        local item = sceneInfos[sceneType]
        table.insert(infos, {
            sceneType = sceneType,
            zhuanPanId = item.zhuanPanId,
            rewards = item.rewards,
            wheelMultiple = item.wheelMultiple or FootballLeagueCfgMgr:getSceneWheelMultiple(sceneType),
            winNum = sceneWins and sceneWins[sceneType] or 0,
            betSelf = item.betSelf or {},
            betTotal = item.betTotal or 0,
            roundRank3 = item.roundRank3 or {},
            jackpot = item.jackpot or 0,
            jackpotAmount = sceneJackpotWins and sceneJackpotWins[sceneType] or 0,
            jackpotAmountPool = item.jackpotAmountPool or {}
        })
    end
    return infos
end

function FootballLeagueMain:getSceneInfoByTeamId(sceneInfos, team_id)
    team_id = normalizeSceneType(team_id)
    if not sceneInfos then
        return nil
    end

    local sceneInfo = sceneInfos[team_id]
    if sceneInfo then
        return sceneInfo
    end

    for _, item in pairs(sceneInfos) do
        if item and normalizeSceneType(item.sceneType) == team_id then
            return item
        end
    end
    return nil
end

function FootballLeagueMain:cloneGameResultByTeamId(item, team_id)
    team_id = normalizeSceneType(team_id)
    local sceneInfo = self:getSceneInfoByTeamId(item and item.sceneInfos, team_id)
    return {
        team_id = team_id,
        prepareTime = item.prepareTime,
        round = item.round,
        zhuanPanId = sceneInfo and sceneInfo.zhuanPanId or item.zhuanPanId,
        rewards = sceneInfo and sceneInfo.rewards or item.rewards,
        sceneInfos = sceneInfo and {sceneInfo} or item.sceneInfos or {}
    }
end

function FootballLeagueMain:cloneBetHistoryByTeamId(info, team_id)
    team_id = normalizeSceneType(team_id)
    local sceneInfo = self:getSceneInfoByTeamId(info and info.sceneInfos, team_id)
    return {
        team_id = team_id,
        serverIndex = info.serverIndex,
        prepareTime = info.prepareTime,
        round = info.round,
        betMap = info.betMap,
        rewards = sceneInfo and sceneInfo.rewards or info.rewards,
        zhuanPanId = sceneInfo and sceneInfo.zhuanPanId or info.zhuanPanId,
        addCoins = info.addCoins,
        sceneInfos = sceneInfo and {sceneInfo} or info.sceneInfos or {}
    }
end

--延时准备
function FootballLeagueMain:dealyPrepare()
    self.dalayPrepareTimerId = gTimer:addOnceTimer(self.openRawardTime * 1000, function ()
        self:betPrepare()
    end)
end

--押注结算
function FootballLeagueMain:betSettlement()
    self.gameState = EGameState.Run
    self.roundOrders = {}

    if not self.gameBetData then
        self:dealyPrepare()
        return
    end

    local roundId = self.roundResult.roundId
    local round = self.roundResult.round

    local sceneInfos, analyDataMap = self:buildRoundSceneInfos(roundId)
    if not sceneInfos then
        self:dealyPrepare()
        return log_error("buildRoundSceneInfos nil")
    end
    self.roundResult.sceneInfos = sceneInfos

    local normalInfo = sceneInfos[EGameScene.Normal]
    local zhuanPanId = normalInfo.zhuanPanId
    local rewards = normalInfo.rewards

    for sceneType = EGameScene.Normal, EGameScene.Master do
        local info = sceneInfos[sceneType]
        log_info("第{0}局场景{1}开奖结果 zhuanpanId:{2} rewards:{3}", round, sceneType, info.zhuanPanId, log_view(info.rewards))
    end

    --保存游戏结果
    self:saveGameResult(sceneInfos)

    local havePlayerBet = self.gameBetData:checkHavePlayerBet()
    local winPlayerMap = {}
    local noWinPlayerMap = {}
    -- 在结算开始时固化身份；统计上报不能依赖稍后的异步派奖回调仍能找到玩家。
    local roundPlayerUidMap = {}
    local roundPlayerMap = {}
    local sceneJackpotAmountMap = {}

    local commitAnalyPlayer = {}
    local commitAnalyReward = {}

    --计算每个玩家赚多少
    for sceneType = EGameScene.Normal, EGameScene.Master do
        local sceneInfo = sceneInfos[sceneType]
        local playersBetData = self.gameBetData:getPlayersBetData(sceneType)

        for pid, pbetInfo in pairs(playersBetData) do
            local player = gWorld:findAllPlayer(pid)
            if player then
                local playerUid = player:getUid()
                roundPlayerUidMap[pid] = playerUid
                roundPlayerMap[pid] = player
                commitAnalyPlayer[pid] = player
                local betMap = pbetInfo.betMap
                local betTotal = pbetInfo.betTotal
                local win = 0
                local jackpotWin = 0
                local jackpotPoolIndex = 0
                local jackpotPoolBefore = 0
                local presult = {}
                for _, id in ipairs(sceneInfo.rewards) do
                    local singleWin = 0
                    local multiple = FootballLeagueCfgMgr:getRewardMult(id, sceneType, sceneInfo.zhuanPanId)
                    if multiple then
                        if betMap[id] and betMap[id] > 0 then
                            singleWin = multiple * betMap[id]
                            win = win + singleWin
                        end
                        presult[tostring(id)] = singleWin
                    else
                        log_error("betSettlement reward multiple is nil, rewardId:{0}, sceneType:{1}, zhuanPanId:{2}", id, sceneType, sceneInfo.zhuanPanId)
                    end
                end

                if sceneType == EGameScene.Master then
                    local analyInfo = analyDataMap[sceneType]
                    jackpotWin, jackpotPoolIndex, jackpotPoolBefore = self:getJackpotWinAmount(pid, sceneInfo, analyInfo and analyInfo.gameAnalyData)
                    if jackpotWin > 0 then
                        win = win + jackpotWin
                        sceneJackpotAmountMap[sceneType] = (sceneJackpotAmountMap[sceneType] or 0) + jackpotWin
                        local jackpotPoolCurrent = self:getJackpotPoolAmount(jackpotPoolIndex)
                        local jackpotPayoutRate = jackpotPoolBefore > 0 and jackpotWin / jackpotPoolBefore * 100 or 0
                        log_info("第{0}局Master场景玩家[{1}]分走JP:{2}, 开奖前奖池:{3}, 当前奖池:{4}, 分走比例:{5}%", round, playerUid, jackpotWin, jackpotPoolBefore, jackpotPoolCurrent, string.format("%.2f", jackpotPayoutRate))
                    end
                end

                log_info("第{0}局场景{1}结算时玩家[{2}] 总计押注:{3}, 押注详情:{4}", round, sceneType, playerUid, betTotal, log_view(betMap))

                if win > 0 then
                    winPlayerMap[pid] = winPlayerMap[pid] or {
                        pid = pid,
                        win = 0,
                        betTotal = 0,
                        sceneWins = {},
                        sceneJackpotWins = {},
                        sceneJackpotPoolIndexes = {},
                        sceneRewardMaps = {}
                    }
                    winPlayerMap[pid].win = winPlayerMap[pid].win + win
                    winPlayerMap[pid].betTotal = winPlayerMap[pid].betTotal + betTotal
                    winPlayerMap[pid].sceneWins[sceneType] = win
                    winPlayerMap[pid].sceneRewardMaps[sceneType] = presult
                    if jackpotWin > 0 then
                        winPlayerMap[pid].sceneJackpotWins[sceneType] = jackpotWin
                        winPlayerMap[pid].sceneJackpotPoolIndexes[sceneType] = jackpotPoolIndex
                    end
                else
                    noWinPlayerMap[pid] = player
                end

                commitAnalyReward[pid] = (commitAnalyReward[pid] or 0) + win
            end
        end
    end

    if next(commitAnalyPlayer) then
        local normalAnaly = analyDataMap[EGameScene.Normal]
        gAnaly:multiCommitAnaly(commitAnalyPlayer, commitAnalyReward, roundId, normalAnaly and normalAnaly.gameOddsResult or EGameOddsResult.Success)
    end

    for pid, player in pairs(noWinPlayerMap) do
        if not winPlayerMap[pid] and player then
            player:saveGameResult(rewards, zhuanPanId, 0, roundId, sceneInfos)
        end
    end

    local winPlayerList = {}
    for _, info in pairs(winPlayerMap) do
        table.insert(winPlayerList, info)
    end

    sceneInfos[EGameScene.Master].jackpotAmount = sceneJackpotAmountMap[EGameScene.Master] or 0
    self:refreshMasterJackpotInfo(sceneInfos)

    -- 统计口径与其他多人游戏一致：开奖结果确定后立即冻结本局投注/奖励，
    -- 不等待异步 addCoins 回调。这样兜底计时器不会提交半成品数据，也不会重复提交。
    if havePlayerBet then
        for pid, pinfo in pairs(winPlayerMap) do
            for sceneType, rewardMap in pairs(pinfo.sceneRewardMaps or {}) do
                self.gameBetData:updatePlayerRewardMap(pid, rewardMap, sceneType)
            end
            for sceneType, sceneWin in pairs(pinfo.sceneWins or {}) do
                self.gameBetData:updateReward(sceneWin, sceneType)
                self.gameBetData:updatePlayerRewardTotal(pid, sceneWin, sceneType)
            end
        end

        self:syncStatisGameData(roundId, roundPlayerUidMap)
        for pid, player in pairs(roundPlayerMap) do
            self:syncStatisPlayerData(roundId, player, pid, roundPlayerUidMap[pid])
        end
    end

    if #winPlayerList > 0 then
        self:betAddCoins(#winPlayerList, winPlayerList, sceneInfos, analyDataMap)
    else       
        self:refreshRoundRank3(sceneInfos)
        self:broadcastResult(roundId, sceneInfos)
        self:dealyPrepare()
    end
end

--广播结果(先发个人结果，再广播全局结果)
function FootballLeagueMain:broadcastResult(roundId, sceneInfos)
    local normalInfo = sceneInfos[EGameScene.Normal]
    local backMsg = {
        round = roundId,
        zhuanPanId = normalInfo.zhuanPanId,
        rewards = normalInfo.rewards,
        roundRank3 = normalInfo.roundRank3 or {},
        toDayRank3 = {},
        sceneInfos = sceneInfos,
        jackpotAmountPool = self:getAllJackpotPool()
    }

    GameSystem.GameRankMgr.getRankList(function (data)
        if data and #data > 0 then
           for i = 1, 3 do
                if data[i] then
                    table.insert(backMsg.toDayRank3, data[i])
                end
           end
        end
        Router.Client.ScOpenRewardPush(backMsg, gWorld)
    end) 
end

function FootballLeagueMain:refreshRoundRank3(sceneInfos, winPlayerList)
    local winPlayerMap = {}
    local seenPidMap = {}
    local roundRank3Candidates = {}

    local function isRankHigher(left, right)
        if left.win ~= right.win then
            return left.win > right.win
        end
        if left.betTotal ~= right.betTotal then
            return left.betTotal > right.betTotal
        end
        return (left.pid or 0) < (right.pid or 0)
    end

    -- 仅维护展示所需的前三名，避免玩家越多时为取 Top 3 做一次全量排序。
    local function addRoundRankCandidate(item)
        if not item or not item.win or item.win <= 0 then
            return
        end
        local insertPos = #roundRank3Candidates + 1
        for i, candidate in ipairs(roundRank3Candidates) do
            if isRankHigher(item, candidate) then
                insertPos = i
                break
            end
        end
        table.insert(roundRank3Candidates, insertPos, item)
        if #roundRank3Candidates > 3 then
            table.remove(roundRank3Candidates)
        end
    end

    -- 当局赢家的结果覆盖历史累计结果，语义与原先 rankPlayerMap 的覆盖一致。
    for _, item in ipairs(winPlayerList or {}) do
        if item and item.pid then
            winPlayerMap[item.pid] = item
        end
    end

    if self.gameBetData then
        for pid, pbetInfo in pairs(self.gameBetData:getPlayersBetData() or {}) do
            local winInfo = winPlayerMap[pid]
            seenPidMap[pid] = true
            addRoundRankCandidate(winInfo or {
                pid = pid,
                win = self.gameBetData:getPlayerRewardTotal(pid),
                betTotal = pbetInfo and pbetInfo.betTotal or 0
            })
        end
    end

    -- 防御性处理：若本局赢家不在下注表中，仍可参与展示排名。
    for pid, item in pairs(winPlayerMap) do
        if not seenPidMap[pid] then
            addRoundRankCandidate(item)
        end
    end

    local roundRank3 = {}
    for _, item in ipairs(roundRank3Candidates) do
        local player = gWorld:findAllPlayer(item.pid)
        if player then
            local rankNum = #roundRank3 + 1
            table.insert(roundRank3, {
                pid = item.pid,
                name = player:getName(),
                avatarUrl = player:getAvatarUrl(),
                score = item.win or 0,
                rankNum = rankNum,
            })
        end
    end

    for sceneType = EGameScene.Normal, EGameScene.Master do
        sceneInfos[sceneType].roundRank3 = roundRank3
    end
end

function FootballLeagueMain:refundPlayerJackpot(pinfo, sceneInfos)
    local refunded = 0
    for sceneType, jackpotAmount in pairs(pinfo and pinfo.sceneJackpotWins or {}) do
        local poolIndex = pinfo.sceneJackpotPoolIndexes and pinfo.sceneJackpotPoolIndexes[sceneType] or 0
        if sceneType == EGameScene.Master and jackpotAmount and jackpotAmount > 0 and poolIndex > 0 then
            self:refundJackpotPoolAmount(poolIndex, jackpotAmount)
            refunded = refunded + jackpotAmount
        end
    end

    if refunded > 0 and sceneInfos and sceneInfos[EGameScene.Master] then
        local masterInfo = sceneInfos[EGameScene.Master]
        masterInfo.jackpotAmount = math.max((masterInfo.jackpotAmount or 0) - refunded, 0)
        self:refreshMasterJackpotInfo(sceneInfos)
    end
end

function FootballLeagueMain:increasePlayerJackpotPool(pinfo, sceneInfos)
    local pid = pinfo and pinfo.pid
    local masterWin = pinfo and pinfo.sceneWins and pinfo.sceneWins[EGameScene.Master] or 0
    local masterJackpotWin = pinfo and pinfo.sceneJackpotWins and pinfo.sceneJackpotWins[EGameScene.Master] or 0
    local masterBaseWin = masterWin - masterJackpotWin
    if not pid or masterBaseWin <= 0 then
        return
    end

    local masterInfo = sceneInfos and sceneInfos[EGameScene.Master]
    local poolIndex = self:getPlayerJackpotPoolIndex(pid, masterInfo and masterInfo.rewards or {})
    if poolIndex <= 0 then
        return
    end

    local poolIncrRate = tonumber(wheelGlobalCfg().jackpotPoolIncrRate) or DEFAULT_JACKPOT_POOL_INCR_RATE
    self:increaseJackpotPoolAmount(poolIndex, masterBaseWin * poolIncrRate)
    self:refreshMasterJackpotInfo(sceneInfos)
end

function FootballLeagueMain:betAddCoins(winPlayerNum, winPlayerList, sceneInfos, analyDataMap)
    local backCount = 0
    local backPlayerList = {}

    self.settlemenTimerId = gTimer:addOnceTimer(2000, function ()
        if self.settlemenTimerId then
            self:resultSort(backPlayerList, sceneInfos)
        end
    end)

    local roundId = self.roundResult.roundId
    local round = self.roundResult.round

    local normalAnaly = analyDataMap and analyDataMap[EGameScene.Normal] and analyDataMap[EGameScene.Normal].gameAnalyData
    local oddsType = normalAnaly and normalAnaly:get_odds_type() or 0
    for _, pinfo in pairs(winPlayerList) do  
        local pid = pinfo.pid
        local win = pinfo.win
        local player = gWorld:findAllPlayer(pid)
        if player then
            local playerUid = player:getUid()
            local patformData = {win_id = table.concat(sceneInfos[EGameScene.Normal].rewards, " ")} 
            player:addCoins(roundId, oddsType, ECoinsOperateType.WinAdd, win, function (ercode, orderID, backPlayer)
                backCount = backCount + 1
                if backPlayer then
                    local realWin = 0
                    if ercode == 0 then
                        realWin = win 
                        backPlayer:todayRevenueAdd(win)
                        local curRevenue = backPlayer:getTodayRevenue()
                        GameSystem.GameRankMgr.updateData(nil, {uid = playerUid, name = backPlayer:getName(), avatarUrl = backPlayer:getAvatarUrl(), score = curRevenue})       
                        table.insert(backPlayerList, {pid = pid, win = win, sceneWins = pinfo.sceneWins, sceneJackpotWins = pinfo.sceneJackpotWins})
                        self:increasePlayerJackpotPool(pinfo, sceneInfos)
                        -- 与 FruitSlots 一致：只在实际加币成功后向全服广播 JP，
                        -- 防止 SDK 失败或回滚时出现错误的中奖跑马灯。
                        local jackpotWin = pinfo.sceneJackpotWins and pinfo.sceneJackpotWins[EGameScene.Master] or 0
                        if jackpotWin > 0 then
                            Router.Client.ScJackpotHintPush({
                                userName = backPlayer:getName() or "",
                                amount = jackpotWin,
                            }, gWorld)
                        end
                        log_info("玩家[{0}]在第{1}局下注赢取积分[{2}]添加成功",playerUid, round, realWin)
                    else
                        self:refundPlayerJackpot(pinfo, sceneInfos)
                        local msg = {
                            errorCode = ercode, 
                            round = round, 
                            zhuanPanId = sceneInfos[EGameScene.Normal].zhuanPanId,
                            rewards = sceneInfos[EGameScene.Normal].rewards,
                            winNum = 0,
                            money = backPlayer:getCoins(),
                            rankNum = 0,
                            todayRevenue = backPlayer:getTodayRevenue(),
                            sceneInfos = self:cloneSceneInfosForPlayer(sceneInfos, pinfo.sceneWins, pinfo.sceneJackpotWins),
                            jackpotAmountPool = self:getAllJackpotPool()
                        }
                        Router.Client.ScRankInfoPush(msg, player)
                        log_error("Sdk加钱有错:{0}, orderID:{1}, uid:{2}, round:{3}, win:{4}", ercode, orderID, playerUid, round, win)
                    end
                else
                    self:refundPlayerJackpot(pinfo, sceneInfos)
                    log_error("sdk 加钱回调Player 为nil:uid:{0} addCoins:{1} ercode:{2}", playerUid, win, ercode)
                end
                if backCount >= winPlayerNum then
                    self:resultSort(backPlayerList, sceneInfos)
                end
            end, patformData)    
        else
            backCount = backCount + 1
            self:refundPlayerJackpot(pinfo, sceneInfos)
            if backCount >= winPlayerNum then
                self:resultSort(backPlayerList, sceneInfos)
            end
        end
    end
end

function FootballLeagueMain:resultSort(playerList, sceneInfos)
    --排序
    table.sort(playerList, function(a, b)
        return a.win > b.win
    end)

    self:refreshRoundRank3(sceneInfos, playerList)

    --分配排名
    local rankNum = 0
    local lastWin = nil
    for _, item in ipairs(playerList) do
        if lastWin == nil then
            rankNum = 1
            lastWin = item.win
        elseif item.win < lastWin then
            rankNum = rankNum + 1
            lastWin = item.win
        end
        item.rankNum = rankNum
        local player = gWorld:findAllPlayer(item.pid)
        if player then
            player:saveGameResult(sceneInfos[EGameScene.Normal].rewards, sceneInfos[EGameScene.Normal].zhuanPanId, item.win, self.roundResult.roundId, sceneInfos, item.sceneWins)
            Router.Client.ScRankInfoPush({
                errorCode = 0,
                round = self.roundResult.roundId, 
                zhuanPanId = sceneInfos[EGameScene.Normal].zhuanPanId,
                rewards = sceneInfos[EGameScene.Normal].rewards,
                winNum = item.win,
                money = player:getCoins(),
                rankNum = item.rankNum,
                todayRevenue = player:getTodayRevenue(),
                sceneInfos = self:cloneSceneInfosForPlayer(sceneInfos, item.sceneWins, item.sceneJackpotWins),
                jackpotAmountPool = self:getAllJackpotPool()
            }, player)
        end         
    end

    self:broadcastResult(self.roundResult.roundId, sceneInfos)
    
    self:dealyPrepare()
    if self.settlemenTimerId then
        gTimer:removeTimer(self.settlemenTimerId)
        self.settlemenTimerId = nil
    end 
end

--保存开奖结果数据
function FootballLeagueMain:saveGameResult(sceneInfos)
    local data = self:getData()
    local normalInfo = sceneInfos[EGameScene.Normal]

    --存最新的8个在系统
    table.insert( data.resultHistory, {
            team_id = EGameScene.Normal,
            round = self.roundResult.roundId, 
            prepareTime = self.roundResult.prepareTime,
            rewards = normalInfo.rewards,
            zhuanPanId = normalInfo.zhuanPanId,
            sceneInfos = sceneInfos
        }
    ) 

    if #data.resultHistory > 8 then
        table.remove(data.resultHistory, 1)
    end 
end

function FootballLeagueMain:getBetTotal(betList)
    local betAllNum = 0
    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local chipNum = chipValue * chipCount  
        betAllNum = betAllNum + chipNum
    end
    return  betAllNum
end

--把betId拼接成字符串反给平台
function FootballLeagueMain:getBetStr(betList, team_id)
    local betIds = {}
    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local betId = value.rewardID
        if chipValue and chipValue > 0 and chipCount and chipCount > 0 and betId then
            table.insert(betIds, betId)
        end
    end
    local str = table.concat(betIds, " ")
    return {bet_id = str, team_id = normalizeSceneType(team_id)}
end

function FootballLeagueMain:checkChipIsValid(betList, pid, round, sceneType)
    local chipValueArr = {}
    local rate = getSceneChipRate(sceneType)
    local cfg = gApp:getProjCommon()
    if not cfg or not cfg.Costs or #cfg.Costs <= 0 then
        log_info("jsNet costs cfg is nil")

        --启用默认配置
        local cfgChips = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetChips)
        if not cfgChips then
            log_error("default costs cfg is nil")
            return false
        end
        for _, chipValue in ipairs(cfgChips) do
            table.insert(chipValueArr, chipValue * rate)
        end
    else
        for _, value in ipairs(cfg.Costs) do
            table.insert(chipValueArr, value.Coins * rate)
        end
    end

    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local isValid = false
        for _, coins in pairs(chipValueArr) do
            if coins == chipValue then
                isValid = true
            end
        end
        if not isValid then
            log_error("chipValue is not valid:{0}-{1}-{2}", chipValue, pid, round)
            return false
        end
    end
    return true
end

function FootballLeagueMain:checkBetCountIsValid(pid, sceneType)
    local cfg = gApp:getProjCommon()
    local max = 0
    if not cfg or not cfg.Custom or not cfg.Custom.betCountMax then
        log_info("jsNet Custom.betCountMax cfg is nil")

        --启用默认配置
        max = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetCountMax)
    else
        max = cfg.Custom.betCountMax
    end
    local palyerCount = self.gameBetData:getPlayerBetCount(pid, sceneType)
    return palyerCount < max
end

function FootballLeagueMain:checkBetTypeIsValid(pid, betList, sceneType)
    local cfg = gApp:getProjCommon()
    local max = 0
    if not cfg or not cfg.Custom or not cfg.Custom.betTypeMax then
        log_error("jsNet Custom.betTypeMax cfg is nil,enabling default configuration")
        --启用默认配置
        max = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetMaxType)
    else
        max = cfg.Custom.betTypeMax
    end
    log_info("最大押注种类:{0}", max)
    local hadBetMap = self.gameBetData:getPlayerRewardsBetStateMap(pid, sceneType)
    local hadBetNum = self.gameBetData:getPlayerBetTypeCount(pid, sceneType)

    local curBetNum = 0
    local curBetMap = {}
    for _, value in pairs(betList) do
        local rewardID = value.rewardID
        if not hadBetMap[rewardID] and not curBetMap[rewardID] then
            curBetMap[rewardID] = true
            curBetNum = curBetNum + 1
        end
    end

    local totalNum = hadBetNum + curBetNum
    return totalNum <= max
end

function FootballLeagueMain:setBetStartState(pid, betList, sceneType)
    for _, value in pairs(betList) do
        local rewardId = value.rewardID
        self.gameBetData:setBetStartState(pid, rewardId, sceneType)
    end
end

--计算延时下注
function FootballLeagueMain:getDelayRewardCoins(uid, pid, roundId, betMap, sceneType)
    local round = GenDayIncrId(roundId)
    local gamedata = self:getData()
    if not gamedata.resultHistory or #gamedata.resultHistory <= 0 then
        return 0
    end

    if not betMap then
        log_error("玩家[{0}]在{1}局延时发奖betMap为nil", uid, round)
        return 0
    end

    local reward = 0
    for _, item in pairs(gamedata.resultHistory) do
        if roundId == item.round then
            local sceneInfo = item.sceneInfos and item.sceneInfos[normalizeSceneType(sceneType)]
            local openRewards = sceneInfo and sceneInfo.rewards or item.rewards
            if not openRewards then
                openRewards = {}
            end

            for _, id in pairs(openRewards) do
                local zhuanPanId = sceneInfo and sceneInfo.zhuanPanId or item.zhuanPanId
                local multiple = FootballLeagueCfgMgr:getRewardMult(id, normalizeSceneType(sceneType), zhuanPanId)
                if multiple and betMap[id] and betMap[id] > 0 then
                    local add = multiple * betMap[id]
                    reward = reward + add
                end
            end

            if normalizeSceneType(sceneType) == EGameScene.Master and sceneInfo and sceneInfo.isJackpot and tostring(pid) == tostring(sceneInfo.jackpotWinnerPid) then
                local poolIndex = self:getJackpotPoolIndexByBetMap(betMap, openRewards)
                if poolIndex > 0 then
                    local percentage = jackpotPercentageForStage(sceneInfo.jackpotStage)
                    local jackpotPoolBefore = self:getJackpotPoolAmount(poolIndex)
                    local jackpotAmount = math.floor(jackpotPoolBefore * percentage)
                    if jackpotAmount > 0 then
                        self:decreaseJackpotPoolAmount(poolIndex, jackpotAmount)
                        reward = reward + jackpotAmount
                        if sceneInfo then
                            sceneInfo.jackpotAmount = (sceneInfo.jackpotAmount or 0) + jackpotAmount
                            self:refreshMasterJackpotInfo(item.sceneInfos)
                        end
                        local jackpotPoolCurrent = self:getJackpotPoolAmount(poolIndex)
                        local jackpotPayoutRate = jackpotPoolBefore > 0 and jackpotAmount / jackpotPoolBefore * 100 or 0
                        log_info("玩家[{0}]在{1}局延时发奖分走JP:{2}, 开奖前奖池:{3}, 当前奖池:{4}, 分走比例:{5}%", uid, round, jackpotAmount, jackpotPoolBefore, jackpotPoolCurrent, string.format("%.2f", jackpotPayoutRate))
                    end
                end
            end
        end
    end
    return reward
end

--下注延时情记录
function FootballLeagueMain:delayRewardRecord(roundId, orderId, betMsg, uid, oddsType, changeType, subCoins, gameExt, player, sceneType)
    if not player then
        log_error("下注延时情记录player{0}为nil", uid)
        return
    end

    if not betMsg then
        log_error("下注延时情记录betMsg{0}为nil", uid)
        return
    end

    local round = GenDayIncrId(roundId)
    local betMap = {}
    local betIdStr = nil
    for _, value in pairs(betMsg.betList) do
        local rewardId = value.rewardID
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local betNum = chipValue * chipCount
        if not betMap[rewardId] then
            betMap[rewardId] = 0
        end

        local betStr = tostring(rewardId)
        betMap[rewardId] = betMap[rewardId] + betNum
        if not betIdStr then
            betIdStr = betStr
        else
            betIdStr = betIdStr .. "," .. betStr
        end
    end

    local reward = self:getDelayRewardCoins(uid, player:getPid(), roundId, betMap, sceneType)
    if reward > 0 then
        player:subCoinsDelayReward(roundId, betIdStr, orderId, oddsType, changeType, subCoins, reward, gameExt)
        log_info("玩家{0}下注延时中奖统计: round:{1} betIdStr:{2} orderId:{3} subCoins:{4} reward:{5}", uid, round, betIdStr, orderId, subCoins, reward)
    end
end

--------------------Msg------------------------
function FootballLeagueMain: csCurGameInfoReq(player, msg)
    local pid = player:getPid()
    local team_id = msg and msg.team_id and player:setTeamId(msg.team_id) or player:getTeamId()
    local backMsg = {
        team_id = team_id,
        gameState = self.gameState,
        round = self.roundResult.roundId,
        prepareTime = self.roundResult.prepareTime,
        serverTime = app__:utc_milli_s(),
        todayRevenue = player:getTodayRevenue(),
        betSelf = {},
        toDayRank3 = {},
        hotRewards = {},
        hotBetMap = {},
        betTotal = 0,
        sceneInfos = {},
        jackpotAmountPool = self:getAllJackpotPool()
    }

    if self.gameState ~= EGameState.Final then
        backMsg.betSelf = self.gameBetData:getScSelfBetInfo(pid, team_id) 
        local hotRewards, hotBetMap = self.gameBetData:getInitHotRank3(team_id)
        backMsg.hotRewards = hotRewards
        backMsg.hotBetMap = hotBetMap
        backMsg.betTotal = self.gameBetData:getBetTotal(team_id)
        for sceneType = EGameScene.Normal, EGameScene.Master do
            local sceneHotRewards, sceneHotBetMap = self.gameBetData:getInitHotRank3(sceneType)
            table.insert(backMsg.sceneInfos, {
                sceneType = sceneType,
                zhuanPanId = 0,
                betSelf = self.gameBetData:getScSelfBetInfo(pid, sceneType),
                hotBetMap = sceneHotBetMap,
                hotTeamId = self.gameBetData:getMostBetTeamId(sceneType),
                betTotal = self.gameBetData:getBetTotal(sceneType),
                rewards = sceneHotRewards,
                wheelMultiple = FootballLeagueCfgMgr:getSceneWheelMultiple(sceneType),
                winNum = 0,
                roundRank3 = {},
                jackpot = sceneType == EGameScene.Master and self:getJackpotAmount() or 0,
                jackpotAmount = 0,
                jackpotAmountPool = sceneType == EGameScene.Master and self:getAllJackpotPool() or {}
            })
        end
    end

    GameSystem.GameRankMgr.getRankList(function (data)
        if data and #data> 0 then
           for i = 1, 3 do
                if data[i] then
                    table.insert(backMsg.toDayRank3, data[i])
                end
           end
        end
        Router.Client.CsCurGameInfoResp(backMsg, player)
    end)
end

--更新下注
function FootballLeagueMain:csBetReq(pid, msg)
    if not pid or pid <= 0 or not msg or not msg.betList or #msg.betList <= 0 then
        return
    end

    local curPlayer = gWorld:findAllPlayer(pid)
    if not curPlayer then
        return
    end

    local playerUid = curPlayer:getUid()
    local playerMoney = curPlayer:getCoins()
    local team_id = curPlayer:setTeamId(msg.team_id or msg.sceneType)
    local sceneType = team_id
    msg.team_id = team_id
    msg.sceneType = sceneType

    local backMsg = {
        errorCode = 0,
        team_id = team_id,
        sceneType = sceneType,
        money = playerMoney,
        betList = {}
    }

    local curTime = app__:utc_s()
    local curRoundId = self.roundResult.roundId
    local curRound = self.roundResult.round
    local curBetMsg = msg

    --检查SDK
    if not curPlayer:checkSdkIsValid() then
        log_error("round:{0}局中{1}sdk状态不对",curRound, playerUid)
        backMsg.errorCode = GameError.GE_SdkCoinsError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查筹码
    if not self:checkChipIsValid(msg.betList, pid, curRound, sceneType) then
        backMsg.errorCode = GameError.GE_ChipError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查押注次数
    if not self:checkBetCountIsValid(pid, sceneType) then
        backMsg.errorCode = GameError.GE_BetCountOver
        log_error("round:{0}局中{1}游戏押注次数超出次数",curRound, playerUid)
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查押注种类
    if not self:checkBetTypeIsValid(pid, msg.betList, sceneType) then
        backMsg.errorCode = GameError.GE_BetTypeCountOver
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查下注时游戏状态
    if self.gameState ~= EGameState.Bet then
        log_error("round:{0}局中{1}押注时游戏状态不对:{2}",curRound, playerUid, self.gameState)
        backMsg.errorCode = GameError.GE_BetTimeError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    -- 倒计时不足 3 秒不允许下注。
    if not self:canBetWithRemainingTime() then
        log_error("round:{0}局中{1}押注剩余时间不足3秒",curRound, playerUid)
        backMsg.errorCode = GameError.GE_BetTimeError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查钱是否够
    local betAllNum = self:getBetTotal(msg.betList)
    local moneyEnough = curPlayer:coinsEnough(betAllNum)
    if not moneyEnough or betAllNum <= 0 then
        log_error("round:{0}局中{1}押注钱不够:当前Coins:{2}-押注Coins:{3}",curRound, playerUid, playerMoney, betAllNum)
        backMsg.errorCode = GameError.GE_MoneyNotEnough
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    self:setBetStartState(pid, msg.betList, sceneType)
   
    local patformData = self:getBetStr(msg.betList, team_id)
    --扣钱
    local orderId = curPlayer:subCoins(curRoundId, ECoinsOperateType.BetSub, betAllNum, function (errorCode, orderID, backPlayer)
        if orderID then
            self.roundOrders[orderID] = nil
        end

        if not backPlayer then
            log_error("扣钱回调找不到玩家:uid:{0} 押注总额:{1} orderID:{2} errorCode:{3} roundId:{4}", playerUid, betAllNum, orderID, errorCode, curRound)
            return
        end

        if errorCode ~= 0 then
            log_error("扣钱回调有错:uid:{0} 押注总额:{1} orderID:{2} errorCode:{3} roundId:{4}", playerUid, betAllNum, orderID, errorCode, curRound)
            backMsg.errorCode = errorCode
            return Router.Client.CsBetResp(backMsg, backPlayer)
        end

        --下注回调状态不为游戏准备状态
        if self.gameState ~= EGameState.Bet or curRoundId ~= self.roundResult.roundId then
            log_info("下注Sdk回调超时, 状态不对: uid:{0} orderID:{1}, betAllNum:{2}, round_bet:{3}, round_now:{4} betInfo:{5}", playerUid, orderID, betAllNum, curRound, self.roundResult.round, log_view(curBetMsg.betList or {}))
            self:delayRewardRecord(curRoundId, orderID, curBetMsg, playerUid, 0, ECoinsOperateType.BetSub, betAllNum, patformData, backPlayer, sceneType)
            return
        end

        --排行榜
        local rankPSys = backPlayer:getSystem("RankPSystem")
        if rankPSys then
            rankPSys:updateRankList(betAllNum)
        end

        playerMoney = backPlayer:getCoins()
        local betInfo = {
            betTime = curTime,
            betList = {}
        }

        for _, value in pairs(msg.betList) do
            local rewardID = value.rewardID
            local chipValue = value.chipValue
            local chipCount = value.chipCount
            local chipNum = chipValue * chipCount 
            self.gameBetData:updateBetValue(pid, rewardID, chipNum, sceneType)
            self.gameBetData:updatePlayerBetCount(pid, sceneType)
            table.insert(betInfo.betList, value)
        end
        self:pushHotBetUpdate()
        --保存押注数据到玩家
        local pBetMap = self.gameBetData:getPlayerBetMap(pid, sceneType)
        backPlayer:saveBetInfo(self.roundResult.prepareTime, curRoundId, betInfo, pBetMap, team_id)

        backMsg.money = playerMoney
        backMsg.team_id = team_id
        backMsg.betList = msg.betList
        Router.Client.CsBetResp(backMsg, backPlayer)

        log_info("玩家[{0}]在第{1}局时间{2}总注押{3}, 押注详情:{4}", playerUid, curRound, curTime, betAllNum, log_view(msg.betList))
    end, patformData)

    if orderId then
        self.roundOrders[orderId] = true
    end 
end

function FootballLeagueMain:csGameHistoryReq(team_id)
    local gamedata = self:getData()
    team_id = normalizeSceneType(team_id)
    local result = {}
    result.list = {}
    if gamedata.resultHistory and #gamedata.resultHistory > 0 then
        for _, item in ipairs(gamedata.resultHistory) do
            table.insert(result.list, self:cloneGameResultByTeamId(item, team_id))
        end
    end
    return result
end

function FootballLeagueMain:csSelfBetHistoryReq(player)
     if player then
        local msg = {
            list = {}
        }
        local betHistory = player:getBetHistory()
        -- 每个场次的历史记录条数与排行榜一致，使用后端 Constant 配置控制。
        local showMax = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.ShowRankCount) or 20
        local sceneCounts = {}
        local finishSceneCount = 0
        for sceneType = EGameScene.Normal, EGameScene.Master do
            sceneCounts[sceneType] = 0
        end
        if betHistory and #betHistory > 0 then
            for i = 1, #betHistory do
                if finishSceneCount >= (EGameScene.Master - EGameScene.Normal + 1) then
                    break
                end
                local info = betHistory[i]
                if info then
                    local infoTeamId = normalizeSceneType(info.team_id or info.sceneType)
                    if sceneCounts[infoTeamId] < showMax and info.round ~= self.roundResult.roundId then
                        local tb = self:cloneBetHistoryByTeamId(info, infoTeamId)
                        table.insert(msg.list, tb)
                        sceneCounts[infoTeamId] = sceneCounts[infoTeamId] + 1
                        if sceneCounts[infoTeamId] == showMax then
                            finishSceneCount = finishSceneCount + 1
                        end
                    end
                end
            end
        end
        Router.Client.CsSelfBetHistoryResp(msg, player)
    end
end

--统计上传游戏数据
function FootballLeagueMain:syncStatisGameData(roundId, playerUidMap)
    if not self.gameBetData or self.statisReportedRoundId == roundId then
        return
    end

    local gamePayData = {}
    local gameRewardData = {}

    local playersBetData = self.gameBetData:getPlayersBetData()
    for pid, _ in pairs(playersBetData) do
        -- 优先使用结算时冻结的 UID；兼容旧调用时再即时查找玩家。
        local uid = playerUidMap and playerUidMap[pid]
        if uid == nil then
            local player = gWorld:findAllPlayer(pid)
            uid = player and player:getUid() or nil
        end
        if uid ~= nil then
            gamePayData[uid] = {
                betMap = self.gameBetData:getPlayerBetMap(pid),
                betTotal = self.gameBetData:getPlayerBetTotal(pid)
            }
            gameRewardData[uid] = {
                rewardMap = self.gameBetData:getPlayerRewardMap(pid),
                rewardTotal = self.gameBetData:getPlayerRewardTotal(pid)
            }
        end
    end
    if not next(gamePayData) or not gApp or not gApp.statisGameRound then
        return
    end
    self.statisReportedRoundId = roundId
    gApp:statisGameRound(roundId, gamePayData, gameRewardData)
    -- 后端奖池统计接口尚未完善，暂不调用。
    -- self:statisRewardPool(roundId)

    local betTotal = self.gameBetData:getBetTotal()
    local rewardTotal = self.gameBetData:getRewardTotal()
    local round = GenDayIncrId(roundId)
    log_info("游戏数据统计: ServerIndex:{0} round:{1} 总投注:{2} 总奖励:{3}", gApp:getServerIndex(), round, betTotal, rewardTotal)
end

--统计上传玩家数据
function FootballLeagueMain:syncStatisPlayerData(roundId, player, pid, playerUid)
    if not self.gameBetData then
        return
    end

    if not player then
        return
    end

    if roundId ~= self.roundResult.roundId then
        log_error("syncStatisPlayerData roundId 不一致")
        return
    end

    if self.gameBetData:getPlayerBetTotal(pid) <= 0 then
        return
    end

    local reportedPlayers = self.statisReportedPlayerPids[roundId]
    if not reportedPlayers then
        reportedPlayers = {}
        self.statisReportedPlayerPids[roundId] = reportedPlayers
    end
    if reportedPlayers[pid] then
        return
    end

    local payData = {}
    local rewardData = {}

    payData.betMap = self.gameBetData:getPlayerBetMap(pid)
    payData.betTotal = self.gameBetData:getPlayerBetTotal(pid)
    rewardData.rewardMap = self.gameBetData:getPlayerRewardMap(pid)
    rewardData.rewardTotal = self.gameBetData:getPlayerRewardTotal(pid)

    reportedPlayers[pid] = true
    player:statisGameRound(roundId, payData, rewardData)
    log_info("玩家数据统计:uid:{0} ServerIndex:{1} round:{2} 总投注:{3} 总奖励:{4}",playerUid, gApp:getServerIndex(), self.roundResult.round, payData.betTotal, rewardData.rewardTotal)
end
