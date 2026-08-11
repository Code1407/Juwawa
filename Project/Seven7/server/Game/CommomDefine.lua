
EAnalyType = {
    NoLimit = 0,    --无限制
    PlayerWin = 1,  --放水
    PlayerLoss = 2  --收割
}

EAnalyPlayerWinType = {
    Invalid = 0,        --系统亏得最少(当其他类型都不满足时，就时用这个类型)
    Coins = 1,          --玩家盈利(亏损)金额最多
    Vip = 2,            --玩家盈利(亏损)玩家vip等级之和最大
    PlayerCount = 3,    --玩家盈利(亏损)玩家数量最多
}

--调控结果
EGameOddsResult = {
    --未知
    Unknown = 0,
    --成功
    Success = 1,
    --由于超过随机次数失败
    RerandomMax = 2,
    --由于尺度限制失败
    RulerMax = 3,
    --Slot占用
    SlotBusy = 4, 
    --由于放水的人都是盈利状态失败
    AllPlayerWin = 5,
    --和调控结果一致
    SameWithAnaly = 6
}

--金币操作类型
ECoinsOperateType = {
    WinAdd = 1, --中奖增加
    BetSub = 2, --押注扣除
    MailAdd = 3,--邮件领取
    RankAdd = 100 -- 排行榜增加
}

ESpecialRoundId = {
    RankAward = 999999,
    MailAward = 1000000,
}

--邮件奖励领取状态
EMailRewardState = {
    NoReward = 0,     --没有奖励
    NoReceive = 1,    --有奖未领取
    Received = 2,     --已领取
}

--资源类型
EResourceType = {
    Coins = 1,        --积分
    AvatarFrame = 2   --头像框
}

EConstantKey = {
    SelectFruitMax = 1,         --同时能选择水果最大数量
    BetChips = 2,               --挡位
    BetTime = 3,                --押注倒计时
    ShowSelfBetRecordCount = 4, --我的下注记录显示最大条数
    SaveSelfBetRecordCount = 5, --我的下注记录服务器存储最大条数
    ShowGameResultCount = 6,   --开奖历史记录显示最大条数
    SaveGameResultCount = 7,   --开奖历史记录存储最大条数
    BetCountMax = 8            --押注最大次数
}