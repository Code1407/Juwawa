
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
	CoinFrozen     = -24, --币种暂时冻结，请联系官方运营部门
	Nothing         = -99997,
	UserException   = -99998,
	Unknow          = -99999,
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





EBetState = {
    None = 0,
    BetStart =1,
    BetSuc = 2
}

EGameState = {
    Bet = 1,
    Run = 2,
    Final = 3
}

EGameScene = {
    Normal = 1,
    Advanced = 2,
    Master = 3
}

EGameSceneCount = 3

EConstantKey = {
    BetTime = 1,        --押注倒计时
    BetMaxType = 2,     --最大押注种类
    ShowRankCount = 3,  --排行榜显示条数
    BetChips = 4,       --默认挡位
    BetCountMax = 5,    --押注次数限制
    BetMultiple = 6,    --每个挡位倍数设置
} 
