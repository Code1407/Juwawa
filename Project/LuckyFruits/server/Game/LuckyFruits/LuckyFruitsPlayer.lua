-- ============================================================
-- LuckyFruitsPlayer 模块：玩家LuckyFruits游戏子系统
-- 继承自 SystemBase，挂载在 Player 实例上，管理玩家在本游戏中的
-- 全部状态：历史记录、今日收益、本回合下注、筹码计数、个人设置。
-- 同时承载下注校验、异步扣币、奖励结算等核心玩法逻辑。
-- ============================================================

require "GameBase.SystemBase"
require "LuckyFruits.LuckyFruits"

LuckyFruitsPlayer = class__(SystemBase)

-- 默认玩家数据结构：用于新玩家初始化与字段补全
local function defaultData()
    return {
        history = {},               -- 玩家个人历史记录（最多20条）
        todayRevenue = 0,           -- 今日累计收益
        bets = LFEmptyBets(),       -- 本回合5个位置的下注金额
        chipCounts = LFEmptyChipCounts(),  -- 本回合各位置各档筹码数量
        playerSettings = { soundVol = 1, lastBetAmountButton = 0 },  -- 个人设置
    }
end

-- 构造函数：以玩家实例为宿主，注册子系统名为LuckyFruitsConst.gameName
function LuckyFruitsPlayer:ctor__(player)
    SystemBase.ctor__(self, LuckyFruitsConst.gameName, player)
end

-- 玩家数据加载：补全缺失字段，保证数据结构完整
-- 兼容历史版本数据：逐字段检查并填充默认值
function LuckyFruitsPlayer:onLoad(data)
    data = data or defaultData()
    data.history = data.history or {}
    data.bets = data.bets or LFEmptyBets()
    data.chipCounts = data.chipCounts or LFEmptyChipCounts()
    data.playerSettings = data.playerSettings or { soundVol = 1, lastBetAmountButton = 0 }
    -- 兼容历史数据缺少子字段的情况
    if data.playerSettings.soundVol == nil then data.playerSettings.soundVol = 1 end
    if data.playerSettings.lastBetAmountButton == nil then data.playerSettings.lastBetAmountButton = 0 end
    SystemBase.onLoad(self, data)
end

-- 玩家进入：获取场景实例并注册到场景的玩家列表
function LuckyFruitsPlayer:onEnter()
    SystemBase.onEnter(self)
    self.scene = SvrSystem[LuckyFruitsConst.gameName]:getScene()
    self.scene:registerPlayer(self)
end

-- 玩家离开：从场景注销，避免后续回合仍向离线玩家推送
function LuckyFruitsPlayer:onLeave()
    if self.scene then self.scene:unregisterPlayer(self:getUid()) end
    SystemBase.onLeave(self)
end

-- 获取玩家UID：优先UID，回退PID，统一转为字符串便于哈希索引
function LuckyFruitsPlayer:getUid()
    local player = self:getPlayer()
    return tostring(player:getUid() or player:getPid())
end

-- 获取玩家钻石余额：向下取整防止小数
function LuckyFruitsPlayer:getDiamond() return math.floor(self:getPlayer():getCoins() or 0) end

-- 构造客户端响应数据：聚合场景状态、账号、历史等供enterGame/synchronize返回
function LuckyFruitsPlayer:getClientResp()
    local data = self:getData()
    return {
        uid = self:getUid(),
        roundStep = self.scene:getRoundStep(),
        account = LFAccount(self:getPlayer()),
        todayRevenue = data.todayRevenue or 0,
        lastWheelAmount = LFEmptyChipCounts(),
        curRoundWheelAmount = data.chipCounts or LFEmptyChipCounts(),
        curRoundAllWheelAmount = self.scene:getRoundAllBetList(),
        -- 全场累计值与实时 onbatNoticeAll 使用同一数据源，与本人是否下注无关。
        curRoundTotalWheelAmount = LFClone(self.scene.roundChipCounts or LFEmptyChipCounts()),
        gameHistory = self.scene:getData().gameHistory or {},
        myHistory = data.history or {},
        lastBetAmountButton = data.playerSettings.lastBetAmountButton or 0,
        playerSettings = data.playerSettings,
    }
end

-- 进入游戏与同步场景：均返回完整客户端响应
function LuckyFruitsPlayer:enterGame() return self:getClientResp() end
function LuckyFruitsPlayer:synchronize() return self:getClientResp() end

-- 新一天：清零今日收益与下注数据
function LuckyFruitsPlayer:onNewDay()
    local data = self:getData()
    data.todayRevenue, data.bets, data.chipCounts = 0, LFEmptyBets(), LFEmptyChipCounts()
end

-- 新回合：清空本回合下注与筹码计数
function LuckyFruitsPlayer:onNewRound()
    local data = self:getData()
    data.bets, data.chipCounts = LFEmptyBets(), LFEmptyChipCounts()
end

-- 新协议校验：每笔下注明确携带0-based位置、筹码面值和数量。
-- 服务端用自己的Costs把面值映射回档位，并生成权威金额和累计所需的数量矩阵。
local function validateBetList(betList)
    local gradeAmounts = LFGetGradeAmounts()
    if #gradeAmounts < 1 or #gradeAmounts > 5 then
        return false, "invalid server grade config"
    end
    if type(betList) ~= "table" or #betList < 1 or #betList > 25 then
        return false, "invalid bet list size"
    end

    local gradeIndexByAmount = {}
    for gradeIndex, amount in ipairs(gradeAmounts) do
        gradeIndexByAmount[amount] = gradeIndex
    end

    local bets, grades, counts = LFEmptyBets(), LFEmptyBets(), LFEmptyChipCounts(#gradeAmounts)
    local maxSafeInteger = 9007199254740991
    for _, item in ipairs(betList) do
        if type(item) ~= "table" then return false, "invalid bet item" end
        local position = tonumber(item.betPosition)
        local chipValue = tonumber(item.chipValue)
        local chipCount = tonumber(item.chipCount)
        if not position or position < 0 or position >= 5 or position ~= math.floor(position) then
            return false, "invalid bet position"
        end
        local gradeIndex = chipValue and gradeIndexByAmount[chipValue] or nil
        if not gradeIndex then return false, "invalid chip value" end
        if not chipCount or chipCount <= 0 or chipCount > 4294967295
            or chipCount ~= math.floor(chipCount) then
            return false, "invalid chip count"
        end

        local amount = chipValue * chipCount
        local betIndex = position + 1
        if amount > maxSafeInteger or bets[betIndex] > maxSafeInteger - amount then
            return false, "bet amount overflow"
        end
        bets[betIndex] = bets[betIndex] + amount
        if counts[betIndex][gradeIndex] > 4294967295 - chipCount then
            return false, "chip count overflow"
        end
        counts[betIndex][gradeIndex] = counts[betIndex][gradeIndex] + chipCount
        grades[betIndex] = 1
    end
    return true, nil, bets, grades, counts
end

-- 旧协议仅作为灰度兼容；扣款金额仍由服务端面额配置和数量矩阵计算。
local function validateLegacyBet(betGrades, chipCounts, requestedBets)
    local gradeAmounts = LFGetGradeAmounts()
    local calculatedBets = LFEmptyBets()
    if #gradeAmounts < 1 or #gradeAmounts > 5 then
        return false, "invalid server grade config"
    end
    if type(betGrades) ~= "table" or #betGrades < 5
        or type(chipCounts) ~= "table" or #chipCounts ~= 5
        or type(requestedBets) ~= "table" or #requestedBets ~= 5 then
        return false, "invalid array size"
    end
    -- 兼容旧前端曾发送8位选择数组；多出的尾部必须全部为0。
    for index = 6, #betGrades do
        if tonumber(betGrades[index]) ~= 0 then return false, "invalid extra bet position" end
    end
    for betIndex = 1, 5 do
        local row = chipCounts[betIndex]
        if type(row) ~= "table" or #row < #gradeAmounts then
            return false, "invalid grade count"
        end
        -- 兼容旧UI固定创建5档、服务端实际配置4档的情况；额外档位只允许为0。
        for gradeIndex = #gradeAmounts + 1, #row do
            if tonumber(row[gradeIndex]) ~= 0 then return false, "invalid extra grade" end
        end
        -- 校验：每个筹码数量为非负整数
        local expected = 0
        for gradeIndex, amount in ipairs(gradeAmounts) do
            local count = tonumber(row[gradeIndex])
            if not count or count < 0 or count ~= math.floor(count) then return false, "invalid chip count" end
            expected = expected + amount * count
        end
        calculatedBets[betIndex] = expected
        -- 客户端金额字段只检查基本类型；真实扣款金额始终采用服务端计算值。
        local requested, selected = tonumber(requestedBets[betIndex]), tonumber(betGrades[betIndex])
        if not requested or requested < 0 or requested ~= math.floor(requested)
            or (selected ~= 0 and selected ~= 1)
            or selected ~= (expected > 0 and 1 or 0) then
            return false, "bet amount mismatch"
        end
    end
    return true, nil, calculatedBets
end

-- 构造下注响应：code是兼容旧客户端的稳定业务码，rawTradeCode透传平台原始交易码。
-- 新平台错误码只需在客户端增加展示逻辑，不再要求游戏服同步更新枚举并重启。
local function betResp(system, code, rawTradeCode)
    return {
        code = code,
        rawTradeCode = rawTradeCode,
        accountDiamond = system:getDiamond(),
        betGradeNum = system:getData().chipCounts or LFEmptyChipCounts(),
    }
end

-- 下注扣币由平台异步回调完成，因此统一通过betResp推送最终结果。
-- 客户端保证同一时刻只有一笔下注在途，因此异步响应可直接关联当前请求。
local function pushBetResp(system, code, player, rawTradeCode)
    player = player or (system and system:getPlayer())
    if system and player and player:isOnline() then
        Router.Client.betResp(betResp(system, code, rawTradeCode), player)
    end
end

-- 下注请求处理：校验→扣币→回调中更新下注数据
-- 异步扣币设计：必须在回调中完成请求，否则客户端会看到虚假成功
function LuckyFruitsPlayer:bet(todayRound, betList, legacyBetGrades, legacyChipCounts, legacyRequestedBets)
    local step, uid = self.scene:getRoundStep(), self:getUid()
    -- 关服中：拒绝下注
    if self.scene:isStop() then
        pushBetResp(self, LFTradeCode.closeServer)
        return nil
    end
    -- 非下注阶段或回合不匹配：错过下注时间
    if step.status ~= LFGameStatus.bet or tonumber(todayRound) ~= step.todayRound then
        pushBetResp(self, LFTradeCode.missTime)
        return nil
    end
    -- 以服务端倒计时为准，最后 3 秒停止接收新下注，避免临近封盘的请求进入异步扣款流程。
    local remainSecond = tonumber(step.remainSecond) or 0
    if remainSecond <= 3 then
        log_info("LuckyFruits bet rejected: cutoff, uid:{0} round:{1} remainSecond:{2}", uid, step.todayRound, remainSecond)
        pushBetResp(self, LFTradeCode.missTime)
        return nil
    end
    -- 新协议优先；未携带betList时才进入旧协议兼容分支。
    local valid, reason, bets, betGrades, chipCounts
    if type(betList) == "table" and #betList > 0 then
        valid, reason, bets, betGrades, chipCounts = validateBetList(betList)
    else
        valid, reason, bets = validateLegacyBet(legacyBetGrades, legacyChipCounts, legacyRequestedBets)
        if valid then
            betGrades, chipCounts = LFEmptyBets(), LFEmptyChipCounts()
            for betIndex = 1, 5 do
                betGrades[betIndex] = tonumber(legacyBetGrades[betIndex]) or 0
                for gradeIndex = 1, #chipCounts[betIndex] do
                    chipCounts[betIndex][gradeIndex] = tonumber(legacyChipCounts[betIndex][gradeIndex]) or 0
                end
            end
        end
    end
    if not valid then
        log_error("LuckyFruits invalid bet: uid:{0} round:{1} reason:{2}", uid, step.todayRound, reason)
        pushBetResp(self, LFTradeCode.fail)
        return nil
    end

    -- 真实下注金额由服务端面额配置和筹码数量计算，不能采用客户端传入金额。
    local total = 0
    for i = 1, 5 do
        if total > 9007199254740991 - bets[i] then
            pushBetResp(self, LFTradeCode.fail)
            return nil
        end
        total = total + bets[i]
    end
    -- 总额为0或余额不足：拒绝下注
    if total <= 0 or not self:getPlayer():coinsEnough(total) then
        pushBetResp(self, LFTradeCode.insufficient)
        return nil
    end

    -- 获取回合上下文：用于绑定扣币与回合的关联
    local context = self.scene:getRoundContext()
    local roundId = context and context.roundId or nil
    if not roundId or context.todayRound ~= step.todayRound then
        pushBetResp(self, LFTradeCode.fail)
        return nil
    end

    -- 所有下注入口（含续押/旧协议）统一限制玩家单局5个位置的累计总额。
    -- 在扣币前计入尚未回调的金额；恰好达到上限允许，超过则整笔拒绝。
    local betMax = LFGetRoundBetMax()
    local roundTotal = LFArraySum(self:getData().bets)
    local pendingTotal = self.scene:getPendingBetAmount(roundId, uid)
    if total > betMax - roundTotal - pendingTotal then
        log_info("LuckyFruits bet rejected: max, uid:{0} round:{1} bet:{2} placed:{3} pending:{4} max:{5}",
            uid, step.todayRound, total, roundTotal, pendingTotal, betMax)
        pushBetResp(self, LFTradeCode.betPassMax)
        return nil
    end

    -- 构造平台数据：bet_id记录选中的下注位置（0-based）
    local betIds = {}
    for i, selected in ipairs(betGrades) do if selected > 0 then betIds[#betIds + 1] = tostring(i - 1) end end
    local platformData = { bet_id = table.concat(betIds, ",") }
    -- 标记本回合有待处理下注：用于关服时判断是否需要等待结算
    local betScene = self.scene
    betScene:beginPendingBet(roundId, uid, total)
    -- 异步扣币：回调中根据结果更新数据或处理跨回合场景
    self:getPlayer():subCoins(roundId, ECoinsOperateType.BetSub, total, function(code, orderId, backPlayer)
        betScene:endPendingBet(roundId, uid, total)
        -- 回调可能仍携带退出前的玩家对象；已重进时把确认下注写入当前对象。
        local system = betScene.players[uid]
            or (backPlayer and backPlayer:getSystem(LuckyFruitsConst.gameName)) or self
        if not system then return end
        -- 扣币失败：推送错误码给客户端
        if code ~= 0 then
            local resultCode = code
            if resultCode ~= ETradeCode.UserStatusError and resultCode ~= ETradeCode.Insufficient  and resultCode ~= ETradeCode.CoinFrozen then resultCode = ETradeCode.SdkDisconnect end
            -- 旧客户端继续读取归一化后的code；新客户端优先读取原始rawTradeCode。
            -- 未知code仍给旧客户端降级为SdkDisconnect，但无需再加入上面的白名单。
            pushBetResp(system, resultCode, system:getPlayer(), code)
            return
        end

        -- 检查回合是否已变化：若下注时已进入下一回合，需走延迟奖励流程
        local current = system.scene:getRoundStep()
        if current.status ~= LFGameStatus.bet or current.todayRound ~= tonumber(todayRound)
            or system.scene:getRoundId() ~= roundId then
            local outcome = system.scene:getRoundOutcome(roundId)
            local result = outcome and outcome.result or nil
            if not result then
                log_error("LuckyFruits bet delay reward missing outcome: uid:{0} round:{1} roundId:{2} orderId:{3} currentRound:{4} status:{5}",
                    uid, step.todayRound, roundId, orderId, current.todayRound or -1, current.status or -1)
                pushBetResp(system, LFTradeCode.fail)
                return
            end

            local reward = LFRevenue(bets, result.resultDetail)
            local player = backPlayer or system:getPlayer()
            -- 延迟奖励：将本次下注的奖励通过subCoinsDelayReward补发给玩家
            -- 打印这回合的下注结果
            if reward > 0 then
                if not player or not player.subCoinsDelayReward then
                    log_error("LuckyFruits bet delay reward failed: player nil, uid:{0} round:{1} roundId:{2} orderId:{3} reward:{4}",
                        uid, step.todayRound, roundId, orderId, reward)
                    pushBetResp(system, LFTradeCode.fail)
                    return
                end

                player:subCoinsDelayReward(
                    roundId, platformData.bet_id, orderId, outcome and outcome.oddsType or 0,
                    ECoinsOperateType.WinAdd, total, reward,
                    { win_id = tostring(result and result.winPos or -1) }
                )
                log_info("LuckyFruits bet delay reward: uid:{0} round:{1} bet_id:{2} orderId:{3} reward:{4}",
                    uid, step.todayRound, platformData.bet_id, orderId, reward)
            else
                log_info("LuckyFruits bet delay no reward: uid:{0} round:{1} bet_id:{2} orderId:{3} reward:{4}",
                    uid, step.todayRound, platformData.bet_id, orderId, reward)
            end
            pushBetResp(system, LFTradeCode.missTime)
            return
        end

        -- 正常流程：更新玩家下注数据
        local data = system:getData()
        for i = 1, 5 do data.bets[i] = (data.bets[i] or 0) + bets[i] end
        data.chipCounts = LFMergeChipCounts(data.chipCounts, chipCounts)
        local player = backPlayer or system:getPlayer()
        -- 记录本回合参与玩家：用于结算时遍历
        if not system.scene:recordRoundPlayer(system, player) then return end
        -- 累加到回合总下注并广播
        system.scene:addRoundBets(bets, chipCounts, system:getUid())
        -- 更新排行榜积分
        local rankSystem = player and player:getSystem("RankPSystem") or nil
        if rankSystem then rankSystem:updateRankList(total) end
        -- 广播本次下注给全场景玩家
        system.scene:broadcast("onbatListRound", {
            uid = system:getUid(), flyPlayerPos = 5, batIndex = betGrades, num = chipCounts,
        })
        pushBetResp(system, LFTradeCode.success)
    end, platformData)
    return nil
end

-- 保存历史记录：记录单回合下注与开奖结果，最多保留20条
function LuckyFruitsPlayer:saveHistory(todayRound, bets, winPos, resultDetail)
    local history = self:getData().history
    history[#history + 1] = {
        date = os.date("%x"), round = todayRound, betDatails = LFClone(bets),
        roundResult = winPos, resultDetail = LFClone(resultDetail),
    }
    while #history > 20 do table.remove(history, 1) end
end

-- 结算当前回合：计算玩家奖励并异步入账，返回排行榜数据
-- 支持跨进程玩家：通过pid查找真实玩家对象进行入账
function LuckyFruitsPlayer:settleCurrentRound(roundId, todayRound, winPos, resultDetail, oddsType, roundUid, roundPid)
    local data, player = self:getData(), self:getPlayer()
    local bets = LFClone(data.bets or LFEmptyBets())
    local total, revenue = LFArraySum(bets), LFRevenue(bets, resultDetail)
    -- 无下注：不参与结算
    if total <= 0 then return nil, nil end
    local uid, pid = tostring(roundUid or self:getUid()), roundPid or (player and player:getPid())
    -- identity用于排行榜展示，可能为跨服玩家对象
    local identity = pid and gWorld:findAllPlayer(pid) or player
    self:saveHistory(todayRound, bets, winPos, resultDetail)

    -- 有奖励：异步入账到玩家账户
    if revenue > 0 then
        local rawPlayer = pid and gWorld:findAllPlayer(pid) or nil
        if rawPlayer then
            -- 初始化超时追踪表：用于异步扣币超时管理
            rawPlayer.subCoinTypeTimeout = rawPlayer.subCoinTypeTimeout or {}
            rawPlayer:addCoins(roundId, oddsType or 0, ECoinsOperateType.WinAdd, revenue, function(code, _, backPlayer)
                if code == 0 and backPlayer then
                    -- 入账成功：更新今日收益并推送玩家更新
                    local system = backPlayer:getSystem(LuckyFruitsConst.gameName) or self
                    system:getData().todayRevenue = (system:getData().todayRevenue or 0) + revenue
                    Router.Client.onPlayerUpdate({
                        uid = uid,
                        diamond = system:getDiamond(),
                        itemAmount = system:getData().bets,
                        todayRound = todayRound,
                    }, backPlayer)
                else
                    log_error("LuckyFruits addCoins failed: uid:{0} round:{1} code:{2}", uid, todayRound, code)
                end
            end, { win_id = table.concat(resultDetail, " ") })
        else
            log_error("LuckyFruits payout player missing: uid:{0} pid:{1} round:{2}", uid, tostring(pid), todayRound)
        end
    end

    -- 返回排行榜条目：包含玩家身份、头像、昵称、奖励金额
    return {
        uid = uid,
        profile = identity and identity:getAvatarUrl() or "",
        name = identity and identity:getName() or "",
        revenue = revenue,
    }, revenue
end

-- 设置当前选中的下注金额按钮索引：用于客户端UI记忆
function LuckyFruitsPlayer:setBetAmountButton(index)
    self:getData().playerSettings.lastBetAmountButton = math.max(0, math.floor(tonumber(index) or 0))
    return { code = 0 }
end

-- 更新玩家设置：音量、上次下注按钮
function LuckyFruitsPlayer:updateSettings(settings)
    local current = self:getData().playerSettings
    if type(settings) == "table" then
        if settings.soundVol ~= nil then current.soundVol = tonumber(settings.soundVol) and math.max(0, tonumber(settings.soundVol)) or 0 end
        if settings.lastBetAmountButton ~= nil then
            current.lastBetAmountButton = math.max(0, math.floor(tonumber(settings.lastBetAmountButton) or 0))
        end
    end
    return { code = 0 }
end
