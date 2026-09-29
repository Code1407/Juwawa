--游戏调控类型
EAnalyType = {
    NoLimit = 0,    --无限制
    PlayerWin = 1,  --放水
    PlayerLoss = 2  --收割
}

--调控放水类型
EAnalyPlayerWinType = {
    Invalid = 0,        --系统亏得最少(当其他类型都不满足时，就时用这个类型)
    Coins = 1,          --玩家盈利(亏损)金额最多
    Vip = 2,            --玩家盈利(亏损)玩家vip等级之和最大
    PlayerCount = 3,    --玩家盈利(亏损)玩家数量最多
}

--调控结果类型
EGameOddsResult = {
    Unknown = 0,        --未知
    Success = 1,        --成功    
    RerandomMax = 2,    --由于超过随机次数失败
    RulerMax = 3,       --由于尺度限制失败
    SlotBusy = 4,       --Slot占用
    AllPlayerWin = 5,   --由于放水的人都是盈利状态失败
    SameWithAnaly = 6   --和调控结果一致
}

--金币操作类型
ECoinsOperateType = {
    WinAdd = 1, --中奖增加
    BetSub = 2, --押注扣除
    MailAdd = 3,--邮件领取
	JuBaoPenAdd = 4, --聚宝盆增加
    RankAdd = 100, -- 排行榜增加
	RetryOrder = 101 -- 重试订单
}

--特殊的RoundId
ESpecialRoundId = {
    RankAward = 999999,
	MailAward = 1000000
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

--活动Id
EActivityId = {
    JuBaoPen = 10001,         --聚宝盆
}

--积分交易SDK错误码
ETradeCode = {
    Internal        = 1, --内部错误
	Remote          = 2, --远端错误

	Success         = 0,
	Insufficient    = -1, --余额不足
	MissTime        = -2, --错过下注时间
	SdkDisconnect   = -3, --平台sdk不通
	CloseServer     = -4, --服务器发生严重错误导致关服
	TokenInvalid    = -5, --无效token
	CoolDown        = -6, --冷却
	Timeout         = -7, --超时
	Fail            = -8, 
	BetDone         = -9, --重复下注
	BetPassMax      = -10, --下注超过最大限制
	RepeatOrder     = -11, --重复订单
	UserStatusError = -12, --用户状态异常
	ObeRepair       = -20, --layla 定制
	Ignore          = -21, --sungo 定制
    CoinsFrozen     = -24, --币种冻结
	Nothing         = -99997,
	UserException   = -99998,
	Unknow          = -99999,
}
