--[[
    Main.lua
    ============================================================================
    游戏入口文件。负责加载各业务模块，并依次完成初始化工作。

    初始化流程：
        1. require 各业务模块文件，确保模块已在 Lua 环境中注册
        2. 创建全局 GameApp 实例 gApp，作为游戏应用的核心对象
        3. 初始化排行榜模块（RankCommon）
        4. 初始化邮件系统模块（MailSystem）
        5. 初始化豪车场景模块（BountyFootballScene）

    各模块职责：
        - GameApp：    游戏应用主体，负责配置加载、生命周期管理等
        - RankCommon： 排行榜公共逻辑，处理排行榜相关的初始化
        - MailSystem： 邮件系统，管理邮件收发与状态处理
        - BountyFootballScene：豪车场景模块，负责豪车相关场景的加载与展示
    ============================================================================
]]

-- 加载游戏应用主模块
require "GameApp"

-- 加载公共定义模块（常量、枚举、通用工具等）
require "CommomDefine"

-- 加载豪车场景模块
require "BountyFootball.BountyFootballScene"

-- 加载排行榜公共模块
require "Rank.RankCommon"

-- 加载邮件系统模块
require "Mail.MailSystem"

-- 创建全局游戏应用实例，作为整个游戏的入口对象
gApp = GameApp()

-- 初始化排行榜系统，注册排行榜相关的数据监听与事件回调
RankCommon()

-- 初始化邮件系统，建立邮件收发与状态同步机制
MailSystem()

-- 初始化豪车场景，触发豪车业务场景的资源加载与展示
BountyFootballScene()
