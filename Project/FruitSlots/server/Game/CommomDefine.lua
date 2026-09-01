-- ============================================================
-- 通用枚举定义模块
-- 定义了游戏中使用的各类枚举常量
-- ============================================================



--积分交易SDK错误码
FRTradeCode = {
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

-- 单控分析类型：控制玩家输赢的策略类型
EAnalyType = {
    NoLimit = 0,    -- 无限制（不进行单控）
    PlayerWin = 1,  -- 玩家赢（控制玩家获胜）
    PlayerLoss = 2, -- 玩家输（控制玩家失败）
}

-- 游戏赔率结果码
EGameOddsResult = {
    Unknown = 0,       -- 未知
    Success = 1,       -- 成功
    RerandomMax = 2,   -- 达到重随机上限
    RulerMax = 3,      -- 达到规则上限
    SlotBusy = 4,      -- 老虎机忙碌中
    AllPlayerWin = 5,  -- 所有玩家获胜
    SameWithAnaly = 6, -- 与分析结果一致
}

-- 金币操作类型
ECoinsOperateType = {
    WinAdd = 1,   -- 获胜增加
    BetSub = 2,   -- 下注扣除
    MailAdd = 3,  -- 邮件发放增加
    RankAdd = 100,-- 排行榜奖励增加
}

-- 特殊回合ID
ESpecialRoundId = {
    RankAward = 999999,  -- 排行榜奖励回合
    MailAward = 1000000, -- 邮件奖励回合
}

-- 邮件奖励状态
EMailRewardState = {
    NoReward = 0,   -- 无奖励
    NoReceive = 1,  -- 未领取
    Received = 2,   -- 已领取
}

-- 资源类型
EResourceType = {
    Coins = 1,       -- 金币
    AvatarFrame = 2, -- 头像框
}
