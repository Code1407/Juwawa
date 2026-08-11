
require "ServerError"

GameError = {
    GE_ErrorStart = ServerError.SE_ErrorEnd + 1,

    GE_ServerError = ServerError.SE_ErrorEnd + 2,
    GE_UserLogining = ServerError.SE_ErrorEnd + 3,
    GE_OtherLogining = ServerError.SE_ErrorEnd + 4,
    GE_ReplaceLogining = ServerError.SE_ErrorEnd + 5
}