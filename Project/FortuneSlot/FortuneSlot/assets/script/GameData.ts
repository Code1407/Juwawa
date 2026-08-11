import { EGameStatus } from "../shared3/interface/IGame";
import { EBetAmountIndex, IJackpotAmountPool, ILineSame } from "./interface/IFruitSlots";

const results: number[] = [];
const lineSames: ILineSame[] = [];
const connectedIndex: number[] = [];
const hists: string[] = [];

export const clientJackpotAmountPool: IJackpotAmountPool = {};
export let gBetAmounts = [1, 10, 100, 1000];
export let gBetAmountsExtra = [1, 15, 150, 1500]
export function initBetAmounts() {
    let betGrade = (<any>window).betGrade;
    gBetAmounts = betGrade.getGradeAmounts();
    gBetAmountsExtra = JSON.parse(JSON.stringify(gBetAmounts));
    for(let i = 0; i < gBetAmounts.length; i++){
        gBetAmountsExtra[i] = Math.floor(gBetAmounts[i] * 1.5);
    }
    console.log("gBetAmounts:", gBetAmounts);
    console.log("gBetAmountsExtra:", gBetAmountsExtra);
}

export let gGameData = {
    results: results,
    lineSames: lineSames,
    connectedIndex: connectedIndex,
    multiple: 0,
    freeCount: 0,
    freeWinAmount: 0,
    betAmountIndex: EBetAmountIndex.single,
    soundVol:1,
    jackpotAmount: 0,
    jackpotAmountPool: clientJackpotAmountPool,
    status: EGameStatus.stop,
    clientStatus: EGameStatus.stop,
    hints: hists
}
window["gGameData"] = gGameData;