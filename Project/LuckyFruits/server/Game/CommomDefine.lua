-- ============================================================
-- CommomDefine 模块：公共枚举与常量定义
-- 定义游戏全模块共用的全局枚举，包括：
--   调控类型、放水玩家筛选维度、交易错误码、调控结果码、
--   金币操作类型、特殊回合ID、邮件奖励状态、资源类型
-- 所有枚举为全局变量，供服务端各业务模块直接引用。
-- ============================================================

-- AI调控类型：决定开奖结果选择方向
EAnalyType = {
    NoLimit = 0,    --无限制
    PlayerWin = 1,  --放水
    PlayerLoss = 2  --收割
}

-- 放水玩家筛选维度：放水模式下选择救济对象的评分依据
EAnalyPlayerWinType = {
    Invalid = 0,        --系统亏得最少(当其他类型都不满足时，就时用这个类型)
    Coins = 1,          --玩家盈利(亏损)金额最多
    Vip = 2,            --玩家盈利(亏损)玩家vip等级之和最大
    PlayerCount = 3,    --玩家盈利(亏损)玩家数量最多
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

    CoinFrozen    = -24,--币种暂时冻结，请联系官方运营部门
    
	Nothing         = -99997,
	UserException   = -99998,
	Unknow          = -99999,
}

--调控结果：AI调控开奖机的返回状态码
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

--金币操作类型：标识金币变更来源，用于流水记录与审计
ECoinsOperateType = {
    WinAdd = 1, --中奖增加
    BetSub = 2, --押注扣除
    MailAdd = 3,--邮件领取
    RankAdd = 100 -- 排行榜增加
}

--特殊回合ID：用于非游戏回合的金币操作（排行榜/邮件奖励）
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

--资源类型：邮件附件等场景的资源分类
EResourceType = {
    Coins = 1,        --积分
    AvatarFrame = 2   --头像框
}
