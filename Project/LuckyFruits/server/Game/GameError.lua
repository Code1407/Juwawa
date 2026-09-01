-- ============================================================
-- GameError 模块：游戏业务错误码定义
-- 基于 ServerError 基础错误码扩展，定义游戏业务相关的错误码。
-- 所有游戏错误码从 SE_ErrorEnd+1 开始递增，避免与基础错误码冲突。
-- 被各业务模块用于返回客户端操作结果与日志记录。
-- ============================================================

require "ServerError"

GameError = {
    GE_ErrorStart = ServerError.SE_ErrorEnd + 1, -- 游戏错误码起始值，所有游戏错误码从此值开始递增

    GE_ServerError = ServerError.SE_ErrorEnd + 2, -- 服务器通用错误
    GE_UserLogining = ServerError.SE_ErrorEnd + 3, -- 用户正在登录中
    GE_OtherLogining = ServerError.SE_ErrorEnd + 4, -- 账号在其他设备登录
    GE_ReplaceLogining = ServerError.SE_ErrorEnd + 5 -- 被顶号登录（新登录替换旧连接）
}