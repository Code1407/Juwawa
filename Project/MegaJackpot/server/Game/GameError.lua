-- ============================================================
-- 游戏错误码定义模块
-- 继承框架ServerError，扩展自定义游戏错误码
-- ============================================================

require "ServerError"

-- 游戏自定义错误码，在框架错误码基础上递增
GameError = {
    GE_ErrorStart = ServerError.SE_ErrorEnd + 1, -- 错误码起始偏移

    GE_ServerError = ServerError.SE_ErrorEnd + 2,      -- 服务器错误
    GE_UserLogining = ServerError.SE_ErrorEnd + 3,     -- 用户正在登录中
    GE_OtherLogining = ServerError.SE_ErrorEnd + 4,    -- 其他用户正在登录
    GE_ReplaceLogining = ServerError.SE_ErrorEnd + 5   -- 替换登录中（顶号登录）
}