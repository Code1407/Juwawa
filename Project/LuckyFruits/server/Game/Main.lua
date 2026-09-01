-- ============================================================
-- Main 模块：服务器启动入口
-- 游戏服启动时由框架加载，负责按依赖顺序实例化所有核心子系统：
--   1. GameApp 作为根应用对象（管理配置加载与关服流程）
--   2. RankCommon 本地排行榜系统（兜底实现）
--   3. MailSystem 邮件系统（跨服邮件接收与缓存）
--   4. LuckyFruitsScene 游戏场景（回合状态机与开奖控制）
-- 实例化顺序遵循依赖关系：基础模块先于业务模块。
-- ============================================================

require "GameApp"
require "CommomDefine"
require "LuckyFruits.LuckyFruitsScene"
require "Rank.RankCommon"
require "Mail.MailSystem"

-- 创建根应用对象并实例化各业务子系统
gApp = GameApp()

RankCommon()
MailSystem()
LuckyFruitsScene()
