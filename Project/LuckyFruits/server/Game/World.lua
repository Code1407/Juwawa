-- ============================================================
-- World 模块：游戏世界根对象
-- 继承自 WorldBase，作为游戏服内全局对象的容器。
-- 负责承载服务器级别的全局状态与跨玩家协调逻辑。
-- ============================================================

require "GameBase.WorldBase"

World = class__(WorldBase)

-- 构造函数：委托基类完成初始化
function World:ctor__()
    WorldBase.ctor__(self)
end
