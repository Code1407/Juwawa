require "GameBase.PlayerBase"
require "Rank.RankPSystem"
require "Mail.MailPSystem"
require "SuperAce.SuperAceSystem"

Player = class__(PlayerBase)

--构造函数
function Player:ctor__(...)
    PlayerBase.ctor__(self, ...)
    SuperAceSystem(self)
    RankPSystem(self)
    MailPSystem(self)
end

--数据加载回调
function Player:onLoad(data)
    if not data then 
        data = {}
    end
    PlayerBase.onLoad(self, data)
end

--玩家进入回调
function Player:onEnter()
    PlayerBase.onEnter(self)
	
	local msg = {}
    msg.pBaseData = {
        playerId = self:getPid(),
        playerUid = self:getUid(),
        name = self:getName(), 
        avatarUrl = self:getAvatarUrl(), 
        coins = self:getCoins()
    }
    Router.Client.ScLoginSucPush(msg, self)
end

--玩家退出回调
function Player:onLeave()
    PlayerBase.onLeave(self)
end

--玩家积分改变回调
function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then
        local coins = self:getCoins()
        Router.Client.ScCoinsUpdatePush({coins = coins}, self)
    end
end

--sdk状态改变回调
function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then
        local sdkState = self:getSdkState()
        Router.Client.ScSdkStatePush({state = sdkState}, self) 
    end
end

--sdk状态是否有效
function Player:checkSdkIsValid()
    local sdkState = self:getSdkState()
    return sdkState == ESdkState.EValid
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
