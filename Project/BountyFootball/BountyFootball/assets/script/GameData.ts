import { EGameStatus } from "../shared3/interface/IGame";

export const coolDownTime = 120;
export const roundBetCountMax = 100;

export enum EBetAmount {
    ten = 0,
    hundred,
    thousand,
    tenThousand,
    hundredThousand
}
export const betGrade =
{
    0: 10,
    1: 100,
    2: 1000,
    3: 10000
}
export let gGameData = {
    status: EGameStatus.stop,
    betAmountIndex: EBetAmount.thousand,    
    historyResults: [0, 1, 2, 3, 4, 5, 6, 7],
    roundStep: {
        todayRound: 0, 
        status: EGameStatus.stop, 
        remainSecond: 5, 
        result: -1,
        hot: [0, 0, 0, 0, 0, 0, 0, 0], 
        roundRank: [],
        timestamp: 0
    },
    soundVol:1,
    gameHide:false,
    //筹码的面额
    BetGradeObj: betGrade,
    //goods:[10,15,25,45,5,5,5,5],
    rate:[2, 5, 18, 50, 88, 20, 30, 100, 66, 8],
    indexArr : [7, 1, 9, 0, 3, 6, 5, 2, 4, 0, 6, 2, 8, 5, 9, 1],//16个车标对应的下注编号，有重复的
    wheelMulti: [100, 5, 8, 2, 50, 30, 20, 18, 88, 2, 30, 18, 66, 20, 8, 5],
    totalWheelAmount: [],
    roundBetCount: 0, // 为了兼容，在客户端做上限
    coolDown: false  // 为了兼容，在客户端做cd
}

window["gGameData"] = gGameData;