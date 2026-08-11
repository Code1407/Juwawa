import { ERateType } from "../../database/entity/SDKEntity";

export const freeTimesDef = [0, 0, 0, 5, 10, 20]; // 获得的免费次数
export const freeCountProbability012 = [16, 4, 1, 0, 0, 0]; // 0,1,2个出现的概率
export const jackpotCountProbability = [0.9, 0.7, 0.5, 0.3, 0.1, 0]; // 0,1,2个出现的概率
export const jackpotIncrRate = 0.02;

export const specailCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0]; // 0,1,2个出现的概率
export const specailCountProbability345 = [0, 0, 0, 0.6, 0.34, 0.05]; // 3,4,5个出现的概率

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
];
export let baseBet = 1;
/**基于投注baseBet的奖励数值表*/
export const connectMultiples = [
    [0, 0, 1, 5, 8, 10],
    [0, 0, 1, 10, 12, 15],
    [0, 0, 2, 15, 20, 30],
    [0, 0, 2, 18, 25, 40],
    [0, 0, 0, 25, 40, 60],
    [0, 0, 0, 30, 60, 150],
    [0, 0, 0, 40, 80, 200],
    [0, 0, 0, 50, 100, 300],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 100, 500, 1000],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
];

export let specailID = [8, 9, 10, 11];

export let scatterID = 8;

export let wildID = 9;

export let bonusID = 10;

export let jackpotID = 11

export const bigWinMultiple = 100;

export const normalHistoryLimit = 30;

export const specailHistoryLimit = 20;

//id: 0蓝莓、1橙子、2火龙果、3草莓、4蛋糕、5甜甜圈、6汉堡、7肉串、8free、9百搭、10bonus、11jackpot

export const defaultRate = {
    "rateType": ERateType.normal,
    "slot": [
        [20, 20, 16, 10, 8, 6, 4, 3, 0, 13],
        [20, 20, 16, 10, 8, 6, 4, 3, 0, 13],
        [20, 20, 18, 14, 10, 8, 4, 3, 0, 3],
        [16, 20, 18, 14, 10, 8, 7, 6, 0, 1],
        [16, 20, 18, 14, 10, 8, 7, 6, 0, 1]
    ],
    "free": 0.007,
    "jackpot": 0.005,
    "bonus": 0.007,
    "freeTimes": [0, 0, 0, 5, 10, 20],
    "freeCountProbability345": [0, 0, 0, 0.8, 0.18, 0.02],
    "bonusGameWeight": [0.3, 0.3, 0.25, 0.1, 0.045, 0.005],
    "bonusGameResult": [10, 15, 20, 30, 50, 500],
    "regenerateCount": 1,
    "regenerateRange": { "min": 1, "max": 5 }
}