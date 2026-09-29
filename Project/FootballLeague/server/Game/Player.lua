require "GameBase.PlayerBase"
require "GameError"
require "Rank.RankPSystem"
require "Mail.MailPSystem"
require "FootballLeague.GameUtils"

Player = class__(PlayerBase)

--构造函数
function Player:ctor__(...)
    PlayerBase.ctor__(self, ...)
    RankPSystem(self)
    MailPSystem(self)
end

--数据加载回调
function Player:onLoad(data)
    if not data then 
        data = {
            betHistory = {},
            openAudio = true,
            chipIndex = 1,
            team_id = EGameScene.Normal,
            todayRevenue = 0,
            lastResetTime = 0
        }
    end
    data.betHistory = data.betHistory or {}
    data.openAudio = data.openAudio == nil and true or data.openAudio
    data.chipIndex = data.chipIndex or 1
    data.team_id = self:normalizeTeamId(data.team_id)
    data.todayRevenue = data.todayRevenue or 0
    data.lastResetTime = data.lastResetTime or 0

    PlayerBase.onLoad(self, data)
end

--玩家进入回调
function Player:onEnter()
    PlayerBase.onEnter(self)
    
    self:onSdkChanged()
    self:resetRevenue()
    SvrSystem.FootballLeagueMain.playerEnterOrLeave(1)
    
    local msg = {}
    msg.pBaseData = {
        playerId = self:getPid(),
        playerUid = self:getUid(),
        name = self:getName(), 
        avatarUrl = self:getAvatarUrl(), 
        coins = self:getCoins()
    }
    local data = self:getData()
    msg.openAudio = data.openAudio
    msg.chipIndex = data.chipIndex
    msg.team_id = self:getTeamId()
    Router.Client.ScPlayerEnterGamePush(msg, self)
end

--玩家退出回调
function Player:onLeave()
    PlayerBase.onLeave(self)
    SvrSystem.FootballLeagueMain.playerEnterOrLeave(0)
end

function Player:onOClock(hour)
   if hour == 0 then
        self:resetRevenue()      
   end     
end

function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then
        local sdkState = self:getSdkState()
        Router.Client.ScSdkStatePush({state = sdkState}, self) 
    end
end

function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then
        local coins = self:getCoins()
        Router.Client.ScCoinsUpdatePush({coins = coins}, self)
    end
end

function Player:checkSdkIsValid()
    local sdkState = self:getSdkState()
    return sdkState == ESdkState.EValid
end

-------------------------------------------------------

function Player:normalizeTeamId(team_id)
    team_id = tonumber(team_id) or EGameScene.Normal
    if team_id < EGameScene.Normal or team_id > EGameScene.Master then
        return EGameScene.Normal
    end
    return team_id
end

function Player:getTeamId()
    local data = self:getData()
    data.team_id = self:normalizeTeamId(data.team_id)
    return data.team_id
end

function Player:setTeamId(team_id)
    local data = self:getData()
    data.team_id = self:normalizeTeamId(team_id)
    return data.team_id
end

function Player:getBetHistoryIndex(serverIndex, round, team_id)
    local data = self:getData()
    team_id = self:normalizeTeamId(team_id)
    for index, item in ipairs(data.betHistory or {}) do
        if item.serverIndex == serverIndex and item.round == round and self:normalizeTeamId(item.team_id or item.sceneType) == team_id then
            return index
        end
    end
    return 0
end

function Player:trimBetHistory(maxCountPerScene)
    local data = self:getData()
    data.betHistory = data.betHistory or {}
    maxCountPerScene = tonumber(maxCountPerScene) or 50

    local sceneCounts = {}
    local index = 1
    while index <= #data.betHistory do
        local item = data.betHistory[index]
        local team_id = self:normalizeTeamId(item and (item.team_id or item.sceneType))
        sceneCounts[team_id] = (sceneCounts[team_id] or 0) + 1
        if sceneCounts[team_id] > maxCountPerScene then
            table.remove(data.betHistory, index)
        else
            index = index + 1
        end
    end
end

function Player:saveBetInfo(prepareTime, round, betInfo, betMap, team_id)
    if not betInfo or #betInfo.betList <= 0 then
        return
    end
    local data = self:getData()
    local serverIndex = gApp:getServerIndex()
    team_id = self:normalizeTeamId(team_id)
    local historyIndex = self:getBetHistoryIndex(serverIndex, round, team_id)
    local bMap = self:getBetMapData(betMap)
    if historyIndex <= 0 then
        local tb = {
            serverIndex = serverIndex,
            prepareTime = prepareTime,
            round = round,
            team_id = team_id,
            rewards = {},
            zhuanPanId = 0,
            orderInfo = {},  --订单信息
            betMap = bMap, --押注Map
            addCoins = 0,
            sceneType = team_id,
            sceneInfos = {},
        }

        betInfo.team_id = team_id
        betInfo.sceneType = team_id
        table.insert(tb.orderInfo, betInfo)
        table.insert(data.betHistory, 1,tb)
    else
        local finalData = data.betHistory[historyIndex]
        if finalData then
            finalData.betMap = bMap
            finalData.team_id = team_id
            finalData.sceneType = team_id
            betInfo.team_id = team_id
            betInfo.sceneType = team_id
            table.insert(finalData.orderInfo, betInfo)
        end
    end
    self:trimBetHistory(51)
end

--当自己下了注时，保存游戏结果
function Player:saveGameResult(rewards, zhuanPanId, addCoins, round, sceneInfos, sceneWins)
    local data = self:getData()
    local len = #data.betHistory
    if len <= 0 then
        return
    end

    local serverIndex = gApp:getServerIndex()
    for _, roundInfo in ipairs(data.betHistory) do
        if roundInfo and roundInfo.serverIndex == serverIndex and roundInfo.round == round then
            local team_id = self:normalizeTeamId(roundInfo.team_id or roundInfo.sceneType)
            local sceneInfo = sceneInfos and sceneInfos[team_id]
            roundInfo.team_id = team_id
            roundInfo.sceneType = team_id
            roundInfo.rewards = sceneInfo and sceneInfo.rewards or rewards
            roundInfo.zhuanPanId = sceneInfo and sceneInfo.zhuanPanId or zhuanPanId
            local sceneAddCoins = addCoins
            if sceneWins then
                sceneAddCoins = sceneWins[team_id] or 0
            end
            roundInfo.addCoins = sceneAddCoins
            roundInfo.sceneInfos = sceneInfos or {}
        end
    end
end

function Player:getBetMapData(betMap)
    local tb = {}
    for reward, value in pairs(betMap) do
        local str = tostring(reward)
        tb[str] = value
    end
    return tb
end

function Player:getBetHistory()
    local data = self:getData()
    return data.betHistory
end

function Player:setTodayRevenue(curRevenue)
    local data = self:getData() 
    data.todayRevenue = curRevenue
end

function Player:getTodayRevenue()
    local data = self:getData() 
    return data.todayRevenue
end

function Player:todayRevenueAdd(addRevenue)
    local nowRevenue = self:getTodayRevenue()
    local num = nowRevenue + addRevenue
    self:setTodayRevenue(num)
end

function Player:resetRevenue()
    local data = self:getData()
    if not data.lastResetTime then
        data.lastResetTime = 0
    end
    local lastResetTime = data.lastResetTime
    local nowTime = os.time()
    if lastResetTime == 0 then
        self:setTodayRevenue(0)
        data.lastResetTime = nowTime
        return
    end

    local isSameDay = GameUtils:isSameDay(lastResetTime, nowTime)
    if not isSameDay then
        self:setTodayRevenue(0)
        data.lastResetTime = nowTime
    end
end

-------------------------------------------------------
function Player:csPlayerBaseDataReq()
    self:refreshSdk(function (errCode, backPlayer)
        if errCode ~= 0 then
            return  log_error("refreshSdk error! {0}", errCode)
        end

        local msg = {}
        msg.pBaseData = {
            playerId = backPlayer:getPid(),
            playerUid = backPlayer:getUid(),
            name = backPlayer:getName(), 
            avatarUrl = backPlayer:getAvatarUrl(), 
            coins = backPlayer:getCoins()
        }
        Router.Client.CsPlayerBaseDataResp(msg, backPlayer)
    end)
end

function Player:csAudioChangeReq(openAudio)
    local data = self:getData()
    data.openAudio = openAudio
end

function Player:csChipChangeReq(chipIndex)
    local data = self:getData()
    data.chipIndex = chipIndex
end

function Player:csTeamChangeReq(team_id)
    self:setTeamId(team_id)
end
