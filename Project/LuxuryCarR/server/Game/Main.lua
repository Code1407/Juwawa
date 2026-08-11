--[[
    Main.lua
    ============================================================================
    游戏入口文件。负责加载各业务模块，并依次完成初始化工作。

    初始化流程：
        1. require 各业务模块文件，确保模块已在 Lua 环境中注册
        2. 创建全局 GameApp 实例 gApp，作为游戏应用的核心对象
        3. 初始化排行榜模块（RankCommon）
        4. 初始化邮件系统模块（MailSystem）
        5. 初始化豪车场景模块（LuxuryCarRScene）

    各模块职责：
        - GameApp：    游戏应用主体，负责配置加载、生命周期管理等
        - RankCommon： 排行榜公共逻辑，处理排行榜相关的初始化
        - MailSystem： 邮件系统，管理邮件收发与状态处理
        - LuxuryCarRScene：豪车场景模块，负责豪车相关场景的加载与展示
    ============================================================================
]]


-- 将 table 安全地序列化为字符串，用于日志打印。
-- 支持循环引用、嵌套深度限制和稳定的键排序，避免调试日志本身引发异常。
function tableToString(value, indent, visited, depth)
    local valueType = type(value)
    if valueType == "string" then
        return string.format("%q", value)
    end
    if valueType ~= "table" then
        local ok, text = pcall(tostring, value)
        return ok and text or ("<" .. valueType .. ">")
    end

    indent = type(indent) == "string" and indent or ""
    visited = type(visited) == "table" and visited or {}
    depth = tonumber(depth) or 0
    if visited[value] then
        return "<cycle>"
    end
    if depth >= 8 then
        return "<max-depth>"
    end

    visited[value] = true
    local keys = {}
    for key in pairs(value) do
        keys[#keys + 1] = key
    end
    table.sort(keys, function(left, right)
        local leftType, rightType = type(left), type(right)
        if leftType == rightType and (leftType == "number" or leftType == "string") then
            return left < right
        end
        if leftType ~= rightType then
            return leftType < rightType
        end
        return tostring(left) < tostring(right)
    end)

    local parts = {"{"}
    local childIndent = indent .. "  "
    for _, key in ipairs(keys) do
        local keyText = type(key) == "string" and key or ("[" .. tostring(key) .. "]")
        parts[#parts + 1] = childIndent .. keyText .. " = " ..
            tableToString(value[key], childIndent, visited, depth + 1)
    end
    parts[#parts + 1] = indent .. "}"
    visited[value] = nil
    return table.concat(parts, "\n")
end

-- 加载游戏应用主模块
require "GameApp"

-- 加载公共定义模块（常量、枚举、通用工具等）
require "CommomDefine"

-- 加载豪车场景模块
require "LuxuryCarR.LuxuryCarRScene"

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
LuxuryCarRScene()
