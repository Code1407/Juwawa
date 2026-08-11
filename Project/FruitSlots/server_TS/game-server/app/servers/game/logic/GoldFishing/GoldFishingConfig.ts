import { ERoundType } from "../../database/entity/GoldFishingEntity";
import { EEntityType, EPropType } from "../../interface/IGoldFishing";

export const capture_rate = 0.97;

export const statusValueTiger = 1000;

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
    /**可获得免费子弹*/
    freeBulle?: number[];
    /**免费子弹的权重*/
    freeBulleWeight?: number[];
    /**具有“状态”可切换的数值*/
    statusData?: { [index: number]: EntityData };
}

export let entityTypeToPropType = {
    [EEntityType.fish501]: EPropType.skill_drill,
    [EEntityType.fish502]: EPropType.skill_laser,
    [EEntityType.fish503]: EPropType.skill_bomb,
    [EEntityType.fish504]: EPropType.skill_blackhole,
    [EEntityType.fish505]: EPropType.skill_thunder,
    [EEntityType.fish401]: EPropType.boss_401,
    [EEntityType.fish402]: EPropType.boss_402,
    [EEntityType.fish403]: EPropType.boss_403,
}

export let propTypeToRoundType = {
    [EPropType.skill_drill]: ERoundType.skill_drill,
    [EPropType.skill_laser]: ERoundType.skill_laser,
    [EPropType.skill_bomb]: ERoundType.skill_bomb,
    [EPropType.skill_blackhole]: ERoundType.skill_blackhole,
    [EPropType.skill_thunder]: ERoundType.skill_thunder,
    [EPropType.boss_401]: ERoundType.boss_401,
    [EPropType.boss_402]: ERoundType.boss_402,
    [EPropType.boss_403]: ERoundType.boss_403,
}

export let entityDatas: { [idx: number]: EntityData } = {
    [EEntityType.fish101]: { killPro: 1 / 2, killMultiple: [2] },//小鱼
    [EEntityType.fish102]: { killPro: 1 / 3, killMultiple: [3] },
    [EEntityType.fish103]: { killPro: 1 / 3, killMultiple: [3] },
    [EEntityType.fish104]: { killPro: 1 / 3, killMultiple: [3] },
    [EEntityType.fish105]: { killPro: 1 / 4, killMultiple: [4] },
    [EEntityType.fish106]: { killPro: 1 / 4, killMultiple: [4] },
    [EEntityType.fish107]: { killPro: 1 / 4, killMultiple: [4] },
    [EEntityType.fish108]: { killPro: 1 / 6, killMultiple: [6] },
    [EEntityType.fish109]: { killPro: 1 / 6, killMultiple: [6] },
    [EEntityType.fish110]: { killPro: 1 / 6, killMultiple: [6] },
    [EEntityType.fish111]: { killPro: 1 / 8, killMultiple: [8] },
    [EEntityType.fish112]: { killPro: 1 / 8, killMultiple: [8] },
    [EEntityType.fish113]: { killPro: 1 / 8, killMultiple: [8] },
    [EEntityType.fish114]: { killPro: 1 / 10, killMultiple: [10] },
    [EEntityType.fish115]: { killPro: 1 / 12, killMultiple: [12] },
    [EEntityType.fish201]: { killPro: 1 / 25, killMultiple: [25] },//中鱼
    [EEntityType.fish202]: { killPro: 1 / 30, killMultiple: [30] },
    [EEntityType.fish203]: { killPro: 1 / 35, killMultiple: [35] },
    [EEntityType.fish204]: { killPro: 1 / 40, killMultiple: [40] },
    [EEntityType.fish205]: { killPro: 1 / 45, killMultiple: [45] },
    [EEntityType.fish206]: { killPro: 1 / 50, killMultiple: [50] },
    [EEntityType.fish207]: { killPro: 1 / 66, killMultiple: [66] },
    [EEntityType.fish208]: { killPro: 1 / 88, killMultiple: [88] },
    [EEntityType.fish209]: { killPro: 1 / 55, killMultiple: [55] },
    [EEntityType.fish301]: { killPro: 1 / 100, killMultiple: [100] },//大鱼
    [EEntityType.fish302]: { killPro: 1 / 120, killMultiple: [120] },
    [EEntityType.fish303]: { killPro: 1 / 150, killMultiple: [150] },
    [EEntityType.fish304]: { killPro: 1 / 180, killMultiple: [180] },
    [EEntityType.fish305]: { killPro: 1 / 200, killMultiple: [200] },
    [EEntityType.fish401]: { killPro: 1 / 190, killMultiple: [100], freeBulle: [30, 60, 90, 120, 150], freeBulleWeight: [20, 20, 20, 20, 20] },//乌龟boss
    [EEntityType.fish402]: { killPro: 1 / 240, killMultiple: [120], freeBulle: [40, 80, 120, 160, 200], freeBulleWeight: [20, 20, 20, 20, 20] },//乌贼boss
    [EEntityType.fish403]: { killPro: 1 / 300, killMultiple: [150], freeBulle: [50, 100, 150, 200, 250], freeBulleWeight: [20, 20, 20, 20, 20] },//金龙boss
    [EEntityType.fish404]: { killPro: 1 / 180, killMultiple: [180] },//未使用
    [EEntityType.fish405]: { killPro: 1 / 200, killMultiple: [200] },//未使用
    [EEntityType.fish501]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//钻头鱼
    [EEntityType.fish502]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//激光鱼
    [EEntityType.fish503]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//炸弹鱼
    [EEntityType.fish504]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//未使用
    [EEntityType.fish505]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//闪电鱼
    [EEntityType.fish506]: { killPro: 1 / 100, killMultiple: [20], freeBulle: [80] },//未使用
}

export let EntityDelayTime = {
    [EEntityType.fish101]: 3.5,
    [EEntityType.fish102]: 3.5,
    [EEntityType.fish103]: 3.5,
    [EEntityType.fish104]: 3.5,
    [EEntityType.fish105]: 3.5,
    [EEntityType.fish106]: 3.5,
    [EEntityType.fish107]: 3.5,
    [EEntityType.fish108]: 3.5,
    [EEntityType.fish109]: 3.5,
    [EEntityType.fish110]: 3.5,
    [EEntityType.fish111]: 3.5,
    [EEntityType.fish112]: 3.5,
    [EEntityType.fish113]: 3.5,
    [EEntityType.fish114]: 3.5,
    [EEntityType.fish115]: 3.5,
    [EEntityType.fish201]: 3.5,
    [EEntityType.fish202]: 3.5,
    [EEntityType.fish203]: 3.5,
    [EEntityType.fish204]: 3.5,
    [EEntityType.fish205]: 3.5,
    [EEntityType.fish206]: 3.5,
    [EEntityType.fish207]: 3.5,
    [EEntityType.fish208]: 3.5,
    [EEntityType.fish209]: 3.5,
    [EEntityType.fish301]: 3.5,
    [EEntityType.fish302]: 3.5,
    [EEntityType.fish303]: 3.5,
    [EEntityType.fish304]: 3.5,
    [EEntityType.fish305]: 3.5,
    [EEntityType.fish401]: 3.5,
    [EEntityType.fish402]: 3.5,
    [EEntityType.fish403]: 3.5,
    [EEntityType.fish404]: 3.5,
    [EEntityType.fish405]: 3.5,
    [EEntityType.fish501]: 3.5,
    [EEntityType.fish502]: 3.5,
    [EEntityType.fish503]: 3.5,
    [EEntityType.fish504]: 3.5,
    [EEntityType.fish505]: 3.5,
    [EEntityType.fish506]: 3.5,
}