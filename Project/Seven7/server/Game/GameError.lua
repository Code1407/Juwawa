
require "ServerError"

GameError = {
    GE_ErrorStart = ServerError.SE_ErrorEnd + 1,

    GE_ServerError = ServerError.SE_ErrorEnd + 2,
    GE_UserLogining = ServerError.SE_ErrorEnd + 3,
    GE_OtherLogining = ServerError.SE_ErrorEnd + 4,
    GE_ReplaceLogining = ServerError.SE_ErrorEnd + 5,

    GE_SdkCoinsError = ServerError.SE_ErrorEnd + 6, --Sdk积分异常
    GE_MoneyNotEnough = ServerError.SE_ErrorEnd + 7, --钱不够
    GE_NotRandomReward = ServerError.SE_ErrorEnd + 8,--没有随机到奖品
    GE_FruitCountOver = ServerError.SE_ErrorEnd + 9,--选择水果数量超限
    GE_BetTimeError = ServerError.SE_ErrorEnd + 10,--下注时间错误
    GE_SdkSubError = ServerError.SE_ErrorEnd + 11,--Sdk扣除失败
    GE_ChipError = ServerError.SE_ErrorEnd + 12,--筹码异常
    GE_BetCountOver = ServerError.SE_ErrorEnd + 13,--押注次数超出
}