import { EGameStatus, ETradeCode, IAccount } from "../../shared3/interface/IGame";


export const gConst = {
    gameName: "SuperAce"
}

export enum EBetAmountIndex {
    unknow = -1,
    single = 0,
    ten,
    hundred,
    thousand,
}
export function ErrorLog(msg: any) {
    console.trace("[SuperAce GameError:]" + msg);
}

export const slotProbabilitysDefault = [
    [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    [0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
];//顺序：scatter、梅花、方块、红桃、黑桃、J、Q、K、A

export const connectMultiples: number[][] = [//倍率
    [0, 0, 0, 0, 0, 0],            //scatter   0  
    [0, 0, 0, 0.05, 0.15, 0.25],    //梅花   1
    [0, 0, 0, 0.05, 0.15, 0.25],    //方块   2
    [0, 0, 0, 0.1, 0.3, 0.5],        //红桃  3
    [0, 0, 0, 0.1, 0.3, 0.5],        //黑桃  4
    [0, 0, 0, 0.2, 0.6, 1],          //J    5
    [0, 0, 0, 0.3, 0.9, 1.5],         //Q   6
    [0, 0, 0, 0.4, 1.2, 2],         //K     7
    [0, 0, 0, 0.5, 1.5, 2.5],        //A    8     
];

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

export function collectNotConnectedIndex(connectedIndex: number[]): number[] {
    let fullIndex = [];
    for (let i = 0; i < 15; i++) fullIndex.push(i);
    return fullIndex.filter(diff => !connectedIndex.includes(diff));
}

export interface IRoundStep {
    runningRoundId: number;
    /** 旧 Pinus/TS 服务端字段，仅用于兼容历史推送。 */
    runningRoundID?: number;
    status: EGameStatus;
    accountDiamond: number;
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
    calculateAmount: number;
    resultItems: IResultItem[];
    multiple: number;     //总倍数（一局所有消除的总倍数）
    multiples: number[]; // 每一次消除后的倍数
    freeCount: number;   // 免费次数
    multipleKinds: number[];
}

export interface IResultItem{
    slotResult: number[];
    eliminateIndexs: number[];
    multiple: number;
    multiples: number[];
    changeGoldenIndexs: number[];
    copyWildIndexs: number[];
    multipleKinds: number[];
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    // jackpotAmountPool: IJackpotAmountPool;
    playerSettings: IPlayerSettings;
    lastResult: IResults;
    hasLastResult: boolean;
    runningRoundId: number;
    machineStatus: EGameStatus;
}

export interface IPlayerSettings {
    soundVol?: number;
    lastBetAmountButton?: number;
    isSpeed?: boolean;
}

export interface IBetResp {
    code: ETradeCode;
    hasResult: boolean;
    result: IResults;
    roundId: number;
}

export interface IRoundResultResp {
    code?: ETradeCode;
    accountDiamond: number;
}

export interface IHint {
    userName: string;
    amount: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number,calculateAmount: number): Promise<IBetResp>;
    betFree(): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: EBetAmountIndex);
    updateSettings(playerSettings: IPlayerSettings);
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onJackpotHint(hint: IHint);
    onMaintenance();
}
