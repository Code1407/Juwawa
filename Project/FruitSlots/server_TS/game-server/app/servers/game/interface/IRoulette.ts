import { EGameStatus, ETradeCode, IAccount, IRankListItem } from "./IGame";

export const gConst = {
    gameName: "Roulette",
    itemMulti: [36,3,3,3,2,2,2,2],//奖励倍数
    redNumbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]//红码
}

export function calculateRevenue(betItems: number[], result: number): number {
    let winItems = [];
    if(result == 0){
        winItems.push(0);
    }
    
    if(result >=1 && result <= 12){
        winItems.push(1);
    }
    if(result >=13 && result <= 24){
        winItems.push(2);
    }
    if(result >= 25 && result <= 36){
        winItems.push(3);
    }
    if(gConst.redNumbers.includes(result)){//红色
        winItems.push(4);
    }
    else if(result != 0){//黑色
        winItems.push(5);
    }
    if(result != 0){
        if(result % 2 == 0){//偶数
            winItems.push(6);
        }
        else{
            winItems.push(7);
        }
    }

    let sumRevenue = 0 ;
    for (let index = 0; index < winItems.length; index++) {
        let itemWin = winItems[index];
        if(betItems[itemWin] > 0){
            sumRevenue += betItems[itemWin]*gConst.itemMulti[itemWin];
        }
    }
    return sumRevenue;
}
export interface IRoundStep {
    todayRound:number,
    status: EGameStatus,
    remainSecond: number,
    result: number,
}

export interface IRoundResult {
    todayRound:number,
    result: number,
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][],betDiamonList:number[]): Promise<IBetResp>;
    //autoBet(todayRound: number, wheelAmount: number[]): Promise<IBetResp>;
    reqRoundHistory(index:number): Promise<string>
    setBetAmountButton(betAmountButtonIndex: number);
    synchronize(): Promise<IEnterGameResp>;
}
export interface IBetResp {
    code: ETradeCode,
    accountDiamond: number,
    betGradeNum: number[][]
}
export interface IAllBetResp {
    wheelAmount: number[][];
}

export interface ISceneListen {
    onNewDay();//跨天
    onMaintenance();//维护
    onRoundStep(roundStep: IRoundStep);//同步秒数和状态
    onResultHandler(roundResult: IRoundResult);//服务器下发派牌的结果
    onBetNoticeAll(resp:IAllBetResp);//有人下注派发
    onRewardHandler(roundResult:IRewardResp);//发奖,结果的挡位
    onRankListChange(resp:IRankListItem[]);//同步排行榜
    onBetListRound(data:IBetListResp);//服务器下发派奖的动画参数
}

export interface IRewardResp {
    winCard: string,
    date: string,
}
export interface IBetListResp{
    uid:string,
    flyPlayerPos:number,
    batIndex:number[],
    num:number[][]
}

export interface IHistoryItem {
    date: string,
    round: number,
    //betDatails: number[][], 
    roundResult: number
}

export interface IMyHistoryList {
    date:string,
    data:IMyHistoryItem[],
}
export interface IMyHistoryItem {
    date: string,
    round: number,
    betDatails: number[], 
    roundResult: number
}
export function getRandom(mini,maxi){
    return Math.floor(Math.random()*(maxi-mini+1))+mini;
}

export interface IPlayerBetList {
    uid:string,
    betGradeArr: number[], 
    betGradeNum: number[][], 
}
export interface IEnterGameResp {
    // 场景信息
    uid:string,
    roundStep: IRoundStep,
    //
    rankList: IRankListItem[],

    // 个人信息
    account: IAccount,
    lastWheelAmount: number[][], // 存在的上一局的下注信息
    curRoundWheelAmount: number[][], // 个人当前局的下注信息
    curRoundAllWheelAmount: IPlayerBetList[], // 当前局所有人的下注信息
    gameHistory: IHistoryItem[],
    lastBetAmountButton: number
}

