-- ============================================================
-- Player 玩家类
-- 继承自 PlayerBase，是游戏中玩家对象的最终实现类。
-- 采用"组合优于继承"的设计思路：通过在构造函数中挂载多个子系统（PSystem），
-- 将豪华车、排行榜、邮件等业务功能以组件的形式附加到玩家对象上。
-- 每个子系统独立维护自己的状态和逻辑，彼此之间通过事件或直接方法调用协同工作。
-- ============================================================

-- 依赖引入：基类和各个子系统
require "GameBase.PlayerBase"       -- 玩家基类，提供玩家通用的基础字段与方法
require "BountyFootball.BountyFootballPlayer" -- 豪华车子系统，处理与豪车相关的玩家数据与行为
require "Rank.RankPSystem"          -- 排行榜子系统，处理玩家在各类榜单中的排名数据
require "Mail.MailPSystem"          -- 邮件子系统，处理玩家的收件箱、邮件读取与附件领取等逻辑

-- Player 继承自 PlayerBase，因此自动获得 PlayerBase 中定义的所有通用属性与方法
-- （例如基础身份字段、数据存储接口、事件机制等），在此基础上再挂载各类业务子系统
Player = class__(PlayerBase)

-- 构造函数：在调用父类构造完成后，依次挂载各个业务子系统
-- 每个子系统的构造函数都会将自身的字段与方法注入到 Player 实例中，
-- 使 Player 同时拥有豪车、排行榜、邮件等多套业务能力
function Player:ctor__(...)
    PlayerBase.ctor__(self, ...) -- 先执行父类构造，初始化玩家基础数据
    -- Compatibility with Common/GameBase/PlayerSdk.lua.  Some Common.zip
    -- versions do not create this table before guessCoins calls
    -- popSubCoinType during the first addCoins request.
    self.subCoinTypeTimeout = self.subCoinTypeTimeout or {}
    BountyFootballPlayer(self)        -- 挂载豪华车子系统，为玩家添加豪车相关的属性与方法
    RankPSystem(self)            -- 挂载排行榜子系统，为玩家添加排行榜相关的属性与方法
    MailPSystem(self)            -- 挂载邮件子系统，为玩家添加邮件相关的属性与方法
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
    -- 与 Seven7 一致，玩家上线后立即把当前 SDK 状态同步给客户端。
    self:onSdkChanged()
	
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

--sdk状态改变回调
function Player:onSdkChanged()
    PlayerBase.onSdkChanged(self)
    if self:isOnline() then
        local sdkState = self:getSdkState()
        Router.Client.ScSdkStatePush({state = sdkState}, self)
    end
end

-- 玩家金币发生变化时主动同步客户端，覆盖邮件、排行奖励、后台加减币等非下注场景。
function Player:onCoinChanged()
    PlayerBase.onCoinChanged(self)
    if self:isOnline() then
        Router.Client.ScCoinsUpdatePush({coins = self:getCoins()}, self)
    end
end

--sdk状态是否有效
function Player:checkSdkIsValid()
    local sdkState = self:getSdkState()
    return sdkState == ESdkState.EValid
end

-------------------------------------------------------
--主动刷新玩家数据
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
