require "FootballLeague.FootballLeagueCfgMgr"

GameBetData = class__()

function GameBetData:ctor__()
    self.sceneBetData = {}
    self.globalBetData = {}
    self.playerBetData = {}

    self.betTotal = 0
    self.rewardTotal = 0
    self.hotRank3 = {}
    self.hotBetMap = {}
    self.hotLevelMap = {}

    self.playerRewardInfo = {}
    self.playerRewardsBetState = {}
end

local function normalizeSceneType(sceneType)
    sceneType = tonumber(sceneType) or EGameScene.Normal
    if sceneType < EGameScene.Normal or sceneType > EGameScene.Master then
        return EGameScene.Normal
    end
    return sceneType
end

function GameBetData:createStore()
    return {
        globalBetData = {},
        playerBetData = {},
        betTotal = 0,
        rewardTotal = 0,
        hotRank3 = {},
        hotBetMap = {},
        hotLevelMap = {},
        playerRewardInfo = {},
        playerRewardsBetState = {},
    }
end

local function getHotLevel(betValue)

    local betMultiple = FootballLeagueCfgMgr:getCfgConstantValue(EConstantKey.BetMultiple) or {}
    local chipRate = betMultiple[sceneType] or 1

    betValue = tonumber(betValue) or 0   --需要做成配置文件配置
    if betValue >= 5000 * chipRate then
        return 3
    elseif betValue >= 2000 * chipRate then
        return 2
    elseif betValue >= 1000 * chipRate then
        return 1
    end
    return 0
end

function GameBetData:getStore(sceneType)
    if not sceneType then
        return self
    end
    sceneType = normalizeSceneType(sceneType)
    if not self.sceneBetData[sceneType] then
        self.sceneBetData[sceneType] = self:createStore()
    end
    return self.sceneBetData[sceneType]
end

function GameBetData:updateBetValueToStore(store, pid, betid, betValue)
    if not store.playerBetData[pid] then
        store.playerBetData[pid] = {
            betInfo = {},
            betMap = {},
            betTotal = 0,
            betCount = 0
        }
    end

    store.playerBetData[pid].betMap[betid] = (store.playerBetData[pid].betMap[betid] or 0) + betValue
    store.playerBetData[pid].betTotal = (store.playerBetData[pid].betTotal or 0) + betValue
    if store.playerRewardsBetState[pid] and store.playerRewardsBetState[pid][betid] then
        store.playerRewardsBetState[pid][betid] = EBetState.BetSuc
    end

    local time = os.time()
    if not store.globalBetData[betid] then
        store.globalBetData[betid] = {
            betValue = 0,
            betTime = 0
        }
    end

    store.globalBetData[betid].betValue = store.globalBetData[betid].betValue + betValue
    store.globalBetData[betid].betTime = time
    store.betTotal = store.betTotal + betValue
end

function GameBetData:updateBetValue(pid, betid, betValue, sceneType)
    if not FootballLeagueCfgMgr:isValidRewardId(betid) then
        log_error("updateBet-ZhuanPan reward data is nil, rewardId:{0}", betid)
        return
    end

    local store = self:getStore(sceneType)
    self:updateBetValueToStore(store, pid, betid, betValue)
    if sceneType then
        self:updateBetValueToStore(self, pid, betid, betValue)
    end
end

function GameBetData:updateReward(addReward, sceneType)
    local store = self:getStore(sceneType)
    store.rewardTotal = store.rewardTotal + addReward
    if sceneType then
        self.rewardTotal = self.rewardTotal + addReward
    end
end

function GameBetData:updateBetInfo(pid, betInfo)
    if not self.playerBetData[pid] then
        self.playerBetData[pid] = {
            betInfo = {},
            betMap = {},
            betTotal = 0,
        }
    end
    table.insert(self.playerBetData[pid].betInfo, betInfo)
end

function GameBetData:updatePlayerBetCount(pid, sceneType)
    local store = self:getStore(sceneType)
    if not store.playerBetData[pid] then
        return
    end
    store.playerBetData[pid].betCount = store.playerBetData[pid].betCount + 1
    if sceneType and self.playerBetData[pid] then
        self.playerBetData[pid].betCount = self.playerBetData[pid].betCount + 1
    end
end

function GameBetData:updatePlayerRewardMap(pid, rewardMap, sceneType)
    local store = self:getStore(sceneType)
    if not store.playerRewardInfo[pid] then
        store.playerRewardInfo[pid] = {}
    end
    store.playerRewardInfo[pid].rewardMap = rewardMap
    if sceneType then
        if not self.playerRewardInfo[pid] then
            self.playerRewardInfo[pid] = {}
        end
        self.playerRewardInfo[pid].rewardMap = self.playerRewardInfo[pid].rewardMap or {}
        for rewardId, rewardValue in pairs(rewardMap or {}) do
            self.playerRewardInfo[pid].rewardMap[rewardId] = (self.playerRewardInfo[pid].rewardMap[rewardId] or 0) + rewardValue
        end
    end
end

function GameBetData:updatePlayerRewardTotal(pid, reward, sceneType)
    local store = self:getStore(sceneType)
    if not store.playerRewardInfo[pid] then
        store.playerRewardInfo[pid] = {}
    end
    store.playerRewardInfo[pid].rewardTotal = reward
    if sceneType then
        if not self.playerRewardInfo[pid] then
            self.playerRewardInfo[pid] = {}
        end
        self.playerRewardInfo[pid].rewardTotal = (self.playerRewardInfo[pid].rewardTotal or 0) + reward
    end
end

--更新玩家押注状态
function GameBetData:setBetStartState(pid, reward, sceneType)
    local store = self:getStore(sceneType)
    if not store.playerRewardsBetState[pid] then
        store.playerRewardsBetState[pid] = {}
    end
    if not store.playerRewardsBetState[pid][reward] then
        store.playerRewardsBetState[pid][reward] = EBetState.BetStart
    end
    if sceneType then
        if not self.playerRewardsBetState[pid] then
            self.playerRewardsBetState[pid] = {}
        end
        if not self.playerRewardsBetState[pid][reward] then
            self.playerRewardsBetState[pid][reward] = EBetState.BetStart
        end
    end
end

function GameBetData:getPlayerRewardsBetStateMap(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerRewardsBetState[pid] or {}
end

function GameBetData:getPlayerBetTypeCount(pid, sceneType)
    local store = self:getStore(sceneType)
    if not store.playerRewardsBetState[pid] or not store.playerRewardsBetState[pid] then
        return 0
    end
    local num = 0
    for betId, _ in pairs(store.playerRewardsBetState[pid]) do
        num = num + 1
    end
    return num
end

function GameBetData:getPlayerRewardMap(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerRewardInfo[pid] and store.playerRewardInfo[pid].rewardMap or {}
end

function GameBetData:getPlayerRewardTotal(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerRewardInfo[pid] and store.playerRewardInfo[pid].rewardTotal or 0
end

function GameBetData:getPlayerBetCount(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData[pid] and store.playerBetData[pid].betCount or 0
end

function GameBetData:getBetTotal(sceneType)
    local store = self:getStore(sceneType)
    return store.betTotal
end

function GameBetData:getRewardTotal(sceneType)
    local store = self:getStore(sceneType)
    return store.rewardTotal
end

function GameBetData:getGlobalBetData(sceneType)
    local store = self:getStore(sceneType)
    return store.globalBetData
end

function GameBetData:getGlobalBetValue(betId, sceneType)
    local store = self:getStore(sceneType)
    return store.globalBetData[betId] and store.globalBetData[betId].betValue or 0
end

function GameBetData:getPlayersBetData(sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData
end

function GameBetData:getPlayerBetData(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData[pid]
end

function GameBetData:getPlayerBetTotal(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData and store.playerBetData[pid] and store.playerBetData[pid].betTotal or 0
end

function GameBetData:getPlayerBetMap(pid, sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData and store.playerBetData[pid] and store.playerBetData[pid].betMap or {}
end

function GameBetData:getPlayerBetRewards(pid, sceneType)
    local tb = {}
    local hadBetMap = self:getPlayerBetMap(pid, sceneType)
    for betid, betValue in pairs(hadBetMap) do
        if betValue > 0 then
            table.insert(tb, betid)
        end
    end
    return tb
end

function GameBetData:getPlayerBetValue(pid, betId, sceneType)
    local store = self:getStore(sceneType)
    return store.playerBetData[pid] and store.playerBetData[pid].betMap and store.playerBetData[pid].betMap[betId] or 0
end

function GameBetData:getScGlobalBetInfo(sceneType)
    local store = self:getStore(sceneType)
    local tb = {
        betMap = {}
    }
    if not store.globalBetData or not next(store.globalBetData) then
        return tb
    end
    for rewardId, info in pairs(store.globalBetData) do
        local key = tostring(rewardId)
        tb.betMap[key] = info.betValue
    end
    return tb
end

function GameBetData:getScSelfBetInfo(pid, sceneType)
    local betMap = {}
    local pbetData = self:getPlayerBetData(pid, sceneType)
    if not pbetData then
        return betMap
    end

    for rewardId, betValue in pairs(pbetData.betMap) do
        local key = tostring(rewardId)
        betMap[key] = betValue
    end
    return betMap
end

function GameBetData:getBetHotRank3(sceneType)
    local store = self:getStore(sceneType)
    local rank3 = {}
    local hotBetMap = {}
    local hotLevelMap = {}
    if not next(store.globalBetData) then
        return rank3, hotBetMap, false
    end

    local sortTb = {}
    for betId, value in pairs(store.globalBetData) do
        local betValue = value.betValue or 0
        -- 同步所有卡牌的全服下注额，客户端卡牌下注数不能只显示个人下注。
        hotBetMap[tostring(betId)] = betValue
        if getHotLevel(betValue) > 0 then
            table.insert(sortTb, {
                betId = betId,
                betValue = betValue,
                betTime = value.betTime
            })
        end
    end

    table.sort(sortTb, function(a, b)
        if a.betValue ~= b.betValue then
            -- 金额不同：金额大的排前面
            return a.betValue > b.betValue
        else
            -- 金额相同：时间大的排前面
            return a.betTime > b.betTime
        end
    end)

    for i = 1, #sortTb do
        local betId = sortTb[i].betId
        local betValue = sortTb[i].betValue
        table.insert(rank3, betId)
        hotLevelMap[tostring(betId)] = getHotLevel(betValue)
    end

    local changed = false
    if #rank3 ~= #store.hotRank3 then
        changed = true
    end

    if not changed then
        for i = 1, #rank3 do
            if rank3[i] ~= store.hotRank3[i] then
                changed = true
                break
            end
        end
    end

    if not changed then
        for _, betId in ipairs(rank3) do
            local key = tostring(betId)
            if hotLevelMap[key] ~= (store.hotLevelMap and store.hotLevelMap[key] or nil) then
                changed = true
                break
            end
        end
    end

    -- 下注金额本身也要实时同步；即使热度等级和排行未变化，下注面板仍需刷新。
    store.hotBetMap = hotBetMap

    if changed then
        store.hotRank3 = rank3
        store.hotLevelMap = hotLevelMap
        return rank3, hotBetMap, true
    end

    return {}, {}, false
end

function GameBetData:getInitHotRank3(sceneType)
    local store = self:getStore(sceneType)
    return store.hotRank3 or {}, store.hotBetMap or {}
end

-- 当前场景下注额最高的球队。热度展示有门槛，不能复用 hotRank3 来判定。
-- 金额相同时沿用热度榜规则，优先最新下注，保证客户端显示稳定。
function GameBetData:getMostBetTeamId(sceneType)
    local store = self:getStore(sceneType)
    local mostBetId = 0
    local mostBetValue = -1
    local mostBetTime = -1
    for betId, info in pairs(store.globalBetData or {}) do
        local betValue = tonumber(info.betValue) or 0
        local betTime = tonumber(info.betTime) or 0
        if betValue > mostBetValue or (betValue == mostBetValue and betTime > mostBetTime) then
            mostBetId = tonumber(betId) or 0
            mostBetValue = betValue
            mostBetTime = betTime
        end
    end
    return mostBetId
end

--给平台一个bet_id
function GameBetData:getBetIdForPlatform(pid)
    if self.playerBetData[pid] and self.playerBetData[pid].betMap then
        for betId, _ in pairs(self.playerBetData[pid].betMap) do
            return { bet_id = betId }
        end
    end
    return {}
end

function GameBetData:checkHavePlayerBet(sceneType)
    local store = self:getStore(sceneType)
    return next(store.playerBetData) ~= nil
end

function GameBetData:getNoBetReweards()
    local cfgZhuanPan = gConfigMgr:getBaseConfig("ZhuanPan")
    local tb = {}
    local rewards = {}
    for id, value in ipairs(cfgZhuanPan) do
        if id < 9 then
            local reward = value.Rewards[1]
            if not self.globalBetData[reward] and not tb[reward] then
                tb[reward] = true
                table.insert(rewards, reward)
            end
        end
    end
    return rewards
end
