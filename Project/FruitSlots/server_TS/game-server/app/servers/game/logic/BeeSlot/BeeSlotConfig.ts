export const linePaths: number[][] = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],

    [1, 7, 3, 9, 5],
    [6, 12, 8, 14, 10],
    [11, 17, 13, 19, 15],
    [16, 22, 18, 24, 20],
    [6, 2, 8, 4, 10],

    [11, 7, 13, 9, 15],
    [16, 12, 18, 14, 20],
    [21, 17, 23, 19, 25],
    [1, 2, 8, 4, 5],
    [6, 7, 13, 9, 10],

    [11, 12, 18, 14, 15],
    [16, 17, 23, 19, 20],
    [6, 7, 3, 9, 10],
    [11, 12, 8, 14, 15],
    [16, 17, 13, 19, 20],

    [21, 22, 18, 24, 25],
    [1, 7, 13, 9, 5],
    [6, 12, 18, 14, 10],
    [11, 17, 23, 19, 15],
    [11, 7, 3, 9, 15],

    [16, 12, 8, 14, 20],
    [21, 17, 13, 19, 25],
    [1, 7, 13, 19, 25],
    [21, 17, 13, 9, 5],
    [1, 12, 3, 14, 5],

    [6, 17, 8, 19, 10],
    [11, 22, 13, 24, 15],
    [11, 2, 13, 4, 15],
    [16, 7, 18, 9, 20],
    [21, 12, 23, 14, 25],

    [1, 7, 8, 9, 5],
    [6, 12, 13, 14, 10],
    [11, 17, 18, 19, 15],
    [16, 22, 23, 24, 20],
    [6, 2, 3, 4, 10],

    [11, 7, 8, 9, 15],
    [16, 12, 13, 14, 20],
    [21, 17, 18, 19, 25],
    [1, 7, 8, 9, 15],
    [6, 12, 13, 14, 20],

    [11, 17, 18, 19, 25],
    [11, 7, 8, 9, 5],
    [16, 12, 13, 14, 10],
    [21, 17, 18, 19, 15],
    [1, 22, 3, 24, 5]
];

export const lineCount = 50;
export const bigWinMultiple = 10 * lineCount;
export const killCount = 5;
export const regenerateCount = 3;
export const regenerateRange = { min: 0, max: 30 };
export const jackpotPoolMultiples = [10, 20, 50, 300];//奖金池的倍数

export const slotProbabilitysDefault = [
    [0.01, 0.02, 0.05, 0.07, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0, 0, 0],
    [0.01, 0.02, 0.05, 0.07, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0, 0, 0],
    [0.01, 0.02, 0.05, 0.07, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0, 0, 0],
    [0.01, 0.02, 0.05, 0.07, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0, 0, 0],
    [0.01, 0.02, 0.05, 0.07, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0, 0, 0],
];//顺序：母蜜蜂、公蜜蜂、小蜜蜂、瓢虫、蝴蝶、A、K、Q、J、10、9、wild、蜜罐、大红花

export const connectMultiples: number[][] = [
    [0, 0, 0, 12, 50, 125],
    [0, 0, 0, 8, 30, 88],
    [0, 0, 0, 8, 30, 88],
    [0, 0, 0, 5, 25, 50],
    [0, 0, 0, 5, 25, 50],
    [0, 0, 0, 3, 20, 38],
    [0, 0, 0, 3, 20, 38],
    [0, 0, 0, 3, 20, 38],
    [0, 0, 0, 3, 20, 38],
    [0, 0, 0, 3, 20, 38],
    [0, 0, 0, 3, 20, 38],
];

//免费游戏数据
export const freeProbabilityDefault = 0.03;//触发免费游戏概率
export const freeCountProbability012 = [0.7, 0.2, 0.1, 0, 0, 0]; // 0,1,2个出现的概率
export const freeCountProbability345 = [0, 0, 0, 0.6, 0.3, 0.1]; // 3,4,5个出现的概率
export const freeTimes = [0, 0, 0, 8, 16, 24]; // 当出现以上个数时，有多少次 free game
export const freeGameWildMultiples = [2, 3, 5];//免费游戏时wild的倍率
export const freeGameWildProbability = [0.6, 0.35, 0.05];//免费游戏时wild的权重
//蜜罐数据
export const honeyJarProbabilityDefault = 0.304;//蜜罐出现概率
export const honeyJarPrizeDrawProbabilityDefault = 0.2;//蜜罐开奖的概率
export const honeyJarCountProbability = [0, 0.6, 0.289, 0.1, 0.01, 0.001];//蜜罐出现个数的权重
export const honeyJarMultiples = [0.1, 0.5, 1, 2, 5, 0];//蜜罐上的倍率
export const honeyJarMultipleProbability = [0.3, 0.31, 0.25, 0.1, 0.01, 0.03];//蜜罐上倍率的权重
export const honeyJarJackpotPoolIndexs = [0, 1, 2, 3];//蜜罐上对应的奖金池索引
export const honeyJarJackpotPoolProbability = [0.65, 0.34, 0.01, 0];//蜜罐上对应的奖金池索引的权重
//转盘数据
export const wheelJackpotPoolIndexs = [0, 1, 2, 3];//转盘上对应的奖金池索引
export const wheelJackpotPoolProbability = [0.65, 0.34, 0.01, 0];//转盘上对应的奖金池索引的权重