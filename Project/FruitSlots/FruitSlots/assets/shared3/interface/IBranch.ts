export let gNewRank = false;
if ((<any>window).config?.enableRank != null)
    gNewRank = (<any>window).config?.enableRank;
if ((<any>window).config?.rank?.enable != null)
    gNewRank = (<any>window).config?.rank?.enable;

export function SetNewRank(value: boolean) {
    gNewRank = value;
}

export interface IRankUserInfo {
    uid: string;
    avator: string;
    name: string;
    rank: number;   // 排名
    bonus: number;  // 奖金
    score: number;  // 总分，在服务器用，客户端不用
    get: boolean;
}

export interface IRankAwardMsg {
    uid: string;
    rank: number;   // 排名
    bonus: number;  // 奖金
    score: number;  // 总分，在服务器用，客户端不用
    rankUsers: IRankUserInfo[];
}

export interface IRankRealTimeMsg {
    timestamp: number;
    timezone: string;
    uid: string;
    rank: number;   // 排名
}

export interface IRankAwardResp {
    code: ETradeCode;
    accountDiamond: number;
}

export interface IRankAward {
    receiveDayAward(): Promise<IRankAwardResp>;
    receiveWeekAward(): Promise<IRankAwardResp>;
    getTodayRealTimeRank(uid: string): Promise<IRankRealTimeMsg>;
}

export interface IRankAwardListen {
    onDayRankAward(msg: IRankAwardMsg);
    onWeekRankAward(msg: IRankAwardMsg);
    onTodayRealTimeRank(msg: IRankRealTimeMsg);
}

export enum ETradeCode {
    success = 0,
    insufficient = -1,  // 余额不足
    missTime = -2,      // 错过下注时间
    sdkDisconnect = -3, // 平台sdk不通
    closeServer = -4,   // 服务器发生严重错误导致关服
    tokenInvalid = -5,  // 无效token
    coolDown = -6,      // 冷却
    timeout = -7,       // 超时
    fail = -8,
    betDone = -9,        //重复下注
    betPassMax = -10,    //下注超过最大限制
    repeatOrder = -11,   // 重复订单
    userStatusError = -12,   // 用户状态异常
    nothing = -99997,
    userException = -99998,
    unknow = -99999,
}

export interface IAction {
    gameName: string,
    round: number,
    uid: string,
    action: string,
    accountDiamond: number,
    actionTime: number
}

export interface IDalayMsg {
    gameName: string,
    round: number,
    uid: string,
    action: string,         // 调哪个接口延迟了
    queryTime: number,      // 时间戳
    responseTime: number,   // 时间戳
    extra: string           // 额外信息
}

export interface ITrace {
    userAction(msg: IAction);   // 记录影响数值的用户行为，例如：点击auto
    userDelay(msg: IDalayMsg);  // 记录接口调用延迟信息
}

export const timeZones = {
    "-12:00": "Etc/GMT+12",
    "-11:00": "Pacific/Pago_Pago",
    "-10:00": "Pacific/Honolulu",
    "-09:00": "America/Anchorage",
    "-08:00": "America/Los_Angeles",
    "-07:00": "America/Denver",
    "-06:00": "America/Chicago",
    "-05:00": "America/New_York",
    "-04:00": "America/Halifax",
    "-03:00": "America/Argentina/Buenos_Aires",
    "-02:00": "Atlantic/South_Georgia",
    "-01:00": "Atlantic/Azores",
    "+00:00": "UTC",
    "+01:00": "Europe/Berlin",
    "+02:00": "Europe/Kiev",
    "+03:00": "Europe/Moscow",
    "+04:00": "Asia/Dubai",
    "+05:00": "Asia/Karachi",
    "+06:00": "Asia/Dhaka",
    "+07:00": "Asia/Bangkok",
    "+08:00": "Asia/Shanghai",
    "+09:00": "Asia/Tokyo",
    "+10:00": "Australia/Sydney",
    "+11:00": "Pacific/Guadalcanal",
    "+12:00": "Pacific/Fiji"
};