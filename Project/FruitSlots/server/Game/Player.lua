-- ============================================================
-- 玩家实体模块
-- 继承自PlayerBase，封装玩家完整数据和生命周期管理
-- 组合了老虎机系统(FruitSlotsPlayer)和邮件系统(MailPSystem)
-- ============================================================

require "GameBase.PlayerBase"
require "FruitSlots.FruitSlotsCommon"
require "FruitSlots.FruitSlotsPlayer"
require "Rank.RankPSystem"
require "Mail.MailPSystem"

Player = class__(PlayerBase)

-- 安全提取UID值（空值返回nil）
local function pickUidValue(value)
    if value == nil or value == "" then
        return nil
    end
    return tostring(value)
end

-- 从玩家对象中解析UID（尝试多种可能的字段名）
-- 优先从raw字段查找，其次从getData()返回的数据中查找
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

-- 获取玩家展示金币数（取整）
local function getDisplayCoins(player)
    return math.floor(player:getCoins() or 0)
end

-- 构建发送给客户端的基础玩家数据包
local function buildPlayerBaseData(player)
    return {
        playerId = player:getPid(),       -- 玩家进程ID
        playerUid = player:getUid(),      -- 玩家账号UID
        name = player:getName() or "",    -- 玩家昵称
        avatarUrl = player:getAvatarUrl() or "", -- 头像URL
        coins = getDisplayCoins(player),  -- 当前金币
    }
end

-- 构造函数：组合老虎机玩家系统和邮件系统
function Player:ctor__(...)
    PlayerBase.ctor__(self, ...)
    FruitSlotsPlayer(self)  -- 注入老虎机逻辑组件
    RankPSystem(self)
    MailPSystem(self)       -- 注入邮件逻辑组件
end

-- 玩家数据加载回调
function Player:onLoad(data)
    if not data then
        data = {}
    end
    PlayerBase.onLoad(self, data)
end

-- 获取玩家UID（优先从数据字段解析，降级为进程ID）
function Player:getUid()
    local uid = resolvePlayerUid(self)
    if uid ~= "" then
        return uid
    end
    return tostring(self:getPid() or "")
end

-- 玩家进入场景：推送基础数据给客户端
function Player:onEnter()
    PlayerBase.onEnter(self)
    Router.Client.ScLoginSucPush({
        pBaseData = buildPlayerBaseData(self)
    }, self)
end

-- 玩家离开场景
function Player:onLeave()
    PlayerBase.onLeave(self)
end

-- 金币变化回调：推送最新金币数给在线客户端
function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then
        Router.Client.ScCoinsUpdatePush({ coins = getDisplayCoins(self) }, self)
    end
end

-- SDK状态变化回调：推送状态给在线客户端
function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then
        Router.Client.ScSdkStatePush({ state = self:getSdkState() or 0 }, self)
    end
end

-- 检查SDK是否有效
function Player:checkSdkIsValid()
    local sdkState = self.getSdkState and self:getSdkState() or nil
    if sdkState == nil then
        return true -- 未设置SDK状态时默认有效
    end
    return sdkState == ESdkState.EValid
end

-- 处理客户端请求玩家基础数据
-- 如果支持SDK刷新，先刷新SDK再返回最新数据
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


