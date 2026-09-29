
/** Sdk状态 */
export enum SdkState {
    Invalid = 0, //无效
    Valid = 1,   //有效
    Error = 2    //错误
}

/** 框架内部网络消息 */
export enum FrameNetMsg {
    CS_SYNC_TIME_REQ = "CsSyncTimeReq",                           //时间同步请求
    SC_COINS_UPDATE_PUSH = "ScCoinsUpdatePush",                   //玩家积分变化推送
    SC_SDK_STATE_PUSH = "ScSdkStatePush",                         //玩家Sdk变化推送
    CS_PLAYER_BASE_DATA_REQ = "CsPlayerBaseDataReq",              //玩家基础信息变化请求
    CS_PLAYER_BASE_DATA_RESP = "CsPlayerBaseDataResp",            //玩家基础信息变化回包
    SC_KICK_OUT_PUSH = "KickOut",                                 //被踢出推送
}


/** 加载进度 */
export enum LoadStep {
    None = 0,
    Config,
    Common,
    GameRes,
    Network,
    Finish
}

/** Bundle名 */
export enum BundleName {
    /**@description 主包 */
    Resources = 'resources',
    Config = 'config',
    Common = 'common',
    Mail = 'mail',
    Rank = 'rank',
    SkinDefault = 'skinDefault',
}

/** 资源路径 */
export enum ResPath {
    /** 飘动提示 */
    Toast = 'resources/prefabs/notify',
    /** 延迟等待提示 */
    Wait = 'resources/prefabs/wait',
    /** 遮罩层 */
    Mask = 'resources/prefabs/mask',
    /** 重新连接动画 */
    ReconnectAni = 'resources/prefabs/reconnectAni',
    /** 游戏配置 */
    GameConfig = 'config/',
}

/** 通用Icon资源路径 */
export enum CommomIconPath {
    LongTimeNoPlay = 'atlas/common/icon_longTimeNoPlay', //长时间没消费玩游戏，踢下线
    Disconnect = 'atlas/common/icon_disconnect',//断网
    Kickout = 'atlas/common/icon_kickout',//顶号
    Recharge = 'atlas/common/icon_recharge',//余额不足提示充值
    Maintain = 'atlas/common/icon_maintain',//维护
    UserStatusError = 'atlas/common/icon_userStatusError',//游戏的黑名单
}

/** 资源类型 */
export enum EResourceType {
    Coins = 1,        //积分
    AvatarFrame = 2   //头像框
}

export enum ESkin {
    default = 1, //默认
}


/** 服务器交易错误码 */
export enum ETradeCode {
    Internal        = 1, //内部错误
	Remote          = 2, //远端错误

	Success         = 0,
	Insufficient    = -1, //余额不足
	MissTime        = -2, //错过下注时间
	SdkDisconnect   = -3, //平台sdk不通
	CloseServer     = -4, //服务器发生严重错误导致关服
	TokenInvalid    = -5, //无效token
	CoolDown        = -6, //冷却
	Timeout         = -7, //超时
	Fail            = -8, 
	BetDone         = -9, //重复下注
	BetPassMax      = -10, //下注超过最大限制
	RepeatOrder     = -11, //重复订单
	UserStatusError = -12, //用户状态异常
	ObeRepair       = -20, //layla 定制
	Ignore          = -21, //sungo 定制
    CoinsFrozen     = -24, //币种冻结
	Nothing         = -99997,
	UserException   = -99998,
	Unknow          = -99999,
}
