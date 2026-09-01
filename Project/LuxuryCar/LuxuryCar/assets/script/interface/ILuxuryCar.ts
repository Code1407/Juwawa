import { EGameStatus } from "../../shared3/interface/IGame";
import { ELang } from "../../shared3/langEnum_shared3";

export let gConst = {
    wheelMulti: [100, 5, 8, 2, 50, 30, 20, 18, 88, 2, 30, 18, 66, 20, 8, 5],
    gameName: "LuxuryCar"
}

export function ErrorLog(msg: any) {
    console.error("[LuxuryCar GameError:]" + msg);
}

export function getDayString(saveTime: string, type: string = ""): string {
    saveTime = saveTime.substring(0, 10);
    let date = new Date(Number.parseFloat(saveTime) * 1000);
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    let mt = m > 9 ? m.toString() : "0" + m;
    let d = date.getDate();
    let dt = d > 9 ? d.toString() : "0" + d;

    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if ([ELang.ar, ELang.ur].includes(lang as ELang)) return dt + "/" + mt + "/" + y;
    return y + "/" + mt + "/" + dt;
}
export function getTimeString2(saveTime: string, type: string = ""): string {
    saveTime = saveTime.substring(0, 10);
    let date = new Date(Number.parseFloat(saveTime) * 1000);
    let h = date.getHours();
    let hst = h > 9 ? h.toString() : "0" + h;
    let minute = date.getMinutes();
    let minutest = minute > 9 ? minute.toString() : "0" + minute;
    let second = date.getSeconds();
    let secondst = second > 9 ? second.toString() : "0" + second;
    return hst + ":" + minutest + ":" + secondst;
}


export function curWeek(day: Date) {
    const firstDayOfYear = new Date(day.getFullYear(), 0, 1);
    const millisecondFromFirst = day.valueOf() - firstDayOfYear.valueOf();
    const millisecondOneDay = 24 * 60 * 60 * 1000;
    const d = Math.ceil(millisecondFromFirst / millisecondOneDay);
    return Math.ceil(d / 7) + 1;
}

export function getRandomNumInt(min: number, max: number): number {
    const Range = max - min;
    const Rand = Math.random(); //获取[0-1)的随机数
    const numInt = (min + Math.round(Rand * Range)); //放大取整
    return numInt;
}

export function getRandomFloat(min: number, max: number): number {
    const Range = max - min;
    const Rand = Math.random(); //获取[0-1)的随机数
    const numInt = (min + Rand * Range); //放大取整
    return numInt;
}

export function arraySum(arr: number[]): number {
    if (!Array.isArray(arr)) {
        return 0;
    }
    return arr.reduce((pre, cur) => { return pre + cur; }, 0);
}

function rateRandom(probability: number[]): number {
    let rate = 0;
    const probabilitySum = arraySum(probability);
    const random = Math.random();
    for (let i = 0; i < probability.length; ++i) {
        if (random < (rate += (probability[i] / probabilitySum)))
            return i;
    };
    ErrorLog("roundRateResult");
    return getRandomNumInt(0, 3);
}

export function roundRateResult(probability: number[]): number {
    const result = rateRandom(probability);
    // return result > 7 ? result : 7 - result;
    return result;
}

export function calculateRevenue(betDetails: number[], result: number): number {
    let sumEarnings = 0;
    let indexArr = [7, 1, 9, 0, 3, 6, 5, 2, 4, 0, 6, 2, 8, 5, 9, 1]//16个车标对应的下注编号，有重复的
    let index = indexArr[result];//拿到压中的车标的编号
    sumEarnings = betDetails[index] * gConst.wheelMulti[result];//下注的金额*车标对应的奖池



    return sumEarnings;
}

export interface IRankListItem {
    profile: string;
    name: string;
    revenue: number;
}

export interface IMyHistoryItem {
    timestamp: number;
    date: string;
    round: number;
    betDatails: number[];
    roundResult: number;
}

export interface IRoundStep {
    todayRound: number;
    status: EGameStatus;
    remainSecond: number;
    result: number;
    hot: number[];
    roundRank: IRankListItem[];
    timestamp: number;
}

export interface IAccount {
    diamond: number;
    avatar: string;
    nickname: string;
}

export interface IPlayerUpdate {
    uid: string;

    // 场景信息
    historyResults: number[];
    rankList: IRankListItem[];

    // 个人信息
    diamond: number;
    todayRevenue: number;
    wheelAmount: number[];
    myHistory: IMyHistoryItem[];
}
export interface IPlayerSettings {
    soundVol?: number;
}

export interface IPlayerBetList {
    uid: string,
    betGradeArr: number[],
    betGradeNum: number[][],
}
export interface IEnterGameResp {
    // 场景信息
    roundStep: IRoundStep;
    historyResults: number[];
    rankList: IRankListItem[];

    // 个人信息
    uid: string,
    account: IAccount;
    todayRevenue: number;
    wheelChipAmount: number[][];
    wheelAmount: number[]; // 在一局内离开再进入，需要取得离开前的下注信息
    totalWheelAmount: number[]; // 在一局内离开再进入，需要取得离开前的所有人下注信息
    curRoundAllWheelAmount: IPlayerBetList[], // 当前局所有人的下注信息
    myHistory: IMyHistoryItem[];
    lastBetAmountButton: number;
    playerSettings: IPlayerSettings
}

export interface IBetResp {
    requestId: number;
    code: number; // 兼容旧客户端的稳定业务码
    rawTradeCode?: number; // 平台原始交易码；新客户端优先读取
    accountDiamond: number;
    wheelAmount: number[];
    wheelChipAmount: number[][];
}
export interface IBetListResp {
    uid: string,
    flyPlayerPos: number,
    batIndex: number[],
    num: number[][]
}
export interface IAllBetResp {
    wheelAmount: number[];
}
export interface ICountDownPlayerUpdate {
    uid: string;
    todayRound: number;
    diamond: number;
    itemAmount: number[];
}
export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][], betDiamonList: number[]): Promise<IBetResp>;
    //autoBet(todayRound: number, wheelAmount: number[]): Promise<IBetResp>;
    setBetAmountButton(betAmountButtonIndex: number);
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRankListChange(rankList: IRankListItem[]);
    onPlayerUpdate(playerResult: ICountDownPlayerUpdate);
    onRoundStep(roundStep: IRoundStep);
    onBetListRound(data: IBetListResp);//服务器下发派奖的动画参数
    onBetNoticeAll(resp: IAllBetResp);//有人下注派发
    onNewDay();
    onMaintenance();
}
