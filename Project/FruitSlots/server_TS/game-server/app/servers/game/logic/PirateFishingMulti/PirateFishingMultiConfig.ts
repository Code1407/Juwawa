import { EEntityType } from "../../interface/IPirateFishingMulti";

export const capture_rate = 0.97;

export const statusValueTiger = 1000;

export class WheelData {
    pro: number;
    multipleWeight: number[];
    multiple: number[];
}

export const wheelDatas_rate: { [index: number]: WheelData } = {
    // [0]: {
    //     pro: 0 / 40,
    //     multipleWeight: [0.5, 0.4, 0.1],
    //     multiple: [0.0001, 0, 0]
    // },
    [1]: {
        pro: 1 / 5000,
        multipleWeight: [0.45, 0.26, 0.15, 0.08, 0.05, 0.01],
        multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        // multipleWeight: [1, 1, 1, 1, 1, 1],
        // multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
    },
    [2]: {
        pro: 1 / 5000,
        multipleWeight: [0.45, 0.28, 0.155, 0.07, 0.04, 0.005],
        multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        // multipleWeight: [1, 1, 1, 1, 1, 1],
        // multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
    },
    [3]: {
        pro: 1 / 5000,
        multipleWeight: [0.45, 0.30, 0.16, 0.06, 0.03, 0.00],
        multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        // multipleWeight: [1, 1, 1, 1, 1, 1],
        // multiple: [0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
    },
    // [4]: {
    //     pro: 0 / 40,
    //     multipleWeight: [0.1, 0.4, 0.5],
    //     multiple: [1, 1, 1]
    // },
}

export let betToJackpotPool = 0.01;

export let rateBetToJackpotPool = [0.2, 1.8, 8];

export class EntityData {
    winOrKill?: number[];
    /**普通获奖概率*/
    winPro?: number;
    /**击杀获奖概率*/
    killPro?: number;
    /**普通获奖倍数权重*/
    winMultipleWeight?: number[];
    /**普通获奖倍数*/
    winMultiple?: number[];
    /**击杀获奖倍数权重*/
    killMultipleWeight?: number[];
    /**击杀获奖倍数*/
    killMultiple?: number[];
    /**具有“状态”可切换的数值*/
    statusData?: { [index: number]: EntityData };
}

// id:0-10小鱼 id:11-12爆金 id:13免费子弹 id:14范围爆炸 id:15-17老虎机 id:18幽灵船 id:19海盗王
// 有些设计是在数组中选一个结果，有些设计是把数组当作一个取值范围
export let entityDatas: { [idx: number]: EntityData } = {
    [EEntityType.fish0]: { killPro: 1 / 2, killMultiple: [2] },
    [EEntityType.fish1]: { killPro: 1 / 2, killMultiple: [2] },
    [EEntityType.fish2]: { killPro: 1 / 3, killMultiple: [3] },
    [EEntityType.fish3]: { killPro: 1 / 6, killMultiple: [6] },
    [EEntityType.fish4]: { killPro: 1 / 10, killMultiple: [10] },
    [EEntityType.fish5]: { killPro: 1 / 12, killMultiple: [12] },
    [EEntityType.fish6]: { killPro: 1 / 15, killMultiple: [15] },
    [EEntityType.fish7]: { killPro: 1 / 20, killMultiple: [20] },
    [EEntityType.fish8]: { killPro: 1 / 40, killMultiple: [40] },
    [EEntityType.fish9]: { killPro: 1 / 50, killMultiple: [50] },
    [EEntityType.fish10]: { killPro: 1 / 60, killMultiple: [60] },
    [EEntityType.turtle]: {
        winOrKill: [0.8, 0.2],
        winPro: 1 / 20,
        winMultiple: [20],
        killPro: 1 / 100,
        killMultiple: [100],
    },
    [EEntityType.monkey]: {
        winOrKill: [0.8, 0.2],
        winPro: 1 / 25,
        winMultiple: [25],
        killPro: 1 / 125,
        killMultiple: [125],
    },
    [EEntityType.bulletCrab]: {
        killPro: 1 / 60,
        killMultiple: [60],
    },
    [EEntityType.KnifeFish]: {
        killPro: 1 / 50,
        killMultiple: [50],
    },
    [EEntityType.slotCrab0]: {//螃蟹88
        winPro: 1 / 30,
        winMultipleWeight: [0.35, 0.4, 0.2, 0.05],
        winMultiple: [8, 28, 58, 88],//随机一个
    },
    [EEntityType.slotCrab1]: {//螃蟹1000
        winPro: 1 / 30,
        winMultipleWeight: [0.01, 0.01, 0.03, 0.14, 0.14, 0.14, 0.15, 0.16, 0.17, 0.03, 0.017, 0.003],
        winMultiple: [2, 4, 5, 6, 8, 10, 12, 15, 20, 300, 400, 1000],//随机一个
    },
    [EEntityType.slotCrab2]: {//螃蟹500
        winPro: 1 / 30,
        winMultipleWeight: [0.01, 0.02, 0.18, 0.2, 0.2, 0.15, 0.1, 0.1, 0.04],
        winMultiple: [1, 3, 5, 8, 10, 12, 15, 20, 500],//随机一个
    },
    [EEntityType.bossGhostShip]: {
        winPro: 1 / 160,
        winMultipleWeight: [0.5, 0.4, 0.1],
        winMultiple: [100, 200, 300],//取值范围
    },
    [EEntityType.bossPirateKing]: {
        winPro: 1 / 400,
        winMultipleWeight: [0.71, 0.26, 0.02, 0.01],
        winMultiple: [300, 600, 900, 1200],//取值范围
    },
    [EEntityType.bossTiger]: {
        statusData: {
            [0]: { winPro: 1 / 200, winMultiple: [200] },
            [1]: { winPro: 1 / 400, winMultiple: [400] },
            [2]: { winPro: 1 / 600, winMultiple: [600] },
            [3]: { winPro: 1 / 800, winMultiple: [800] },
            [4]: { winPro: 1 / 1000, winMultiple: [1000] },
        }
    }
}

export let EntityDelayTime = {
    [EEntityType.fish0]: 3.5,
    [EEntityType.fish1]: 3.5,
    [EEntityType.fish2]: 3.5,
    [EEntityType.fish3]: 3.5,
    [EEntityType.fish4]: 3.5,
    [EEntityType.fish5]: 3.5,
    [EEntityType.fish6]: 3.5,
    [EEntityType.fish7]: 3.5,
    [EEntityType.fish8]: 3.5,
    [EEntityType.fish9]: 3.5,
    [EEntityType.fish10]: 3.5,
    [EEntityType.turtle]: 3.5,
    [EEntityType.monkey]: 3.5,
    [EEntityType.bulletCrab]: 3.5,
    [EEntityType.KnifeFish]: 3.5,
    [EEntityType.slotCrab0]: 2,
    [EEntityType.slotCrab1]: 2,
    [EEntityType.slotCrab2]: 2,
    [EEntityType.bossGhostShip]: 3,
    [EEntityType.bossPirateKing]: 10,
    [EEntityType.bossTiger]: 1,
}

export let jackpotDelayTime = 8;