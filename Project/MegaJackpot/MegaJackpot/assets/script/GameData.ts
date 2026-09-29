
import { EGameStatus, IPlayerSettings } from "../shared3/interface/IGame";
import { EBetAmountIndex, IHistoryItem, IHistorySummary, IJackpotAmountPool, ILineSame } from "./interface/IMageJackpot";

// 服务端结算使用9条线；下注按钮保存并传输的是总下注，不能再以单线金额展示。
const TOTAL_BET_LINE_COUNT = 9;

const results: number[] = [];
const lineSames: ILineSame[] = [];
const connectedIndex: number[] = [];
const hists: string[] = [];
// 原地更新，保证已打开的历史界面可以继续持有同一份数组引用。
const bettingHistory: IHistoryItem[] = [];

// 服务端全局中奖广播对应的跑马灯资料。展示层可按需使用头像、ID、昵称、时间和金额。
export interface IJackpotMarqueeItem {
    avatarUrl: string;
    playerUid: string;
    userName: string;
    winTime: number;
    amount: number;
    isJackpot: boolean;
}

const jackpotMarqueeQueue: IJackpotMarqueeItem[] = [];

// 登录成功推送会覆盖此默认布局。索引0~11必须与转盘Spine皮肤顺序一致。
export let gBonusWheelSegmentMultipliers = [3, 5, 3, 20, 15, 10, 1, 10, 1, 5, 3, 5];

export function setBonusWheelSegmentMultipliers(values: any): boolean {
    if (!Array.isArray(values) || values.length !== 12) return false;
    const segments = values.map(Number);
    if (segments.some(value => !Number.isFinite(value) || value <= 0)) return false;

    gBonusWheelSegmentMultipliers.length = 0;
    gBonusWheelSegmentMultipliers.push(...segments);
    return true;
}

export const clientJackpotAmountPool: IJackpotAmountPool = {};
// 仅用于登录响应尚未返回时的安全占位。进入游戏后由响应中的服务端权威档位覆盖。
export let gBetAmounts = [2700, 8100, 27000, 81000, 270000];

function normalizeBetAmounts(values: any): number[] {
    if (!Array.isArray(values)) return [];

    const amounts: number[] = [];
    for (const value of values) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0 || Math.floor(amount) !== amount
            || amount % TOTAL_BET_LINE_COUNT !== 0) {
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
    bonusTriggered: false,
    bonusSymbolCount: 0,
    bonusMultiplier: 0,
    bonusWinAmount: 0,
    bonusSegmentIndex: -1,
    betAmountIndex: EBetAmountIndex.single,
    jackpotAmount: 0,
    jackpotAmountPool: clientJackpotAmountPool,
    status: EGameStatus.stop,
    clientStatus: EGameStatus.stop,
    hints: hists,
    history: bettingHistory,
    historySummary: null as IHistorySummary,
    jackpotMarqueeQueue: jackpotMarqueeQueue,
}
export let gPlayerSettings: IPlayerSettings = {
    soundVol: 1,
    lastBetAmountButton: 0,
};
window["gGameData"] = gGameData;
window["gPlayerSettings"] = gPlayerSettings;
