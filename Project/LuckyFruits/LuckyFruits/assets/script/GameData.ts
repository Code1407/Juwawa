import { EGameStatus } from "../shared3/interface/IGame";

export enum EBetAmount {
    ten = 0,
    hundred,
    thousand,
    tenThousand,
}
export const betGrade =
{
    0: 10,
    1: 100,
    2: 1000,
    3: 10000
}
export const BetLevel =
{
    0: 3,
    1: 6,
    2: 9,
    3: 12
}

// export const betGrade = 
// {
//     0:100,
//     1:1000,
//     2:10000,
//     3:100000
// }
// export const BetLevel = 
// {
//     0:6,
//     1:9,
//     2:12,
//     3:15
// }


export let gGameData = {
    isNetPlay: true,//是否网络环境
    //status: EGameStatus.stop,
    betAmountIndex: EBetAmount.thousand,
    soundVol: 1,
    betNum: 1,
    BetTotalNumber: 0,
    betMax:0,
    roundStep: {
        status: EGameStatus.stop,
        todayRound: 0,
        remainSecond: 10,
        serverNowMs: 0,
        phaseStartedAtMs: 0,
        phaseEndsAtMs: 0,
        timelineVersion: 0,
        rollStartPos: 0,
        winPos: -1,
        resultDetail: [],
        resultPos: [],
    },
    WinPos: -1,
    ResultDetail: [],
    WinChip: {},
    AutoBet: {},
    Gamefocus: true,
    roundBetCount: 0, // 为了兼容，在客户端做上限
    coolDown: false , // 为了兼容，在客户端做cd
    //筹码的面额
    BetGradeObj: betGrade,//废弃
    //筹码的种类
    BetLevel: BetLevel,//废弃
}
window["gGameData"] = gGameData;
