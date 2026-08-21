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
require "LuxuryCarR.LuxuryCarRConfig"

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
--       2. 若当前加载的配置表为 "LuxuryCarRCore"，则触发豪车核心配置的二次处理
--       3. 若当前加载的配置表为 "RankCommon"，则触发排行榜配置管理器的初始化
function GameApp:onLoadConfig(tag, name, tab)
    -- 先执行基类的配置加载逻辑，保证通用配置（如基础数据表）先完成初始化
    if GameAppBase.onLoadConfig then GameAppBase.onLoadConfig(self, tag, name, tab) end

    -- 豪车核心配置表加载完成后，调用 LuxuryCarRLoadConfig 执行豪车模块的配置解析与数据准备
    if name == "LuxuryCarRCore" then LuxuryCarRLoadConfig(tab) end

    -- 排行榜公共配置表加载完成后，通知 RankCfgMgr 完成排行榜配置的初始化
    if name == "RankCommon" then RankCfgMgr:onLoadRankCfgMgr(true) end
end


--- 项目配置流程入口
--   在所有基础配置加载完毕后由框架调用，用于执行项目级别的配置依赖处理
--   典型场景：当某个模块依赖多个配置表都加载完成后，在此处执行最终的整合逻辑
--
--   执行顺序：
--       1. 调用 LuxuryCarRLoadConfig() 完成豪车模块的最终配置加载
--       2. 调用 RankCfgMgr:onProjRankCfgMgr() 完成排行榜模块的项目级配置整合
function GameApp:onProjConfig()
    -- 豪车模块：执行项目级配置加载，将各豪车相关配置整合为运行时可用的数据结构
    LuxuryCarRLoadConfig()

    -- 排行榜模块：在所有排行榜相关配置都就位后，执行最终的排行榜数据准备工作
    RankCfgMgr:onProjRankCfgMgr()
end


--[[
    ## 游戏服务器App
    一般情况下需要在GameApp.lua文件里定义GameApp类（模板已处理），此类会有一个全局对像，`gApp`。
    `GameApp`类中有一些回调和函数可以使用：
    - `onLoadConfig(tag, name, tab)`，加载配置的回调，在服务器启动时，或配置热更时会回调，`tag`为标签名（可同时存在多套表，以标签名区分），`name`为表名，`tab`为配置数据（以id为key的表）。如果对游戏逻辑需要对配置表做二次处理，则必须定义此回调，并在回调里做二次处理，否则热更配置时数据不会刷新。
    - `onProjConfig()`，加载项目配置的回调，在服务器启动时，或后台修改项目配置时会回调。如果对游戏逻辑需要对项目配置做二次处理，则必须定义此回调，并在回调里做二次处理，否则后台修改项目配置时数据不会刷新。
    - `getProjCommon()`，返回发布项目的项目公共配置，如果后台发布时没有配置任何配置则会是个空表。后台可能会配置`{Costs = {{Coins = 1, CostUrl = "http://127.0.0.1/1.png"}}, Custom = {}}`，指定档位。
    - `getProjServer()`，返回发布项目的服务器配置，可能会配置`{Custom = {}}`。
    - `onClosing()`，服务器正在关闭的回调，默认此回调过后50秒服务器将会关闭，如果清理工作已完成可调用`gApp:finishClosing()`来提前关闭。
    - `finishClosing()`，通知清理工作已完成，服务器会在5秒内关闭。
    - `isWaitClosing()`，判断当前是否处于关闭过程中。

    当服务器关闭时，会向所有在线玩家发送消息SvrNotifyMsg,数据结构为
    {
        msgCode = 1, --消息码，1为关服
        msgData = {
            stopSeconds = 50, --距离关服时间，秒
        }
    }
    同时服务器会拒绝所有的扣款操作，在调用扣款接口时会返回错误，并且再次发送消息SvrNotifyMsg，消息码为1。
    适配流程：
    1. 在onClosing()回调中，判断游戏是否还有未结算的对局，如果没有则直接调用gApp:finishClosing()。
    2. 服务器在开完奖后调用gApp:isWaitClosing()判断是否处于关闭过程，如果处理关闭过程中，则不再开启下一轮抽奖，并且调用gApp:finishClosing()。
    3. 客户端则监听SvrNotifyMsg消息，并做出提示，建议做tips提示即可。

]]

-- 服务器开始关闭：没有待结算下注时立即结束；否则让当前局完成开奖、结算。
function GameApp:onClosing()
    local sceneSystem = SvrSystem and SvrSystem.LuxuryCarR
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if not scene then
        log_info("LuxuryCarR closing: scene unavailable, finish immediately")
        return self:finishClosing()
    end

    local needSettle = scene:prepareServerClosing()
    log_info("LuxuryCarR closing: needSettle:{0}", needSettle and 1 or 0)
    if not needSettle then
        self:finishClosing()
    end
end

-- 保存框架原始实现；自定义 finishClosing 广播完成后必须继续调用它，
-- 否则覆盖同名方法会导致进程无法进入真正的 5 秒关服阶段。
local frameworkFinishClosing = GameAppBase and GameAppBase.finishClosing

-- 服务器清理工作已完成：通知客户端刷新为 5 秒倒计时，再交还框架关服。
function GameApp:finishClosing()
    if self._finishClosingRequested then return end
    self._finishClosingRequested = true

    local sceneSystem = SvrSystem and SvrSystem.LuxuryCarR
    local scene = sceneSystem and sceneSystem.getScene and sceneSystem:getScene() or nil
    if scene and scene.broadcast then
        scene:broadcast("SvrNotifyMsg", {
            msgCode = 1,
            msgData = { stopSeconds = 5 },
        })
    end
    log_info("LuxuryCarR closing: notify clients, stop in 5 seconds")

    if frameworkFinishClosing then
        return frameworkFinishClosing(self)
    end
    log_error("LuxuryCarR closing: framework finishClosing unavailable")
end
