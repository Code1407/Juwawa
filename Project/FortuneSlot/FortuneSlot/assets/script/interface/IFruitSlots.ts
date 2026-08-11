import { ELang } from "../../lang/langEnum";
import { EGameStatus, ETradeCode, IAccount } from "../../shared3/interface/IGame";


export const gConst = {
    gameName: "FortuneSlot"
}

export enum EBetAmountIndex {
    unknow = -1,
    single = 0,
    ten,
    hundred,
    thousand,
}

export const slotProbabilitysDefault = [50,40,30,24,20,16,10,4]
export const specialMultiplesRate = [60,30,20,12,6,0,1]
export const extraMultiplesRate = [0,30,20,12,6,4,1]
export const connectIndexs = [
    [0, 1, 2],
    [0, 5, 10],
    [4, 5, 6],
    [8, 9, 10],
    [8, 5, 2]
]

export const goodsMultiples = [0.4, 1, 1.6, 2, 2.4, 3, 4, 5];//J、Q、K、A、绿宝石、蓝宝石、红宝石、wild的倍率

export const stopCounts = [3,5,7,9,11,13,15,17,19]

export const wheelMultiples = [1, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 1000] 

export const wheelExtraMultiples = [1,2,3,5,10,15]

export const wheelAngle = [58.5,270,118.5,210,30,330,300,88.5,150,240,180,0]

export const wheelExtraRate = [60,30,20,12,6,4]

export const bigWinMultiple = 100;
export const lineCount = 30;

export function ErrorLog(msg: any) {
    console.trace("[FortuneSlot GameError:]" + msg);
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

export function collectNotConnectedIndex(connectedIndex: number[]): number[] {
    let fullIndex = [];
    for (let i = 0; i < 15; i++) fullIndex.push(i);
    return fullIndex.filter(diff => !connectedIndex.includes(diff));
}

export function getDayString(saveTime:string,type:string = ""):string{
    saveTime = saveTime.substring(0,10);
    let date = new Date(Number.parseFloat(saveTime)*1000);
    let y = date.getFullYear();
    let m = date.getMonth()+1;
    let mt = m > 9?m.toString():"0"+m;
    let d = date.getDate();
    let dt = d > 9?d.toString():"0"+d;
    
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    return y+"/"+mt+"/"+dt;
}
export function getTimeString2(saveTime:string,type:string = ""):string{
    saveTime = saveTime.substring(0,10);
    let date = new Date(Number.parseFloat(saveTime)*1000);
    let h = date.getHours();
    let hst = h > 9?h.toString():"0"+h;
    let minute = date.getMinutes();
    let minutest = minute > 9?minute.toString():"0"+minute;
    let second = date.getSeconds();
    let secondst = second > 9?second.toString():"0"+second;
    return hst+":"+minutest+":"+secondst;
}

export interface IRoundStep {
    runningRoundID: number;
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
    slotResults: number[];
    multiple: number;
    multiples: number[]; // 策划想看的信息
    wheelMultipleIndex: number;
    wheelExtraIndex: number;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    // jackpotAmountPool: IJackpotAmountPool;
    playerSettings: IPlayerSettings;
    lastResult: IResults;
    history:IHistoryItem[]
}

export interface IHistoryItem{
    date:string;
    round:number;
    betAmount: number;
    lines:number[];
    goods:number[];
    win:number;
    wheelMultiple:number;
    isExtra:boolean
}

export interface IPlayerSettings {
    soundVol?: number;
    lastBetAmountButton?: number;
    isSpeed?: boolean;
}

export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
}

export interface IRoundResultResp {
    accountDiamond: number;
    history:IHistoryItem[]
}

export interface IHint {
    userName: string;
    amount: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number,calculateAmount: number, isExtra: boolean): Promise<IBetResp>;
    betFree(): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: EBetAmountIndex);
    updateSettings(playerSettings: IPlayerSettings);
    synchronize(): Promise<IEnterGameResp>;
    refreshPlayerBaseData(): Promise<any>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onJackpotHint(hint: IHint);
    onMaintenance();
}
