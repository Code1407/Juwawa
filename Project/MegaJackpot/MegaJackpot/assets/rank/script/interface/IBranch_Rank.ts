export let gNewRank = false;
export function initGNewRank() {
    if ((<any>window).enableRank != null) gNewRank = (<any>window).enableRank;
}

export function SetNewRank(value: boolean) {
    gNewRank = value;
}

export interface IRankUserInfo {
    uid: string;
    /** 服务端常用 */
    avatar?: string;
    /** 历史字段拼写，部分协议仍用 */
    avator?: string;
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
    /** 旧服：`"+08:00"` 等与 `timeZones` 的 key 一致；新服：-12~12 的整数（8 即 `"+08:00"`） */
    timezone: number;
    uid: string;
    rank: number;   // 排名
}

/** 将实时榜协议里的时区统一为 `timeZones` / `GetTimeZoneTicks` 使用的 `±HH:00` 字符串 */
export function normalizeRankServerTimezone(tz: string | number | null | undefined): string {
    if (tz === null || tz === undefined) return ``;
    if (typeof tz === `number`) {
        if (!Number.isFinite(tz)) return ``;
        let h = Math.round(tz);
        h = Math.max(-12, Math.min(12, h));
        const abs = Math.abs(h);
        const hh = abs < 10 ? `0${abs}` : `${abs}`;
        return h < 0 ? `-${hh}:00` : `+${hh}:00`;
    }
    const trimmed = String(tz).trim();
    if (/^[+-]?\d{1,2}$/.test(trimmed))
        return normalizeRankServerTimezone(parseInt(trimmed, 10));
    return trimmed;
}

/** `CsGetRankListByDateStrResp`：`rankQuery` 与上行一致，为 `today?` | `thisweek?` | `YYYY-MM-DD`。 */
export interface IRankListByDateStrMsg {
    dateStr: string;
    rankUsers?: IRankUserInfo[];
}

export interface IRankAwardResp {
    code: ETradeCode;
    accountDiamond: number;
}

export interface IRankAward {
    csReceiveDayAwardReq();
    csReceiveWeekAwardReq();
    csGetTodayRealTimeRankReq();
}

export interface IRankAwardListen {
    csDayRankAwardResp(msg: IRankAwardMsg);
    csWeekRankAwardResp(msg: IRankAwardMsg);
    csTodayRealTimeRankResp(msg: IRankRealTimeMsg);
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

export interface DateTimeFormatOptions {
    year?: boolean;
    month?: boolean;
    day?: boolean;
    hour?: boolean;
    minute?: boolean;
    second?: boolean;
    char?: string;
    timeZone?: string
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

export const timeZones2 = {
    "Etc/GMT+12": "-12:00",
    "Pacific/Pago_Pago": "-11:00",
    "Pacific/Honolulu": "-10:00",
    "America/Anchorage": "-09:00",
    "America/Los_Angeles": "-08:00",
    "America/Denver": "-07:00",
    "America/Chicago": "-06:00",
    "America/New_York": "-05:00",
    "America/Halifax": "-04:00",
    "America/Argentina/Buenos_Aires": "-03:00",
    "Atlantic/South_Georgia": "-02:00",
    "Atlantic/Azores": "-01:00",
    "UTC": "+00:00",
    "Europe/Berlin": "+01:00",
    "Europe/Kiev": "+02:00",
    "Europe/Moscow": "+03:00",
    "Asia/Dubai": "+04:00",
    "Asia/Karachi": "+05:00",
    "Asia/Dhaka": "+06:00",
    "Asia/Bangkok": "+07:00",
    "Asia/Shanghai": "+08:00",
    "Asia/Tokyo": "+09:00",
    "Australia/Sydney": "+10:00",
    "Pacific/Guadalcanal": "+11:00",
    "Pacific/Fiji": "+12:00",
};