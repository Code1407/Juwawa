require "GameBase.PlayerBase"
require "GameError"
require "Seven7CfgMgr"
require "Rank.RankPSystem"
require "Mail.MailPSystem"

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
            chipIndex = 1
        }
    end
    PlayerBase.onLoad(self, data)
end

--玩家进入回调
function Player:onEnter()
    PlayerBase.onEnter(self)
    SvrSystem.Seven7Main.playerEnterOrLeave(1)
    self:onSdkChanged()

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
    Router.Client.ScPlayerEnterGamePush(msg, self)
end

--玩家退出回调
function Player:onLeave()
    PlayerBase.onLeave(self)
    SvrSystem.Seven7Main.playerEnterOrLeave(0)
end

--SDK回调
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

--检查是不是上次押注的游戏
function Player:checkIsNewRound(serverIndex, round)
    local data = self:getData()
    local len = #data.betHistory
    if len <= 0 then
        return true
    end

    local finalData = data.betHistory[1]
    if finalData.serverIndex == serverIndex and finalData.round == round then
        return false
    end
    return true
end

function Player:saveBetInfo(prepareTime, round, betInfo, betMap)
    if not betInfo or #betInfo.betList <= 0 then
        return
    end
    local data = self:getData()
    local serverIndex = gApp:getServerIndex()
    local isNewRound = self:checkIsNewRound(serverIndex, round)
    local bMap = self:getBetMapData(betMap)
    if isNewRound then
        local tb = {
            serverIndex = serverIndex,
            prepareTime = prepareTime,
            round = round,
            orderInfo = {},  --订单信息
            betMap = bMap,   --押注Map
            result = {}
        }

        table.insert(tb.orderInfo, betInfo)
        table.insert(data.betHistory, 1,tb)
        local maxCount = Seven7CfgMgr:getCfgConstantValue(EConstantKey.SaveSelfBetRecordCount)
        local len = #data.betHistory
        if len > maxCount then
            table.remove(data.betHistory, len)
        end
    else
        local finalData = data.betHistory[1]
        if finalData then
            finalData.betMap = bMap
            table.insert(finalData.orderInfo, betInfo)
        end
    end
end


--当自己下了注时，保存游戏结果
function Player:saveGameResult(result, round)
    local data = self:getData()
    local len = #data.betHistory
    if len <= 0 then
        return
    end
    local roundInfo = data.betHistory[1]
    if not roundInfo then
        return
    end

    local serverIndex = gApp:getServerIndex()
    if roundInfo.serverIndex ~= serverIndex and roundInfo.round ~= round then
        return
    end
    roundInfo.result = result
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

--------------------------MSG-----------------------------
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