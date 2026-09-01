-- ============================================================
-- RankPSystem 模块：玩家排行榜子系统
-- 继承自 SystemBase，作为 Player 的子系统挂载在玩家实例上。
-- 负责玩家个人排行榜数据拉取、名次变更推送、奖励查询与领取，
-- 同时在本地排行榜与平台排行榜之间根据配置自动切换。
-- 双轨制：本地 SvrSystem.RankCommon 与跨服 PlatSystem.RankCommon
-- ============================================================

require "GameBase.SystemBase"
require "GameBase.PlatSystem"
require "Rank.RankCommon"
require "Rank.RankCfgMgr"

RankPSystem = class__(SystemBase)
-- 奖励分配比例：前10名各档位占比（第1名45%...第10名1%），与配置AwardRate对应
local rates = { 45,20,13,8,5,3,2,2,1,1 }
-- 构造函数：初始化奖励展示数量、当前名次、拉取间隔与定时器句柄
function RankPSystem:ctor__(player)
    SystemBase.ctor__(self, "RankPSystem", player)
    self.awardCountShow = 5      -- 推送奖励列表时展示的前N名数量
    self.rankNum = 0              -- 玩家当前名次缓存（0表示未上榜）
    self.pullRankTick = 1000      -- 轮询拉取排行榜数据的间隔（毫秒）
    self.pullRankTimer = nil      -- 轮询定时器句柄
end

-- 玩家进入：拉取实时榜数据 + 日榜/周榜奖励
function RankPSystem:onEnter()
    SystemBase.onEnter(self)
    self:pullRankData()
    self:pullDayRankAward()
    self:pullWeekRankAward()
end

-- 整点回调：若玩家在奖励名次范围内，延迟1秒后重新拉取日/周榜奖励
function RankPSystem:onOClock(hour)
    SystemBase.onOClock(self, hour)
    self.player:addOnceTimer(1000, function()
        if self.rankNum > 0 and self.rankNum <= #rates then
            self:pullDayRankAward()
            self:pullWeekRankAward()
        end
    end)
end

-- 根据配置选择排行榜数据源：平台开启时用PlatSystem，否则用本地SvrSystem
function RankPSystem:getRankCommon()
    if RankCfgMgr:isPlatformOpen() then return PlatSystem.RankCommon end
    return SvrSystem.RankCommon
end

-- 启动定时轮询排行榜数据（间隔pullRankTick毫秒，无限循环）
function RankPSystem:addPullRankDataTimer()
    self:removePullRankDataTimer()
    self.pullRankTimer = self.player:addTimer(1000, self.pullRankTick, -1, function()
        self:pullRankData()
    end)
end

-- 移除轮询定时器，避免玩家离线后仍占用资源
function RankPSystem:removePullRankDataTimer()
    if self.pullRankTimer then
        self.player:removeTimer(self.pullRankTimer)
        self.pullRankTimer = nil
    end
end

-- 拉取今日实时排行榜数据，回调中更新玩家名次缓存并推送变更
function RankPSystem:pullRankData()
    local common = self:getRankCommon()
    if RankCfgMgr:isPlatformOpen() then
        return common.getTodayRealTimeRankUsers(function(data) self:pushSelfRankInfo(data) end)
    end
    common.getTodayRealTimeRankUsers(function(data) self:pushSelfRankInfo(data) end)
end

-- 拉取日榜奖励信息并推送
function RankPSystem:pullDayRankAward()
    self:_pushAward("day", "ScDayRankAwardPush")
end

-- 拉取周榜奖励信息并推送
function RankPSystem:pullWeekRankAward()
    self:_pushAward("week", "ScWeekRankAwardPush")
end

-- 拉取排行榜后的回调：查找自身名次，变更时推送；首次上榜启动轮询定时器
function RankPSystem:pushSelfRankInfo(data)
    local uid = tostring(self.player:getUid())
    for _, user in ipairs(data or {}) do
        if tostring(user.uid) == uid then
            -- 名次变化才推送，避免冗余消息
            if self.rankNum ~= user.rank then
                self.rankNum = user.rank
                Router.Client.ScTodayRealTimeRankPush({
                    timestamp = app__:time_s() * 1000,
                    timezone = app__:time_zone(),
                    uid = uid,
                    rank = user.rank,
                }, self.player)
            end
            -- 首次上榜启动定时轮询，保持名次同步
            if not self.pullRankTimer then self:addPullRankDataTimer() end
            return
        end
    end
    -- 玩家不在榜中：若之前在奖励名次内，补拉一次日/周榜奖励
    if self.rankNum > 0 and self.rankNum <= #rates then
        self:pullDayRankAward()
        self:pullWeekRankAward()
    end
    self.rankNum = 0
    self:removePullRankDataTimer()
end

-- 更新玩家积分：同时更新本地榜与平台榜，回调中广播名次变更并重新拉取
function RankPSystem:updateRankList(score)
    -- Keep the game-local turnover board in sync for the LuckyFruits scene, then
    -- mirror the same successful wager to the cross-game platform board.
    SvrSystem.RankCommon.updateRankList(function()
            local game = self.player:getSystem(LuckyFruitsConst.gameName)
            if game and game.scene then
                game.scene:broadcast("onRankListChange", { rankList = game.scene:rankList() })
            end
            self:pullRankData()
        end, self.player:getUid(), score, self.player:getName(), self.player:getAvatarUrl())
    -- 平台榜开启时镜像更新，实现双榜同步
    if RankCfgMgr:isRankOpen() and RankCfgMgr:isPlatformOpen() then
        PlatSystem.RankCommon.updateRankList(function() self:pullRankData() end, self.player:getUid(), score, self.player:getName(), self.player:getAvatarUrl())
    end
end

-- 客户端请求今日实时名次：平台模式直接取服务端结果，本地模式自行匹配UID
function RankPSystem:CsGetTodayRealTimeRankReq()
    local common = self:getRankCommon()
    local callback = function(list)
        if RankCfgMgr:isPlatformOpen() then
            local item = list or { timestamp = app__:time_s() * 1000, timezone = app__:time_zone(), uid = tostring(self.player:getUid()), rank = 0 }
            return Router.Client.CsGetTodayRealTimeRankResp(item, self.player)
        end
        -- 本地模式：遍历排行榜查找自身名次
        local mine = { timestamp = app__:utc_milli_s(), timezone = app__:time_zone(), uid = tostring(self.player:getUid()), rank = 0 }
        for _, item in ipairs(list) do
            if tostring(item.uid) == mine.uid then
                mine.rank = item.rank; 
                break
            end
        end
        Router.Client.CsGetTodayRealTimeRankResp(mine, self.player)
    end
    if RankCfgMgr:isPlatformOpen() then 
        common.csGetTodayRealTimeRankReq(callback, self.player:getUid())
    else
        common.getTodayRealTimeRankUsers(callback) 
    end
end

-- 客户端请求指定日期排行榜列表，异步回调推送结果
function RankPSystem:CsGetRankListByDateStrReq(msg)
    local dateStr = type(msg) == "string" and msg or (msg and msg.dateStr or os.date("%Y-%m-%d"))
    local common = self:getRankCommon()
    common.getRankListByDateStr(function(users) Router.Client.CsGetRankListByDateStrResp({ dateStr = dateStr, rankUsers = users }, self.player) end, dateStr)
end

-- 推送日/周榜奖励信息给客户端（平台模式与本地模式分支处理）
function RankPSystem:_pushAward(kind, route)
    if RankCfgMgr:isPlatformOpen() then
        -- 平台模式：异步获取奖励用户列表，找到自身后推送前5名
        local getter = kind == "day" and self:getRankCommon().getDayRankUsers or self:getRankCommon().getWeekRankUsers
        return getter(function(users)
            for _, user in ipairs(users or {}) do
                if tostring(user.uid) == tostring(self.player:getUid()) then
                    local shown = {}
                    for i = 1, math.min(#users, 5) do 
                        shown[i] = users[i] 
                    end
                    return Router.Client[route]({ uid = user.uid, rank = user.rank, bonus = user.bonus, score = user.score, rankUsers = shown }, self.player)
                end
            end
        end)
    end
    -- 本地模式：直接查询奖励记录与同榜前5名
    local common = self:getRankCommon()
    local award = common.getAward(kind, self.player:getUid())
    if not award then return end
    local list = common.getAwardRankUsers(kind, award.date, 5)
    Router.Client[route]({ uid = award.uid, rank = award.rank, bonus = award.bonus, score = award.score, rankUsers = list }, self.player)
end

-- 客户端请求日榜奖励列表
function RankPSystem:CsDayRankAwardReq() self:_pushAward("day", "ScDayRankAwardPush") end

-- 客户端请求周榜奖励列表
function RankPSystem:CsWeekRankAwardReq() self:_pushAward("week", "ScWeekRankAwardPush") end

-- 领取日/周榜奖励：平台模式异步领取，本地模式直接标记领取
-- 两模式均先发起统计上报，再通过addCoins入账，成功后上报发放结果
function RankPSystem:_receive(kind, route)
    if RankCfgMgr:isPlatformOpen() then
        -- 平台模式：异步请求领取
        local common, uid, gameId = self:getRankCommon(), self.player:getUid(), gApp:getServerId()
        local request = kind == "day" and common.csReceiveDayAwardReq or common.csReceiveWeekAwardReq
        return request(function(data)
            -- 无奖励数据或奖金为0时直接返回失败
            if not data or (data.bonus or 0) <= 0 then return Router.Client[route]({ code = -1, accountDiamond = self.player:getCoins(), bonus = 0 }, self.player) end
            -- 上报领奖请求统计
            common.awardReqStatis(nil, gameId, uid, data.bonus, data.score, kind == "week")
            -- 入账：使用ESpecialRoundId.RankAward标识排行榜奖励回合
            self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, data.bonus, function(code, orderId, backPlayer)
                local player = backPlayer or self.player
                -- 入账成功后上报发放结果统计
                if code == 0 then common.awardSucStatis(nil, gameId, uid, data.bonus, orderId, player:getCoins()) end
                Router.Client[route]({ code = code, accountDiamond = player:getCoins(), bonus = data.bonus }, player)
            end, { win_id = "-1" })
        end, uid, gameId)
    end
    -- 本地模式：直接标记奖励为已领取（claimAward内部防重）
    local common = self:getRankCommon()
    local award = common.claimAward(kind, self.player:getUid())
    if not award or (award.bonus or 0) <= 0 then return Router.Client[route]({ code = -1, accountDiamond = self.player:getCoins(), bonus = 0 }, self.player) end
    local uid, gameId = self.player:getUid(), gApp:getServerId()
    common.awardReqStatis(nil, gameId, uid, award.bonus, award.score, kind == "week")
    self.player:addCoins(ESpecialRoundId.RankAward, 0, ECoinsOperateType.RankAdd, award.bonus, function(code, orderId, backPlayer)
        local player = backPlayer or self.player
        if code == 0 then
            common.awardSucStatis(nil, gameId, uid, award.bonus, orderId, player:getCoins())
        end
        Router.Client[route]({ code = code, accountDiamond = player:getCoins(), bonus = award.bonus }, player)
    end, { win_id = "-1" })
end

-- 客户端请求领取日榜奖励
function RankPSystem:CsReceiveDayAwardReq() self:_receive("day", "CsReceiveDayAwardResp") end

-- 客户端请求领取周榜奖励
function RankPSystem:CsReceiveWeekAwardReq() self:_receive("week", "CsReceiveWeekAwardResp") end
