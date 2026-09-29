-- ============================================================
-- 世界/场景容器模块
-- 继承自WorldBase，作为游戏世界的根容器
-- ============================================================

require "GameBase.WorldBase"

-- 游戏世界类，管理所有场景和实体
World = class__(WorldBase)

function World:ctor__()
    WorldBase.ctor__(self)
end