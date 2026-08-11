import { randomInt } from "crypto";
import { EGameStatus, ETradeCode, IAccount, IPlayerSettings, arraySum } from "./IGame";

export const gConst = {
    gameName: "PirateKing"
}

export enum EBetAmountIndex {
    single = 0,
    ten,
    hundred,
    thousand,
}

/*
export const linePaths: number[][] = [
    [11, 12, 13, 14, 15],
    [11, 12, 8, 9, 10],
    [11, 12, 3, 14, 15],
    [11, 7, 13, 9, 5],
    [11, 7, 13, 14, 10],

    [6, 12, 13, 14, 10],
    [6, 12, 8, 4, 10],
    [6, 12, 3, 14, 10],
    [6, 7, 13, 9, 10],
    [6, 2, 13, 4, 15],

    [1, 12, 13, 14, 5],
    [1, 12, 8, 14, 5],
    [1, 12, 3, 14, 5],
    [1, 7, 13, 9, 5],
    [1, 2, 8, 14, 15],

    [11, 7, 8, 9, 15],
    [11, 7, 3, 9, 15],
    [11, 2, 13, 4, 15],
    [11, 2, 8, 4, 15],
    [11, 2, 3, 4, 15],

    [6, 7, 8, 9, 10],
    [6, 7, 3, 9, 10],
    [6, 2, 8, 14, 10],
    [6, 2, 3, 4, 10],
    [11, 7, 8, 9, 5],
    
    [1, 7, 8, 9, 5],
    [1, 7, 3, 9, 5],
    [1, 2, 13, 4, 5],
    [11, 2, 8, 14, 5],
    [1, 2, 3, 4, 5]
];
*/

// 从上面选20条
const showLine = [
    21, 30, 1, 14,
    17, 24, 6, 15,
    -1, 7, 23, 26,
    16, 27, -1, 22,
    9, 28, 3, 11
];

export function ErrorLog(msg: any) {
    console.trace("[PirateKing GameError:]" + msg);
}

export function getRandomNumInt(min: number, max: number): number {
    return randomInt(Math.round(min), Math.round(max + 1));
    var Range = max - min;
    var Rand = Math.random(); //获取[0-1)的随机数
    let numInt = (min + Math.round(Rand * Range)); //放大取整
    return numInt;
}

export function arrayIncludes(arr1: string[], arr2: string[]): boolean {
    return arr2.every(element => arr1.includes(element));
}

export function rateRandom(probability: number[], errorBegin: number, errorEnd: number): number {
    let rate = 0;
    let probabilitySum = arraySum(probability);
    let random = Math.random();
    for (let i = 0; i < probability.length; ++i) {
        if (random < (rate += (probability[i] / probabilitySum)))
            return i;
    };
    ErrorLog("rateResult error");
    return getRandomNumInt(errorBegin, errorEnd);
}

export function rateRandomResult(probability: number[]): number {
    return rateRandom(probability, 0, 6);
}

export function rateRandomDefault(probability: number[]): number {
    return rateRandom(probability, 0, probability.length - 1);
}

export interface IRankHint {
    uid: string;
    betResp: IBetResp;
}

export interface ITopUser {
    uid: string;
    userName: string;
    avatar: string;
}

export interface IRoundStep {
    runningRoundID: number;
    status: EGameStatus;
    accountDiamond: number;
    results: IResults;
}

export interface IJackpotAmountPool {
    [betAmount: number]: number;
};

export interface ILineSame {
    lineNum: number;
    target: number;
    count: number;
}

export interface IResults {
    betAmount: number;
    results: number[];
    lineSames: ILineSame[];
    multiple: number;
    multiples: number[]; // 策划想看的信息
    jackpotAmount: number;
}

export interface IHistoryItem{
    time: string;
    round: number;
    betAmount: number;
    lineSames: ILineSame[];
    multiple: number;
    jackpotAmount: number;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    betAmountIndex: EBetAmountIndex;
    playerSettings: IPlayerSettings;
    lastResult: IResults;
    historyList: IHistoryItem[];
}

export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
    extra: any;
}

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: EBetAmountIndex);
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onResultHandler(uid: string, resp: IBetResp);
    onAccountDiamondUpdate(uid: string, amount: { value: number, offset?: number });//amount要包装成对象，否则当余额为0时会抛出异常
    onTopUserChange(topUsers: ITopUser[]);
    onWinHint(hints: IRankHint[]);
    onMaintenance();
}