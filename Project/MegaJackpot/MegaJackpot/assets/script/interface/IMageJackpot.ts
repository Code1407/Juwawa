import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "../../shared3/interface/IGame";

export const gConst = {
    gameName: "MageJackpot"
}


export enum EBetAmountIndex {
    unknow = -1,
    single = 0,
    ten,
    hundred,
    thousand,
}

export const linePaths: number[][] = [
    [6, 7, 8, 9, 10],
    [1, 2, 3, 4, 5],
    [11, 12, 13, 14, 15],
    [1, 7, 13, 9, 5],
    [11, 7, 3, 9, 15],
    [6, 2, 3, 4, 10],
    [6, 12, 13, 14, 10],
    [1, 2, 8, 14, 15],
    [11, 12, 8, 4, 5]
];

export const bigWinMultiple = 5;
export const lineCount = 1;    //倍数操作30倍修改为1倍

export function ErrorLog(msg: any) {
    console.trace("[MageJackpot GameError:]" + msg);
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
    results?: IResults;
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
    bonusTriggered: boolean;
    bonusSymbolCount: number;
    bonusMultiplier: number;
    bonusWinAmount: number;
    bonusSegmentIndex: number;
    jackpotAmount: number;
    jackpotAmountPool: IJackpotAmountPool;
}

/** 服务端下发的单局历史记录。字段名与 enterGame / synchronize 的 history 保持一致。 */
export interface IHistoryItem {
    /** 结算时间，可为日期字符串、Unix 秒或 Unix 毫秒。 */
    date: string | number;
    /** 服务端回合号，同时作为订单号展示。 */
    round: string | number;
    /** 平台实际扣款订单号；旧历史记录缺失时前端回退显示 round。 */
    orderId?: string | number;
    /** 本局总下注。 */
    bet: number;
    /** 本局总赢奖。 */
    win: number;
    multiple?: number;
    gameType?: number;
    results?: number[];
}

export interface IHistorySummary {
    todayWin: number;
    monthWin: number;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    jackpotAmountPool: IJackpotAmountPool;
    /** 服务端权威总下注档位：后台 Costs 配置优先，未配置时回退服务端默认值。 */
    betAmounts?: number[];
    betAmountIndex: EBetAmountIndex;
    lastResult: IResults;
    playerSettings: IPlayerSettings,
    /** 最近历史下注；旧服务端未下发时不覆盖客户端已缓存的数据。 */
    history?: IHistoryItem[];
    /** 由服务端从当月 1 日 00:00 起累计的赢奖汇总。 */
    historySummary?: IHistorySummary;
    // 旧服务端可能未下发，客户端保留兼容性降级。
    roundStep?: IRoundStep;
}

export interface IBetResp {
    code: ETradeCode;
    rawTradeCode?: number;
    result: IResults;
    roundId: number;
}

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface IBetAmountsResp {
    code: ETradeCode;
    betAmounts: number[];
}

export interface IHint {
    avatarUrl: string;
    playerUid: string;
    userName: string;
    /** Unix timestamp in milliseconds. */
    winTime: number;
    amount: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number): Promise<IBetResp>;
    betFree(): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: EBetAmountIndex);
    synchronize(): Promise<IEnterGameResp>;
    sendBetAmounts(): Promise<IBetAmountsResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onResultHandler(msg: IBetResp);
    onWinHint(hint: IHint, isJackpot: boolean);
    onMaintenance();
}
