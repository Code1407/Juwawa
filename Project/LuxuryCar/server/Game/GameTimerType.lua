-- 游戏计时器类型定义
-- 基于 TimerType 基础类型扩展，定义游戏业务相关的计时器ID
require "TimerType"

GameTimerType = {
    GTT_TimerStart = TimerType.TT_TimerEnd + 1, -- 游戏计时器起始ID，所有游戏计时器ID从此值开始递增
}