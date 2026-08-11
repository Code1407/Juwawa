-- 依赖引入：系统基类、豪车游戏主模块、豪车游戏机（轮盘/转盘逻辑）
require "GameBase.SystemBase"
require "LuxuryCarR.LuxuryCarR"
require "LuxuryCarR.LuxuryCarRMachine"

-- LuxuryCarRPlayer 类：继承自 SystemBase，封装单个玩家在豪车游戏中的全部状态与行为。
-- 每个进入豪车游戏的玩家都会拥有一个 LuxuryCarRPlayer 实例，用于：
--   - 管理玩家在游戏桌上的个人数据（下注明细、今日盈亏、历史记录、偏好设置等）
--   - 处理下注请求 bet() 与回合结算 settleCurrentRound()
--   - 向客户端返回完整的游戏快照 getClientResp()
LuxuryCarRPlayer = class__(SystemBase)

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
function LuxuryCarRPlayer:ctor__(player)
    SystemBase.ctor__(self, LuxuryCarRConst.gameName, player)
end


-- 数据加载：从持久化数据恢复玩家状态；若无数据则使用 defaultData() 初始化。
function LuxuryCarRPlayer:onLoad(data)
    data = data or defaultData()
    data.history, data.bets = data.history or {}, data.bets or LCEmptyBets()
    data.chipCounts = data.chipCounts or LCEmptyChipCounts()
    SystemBase.onLoad(self, data)
end

-- 玩家进入游戏（生命周期 onEnter）：
--   1. 通过基类 onEnter 完成系统级初始化
--   2. 获取当前场景（赌桌）引用
--   3. 创建 LuxuryCarRMachine（轮盘/转盘控制器）绑定到本玩家
--   4. 将本玩家注册到场景中，使其参与场景广播与回合流转
function LuxuryCarRPlayer:onEnter()
    SystemBase.onEnter(self)
    self.scene = SvrSystem.LuxuryCarR:getScene()
    self.machine = LuxuryCarRMachine(self.scene, self)
    self.scene:registerPlayer(self)
end

-- 玩家离开游戏（生命周期 onLeave）：
--   1. 从场景中注销本玩家（按 UID 移除），不再接收后续广播
--   2. 调用基类 onLeave 完成系统级清理与数据落盘
function LuxuryCarRPlayer:onLeave()
    if self.scene then self.scene:unregisterPlayer(self:getUid()) end
    SystemBase.onLeave(self)
end

-- 获取玩家唯一标识：优先使用 UID，回退到 PID。
function LuxuryCarRPlayer:getUid() 
    return tostring(self:getPlayer():getUid() or self:getPlayer():getPid())
end

-- 获取玩家钻石（金币）余额：向下取整。
function LuxuryCarRPlayer:getDiamond() 
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
function LuxuryCarRPlayer:getClientResp()
    local data = self:getData()
    return { uid = self:getUid(), roundStep = self.scene:getRoundStep(), account = LCAccount(self:getPlayer()), todayRevenue = data.todayRevenue or 0, wheelAmount = data.bets or LCEmptyBets(), wheelChipAmount = data.chipCounts or LCEmptyChipCounts(), totalWheelAmount = self.scene.roundBets, curRoundAllWheelAmount = self.scene:getRoundAllBetList(), historyResults = self.scene.historyResults, rankList = self.scene:rankList(), myHistory = data.history or {}, lastBetAmountButton = data.lastBetAmountButton or 0, playerSettings = data.playerSettings or {} }
end

-- enterGame：玩家进入游戏时调用，返回初始快照（委托给 getClientResp）。
function LuxuryCarRPlayer:enterGame() 
    return self:getClientResp()
end

-- synchronize：玩家请求同步时调用，返回最新快照（委托给 getClientResp）。
function LuxuryCarRPlayer:synchronize() 
    return self:getClientResp()
end

-- onNewDay：每日重置回调。将今日盈亏清零、下注分布重置为空。
function LuxuryCarRPlayer:onNewDay()
    local data = self:getData()
    data.todayRevenue, data.bets, data.chipCounts = 0, LCEmptyBets(), LCEmptyChipCounts()
end

-- onNewRound：每回合开始回调。将本回合下注分布重置为空，为新一轮下注做准备。
function LuxuryCarRPlayer:onNewRound()
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
function LuxuryCarRPlayer:saveHistory(roundId, bets, result)
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
        log_error("LuxuryCarR costs cfg is nil, using default amounts")
        -- 默认配置：100、1000、10000、100000 
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
            log_error("LuxuryCarR costs cfg invalid: grade:{0} coins:{1}", gradeIndex, amount or 0)
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
function LuxuryCarRPlayer:bet(todayRound, betGrades, chipCounts, requestedBets)
    local step = self.scene:getRoundStep()
    local uid = self:getUid()
    -- 验证：场景已关闭
    if self.scene:isStop() then
        log_info("LuxuryCarR bet rejected: scene stopped, uid:{0}", uid)
        return { code = LCTradeCode.closeServer, accountDiamond = self:getDiamond() }
    end
    -- 验证：不在下注阶段或回合号不匹配
    if step.status ~= LCGameStatus.bet or tonumber(todayRound) ~= step.todayRound then
        log_info("LuxuryCarR bet rejected: invalid time, uid:{0} requestRound:{1} currentRound:{2} status:{3}", uid, todayRound, step.todayRound, step.status)
        return { code = LCTradeCode.missTime, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets }
    end
    -- 服务端按公共档位配置重算下注金额；档位、数量、选中标记或金额不匹配时拒绝下注。
    local gradesValid, invalidReason = validateBetGrades(betGrades, chipCounts, requestedBets)
    if not gradesValid then
        log_error("LuxuryCarR bet grade invalid: uid:{0} round:{1} reason:{2}", uid, step.todayRound, invalidReason)
        return {
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
        log_info("LuxuryCarR bet rejected: insufficient, uid:{0} total:{1} balance:{2}", uid, total, self:getDiamond())
        return { code = LCTradeCode.insufficient, accountDiamond = self:getDiamond(), wheelAmount = self:getData().bets }
    end
    local roundId = self.scene:getRoundId()
    if not roundId then
        log_error("LuxuryCarR bet failed: roundId is nil, uid:{0} todayRound:{1}", uid, step.todayRound)
        return {
            code = LCTradeCode.fail,
            accountDiamond = self:getDiamond(),
            wheelAmount = self:getData().bets,
            wheelChipAmount = self:getData().chipCounts
        }
    end

    log_info("LuxuryCarR bet start: uid:{0} round:{1} roundId:{2} total:{3} bets:{4} balance:{5}",
        uid, step.todayRound, roundId, total, tableToString(bets), self:getDiamond())

    -- 扣款（异步回调）：扣款成功后更新下注、广播、通知客户端
    self:getPlayer():subCoins(roundId, ECoinsOperateType.BetSub, total, function(code, _orderId, backPlayer)
        local system = backPlayer and backPlayer:getSystem(LuxuryCarRConst.gameName)
        if not system then
            log_error("LuxuryCarR bet callback failed: system not found, uid:{0}", uid)
            return
        end

        if code ~= 0 then
            log_error("LuxuryCarR bet subCoins failed: uid:{0} code:{1} total:{2}", uid, code, total)
            local resultCode = code
            if resultCode ~= -12 then resultCode = -3 end
            Router.Client.onResultHandler({ code = resultCode, roundId = todayRound }, backPlayer)
            return Router.Client.betResp({ code = code, accountDiamond = system:getDiamond() }, backPlayer)
        end

        -- 验证：不在下注阶段或回合号不匹配
        local n_step = system.scene:getRoundStep()
        if n_step.status ~= LCGameStatus.bet or tonumber(todayRound) ~= n_step.todayRound then
            log_error("LuxuryCar bet callback failed: not in current round, uid:{0} round:{1} currentRound:{2},timestamp:{3},status:{4},orderId:{5}", uid, n_step.todayRound, todayRound, app__:utc_milli_s(), n_step.status, _orderId)   
            log_info("超时 : not in current round, uid:{0} round:{1} currentRound:{2}", uid, n_step.todayRound, todayRound)

            -- 合并已下注数据与新请求的下注数据
            local respBets = LCClone(system:getData().bets or LCEmptyBets())
            for i = 1, 10 do
                respBets[i] = (respBets[i] or 0) + (bets[i] or 0)
            end
            local respChipCounts = LCMergeChipCounts(system:getData().chipCounts, chipCounts)
            -- 打印所有下注目标、每个目标下注金额、当局开奖目标
            log_error("LuxuryCarR bet not in current round details: uid:{0} bets:{1} chipCounts:{2} resultPosition:{3} resultBetArea:{4}",
                uid, tableToString(respBets), tableToString(respChipCounts),
                n_step.result, (LCResultBetIndex or {})[n_step.result])
            log_info("Players bets:{0} chipCounts:{1}", uid, todayRound, tableToString(respBets), tableToString(respChipCounts))
           
            return
        end

        -- 累加本次下注到玩家个人下注记录
        local data = system:getData()
        for i = 1, 10 do
            data.bets[i] = (data.bets[i] or 0) + bets[i]
        end
        data.chipCounts = LCMergeChipCounts(data.chipCounts, chipCounts)
        system.scene:recordRoundPlayer(system)
        -- 更新场景总池
        system.scene:addRoundBets(bets)
        -- 更新排行榜
        local rank = backPlayer:getSystem("RankPSystem")
        if rank then
            rank:updateRankList(total)
        end
        -- 广播下注动作（飞球动画等表现层）
        system.scene:broadcast("onBetListRound", { uid = system:getUid(), flyPlayerPos = 0, batIndex = betGrades or {}, num = chipCounts or {} })

        log_info("LuxuryCarR bet success: uid:{0} round:{1} total:{2} bets:{3} balance:{4}",
            system:getUid(), step.todayRound, total, tableToString(bets), system:getDiamond())

        -- 向客户端返回成功确认
        Router.Client.betResp({ code = LCTradeCode.success, accountDiamond = system:getDiamond(), wheelAmount = data.bets, wheelChipAmount = data.chipCounts }, backPlayer)
    end)
    -- 立即返回"处理中"的成功响应。客户端 request 会先拿到这里的返回，因此也要带上本次下注快照。
    local respBets = LCClone(self:getData().bets or LCEmptyBets())
    for i = 1, 10 do
        respBets[i] = (respBets[i] or 0) + (bets[i] or 0)
    end
    local respChipCounts = LCMergeChipCounts(self:getData().chipCounts, chipCounts)
    return { code = LCTradeCode.success, accountDiamond = self:getDiamond() - total, wheelAmount = respBets, wheelChipAmount = respChipCounts }
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
--      b. 广播 onPlayerUpdate 通知所有玩家该玩家的最新余额与下注信息（用于排行榜/UI 更新）
--   6. 返回结算条目（包含玩家 UID、头像、昵称、盈亏金额）以及 revenue 供场景排行榜使用
function LuxuryCarRPlayer:settleCurrentRound(roundId, todayRound, result, oddsType)
    local bets = LCClone(self:getData().bets or LCEmptyBets())
    local total, revenue = LCArraySum(bets), LCRevenue(bets, result)
    local uid = self:getUid()
    -- 未参与下注，跳过结算
    if total <= 0 then
        return nil, nil
    end

    log_info("LuxuryCarR settle: uid:{0} round:{1} roundId:{2} result:{3} betTotal:{4} revenue:{5} isWin:{6}",
        uid, todayRound, roundId, result, total, revenue, revenue > 0 and "yes" or "no")

    -- 保存历史记录
    self:saveHistory(todayRound, bets, result)
    -- 中奖派彩
    if revenue > 0 then
        local rawPlayer = self:getPlayer()
        if not rawPlayer then
            log_error("LuxuryCarR settle addCoins failed: player is nil, uid:{0} round:{1} revenue:{2}",
                uid, todayRound, revenue)
            return { uid = uid, profile = "", name = "", revenue = revenue, rank = 0 }, revenue
        end
        -- Also initialize here so a hot-reloaded server fixes players that
        -- were constructed before Player:ctor__ received the compatibility fix.
        rawPlayer.subCoinTypeTimeout = rawPlayer.subCoinTypeTimeout or {}
        local platformData = { win_id = tostring(result) }
        rawPlayer:addCoins(roundId, oddsType or 0, ECoinsOperateType.WinAdd, revenue, function(code, orderId, backPlayer)
            if code == 0 and backPlayer then
                -- 更新今日盈亏
                self:getData().todayRevenue = (self:getData().todayRevenue or 0) + revenue
                -- 广播玩家更新（通知其他玩家此玩家的最新状态）
                self.scene:broadcast("onPlayerUpdate", { uid = uid, diamond = self:getDiamond(), itemAmount = self:getData().bets, todayRound = todayRound })
                log_info("LuxuryCarR settle success: uid:{0} round:{1} revenue:{2} todayRevenue:{3} balance:{4}",
                    uid, todayRound, revenue, self:getData().todayRevenue, self:getDiamond())
            else
                log_error("LuxuryCarR settle addCoins failed: uid:{0} round:{1} revenue:{2} orderId:{3} code:{4} playerNil:{5}",
                    uid, todayRound, revenue, orderId, code, backPlayer == nil)
            end
        end, platformData)
    end
    -- 返回结算条目供场景排行榜汇总
    return { uid = uid, profile = self:getPlayer():getAvatarUrl() or "", name = self:getPlayer():getName() or "", revenue = revenue, rank = 0 }, revenue
end

-- setBetAmountButton：记录玩家最后选择的下注金额档位按钮索引，用于 UI 恢复。
function LuxuryCarRPlayer:setBetAmountButton(index)
    self:getData().lastBetAmountButton = math.floor(tonumber(index) or 0)
    return { code = 0 }
end

-- updateSettings：更新玩家个人偏好设置（如音效开关、特效开关等），深拷贝存入数据。
function LuxuryCarRPlayer:updateSettings(settings)
    self:getData().playerSettings = LCClone(settings or {})
    return { code = 0 }
end
