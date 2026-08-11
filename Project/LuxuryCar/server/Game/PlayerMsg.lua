---------------------------------------------------------------------------
-- PlayerMsg 玩家消息路由模块
--
-- 本模块是客户端消息的路由中枢（Message Router），负责将客户端发送的
-- 各类请求分发到对应的子系统（游戏系统、排行榜系统、邮件系统）进行处理。
--
-- 架构概览：
--   客户端请求 ──▶ Player 方法 ──▶ 子系统方法
--                     │
--         ┌───────────┼───────────┐
--         ▼           ▼           ▼
--      game()      rank()      mail()
--   (游戏子系统) (排行榜子系统) (邮件子系统)
--
-- 三大子系统：
--   1. game  —— 游戏核心玩法（进入游戏、下注、设置金额、同步、更新配置等）
--   2. rank  —— 排行榜（实时排行、历史排行、日/周奖励领取等）
--   3. mail  —— 邮件系统（邮件列表、阅读、删除、领取附件奖励等）
--
-- 每个 Player 方法均为薄封装，仅做参数转发，不包含业务逻辑。
---------------------------------------------------------------------------

require "Player"
require "LuxuryCar.LuxuryCar"

---------------------------------------------------------------------------
-- 辅助函数：从玩家对象获取对应的子系统实例
-- 这些函数是消息路由的基础，将 Player 自身的方法调用
-- 转发到具体的子系统（通过 getSystem 获取）
---------------------------------------------------------------------------

--- 获取游戏子系统实例
-- @param player Player 玩家对象
-- @return table 游戏子系统（LuxuryCar 模块）
local function game(player) return player:getSystem(LuxuryCarConst.gameName) end

--- 获取排行榜子系统实例
-- @param player Player 玩家对象
-- @return table 排行榜子系统（RankPSystem 模块）
local function rank(player) return player:getSystem("RankPSystem") end

--- 获取邮件子系统实例
-- @param player Player 玩家对象
-- @return table 邮件子系统（MailPSystem 模块）
local function mail(player) return player:getSystem("MailPSystem") end

function Player:CsSyncTimeReq(msg)
    msg = msg or {}
    return { cTime = msg.cTime or 0, sTime = app__:time_milli_s() }
end

function Player:CsPlayerBaseDataReq()
    self:csPlayerBaseDataReq()
end

---------------------------------------------------------------------------
-- 游戏相关路由方法（6 个）
-- 客户端请求路由至 game() 游戏子系统处理
---------------------------------------------------------------------------

--- 路由：进入游戏
-- @param msg 客户端消息体（包含房间信息等）
function Player:enterGame(msg) return game(self):enterGame(msg) end

--- 路由：下注
-- @param msg 客户端消息体
--   - todayRound      当前回合
--   - betGradeArr     下注等级数组
--   - betGradeNumArr  下注等级对应数量数组
--   - betDiamonList   钻石下注列表
function Player:bet(msg)
    return game(self):bet(msg.todayRound, msg.betGradeArr, msg.betGradeNumArr, msg.betDiamonList)
end

--- 路由：设置下注金额按钮
-- @param msg 客户端消息体（可空）
--   - betAmountButtonIndex  金额按钮索引
function Player:setBetAmountButton(msg) return game(self):setBetAmountButton((msg or {}).betAmountButtonIndex) end

--- 路由：数据同步（将服务端最新状态下发给客户端）
-- @param _msg 未使用的消息参数
function Player:synchronize(_msg) return game(self):synchronize() end

--- 路由：更新玩家设置
-- @param msg 客户端消息体（可空）
--   - config  配置项
function Player:updateSettings(msg) return game(self):updateSettings((msg or {}).config) end

--- 路由：DBM 心跳（占位实现，直接返回成功）
-- @param _msg 未使用的消息参数
-- @return table { code = 0 } 固定返回成功码
function Player:dbmHeartbeat(_msg) return { code = 0 } end

---------------------------------------------------------------------------
-- 排行榜相关路由方法（6 个）
-- 客户端请求路由至 rank() 排行榜子系统处理
-- 所有方法均带 nil 检查，确保 rank 子系统存在后再调用
---------------------------------------------------------------------------

--- 路由：获取今日实时排行
function Player:CsGetTodayRealTimeRankReq() if rank(self) then rank(self):CsGetTodayRealTimeRankReq() end end

--- 路由：按日期获取排行列表
-- @param msg 客户端消息体（包含日期字符串等）
function Player:CsGetRankListByDateStrReq(msg) if rank(self) then rank(self):CsGetRankListByDateStrReq(msg) end end

--- 路由：领取日榜奖励
function Player:CsDayRankAwardReq() if rank(self) then rank(self):CsDayRankAwardReq() end end

--- 路由：领取周榜奖励
function Player:CsWeekRankAwardReq() if rank(self) then rank(self):CsWeekRankAwardReq() end end

--- 路由：领取日榜奖励（主动领取，区别于自动发放）
function Player:CsReceiveDayAwardReq() if rank(self) then rank(self):CsReceiveDayAwardReq() end end

--- 路由：领取周榜奖励（主动领取，区别于自动发放）
function Player:CsReceiveWeekAwardReq() if rank(self) then rank(self):CsReceiveWeekAwardReq() end end

---------------------------------------------------------------------------
-- 邮件相关路由方法（5 个）
-- 客户端请求路由至 mail() 邮件子系统处理
-- 所有方法均带 nil 检查，确保 mail 子系统存在后再调用
---------------------------------------------------------------------------

--- 路由：获取邮件列表
function Player:CsMailListReq() if mail(self) then mail(self):CsMailListReq() end end

--- 路由：标记邮件为已读
-- @param msg 客户端消息体（包含邮件 ID 等）
function Player:CsMailReadReq(msg) if mail(self) then mail(self):CsMailReadReq(msg) end end

--- 路由：删除单封邮件
-- @param msg 客户端消息体（包含邮件 ID 等）
function Player:CsMailDeleteReq(msg) if mail(self) then mail(self):CsMailDeleteReq(msg) end end

--- 路由：删除所有已读邮件
function Player:CsMailDeleteAllReadReq() if mail(self) then mail(self):CsMailDeleteAllReadReq() end end

--- 路由：领取邮件奖励（附件领取）
-- @param msg 客户端消息体（包含邮件 ID 等）
function Player:CsMailRewardReceiveReq(msg) if mail(self) then mail(self):CsMailRewardReceiveReq(msg) end end
