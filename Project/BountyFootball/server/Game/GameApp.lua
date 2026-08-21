--[[
    GameApp.lua
    ============================================================================
    游戏应用主类。继承自 GameAppBase，扩展了项目特有的配置加载逻辑。

    继承关系：
        GameAppBase（基类，提供通用的游戏应用框架与配置加载能力）
            └── GameApp（本类，实现项目级配置的加载与管理）

    核心职责：
        1. 通过 onLoadConfig 回调，在配置表加载完成时触发对应模块的初始化
        2. 通过 onProjConfig 流程，统一处理项目级别的配置依赖与后置初始化
    ============================================================================
]]

-- 加载游戏应用基类，GameApp 将继承自该类
require "GameBase.GameAppBase"

-- 加载玩家消息处理模块（处理玩家相关的协议消息）
require "PlayerMsg"

-- 加载游戏消息处理模块（处理游戏通用协议消息）
require "GameMsg"

-- 加载排行榜配置管理器，负责排行榜配置的解析与热更
require "Rank.RankCfgMgr"

-- 加载豪车配置模块，负责豪车核心配置的加载
require "BountyFootball.BountyFootballConfig"

-- 通过 class__ 继承 GameAppBase，创建 GameApp 类
GameApp = class__(GameAppBase)

-- 构造函数：显式调用基类构造器，确保基类的初始化逻辑（如配置管理器、事件系统等）被正确执行
function GameApp:ctor__() GameAppBase.ctor__(self) end

--- 配置加载回调函数
--   当 C++/底层框架加载完某个配置表后，会回调此方法
--   @param tag  配置标签（加载标识符）
--   @param name 配置名称（用于区分不同的配置表）
--   @param tab  配置数据（已解析的配置表数据）
--
--   处理逻辑：
--       1. 优先调用基类 GameAppBase.onLoadConfig，完成通用配置处理
--       2. 若当前加载的配置表为 "BountyFootballCore"，则触发豪车核心配置的二次处理
--       3. 若当前加载的配置表为 "RankCommon"，则触发排行榜配置管理器的初始化
function GameApp:onLoadConfig(tag, name, tab)
    -- 先执行基类的配置加载逻辑，保证通用配置（如基础数据表）先完成初始化
    if GameAppBase.onLoadConfig then GameAppBase.onLoadConfig(self, tag, name, tab) end

    -- 豪车核心配置表加载完成后，调用 BountyFootballLoadConfig 执行豪车模块的配置解析与数据准备
    if name == "BountyFootballCore" then BountyFootballLoadConfig(tab) end

    -- 排行榜公共配置表加载完成后，通知 RankCfgMgr 完成排行榜配置的初始化
    if name == "RankCommon" then RankCfgMgr:onLoadRankCfgMgr(true) end
end


--- 项目配置流程入口
--   在所有基础配置加载完毕后由框架调用，用于执行项目级别的配置依赖处理
--   典型场景：当某个模块依赖多个配置表都加载完成后，在此处执行最终的整合逻辑
--
--   执行顺序：
--       1. 调用 BountyFootballLoadConfig() 完成豪车模块的最终配置加载
--       2. 调用 RankCfgMgr:onProjRankCfgMgr() 完成排行榜模块的项目级配置整合
function GameApp:onProjConfig()
    -- 豪车模块：执行项目级配置加载，将各豪车相关配置整合为运行时可用的数据结构
    BountyFootballLoadConfig()

    -- 排行榜模块：在所有排行榜相关配置都就位后，执行最终的排行榜数据准备工作
    RankCfgMgr:onProjRankCfgMgr()
end

-- 优雅关服：空局立即关闭；已有下注则等待当前局完成结算。
function GameApp:onClosing()
    local sceneSystem = SvrSystem and SvrSystem.BountyFootball
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if not scene then
        log_info("BountyFootball closing: scene unavailable, finish immediately")
        return self:finishClosing()
    end
    local needSettle = scene:prepareServerClosing()
    log_info("BountyFootball closing: needSettle:{0}", needSettle and 1 or 0)
    if not needSettle then
        self:finishClosing()
    end
end

-- 保存框架原始实现；自定义 finishClosing 广播完成后必须继续调用它。
local frameworkFinishClosing = GameAppBase and GameAppBase.finishClosing

-- 清理完成后通知客户端刷新为 5 秒倒计时，再交还框架关服。
function GameApp:finishClosing()
    if self._finishClosingRequested then return end
    self._finishClosingRequested = true

    local sceneSystem = SvrSystem and SvrSystem.BountyFootball
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if scene and scene.broadcast then
        scene:broadcast("SvrNotifyMsg", {
            msgCode = 1,
            msgData = { stopSeconds = 5 },
        })
    end
    log_info("BountyFootball closing: notify clients, stop in 5 seconds")

    if frameworkFinishClosing then
        return frameworkFinishClosing(self)
    end
    log_error("BountyFootball closing: framework finishClosing unavailable")
end
