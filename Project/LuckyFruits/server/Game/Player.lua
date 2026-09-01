-- ============================================================
-- Player 模块：玩家基础类
-- 继承自 PlayerBase，作为玩家在游戏服内的根对象。
-- 构造时挂载三个业务子系统：LuckyFruitsPlayer、RankPSystem、MailPSystem，
-- 分别承载游戏、排行榜、邮件功能；并统一管理玩家生命周期事件
-- （加载、进入、离开、SDK状态变更、金币变更）。
-- ============================================================

require "GameBase.PlayerBase"
require "LuckyFruits.LuckyFruitsPlayer"
require "Rank.RankPSystem"
require "Mail.MailPSystem"

Player = class__(PlayerBase)

-- 构造玩家基础数据快照：用于推送至客户端展示玩家身份与资产
local function baseData(player)
    return {
        playerId = player:getPid(),
        playerUid = player:getUid(),
        name = player:getName() or "",
        avatarUrl = player:getAvatarUrl() or "",
        coins = math.floor(player:getCoins() or 0),
    }
end

-- 构造函数：挂载三个业务子系统
-- subCoinTypeTimeout 用于异步扣币超时追踪，避免重复扣款
function Player:ctor__(...)
    PlayerBase.ctor__(self, ...)
    self.subCoinTypeTimeout = self.subCoinTypeTimeout or {}
    LuckyFruitsPlayer(self)
    RankPSystem(self)
    MailPSystem(self)
end

-- 玩家数据从存储层加载完成时触发
function Player:onLoad(data)
    PlayerBase.onLoad(self, data or {})
end

-- 玩家进入游戏服：先同步SDK状态，再推送登录成功及基础数据
function Player:onEnter()
    PlayerBase.onEnter(self)
    self:onSdkChanged()
    Router.Client.ScLoginSucPush({ pBaseData = baseData(self) }, self)
end

-- 玩家离开游戏服：交由基类清理在线状态
function Player:onLeave() PlayerBase.onLeave(self) end

-- SDK状态变更通知：在线时主动推送最新状态给客户端
function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then Router.Client.ScSdkStatePush({ state = self:getSdkState() or 0 }, self) end
end

-- 金币变更通知：在线时推送最新金币余额给客户端
function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then Router.Client.ScCoinsUpdatePush({ coins = math.floor(self:getCoins() or 0) }, self) end
end

-- 校验SDK是否有效：状态为空或显式有效才允许操作
function Player:checkSdkIsValid()
    local state = self.getSdkState and self:getSdkState() or nil
    return state == nil or state == ESdkState.EValid
end

-- 客户端请求玩家基础数据：若支持refreshSdk则异步刷新后再回包
function Player:csPlayerBaseDataReq()
    local response = { pBaseData = baseData(self) }
    if not self.refreshSdk then return response end
    self:refreshSdk(function(errorCode, backPlayer)
        if errorCode ~= 0 then
            return log_error("LuckyFruits refreshSdk failed: code:{0}", errorCode)
        end
        local player = backPlayer or self
        Router.Client.CsPlayerBaseDataResp({ pBaseData = baseData(player) }, player)
    end)
    return response
end
