
-- ============================================================
-- 游戏服务端主入口文件
-- 负责加载所有核心模块并初始化全局实例
-- ============================================================

require "GameApp"
require "Rank.RankCommon"                          -- 游戏应用主类
require "CommomDefine"                     -- 通用枚举定义
require "GameMsg"                          -- 消息路由（接收GameCenter消息）
require "Mail.MailSystem"                  -- 全局邮件系统
require "MageJackpot.MageJackpotScene"       -- 游戏场景管理

-- 创建全局单例实例
gApp = GameApp()
RankCommon()
MailSystem()               -- 邮件系统实例
MageJackpotScene()          -- 水果老虎机场景实例


