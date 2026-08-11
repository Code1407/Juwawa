import { ERateType } from "../../database/entity/SDKEntity";
import { IGameRateBase } from "../GameBase/ShiftGame/MachineShiftBase";

export let linePaths: number[][] = [

    [0, 1, 2, 3, 4,],
    [5, 6, 7, 8, 9,],
    [10, 11, 12, 13, 14,],

    [0, 6, 2, 8, 4,],
    [5, 1, 7, 3, 9,],
    [5, 11, 7, 13, 9,],
    [10, 6, 12, 8, 14,],

    [0, 1, 7, 3, 4,],
    [10, 11, 7, 13, 14,],
    [5, 6, 12, 8, 9,],
    [5, 6, 2, 8, 9,],

    [0, 11, 2, 13, 4,],
    [10, 1, 12, 3, 14,],

    [5, 1, 2, 3, 9,],
    [5, 11, 12, 13, 9,],
    [10, 6, 7, 8, 14,],
    [0, 6, 7, 8, 4,],

    [10, 6, 2, 8, 14,],
    [0, 6, 12, 8, 4,],

    [0, 1, 12, 3, 4,],
    [10, 11, 2, 13, 14,],

    [0, 11, 12, 13, 4,],
    [10, 1, 2, 3, 14,],

    [5, 1, 12, 3, 9,],
    [5, 11, 2, 13, 9,],
];
export const lineCount = linePaths.length;
export const bigWinMultiple = 80;
export const killCount = 5;
export const regenerateCount = 1;
export const regenerateRange = { min: 0, max: 10 };

export const slotProbabilitysDefault: number[][] = [
    [0.05, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.15, 0.2, 0],
    [0.03, 0.04, 0.05, 0.08, 0.1, 0.1, 0.14, 0.16, 0.18, 0.12],
    [0.03, 0.04, 0.06, 0.1, 0.12, 0.12, 0.14, 0.16, 0.18, 0.05],
    [0.03, 0.06, 0.08, 0.1, 0.12, 0.12, 0.14, 0.16, 0.18, 0.01],
    [0.03, 0.06, 0.08, 0.1, 0.12, 0.12, 0.14, 0.16, 0.18, 0.01],
];
export const connectMultiples: number[][] = [
    [75, 250, 1000,],
    [50, 200, 500,],
    [30, 100, 300,],
    [20, 80, 200,],
    [20, 60, 150,],
    [15, 50, 120,],
    [15, 50, 120,],
    [10, 20, 100,],
    [10, 20, 100,],
    [0, 0, 0,],
    [0, 0, 0,],
    [0, 0, 0,],
];

export const freeProbabilityDefault = 0.0025; // 0.02;
export const freeCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0]; // 0,1,2个出现的概率
export const freeCountProbability345 = [0, 0, 0, 0.6, 0.3, 0.1]; // 3,4,5个出现的概率

export const jackpotProbabilityDefault = 0.004;
export const jackpotCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0, 0]; // 0,1,2个出现的概率
export const jackpotCountProbability3456 = [0, 0, 0, 1, 0, 0, 0]; // 3,4,5,6个出现的概率
//export const jackpotMutiple = [0, 0, 0, 10, 30, 50, 100]; // 当出现以上个数时，可以分jackpot的倍数

export const shootGameWeight = [0.3, 0.3, 0.25, 0.13, 0.017, 0.003];
export const shootGameResult = [0, 1, 2, 3, 5, 10];
export const wildProbabilitysOnFreeGame: number[] = [0.5, 0.1, 0.4];
