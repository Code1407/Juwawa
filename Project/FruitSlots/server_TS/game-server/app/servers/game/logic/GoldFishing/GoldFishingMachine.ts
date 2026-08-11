import { randomInt } from "crypto";
import { EEntityType, EPropType, IEntityInfo, IShootResult, gConst } from "../../interface/IGoldFishing";
import { getLogger } from "pinus";
import { ETradeCode } from "../../interface/IGame";
import { EntityData, capture_rate, entityDatas, entityTypeToPropType, } from "./GoldFishingConfig";
import GoldFishingScene from "./GoldFishingScene";
import { ERateType } from "../../database/entity/SDKEntity";
import { GoldFishingRoom } from "./GoldFishingRoom";
import { MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import { GoldFishingPlayer } from "./GoldFishingPlayer";
let logger = getLogger(gConst.gameName, __filename);


export interface INormalShootResult {
    shootResult: IShootResult,
}

export interface ILaserShootResult {
    shootResult: IShootResult,
    freeBullet: number,
}
export interface IFishSkillResult {
    betAmount: number,
    shootResults: IShootResult[],
}

export function WeightToIndex(weights: number[]): number {
    let weightSum = 0;
    let weightSums: number[] = [];
    for (let i = 0; i < weights.length; i++) {
        weightSum += weights[i];
        weightSums.push(weightSum);
    }
    let ran = Math.random() * weightSum;
    for (let i = 0; i < weights.length; i++) {
        if ((i > 0 ? weightSums[i - 1] : 0) <= ran && ran < weightSums[i]) {
            return i;
        }
    }
}

export function Avg(arry: number[]): number {
    if (arry.length < 1)
        return 0;
    let sum = 0;
    arry.forEach(element => {
        sum += element;
    });
    return sum / arry.length;
}
export function GetIndexArray(length: number): number[] {
    let arry: number[] = [];
    for (let i = 0; i < length; i++) {
        arry.push(i);
    }
    return arry;
}
export function Disarray(arry: number[]) {
    let exValue: number = 0;
    let exIndex: number = 0;
    for (let i = 0; i < arry.length; i++) {
        exIndex = randomInt(i, arry.length);
        exValue = arry[exIndex];
        arry[exIndex] = arry[i];
        arry[i] = exValue;
    }
}

export function BetweenInt(include: number, value: number, exclude: number): boolean {
    return value >= include && value < exclude;
}
export function RandomFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
}
interface IGame4Player {
    /**激光暴击率*/
    LaserComboPro: number;
    /**激光暴击连击数*/
    LaserComboWeight: number[];
    /**激光暴击连击数*/
    LaserComboCount: number[];
    /**虎克弹连击数*/
    HookCombo: number;
}
export const Game4Player: IGame4Player = {
    LaserComboPro: 1 / 10,
    LaserComboWeight: [0.4, 0.3, 0.2, 0.05, 0.05],
    LaserComboCount: [10, 30, 50, 100, 200],
    HookCombo: 5,
}
export const playerProBlance: number = 1;

export interface IGameRate {
    rateType: ERateType;
    capture_rate: number;
    jp?: number;
    success?: number;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        capture_rate: capture_rate,
    }

    return JSON.parse(JSON.stringify(gameRateDefault));
}

export class GoldFishingMachine
    extends MachineShiftBase<IGameRate>
{
    constructor(scene: GoldFishingScene, player: GoldFishingPlayer, private room: GoldFishingRoom) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate);
    }

    fishSkillInfo: { [propType: number]: { [roundId: number]: { endTime: number, betAmount: number, totalHit: number, maxHit: number } } } = {}

    fishSkillDuration: { [propType: number]: number } = {
        [EPropType.skill_drill]: 15 * 1000,
        [EPropType.skill_laser]: 8 * 1000,
        [EPropType.skill_bomb]: 3.5 * 1000,
        [EPropType.skill_blackhole]: 7 * 1000,
        [EPropType.skill_thunder]: 5 * 1000,
        [EPropType.boss_401]: 6 * 1000,
        [EPropType.boss_402]: 6 * 1000,
        [EPropType.boss_403]: 6 * 1000,
    };

    TrySetSkill(betAmount: number, roundId: number, entityType: EEntityType, maxHit: number) {
        if (entityTypeToPropType[entityType] != null) {
            let propType = entityTypeToPropType[entityType];
            if (this.fishSkillInfo[propType] == null) {
                this.fishSkillInfo[propType] = {};
            }
            //+ this.fishSkillDuration[propType]
            this.fishSkillInfo[propType][roundId] = { endTime: Date.now() + this.fishSkillDuration[propType], betAmount: betAmount, totalHit: 0, maxHit: maxHit };
            if (entityType < EEntityType.fish501) {
                let comboHit = -1;
                switch (propType) {
                    case EPropType.boss_401: comboHit = 30; break
                    case EPropType.boss_402: comboHit = 40; break
                    case EPropType.boss_403: comboHit = 50; break
                }
                let loopCount = maxHit / comboHit;
                this.fishSkillInfo[propType][roundId].endTime += loopCount * 2500;
            }
            setTimeout(() => {//一分钟后释放内存
                if (this.fishSkillInfo[propType][roundId] != null) {
                    delete this.fishSkillInfo[propType][roundId];
                }
            }, 60000);
        }
    }

    NormalShootEntity(amount: number, entityId: number): INormalShootResult {
        let result: INormalShootResult = {
            shootResult: null,
        };

        let entity = this.room.FindEntities([entityId])[0];

        if (entity != null) {
            let shootResult = this.ShootEntity(amount, entity);
            if (shootResult.killEntity) {
                this.room.DestroyEntity(amount, entity);
            }
            shootResult.revenue = amount * shootResult.rewardMulti;
            result.shootResult = shootResult;
        }
        else {
            // logger.warn("entity not found", "entityId", entityId);
        }

        if (entity != null && result.shootResult == null) {
            // logger.warn("NormalShoot", "shootResults.length < 1");
        }

        return result;
    }

    LaserShootEntity(amount: number, entityId: number): ILaserShootResult {
        let result: ILaserShootResult = {
            shootResult: null,
            freeBullet: 0,
        };

        let entity = this.room.FindEntities([entityId])[0];

        if (entity != null) {
            let shootResult = this.ShootEntity(amount, entity);
            if (shootResult.killEntity) {
                this.room.DestroyEntity(amount, entity);
            }
            shootResult.revenue = amount * shootResult.rewardMulti;
            result.shootResult = shootResult;
        }
        else {
            // logger.warn("entity not found", "entityId", entityId);
        }

        if (entity != null && result.shootResult == null) {
            // logger.warn("LaserShoot", "shootResults.length < 1");
        }

        return result;
    }

    FishSkillAttackEntity(propType: EPropType, fromRound: number, fishIdArray: number[]) {
        let betAmount = this.fishSkillInfo[propType][fromRound].betAmount;//对应的档位金额
        let totalHit = this.fishSkillInfo[propType][fromRound].totalHit;//累计进行了多少次攻击
        let maxHit = this.fishSkillInfo[propType][fromRound].maxHit;//获取攻击次数上限
        let result: IFishSkillResult = {
            betAmount: betAmount,
            shootResults: []
        }

        let gameRate: IGameRate = this.getGameRate(betAmount);
        let limit = maxHit - totalHit;//剩余攻击次数
        let limitFishIdArray: number[] = [];
        for (let i = 0; i < Math.min(limit, fishIdArray.length); i++) {
            limitFishIdArray.push(fishIdArray[i]);
        }
        this.fishSkillInfo[propType][fromRound].totalHit += limitFishIdArray.length;//计入累计

        if (this.fishSkillInfo[propType][fromRound].totalHit >= maxHit) {
            delete this.fishSkillInfo[propType][fromRound];
        }

        result.shootResults = this.MultiShootEntities(betAmount, limitFishIdArray)

        if (result.shootResults.length < 1) {
            let toLog = ["shootResults.length < 1", "SkillAttackEntity", EPropType[propType], "limitFishIdArray", limitFishIdArray.join(`\n`),];
            logger.warn(toLog.join(`\n`));
        }

        return result;
    }

    MultiShootEntities(amount: number, fishIdArray: number[]): IShootResult[] {
        let entities = this.room.FindEntities(fishIdArray);

        let shootResults: IShootResult[] = [];

        entities.forEach(entity => {
            let shootResult = this.ShootEntity(amount, entity);
            if (shootResult.killEntity) {
                this.room.DestroyEntity(amount, entity);
            }
            shootResult.revenue = amount * shootResult.rewardMulti;
            shootResults.push(shootResult);
        });

        return shootResults;
    }

    ShootEntity(betAmount: number, entity: IEntityInfo): IShootResult {
        let shootResult: IShootResult = {
            entity: {
                InsId: entity.InsId,
                type: entity.type,
            },
            killEntity: false,
            rewardMulti: 0,
            revenue: 0,
            freeBullet: 0,
        };
        let entityData: EntityData = entityDatas[entity.type];
        if (entityData == null) {
            logger.error(`unkown entity ${entity.type}`)
            return shootResult;
        }

        let gameRate: IGameRate = this.getGameRate(betAmount);

        let expectedMulti = this.GetRewardMulti(entityData, shootResult, gameRate);
        let expectedRevenue = betAmount * expectedMulti;
        let rateType = this.balanceKill(betAmount, betAmount, expectedRevenue);
        if (rateType == ERateType.kill) {
            shootResult.killEntity = false;
            shootResult.revenue = 0;
            shootResult.rewardMulti = 0;
            shootResult.freeBullet = 0;
            this.setLastRoundRateType(ERateType.kill);
        }

        return shootResult;
    }

    GetRewardMulti(entityData: EntityData, shootResult: IShootResult, gameRate: IGameRate): number {
        let expectedMulti = 0;

        let killIndex = -1;
        let winIndex = -1;
        if (entityData.killMultiple != null) {//可以被杀死获奖
            killIndex = entityData.killMultipleWeight != null ?
                WeightToIndex(entityData.killMultipleWeight) :
                randomInt(0, entityData.killMultiple.length);
        }
        if (entityData.winMultiple != null) {//可以不杀死获奖
            winIndex = entityData.winMultipleWeight != null ?
                WeightToIndex(entityData.winMultipleWeight) :
                randomInt(0, entityData.winMultiple.length);
        }
        if (entityData.freeBulle != null) {//可获得免费子弹
            let index = entityData.freeBulleWeight != null ?
                WeightToIndex(entityData.freeBulleWeight) :
                randomInt(0, entityData.freeBulle.length);
            shootResult.freeBullet = entityData.freeBulle[index];
            expectedMulti += shootResult.freeBullet;
        }
        if (killIndex > -1 && winIndex > -1) {
            let winOrKill = WeightToIndex(entityData.winOrKill);
            if (winOrKill == 1)
                winIndex = -1;
            else
                killIndex = -1;
        }
        if (killIndex > -1) {
            if (Math.random() < entityData.killPro * gameRate.capture_rate || 1 / entityData.killPro < gameRate.success) {
                shootResult.rewardMulti += entityData.killMultiple[killIndex];
                expectedMulti += shootResult.rewardMulti;
                shootResult.killEntity = true;
            }
        }
        if (winIndex > -1) {
            if (Math.random() < entityData.winPro * gameRate.capture_rate || 1 / entityData.winPro < gameRate.success) {
                shootResult.rewardMulti += entityData.winMultiple[winIndex];
                expectedMulti += shootResult.rewardMulti;
            }
        }

        return expectedMulti;
    }
}