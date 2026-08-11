require "GameBase.PlayerBase"
require "FortuneSlot.FortuneSlotCommon"
require "FortuneSlot.FortuneSlotPlayer"
require "Rank.RankPSystem"
require "Mail.MailPSystem"

Player = class__(PlayerBase)

local function pickUidValue(value)
    if value == nil or value == "" then
        return nil
    end
    return tostring(value)
end

local function resolvePlayerUid(player)
    local value = pickUidValue(rawget(player, "uId"))
        or pickUidValue(rawget(player, "uid"))
        or pickUidValue(rawget(player, "UserId"))
        or pickUidValue(rawget(player, "_uId"))
        or pickUidValue(rawget(player, "_uid"))
    if value then
        return value
    end

    local data = player.getData and player:getData() or nil
    if type(data) == "table" then
        value = pickUidValue(data.uId) or pickUidValue(data.uid) or pickUidValue(data.UserId)
        if value then
            return value
        end
    end

    return ""
end

local function getDisplayCoins(player)
    return math.floor(player:getCoins() or 0)
end

local function buildPlayerBaseData(player)
    return {
        playerId = player:getPid(),
        name = player:getName() or "",
        avatarUrl = player:getAvatarUrl() or "",
        coins = getDisplayCoins(player),
    }
end

function Player:ctor__(...)
    PlayerBase.ctor__(self, ...)
    FortuneSlotPlayer(self)
    RankPSystem(self)
	MailPSystem(self)
end

function Player:onLoad(data)
    if not data then
        data = {}
    end
    PlayerBase.onLoad(self, data)
end

function Player:getUid()
    local uid = resolvePlayerUid(self)
    if uid ~= "" then
        return uid
    end
    return tostring(self:getPid() or "")
end

function Player:onEnter()
    PlayerBase.onEnter(self)
    Router.Client.ScLoginSucPush({
        pBaseData = {
            playerId = self:getPid(),
            name = self:getName() or "",
            avatarUrl = self:getAvatarUrl() or "",
            coins = getDisplayCoins(self),
        }
    }, self)
end

function Player:onLeave()
    PlayerBase.onLeave(self)
end

function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then
        Router.Client.ScCoinsUpdatePush({ coins = getDisplayCoins(self) }, self)
    end
end

function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then
        Router.Client.ScSdkStatePush({ state = self:getSdkState() or 0 }, self)
    end
end

function Player:checkSdkIsValid()
    local sdkState = self.getSdkState and self:getSdkState() or nil
    if sdkState == nil then
        return true
    end
    return sdkState == ESdkState.EValid
end

function Player:csPlayerBaseDataReq()
    if self.refreshSdk then
        self:refreshSdk(function(errCode, backPlayer)
            if errCode ~= 0 then
                return log_error("refreshSdk error! {0}", errCode)
            end
            local player = backPlayer or self
            Router.Client.CsPlayerBaseDataResp({
                pBaseData = buildPlayerBaseData(player),
            }, player)
        end)
    end

    return {
        pBaseData = buildPlayerBaseData(self),
    }
end
