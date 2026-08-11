

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

    [1, 12, 13, 14, 5],
];

export const slotProbabilitysDefault = [
    [0.03, 0.04, 0.06, 0.1, 0.15, 0.2, 0.2, 0.2, 0.22, 0.22, 0.22, 0, 0, 0, 0],
    [0.03, 0.04, 0.07, 0.08, 0.08, 0.15, 0.17, 0.17, 0.2, 0.2, 0.2, 0.15, 0.03, 0, 0],
    [0.03, 0.04, 0.07, 0.08, 0.08, 0.15, 0.2, 0.2, 0.2, 0.2, 0.2, 0.13, 0.02, 0, 0],
    [0.03, 0.04, 0.07, 0.1, 0.1, 0.17, 0.2, 0.2, 0.2, 0.2, 0.2, 0.08, 0.01, 0, 0],
    [0.03, 0.05, 0.07, 0.1, 0.13, 0.2, 0.2, 0.2, 0.22, 0.22, 0.22, 0, 0, 0, 0],
];

export const connectMultiples: number[][] = [
    [0, 0, 1, 7, 20, 30],
    [0, 0, 0, 6, 15, 24],
    [0, 0, 0, 5, 12, 20],
    [0, 0, 0, 4, 9, 16],
    [0, 0, 0, 3, 7, 14],
    [0, 0, 0, 2, 6, 12],
    [0, 0, 0, 2, 4, 9],
    [0, 0, 0, 2, 4, 9],
    [0, 0, 0, 1, 2, 6],
    [0, 0, 0, 1, 2, 6],
    [0, 0, 0, 1, 2, 6],
];

export let specailID = [11, 12, 13, 14];

export let wildx2ID = 11;
export let wildx3ID = 12;
export let wildID = [11, 12];
export let freeGameID = 13;
export let superGameID = 14;

export let freeSlotIndex = [
    [0, 5, 10],
    [2, 7, 12],
    [4, 9, 14],
]

export const jackpotPoolMultiple = [200, 400, 1000, 6000];
export const lineCount = linePaths.length;

export const bigWinMultiple = 100;

export const freeGameProDef = 1 / 20; //进入免费游戏的概率
export const freeCount012ProDef = [0.5, 0.5, 0.5, 0, 0, 0]; // 0,1,2个图标出现的概率
export const freeCount345ProDef = [0, 0, 0, 0.9, 0, 0]; // 3,4,5个图标出现的概率
export const freeTimeDef = 7; // 获得的免费次数
export const incrFreeTimeProDef = 0.44; // 有概率增加免费进度
export const freeTimesDef = [1, 2, 3]; // 进度满后增加的免费次数
export const freeTimesProDef = [0.25, 0.5, 0.25]; // 对应免费次数的权重

export const superGameProDef = 0; //进入superGame的概率
export const superCount012ProDef = [0, 0, 0, 0, 0, 0]; // 0,1,2个图标出现的概率
export const superCount345ProDef = [0, 0, 0, 0, 0, 0]; // 3,4,5个图标出现的概率
export const superTimeDef = 7; // 获得的免费次数
export const incrSuperTimeProDef = 0.44; // 有概率增加进度
export const incrSuperTimeAwardDef = [1, 2, 3]; // 增加多少进度
export const incrSuperTimeAwardProDef = [0.25, 0.5, 0.25]; // 增加进度的概率
export const superTimesDef = [1, 2, 3]; // 进度满后增加的免费次数
export const superTimesProDef = [0.25, 0.5, 0.25]; // 对应免费次数的权重

export const jackpotProDef = 1 / 40; // 直接获得jackpot的几率
export const jackpotProgressProDef = 1 / 20; // 获得jackpot进度的几率

export const jackpotRateDef = 0.05;//从押注抽取奖金

export const jackpotWinWeightDef = [0.45, 0.4, 0.145, 0.005]//获奖概率