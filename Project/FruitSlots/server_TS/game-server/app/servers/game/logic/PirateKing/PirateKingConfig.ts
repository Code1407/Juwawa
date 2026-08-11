

// 11种物品，3x5的展示框，20条检查路径

import { ILineSame } from "../../interface/IPirateKing";

export const slotProbabilitysDefault = [
    [0.14, 0.16, 0.18, 0.12, 0.1, 0.08, 0.07, 0.06, 0.05, 0.04],
    [0.11, 0.12, 0.14, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.03, 0.15],
    [0.13, 0.15, 0.17, 0.11, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.1],
    [0.15, 0.16, 0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.05],
    [0.15, 0.16, 0.18, 0.12, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.05]
];

export const connectMultiples: number[][] = [
    [10, 20, 75],
    [10, 15, 50],
    [5, 15, 50],
    [15, 25, 75],
    [15, 25, 100],
    [20, 50, 100],
    [20, 50, 125],
    [25, 75, 125],
    [25, 75, 200],
    [25, 100, 300]
];


export const jackpotProbabilityDefault = 0.005;// 0.003; // 0.01;
export const jackpotCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0, 0]; // 0,1,2个出现的概率
export const jackpotCountProbability3456 = [0, 0, 0, 0.6, 0.34, 0.05, 0.01]; // 3,4,5,6个出现的概率
export const jackpotMutiple = [0, 0, 0, 10, 30, 50, 100]; // 当出现以上个数时，可以分jackpot的倍数

export const linePaths: number[][] = [
    [6, 7, 8, 9, 10],
    [1, 2, 3, 4, 5],
    [11, 12, 13, 14, 15],
    [1, 7, 13, 9, 5],

    [11, 7, 3, 9, 15],
    [6, 2, 3, 4, 10],
    [6, 12, 13, 14, 10],
    [1, 2, 8, 14, 15],

    [11, 12, 8, 4, 5],
    [6, 12, 8, 4, 10],
    [6, 2, 8, 14, 10],
    [1, 7, 8, 9, 5],

    [11, 7, 8, 9, 15],
    [1, 7, 3, 9, 5],
    [11, 7, 13, 9, 15],
    [6, 7, 3, 9, 10],

    [6, 7, 13, 9, 10],
    [1, 2, 13, 4, 5],
    [11, 12, 3, 14, 15],
    [1, 12, 13, 14, 5]
];
export const lineCount = linePaths.length;
export const bigWinMultiple = 65;

export function collectConnectedIndex(lineSames: ILineSame[]): number[] {
    let connectedIndex: number[] = [];
    for (let i = 0; i < lineSames.length; i++) {
        let lineSame = lineSames[i];
        let linePath = linePaths[lineSame.lineNum];
        for (let j = 0; j < lineSame.count; j++) {
            let pathIndex = linePath[j] - 1;
            if (!connectedIndex.includes(pathIndex)) connectedIndex.push(pathIndex);
        }
    }
    return connectedIndex;
}

export function collectNotConnectedIndex(connectedIndex: number[]): number[] {
    let fullIndex = [];
    for (let i = 0; i < 15; i++) fullIndex.push(i);
    return fullIndex.filter(diff => !connectedIndex.includes(diff));
}