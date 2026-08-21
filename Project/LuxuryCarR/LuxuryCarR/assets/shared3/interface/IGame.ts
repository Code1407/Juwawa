export enum EGameStatus {
    stop = 0,
    bet,
    run,
    run2final,
    final,
    ready,
    coolDown,
    heartbeat,
    unknow
}

export interface IAccount {
    diamond: number;
    avatar: string;
    nickname: string;
    level: number;
}

export interface ICountDownPlayerUpdate {
    todayRound: number;
    diamond: number;
    itemAmount: number[];
}

export interface IPlayerSettings {
    soundVol?: number;
    isSpeed?: boolean;
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

export enum EBetStatus {
    bet = 0,
    unbet = 1,
    cashout = 2,
    betNextRound = 3,
    stop = 4,
    auto = 5
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
