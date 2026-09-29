import { EGameStatus } from "../shared3/interface/IGame";
import { EBetAmountIndex, IJackpotAmountPool, ILineSame } from "./interface/ISuperAce";

const results: number[] = [];
const lineSames: ILineSame[] = [];
const connectedIndex: number[] = [];
const hists: string[] = [];

export const clientJackpotAmountPool: IJackpotAmountPool = {};
export let gBetAmounts = [1, 10, 100, 1000];
export let gBetAmountsExtra = [1, 15, 150, 1500]
export function initBetAmounts(): boolean {
    const betGrade = (<any>window).betGrade;
    const configuredAmounts = betGrade && typeof betGrade.getGradeAmounts === "function"
        ? betGrade.getGradeAmounts()
        : betGrade && betGrade.gradeAmounts;
    if (!Array.isArray(configuredAmounts)) return false;

    const amounts = configuredAmounts
        .map(amount => Number(amount))
        .filter((amount, index, values) => Number.isSafeInteger(amount)
            && amount > 0 && values.indexOf(amount) === index);
    if (amounts.length === 0) return false;

    gBetAmounts = amounts;
    // SuperAce 的 Extra 档位与本地默认值、FortuneSlot 保持一致，按普通档位的 1.5 倍取整。
    gBetAmountsExtra = amounts.map(amount => Math.floor(amount * 1.5));
    return true;
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
