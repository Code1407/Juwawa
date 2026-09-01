-- ============================================================
-- PlayerMsg 模块：客户端消息入口路由
-- 将客户端请求消息转发到玩家对应的业务子系统
-- （LuckyFruits 游戏、RankPSystem 排行榜、MailPSystem 邮件）。
-- 本模块仅做路由分发，不承载具体业务逻辑。
-- ============================================================

require "Player"
require "LuckyFruits.LuckyFruits"

-- 获取玩家LuckyFruits游戏子系统实例
local function game(player) return player:getSystem(LuckyFruitsConst.gameName) end
-- 获取玩家排行榜子系统实例
local function rank(player) return player:getSystem("RankPSystem") end
-- 获取玩家邮件子系统实例
local function mail(player) return player:getSystem("MailPSystem") end

-- 时间同步请求：返回客户端时间回显与服务器毫秒级时间，用于时差校正
function Player:CsSyncTimeReq(msg)
    msg = msg or {}
    return { cTime = msg.cTime or 0, sTime = app__:time_milli_s() }
end
-- 请求玩家基础数据（昵称、头像、金币等）
function Player:CsPlayerBaseDataReq() return self:csPlayerBaseDataReq() end
-- 进入游戏场景请求
function Player:enterGame(msg) return game(self):enterGame(msg) end
-- 同步场景状态请求（下注阶段、剩余时间等）
function Player:synchronize() return game(self):synchronize() end
-- 押注请求：新协议使用明确的“位置+面值+数量”列表；旧字段仅用于灰度兼容。
function Player:bet(msg)
    msg = msg or {}
    return game(self):bet(
        msg.todayRound, msg.betList,
        msg.betGradeArr, msg.betGradeNumArr, msg.betDiamonList
    )
end
-- 设置当前选中的押注金额按钮索引（用于客户端UI高亮）
function Player:setBetAmountButton(msg) return game(self):setBetAmountButton((msg or {}).betAmountButtonIndex) end
-- 更新玩家本地设置（音效、震动、画质等配置项）
function Player:updateSettings(msg) return game(self):updateSettings((msg or {}).config) end
-- 数据库心跳包：仅回包0以维持连接活跃
function Player:dbmHeartbeat() return { code = 0 } end

-- 请求今日实时排行榜（包含自身名次信息）
function Player:CsGetTodayRealTimeRankReq() if rank(self) then rank(self):CsGetTodayRealTimeRankReq() end end
-- 请求指定日期的排行榜列表
function Player:CsGetRankListByDateStrReq(msg) if rank(self) then rank(self):CsGetRankListByDateStrReq(msg) end end
-- 请求日榜奖励列表
function Player:CsDayRankAwardReq() if rank(self) then rank(self):CsDayRankAwardReq() end end
-- 请求周榜奖励列表
function Player:CsWeekRankAwardReq() if rank(self) then rank(self):CsWeekRankAwardReq() end end
-- 领取日榜奖励
function Player:CsReceiveDayAwardReq() if rank(self) then rank(self):CsReceiveDayAwardReq() end end
-- 领取周榜奖励
function Player:CsReceiveWeekAwardReq() if rank(self) then rank(self):CsReceiveWeekAwardReq() end end

-- 请求邮件列表
function Player:CsMailListReq() if mail(self) then mail(self):CsMailListReq() end end
-- 标记单封邮件为已读
function Player:CsMailReadReq(msg) if mail(self) then mail(self):CsMailReadReq(msg) end end
-- 删除单封邮件
function Player:CsMailDeleteReq(msg) if mail(self) then mail(self):CsMailDeleteReq(msg) end end
-- 删除所有已读邮件
function Player:CsMailDeleteAllReadReq() if mail(self) then mail(self):CsMailDeleteAllReadReq() end end
-- 领取邮件附件奖励
function Player:CsMailRewardReceiveReq(msg) if mail(self) then mail(self):CsMailRewardReceiveReq(msg) end end
