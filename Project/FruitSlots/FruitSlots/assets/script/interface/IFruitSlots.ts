import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "../../shared3/interface/IGame";

export const gConst = {
    gameName: "FruitSlots"
}


export enum EBetAmountIndex {
    unknow = -1,
    single = 0,
    ten,
    hundred,
    thousand,
}

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

export const bigWinMultiple = 100;
export const lineCount = 30;

export function ErrorLog(msg: any) {
    console.trace("[FruitSlots GameError:]" + msg);
}

export function getRandomNumInt(min: number, max: number): number {
    var Range = max - min;
    var Rand = Math.random(); //获取[0-1)的随机数
    let numInt = (min + Math.round(Rand * Range)); //放大取整
    return numInt;
}

export function arraySum(arr: number[]): number {
    return arr?.length > 0 ? arr.reduce((pre, cur) => { return pre + cur; }) : 0;
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

export function collectConnectedIndex(lineSames: ILineSame[]): number[] {
    let connectedIndex: number[] = [];
    for (let i = 0; i < lineSames.length; i++) {
        let lineSame = lineSames[i];
        let linePath = linePaths[lineSame.lineNum];
        for (let j = 0; j < lineSame.count; j++) {
            let pathIndex = linePath[j] - 1;
            if (!connectedIndex.includes(pathIndex)) connectedIndex.push(pathIndex);
        }
    }
    return connectedIndex;
}

export function collectNotConnectedIndex(connectedIndex: number[]): number[] {
    let fullIndex = [];
    for (let i = 0; i < 15; i++) fullIndex.push(i);
    return fullIndex.filter(diff => !connectedIndex.includes(diff));
}

export interface IRoundStep {
    runningRoundID: number;
    status: EGameStatus;
    accountDiamond: number;
    jackpotPool: IJackpotAmountPool;
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
    freeWinAmount: number;
    freeCount: number;
    jackpotAmount: number;
    jackpotAmountPool: IJackpotAmountPool;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    jackpotAmountPool: IJackpotAmountPool;
    betAmountIndex: EBetAmountIndex;
    lastResult: IResults;
    playerSettings: IPlayerSettings,
}

export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
}

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface IHint {
    userName: string;
    amount: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number): Promise<IBetResp>;
    betFree(): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: EBetAmountIndex);
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onResultHandler(msg: IBetResp);
    onJackpotHint(hint: IHint);
    onMaintenance();
}
