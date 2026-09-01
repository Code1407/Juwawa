-- ============================================================
-- 玩家消息处理模块
-- 定义客户端与服务器之间的消息路由和处理函数
-- 将CS请求转发给对应的系统（FruitSlots/Mail）处理
-- ============================================================

require "Player"
require "FruitSlots.FruitSlotsCommon"

-- 获取玩家的老虎机系统实例
local function getFruitSlotsSys(player)
    return player:getSystem(FruitSlotsConst.gameName)
end

-- 获取玩家的邮件系统实例
local function getMailSys(player)
    return player:getSystem("MailPSystem")
end

local function getRankSys(player)
    return player:getSystem("RankPSystem")
end

-- ===== 基础功能消息 =====

-- 时间同步请求：用于校准客户端与服务端之间的时间偏差
-- @param msg.cTime - 客户端发送时的本地时间戳（毫秒）
-- @return cTime - 客户端原样返回的时间戳，供客户端计算往返延迟（RTT）
-- @return sTime - 服务端当前时间戳（毫秒），客户端可据此调整本地时钟偏移
function Player:CsSyncTimeReq(msg)
    return { cTime = msg.cTime, sTime = app__:time_milli_s() }
end

-- 请求玩家基础数据（昵称、头像、等级、钻石等）
-- @return table - 由 csPlayerBaseDataReq 组装的基础数据表，包含玩家档案信息
function Player:CsPlayerBaseDataReq()
    return self:csPlayerBaseDataReq()
end

-- ===== 老虎机游戏消息 =====

-- 进入游戏：返回账号信息、Jackpot奖池、上一局未完成的结果等
-- @param msg.uid   - 玩家唯一ID
-- @param msg.token - 登录凭证
-- @param msg.lang  - 客户端语言（如 "zh-CN"）
-- @param msg.ua    - 客户端 User-Agent 信息
-- @return enterGameResp - 经过 proto 编码的进入游戏响应
function Player:enterGame(msg)
    local sys = getFruitSlotsSys(self)
    return FRProtoEncodeEnterGameResp(sys:enterGame(msg))
end

-- 同步游戏状态：断线重连或手动刷新当前游戏数据时调用
-- 返回与 enterGame 相同的数据结构，用于恢复游戏现场
-- @return synchronizeResp - 经过 proto 编码的状态同步响应
function Player:synchronize(msg)
    local sys = getFruitSlotsSys(self)
    return FRProtoEncodeEnterGameResp(sys:synchronize())
end

-- 普通下注：扣除钻石后进行一轮普通游戏
-- @param msg.betAmount - 下注金额（单线押注 × 线数 = 总押注）
-- @return betNormalResp  - 包含盘面结果、中奖倍数、Jackpot 等信息的响应
function Player:betNormal(msg)
    local sys = getFruitSlotsSys(self)
    return FRProtoEncodeBetResp(sys:betNormal(msg.betAmount))
end

-- 免费游戏下注（免费旋转）：免费游戏期间调用，不扣除钻石
-- @return betFreeResp - 免费旋转的盘面结果和中奖信息
function Player:betFree(msg)
    local sys = getFruitSlotsSys(self)
    return FRProtoEncodeBetResp(sys:betFree())
end

-- 停止当前回合（进入结算流程）
-- 由客户端自动停止定时器到期时触发，将当前结果写入历史并发放奖励
-- @param msg.roundId - 要结算的回合ID
-- @return stopRoundResp - 结算后的账户钻石余额
function Player:stopRound(msg)
    local sys = getFruitSlotsSys(self)
    return FRProtoEncodeStopRoundResp(sys:stopRound(msg.roundId))
end

-- 设置当前选中的下注按钮索引（切换下注档位）
-- @param msg.betAmountButtonIndex - 下注档位按钮索引（0-based）
-- @return setBetAmountButtonResp - 操作结果码
function Player:setBetAmountButton(msg)
    local sys = getFruitSlotsSys(self)
    return sys:setBetAmountButton(msg.betAmountButtonIndex)
end

-- 更新玩家本地设置（音量、快速模式等，仅客户端持久化）
-- @param msg.config - PlayerSettings 配置对象
--   config.soundVol            - 音量大小
--   config.lastBetAmountButton - 上次下注档位索引
--   config.isSpeed             - 是否开启快速模式
-- @return updateSettingsResp - 操作结果码
function Player:updateSettings(msg)
    local sys = getFruitSlotsSys(self)
    return sys:updateSettings(msg.config)
end

-- 同步下注金额档位配置：校验客户端配置，并始终返回服务端权威档位。
-- @param msg.betAmounts - 客户端持有的下注金额列表
-- @return table { code, betAmounts } - code为0表示原本一致，Fail表示客户端配置已过期
function Player:sendBetAmounts(msg)
    local sys = getFruitSlotsSys(self)
    local clientAmounts = msg and msg.betAmounts or nil
    local serverAmounts = FruitSlotsGetBetAmounts()
    local code = FRTradeCode.Success
    if not FruitSlotsBetAmountsMatch(clientAmounts, serverAmounts) then
        log_error("FruitSlots bet amounts mismatch, uid:{0}", tostring(self:getUid() or ""))
        code = FRTradeCode.Fail
    end
    sys.scene:syncBetAmountPools()
    return { code = code, betAmounts = serverAmounts }
end

-- ===== 心跳与调试消息 =====

-- 数据库代理（DBM）心跳保活：维持与数据库代理的长连接
-- @return table { code = 0 } - 固定返回成功
function Player:dbmHeartbeat(msg)
    return { code = 0 }
end

-- 用户行为埋点上报（点击、滑动等客户端事件统计）
-- @param msg.action - 行为标识字符串（如 "click_bet"、"enter_game"）
-- @param msg.extra  - 附加数据（JSON 格式，可扩展）
-- @return table { code = 0 } - 固定返回成功
function Player:userAction(msg)
    return { code = 0 }
end

-- 用户网络延迟数据上报（用于服务质量监控）
-- @param msg.action - 延迟相关行为标识
-- @param msg.extra  - 延迟统计数据
-- @return table { code = 0 } - 固定返回成功
function Player:userDelay(msg)
    return { code = 0 }
end

-- 测试接口：返回空统计结果（仅调试用）
-- @return table { count, winCount, averageMultiple } - 均为 0 的空统计
function Player:test(msg)
    return { count = 0, winCount = 0, averageMultiple = 0 }
end

-- ===== 排行榜系统消息 =====

-- 领取每日排行榜奖励
function Player:CsReceiveDayAwardReq()
    local sys = getRankSys(self)
    if sys then sys:CsReceiveDayAwardReq() end
end

-- 领取每周排行榜奖励
function Player:CsReceiveWeekAwardReq()
    local sys = getRankSys(self)
    if sys then sys:CsReceiveWeekAwardReq() end
end

-- 请求每日排行榜数据
function Player:CsDayRankAwardReq()
    local sys = getRankSys(self)
    if sys then sys:CsDayRankAwardReq() end
end

-- 请求每周排行榜数据
function Player:CsWeekRankAwardReq()
    local sys = getRankSys(self)
    if sys then sys:CsWeekRankAwardReq() end
end

-- 获取当日实时排行榜排名
function Player:CsGetTodayRealTimeRankReq()
    local sys = getRankSys(self)
    if sys then sys:CsGetTodayRealTimeRankReq() end
end

-- 按日期字符串查询历史排行榜数据
-- @param msg.dateStr - 日期字符串（格式如 "2024-01-15"）
function Player:CsGetRankListByDateStrReq(msg)
    local sys = getRankSys(self)
    if sys then sys:CsGetRankListByDateStrReq(msg.dateStr) end
end

-- ===== 邮件系统消息（转发到 MailPSystem） =====

-- 获取当前玩家的邮件列表
function Player:CsMailListReq()
    local sys = getMailSys(self)
    if sys then sys:CsMailListReq() end
end

-- 将指定邮件标记为已读
-- @param msg - 邮件消息体（由 MailPSystem 解析具体字段）
function Player:CsMailReadReq(msg)
    local sys = getMailSys(self)
    if sys then sys:CsMailReadReq(msg) end
end

-- 删除指定邮件
-- @param msg - 邮件消息体（含邮件ID等标识）
function Player:CsMailDeleteReq(msg)
    local sys = getMailSys(self)
    if sys then sys:CsMailDeleteReq(msg) end
end

-- 一键删除所有已读邮件
function Player:CsMailDeleteAllReadReq()
    local sys = getMailSys(self)
    if sys then sys:CsMailDeleteAllReadReq() end
end

-- 领取指定邮件的附件奖励（钻石、道具等）
-- @param msg - 邮件消息体（含邮件ID，用于定位具体邮件和奖励）
function Player:CsMailRewardReceiveReq(msg)
    local sys = getMailSys(self)
    if sys then sys:CsMailRewardReceiveReq(msg) end
end
