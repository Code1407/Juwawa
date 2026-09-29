
import { EGameStatus, IPlayerSettings } from "../shared3/interface/IGame";
import { EBetAmountIndex, IJackpotAmountPool, ILineSame } from "./interface/IFruitSlots";

const results: number[] = [];
const lineSames: ILineSame[] = [];
const connectedIndex: number[] = [];
const hists: string[] = [];

export const clientJackpotAmountPool: IJackpotAmountPool = {};
export let gBetAmounts = [300, 900, 3000, 9000,30000];

function normalizeBetAmounts(values: any): number[] {
    if (!Array.isArray(values)) return [];

    const amounts: number[] = [];
    for (const value of values) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0 || Math.floor(amount) !== amount) {
            return [];
        }
        amounts.push(amount);
    }
    return amounts;
}

// 始终原地更新，避免其他模块持有旧数组引用后看不到远端配置变化。
export function setBetAmounts(values: any): boolean {
    const amounts = normalizeBetAmounts(values);
    if (amounts.length === 0) return false;

    gBetAmounts.length = 0;
    for (const amount of amounts) gBetAmounts.push(amount);

    const betGrade = (<any>window).betGrade;
    if (betGrade) betGrade.gradeAmounts = gBetAmounts;
    return true;
}

export function initBetAmounts(): boolean {
    const betGrade = (<any>window).betGrade;
    const initialized = setBetAmounts(betGrade && betGrade.getGradeAmounts
        ? betGrade.getGradeAmounts()
        : betGrade && betGrade.gradeAmounts);
    return initialized;
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
