import { randomInt } from "crypto";

export enum EGameStatus {
    stop = 0,
    bet,
    run,
    run2final,
    final,
    ready,
    coolDown,
    heartbeat,
    bet1,
    play1,
    result1,
    bet2,
    play2,
    result2,
    bet3,
    play3,
    result3,
    maintenance = 99998,
    unknow = 99999
}

export interface IAccount {
    diamond: number;
    avatar: string;
    nickname: string;
    level?: number;
    vipLevel?: number;
    uid?: string;
    token?: string;
}

export interface IPlayerSettings {
    soundVol?: number;
    lastBetAmountButton?: number;
}

export interface IRankListItem {
    uid:string,
    profile: string, 
    name: string, 
    revenue: number
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

export interface ICountDownPlayerUpdate {
    diamond: number;
    itemAmount: number[];
}

export const pokerDict = {"A":1, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "J":11, "Q":12, "K":13 };
export const pokerNum = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const pokerDecor = ['♠', '♥', '♣', '♦'];

export function get2ArrAverage(arr1: number[], arr2: number[]) {
    if (arr1?.length > 0 && arr2?.length > 0) {
        let length = Math.max(arr1.length, arr2.length);
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += arr1[i] * arr2[i];
        }
        return sum;
    }
    return 0;
}

export enum EPokerHands {
    unknow = 0,
    highCard = 1,           // 单张
    pair = 2,               // 对子
    straight = 3,           // 顺子
    sameDecor = 4,          // 同花
    sameDecorStraight = 5,  // 同花顺
    sameNum = 6,            // 豹子
}

export interface IPokerItem {
    num: number;
    decor: number;
}

export function rateRandom(probability: number[]): number {
    let rate = 0;
    const probabilitySum = arraySum(probability);
    const random = Math.random();
    for (let i = 0; i < probability.length; ++i) {
        if (random < (rate += (probability[i] / probabilitySum)))
            return i;
    };
    return 0;
}

export function getRandomNumInt(min: number, max: number): number {
    return randomInt(Math.round(min), Math.round(max+1));
    var Range = max - min;
    var Rand = Math.random(); //获取[0-1)的随机数
    let numInt = (min + Math.round(Rand * Range)); //放大取整
    return numInt;
}

export function multiply100(n: string|number): number {
    let numst = n.toString();
    let num100 = 0;
    let dotIndex = numst.indexOf(".");
    if(dotIndex > 0){
        let numSt = numst.replace(".","");
        numSt =  numSt.slice(0, dotIndex + 2);
        for (let i = numSt.length; i < dotIndex+2; i++) {
            numSt += "0";
        }
        num100 = Number.parseInt(numSt);
    } else {
        num100 = Number.parseInt(numst) * 100;  
    }
    return num100;
}

export function toFixed(st: string|number, n: number): string {
    let numSt = st.toString();
    let dotIndex = numSt.indexOf(".");
    if(dotIndex > 0) {
        numSt = numSt.substring(0, dotIndex+n+1);
    } else if (n > 0) {
        numSt += '.';
        dotIndex = numSt.length - 1;
    }
    for (let i = numSt.length; i < dotIndex+n+1; i++) {
        numSt += "0";
    }
    return numSt;
}

export function arraySum(arr: number[]): number {
    return arr?.length > 0 ? arr.reduce((pre, cur) => { return pre + cur; }) : 0;
}

export function getRandomFloat(min: number, max: number): number {
    const Range = max - min;
    const Rand = Math.random(); //获取[0-1)的随机数
    const numInt = (min + Rand * Range); //放大取整
    return numInt;
}

const millisecondOneDay = 24 * 60 * 60 * 1000;

export function getYesterday(): Date {
    return new Date(new Date().valueOf() - millisecondOneDay);
}

export function getLastWeek(): Date {
    return new Date(new Date().valueOf() - 7 * millisecondOneDay);
}

const timeZones = {
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


export function getTimezoneOptionDateTime(sdkTimeZoneNum: string): {local: string, options: Intl.DateTimeFormatOptions, timeZoneNum: string} {
    let timeZoneNum = sdkTimeZoneNum ? sdkTimeZoneNum : "+08:00";
    let timeZone = timeZones[timeZoneNum];
    if (!timeZone) timeZone = "Asia/Shanghai";
    // timeZone = "Asia/Shanghai";  // 完成时区后去掉
    // timeZoneNum = "+08:00"; // 完成时区后去掉
    let options: Intl.DateTimeFormatOptions = {
        timeZone: timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    let local = 'UTC';
    return {local, options, timeZoneNum};
}

export function getTimezoneOptionDate(sdkTimeZoneNum: string): {local: string, options: Intl.DateTimeFormatOptions, timeZoneNum: string} {
    let timeZoneNum = sdkTimeZoneNum ? sdkTimeZoneNum : "+08:00";
    let timeZone = timeZones[timeZoneNum];
    if (!timeZone) timeZone = "Asia/Shanghai";
    // timeZone = "Asia/Shanghai";  // 完成时区后去掉
    // timeZoneNum = "+08:00"; // 完成时区后去掉
    let options: Intl.DateTimeFormatOptions = {
        timeZone: timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false
    };
    let local = 'UTC';
    return {local, options, timeZoneNum};
}

export const strTimeOut = 'request timeout';
export const nSdkTimeOut = 35 * 1000;

export const strServiceMaintenance = 
"In service maintenance!"
+ "\n\nExpected to wait a few minutes."