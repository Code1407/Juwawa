
import { EGameStatus, IPlayerSettings } from "../shared3/interface/IGame";
import { EBetAmountIndex, IJackpotAmountPool, ILineSame } from "./interface/IFruitSlots";

const results: number[] = [];
const lineSames: ILineSame[] = [];
const connectedIndex: number[] = [];
const hists: string[] = [];

export const clientJackpotAmountPool: IJackpotAmountPool = {};
export let gBetAmounts = [1, 10, 100, 1000];
export function initBetAmounts() {
    let betGrade = (<any>window).betGrade;
    gBetAmounts = betGrade.getGradeAmounts();
    console.log("initBetAmounts-------------",gBetAmounts);
}

export let gGameData = {
    results: results,
    lineSames: lineSames,
    connectedIndex: connectedIndex,
    multiple: 0,
    freeCount: 0,
    freeWinAmount: 0,
    betAmountIndex: EBetAmountIndex.single,
    jackpotAmount: 0,
    jackpotAmountPool: clientJackpotAmountPool,
    status: EGameStatus.stop,
    clientStatus: EGameStatus.stop,
    hints: hists
}
export let gPlayerSettings: IPlayerSettings = {
    soundVol: 1,
    lastBetAmountButton: 0,
};
window["gGameData"] = gGameData;
window["gPlayerSettings"] = gPlayerSettings;