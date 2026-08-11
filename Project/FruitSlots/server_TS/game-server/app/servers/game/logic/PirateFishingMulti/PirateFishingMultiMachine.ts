import { randomInt } from "crypto";
import { IEntityInfo, IOilDrumData, IShootResult, gConst, IFreeBulletData, EEntityType, ISlotResult, ISlotInfo, IWheelResult, EWeaponType } from "../../interface/IPirateFishingMulti";
import { getLogger } from "pinus";
import { ETradeCode } from "../../interface/IGame";
import { EntityData, WheelData, capture_rate, entityDatas, statusValueTiger, wheelDatas_rate } from "./PirateFishingMultiConfig";
import PirateFishingMultiScene from "./PirateFishingMultiScene";
import { ERateType } from "../../database/entity/SDKEntity";
import { PirateFishingMultiRoom } from "./PirateFishingMultiRoom";
import { MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import { PirateFishingMultiPlayer } from "./PirateFishingMultiPlayer";
let logger = getLogger(gConst.gameName, __filename);


export interface INormalShootResult {
    slotGet: number,
    shootResult: IShootResult,
    wheelResult?: IWheelResult,
}
export interface IHookShootResult {
    slotGet: number,
    realComboCount: number,
    shootResult: IShootResult,
    wheelResult?: IWheelResult,
}
export interface ILaserShootResult {
    slotGet: number,
    realComboCount: number,
    shootResults: IShootResult[],
    wheelResult?: IWheelResult,
}
export interface IOilDrumResult {
    betAmount: number,
    slotGet: number,
    shootResults: IShootResult[],
    wheelResult?: IWheelResult,
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
export const oilMaxFill = 3000;
export const bulletOfOil = 30;
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
    oil_max: number;
    wheelDatas: { [index: number]: WheelData };
    jp?: number;
    success?: number;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        capture_rate: capture_rate,
        oil_max: bulletOfOil,
        wheelDatas: wheelDatas_rate   
    }

    return JSON.parse(JSON.stringify(gameRateDefault));
}

export class PirateFishingMultiMachine
    extends MachineShiftBase<IGameRate>
{
    constructor(scene: PirateFishingMultiScene, player: PirateFishingMultiPlayer, private room: PirateFishingMultiRoom) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate);
    }

    IncrOil(betAmount: number, value: number, oilDrum: IOilDrumData): void {
        if (oilDrum[betAmount] == null) {
            oilDrum[betAmount] = { oilCurFill: 0, oilMaxFill: oilMaxFill, drumCount: 0 }
        }
        oilDrum[betAmount].oilCurFill += value;
        while (oilDrum[betAmount].oilCurFill > oilDrum[betAmount].oilMaxFill) {
            oilDrum[betAmount].oilCurFill -= oilDrum[betAmount].oilMaxFill;
            oilDrum[betAmount].drumCount++;
        }
    }

    IncrFreeBullet(betAmount: number, count: number, freeBulletData: IFreeBulletData): void {
        return;
        if (freeBulletData[betAmount] == null) {
            freeBulletData[betAmount] = 0;
        }
        freeBulletData[betAmount] += count;
    }

    TryUseFreeBullet(betAmount: number, count: number, freeBulletData: IFreeBulletData): boolean {
        if (freeBulletData[betAmount] == null) {
            return false;
        }
        if (freeBulletData[betAmount] < count) {
            return false;
        }
        freeBulletData[betAmount] -= count;
        return true;
    }

    TryUseOilDrum(betAmount: number, oilDrum: IOilDrumData): ETradeCode {
        if (oilDrum[betAmount] != null && oilDrum[betAmount].drumCount >= 1) {
            oilDrum[betAmount].drumCount--;
            return ETradeCode.success;
        }
        else {
            return ETradeCode.fail;
        }
    }

    NormalShootEntity(betAmountIndex: number, amount: number, entityId: number): INormalShootResult {
        let result: INormalShootResult = {
            slotGet: 0,
            shootResult: null,
        };

        let entity = this.room.FindEntities([entityId])[0];

        if (entity != null) {
            let shootResult = this.ShootEntity(betAmountIndex, amount, entity, EWeaponType.normal);
            if (shootResult.killEntity) {
                this.room.DestroyEntity(amount, entity);
            }
            shootResult.revenue = amount * shootResult.rewardMulti;
            if (shootResult.slotInfo != null)
                result.slotGet++;
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

    HookShootEntity(betAmountIndex: number, amount: number, entityId: number): IHookShootResult {

        let result: IHookShootResult = {
            slotGet: 0,
            realComboCount: 0,
            shootResult: null,
        };

        let entity = this.room.FindEntities([entityId])[0];

        if (entity != null) {

            for (let i = 0; i < Game4Player.HookCombo; i++) {
                let shootResult = this.ShootEntity(betAmountIndex, amount, entity, EWeaponType.hook);
                if (shootResult.killEntity) {
                    this.room.DestroyEntity(amount, entity);
                }
                shootResult.revenue = amount * shootResult.rewardMulti;
                result.realComboCount++;
                if (shootResult.revenue > 0 || shootResult.wheelResult != null || shootResult.slotInfo != null || i + 1 == Game4Player.HookCombo) {
                    if (shootResult.slotInfo != null)
                        result.slotGet++;
                    result.shootResult = shootResult;
                    break;
                }
            }

        }
        else {
            // logger.warn("entity not found", "entityId", entityId);
        }

        if (entity != null && result.shootResult == null) {
            // logger.warn("HookShoot", "shootResults.length < 1");
        }

        return result;
    }

    LaserShootEntity(betAmountIndex: number, amount: number, entityId: number, LaserComboCount: number): ILaserShootResult {
        let result: ILaserShootResult = {
            slotGet: 0,
            realComboCount: 0,
            shootResults: [],
        };

        let entity = this.room.FindEntities([entityId])[0];

        if (entity != null) {
            for (let i = 0; i < LaserComboCount; i++) {
                let shootResult = this.ShootEntity(betAmountIndex, amount, entity, EWeaponType.laser);
                if (shootResult.killEntity) {
                    this.room.DestroyEntity(amount, entity);
                }
                shootResult.revenue = amount * shootResult.rewardMulti;
                if (shootResult.revenue > 0 || shootResult.wheelResult != null || shootResult.slotInfo != null || i + 1 == LaserComboCount) {
                    if (shootResult.slotInfo != null)
                        result.slotGet++;
                    result.shootResults.push(shootResult);
                }
                result.realComboCount++;
                if (shootResult.killEntity || shootResult.wheelResult != null) {
                    break;
                }
            }

        }
        else {
            // logger.warn("entity not found", "entityId", entityId);
        }

        if (entity != null && result.shootResults == null) {
            // logger.warn("LaserShoot", "shootResults.length < 1");
        }

        return result;
    }

    OilDrumShootEntity(betAmountIndex: number, amount: number, fishIdArray: number[]): IOilDrumResult {
        let result: IOilDrumResult = {
            betAmount: amount,
            slotGet: 0,
            shootResults: []
        }

        let gameRate: IGameRate = this.getGameRate(betAmountIndex);
        let oilMax = gameRate.oil_max;

        let limitFishIdArray: number[] = [];
        for (let i = 0; i < Math.min(oilMax, fishIdArray.length); i++) {
            limitFishIdArray.push(fishIdArray[i]);
        }

        let shootResults = this.MultiShootEntities(betAmountIndex, amount, limitFishIdArray, EWeaponType.oilDrum)

        for (let shootResult of shootResults) {
            if (shootResult.slotInfo != null) {
                result.slotGet++;
            }
        }
        result.shootResults = shootResults

        if (result.shootResults.length < 1) {
            // logger.warn("OilDrumShoot", "shootResults.length < 1");
        }

        return result;
    }

    MultiShootEntities(betAmountIndex: number, amount: number, fishIdArray: number[], weapon: EWeaponType): IShootResult[] {
        let entities = this.room.FindEntities(fishIdArray);

        let KnifeFishKilled: IEntityInfo[] = [];

        let shootResults: IShootResult[] = [];

        entities.forEach(entity => {
            let shootResult = this.ShootEntity(betAmountIndex, amount, entity, weapon);
            if (shootResult.killEntity) {
                this.room.DestroyEntity(amount, entity);
                if (entity.type == EEntityType.KnifeFish)
                    KnifeFishKilled.push(entity);
            }
            shootResult.revenue = amount * shootResult.rewardMulti;
            shootResults.push(shootResult);
        });

        return shootResults;
    }

    ShootEntity(betAmountIndex: number, betAmount: number, entity: IEntityInfo, weapon: EWeaponType): IShootResult {
        let shootResult: IShootResult = {
            entity: {
                InsId: entity.InsId,
                type: entity.type,
            },
            killEntity: false,
            rewardMulti: 0,
            revenue: 0,
            freeChance: 0,
            slotInfo: null
        };
        let entityData: EntityData = entityDatas[entity.type];
        if (entityData == null) {
            logger.error(`unkown entity ${entity.type}`)
            return shootResult;
        }

        let gameRate: IGameRate = this.getGameRate(betAmount);
        let capture = gameRate.capture_rate;
        let wheelDatas = gameRate.wheelDatas;

        if (
            weapon != EWeaponType.oilDrum &&
            wheelDatas[betAmountIndex] != null &&
            (Math.random() < wheelDatas[betAmountIndex].pro || Math.random() < gameRate.jp) &&
            !this.room.wheelCd.IsCoolDown()
        ) {
            let winIndex = WeightToIndex(wheelDatas[betAmountIndex].multipleWeight);
            let rewardMulti = wheelDatas[betAmountIndex].multiple[winIndex];
            shootResult.wheelResult = {
                wheelType: entity.type,
                betAmount: betAmount,
                betAmountIndex: betAmountIndex,
                winIndex: winIndex,
                rewardMulti: rewardMulti
            }
            return shootResult;
        }


        switch (entity.type) {//处理螃蟹slot
            case EEntityType.slotCrab0:
            case EEntityType.slotCrab1:
            case EEntityType.slotCrab2:
                if (Math.random() < entityData.winPro * capture || 1 / entityData.winPro < gameRate.success)
                    shootResult.slotInfo = { betAmount: betAmount, slotType: entity.type };
                return shootResult;
            case EEntityType.bossTiger://老虎boss
                this.GetRewardMulti(entityData.statusData[this.room.tigerBossStatus], shootResult, gameRate);
                this.room.tigerBossTotalBet += betAmount;
                this.room.tigerBossStatus = Math.min(4, Math.floor(this.room.tigerBossTotalBet / statusValueTiger));
                shootResult.entity.status = this.room.tigerBossStatus;
                return shootResult;

        }

        this.GetRewardMulti(entityData, shootResult, gameRate);

        if (shootResult.rewardMulti > 0) {
            // id:0-10小鱼 id:11-12爆金 id:13免费子弹 id:14范围爆炸 id:15-17老虎机 id:18幽灵船 id:19海盗王
            if (entity.type == EEntityType.bulletCrab) {
                shootResult.freeChance = 30;
            }
        }

        let curRevenue = betAmount * shootResult.rewardMulti;
        let rateType = this.balanceKill(betAmount, betAmount, curRevenue);
        if (rateType == ERateType.kill) {
            shootResult.killEntity = false;
            shootResult.freeChance = 0;
            shootResult.revenue = 0;
            shootResult.rewardMulti = 0;
            shootResult.slotInfo = null;
            this.setLastRoundRateType(ERateType.kill);
        }

        return shootResult;
    }

    GetRewardMulti(entityData: EntityData, shootResult: IShootResult, gameRate: IGameRate) {
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
                shootResult.killEntity = true;
            }
        }
        if (winIndex > -1) {
            if (Math.random() < entityData.winPro * gameRate.capture_rate || 1 / entityData.winPro < gameRate.success) {
                shootResult.rewardMulti += entityData.winMultiple[winIndex];
            }
        }
    }

    GetSlotResult(slotInfo: ISlotInfo): ISlotResult {
        let result: ISlotResult = {
            slotType: slotInfo.slotType,
            revenue: 0,
            slot: [],
            rewardMulti: 0,
            uid: "",
            stackCount: 0,
            betAmount: slotInfo.betAmount
        }
        let entityData = entityDatas[slotInfo.slotType];
        let multipleIndex = WeightToIndex(entityData.winMultipleWeight);

        let betAmount = slotInfo.betAmount;
        let curRevenue = betAmount * result.rewardMulti;
        let rateType = this.balanceKill(betAmount, betAmount, curRevenue);
        if (rateType == ERateType.kill) {
            // 如果捕获了，推翻结果，包括客户端表现
            multipleIndex = 0;
            this.setLastRoundRateType(ERateType.kill);
        } else {
            this.setLastRoundRateType(ERateType.normal);
        }

        result.rewardMulti = entityData.winMultiple[multipleIndex]
        result.revenue = slotInfo.betAmount * result.rewardMulti;
        Disarray(slotMap[slotInfo.slotType][result.rewardMulti]);
        result.slot = slotMap[slotInfo.slotType][result.rewardMulti];
        return result;
    }
}


let slotMap = {
    [EEntityType.slotCrab0]: {
        [88]: [0, 0, 0],
        [58]: [1, 1, 1],
        [28]: [2, 2, 2],
        [8]: [0, 1, 2],
    },
    [EEntityType.slotCrab1]: {
        [1000]: [0, 3, 0],
        [400]: [0, 2, 0],
        [300]: [0, 1, 0],
        [20]: [4, 4, 4],
        [15]: [5, 5, 5],
        [12]: [6, 6, 6],
        [10]: [7, 7, 7],
        [8]: [4, 5, 6],
        [6]: [8, 8, 8],
        [5]: [9, 9, 9],
        [4]: [10, 10, 10],
        [2]: [8, 9, 10],
    },
    [EEntityType.slotCrab2]: {
        [500]: [0, 0, 0],
        [20]: [1, 1, 1],
        [15]: [2, 2, 2],
        [12]: [3, 3, 3],
        [10]: [1, 2, 3],
        [8]: [4, 4, 4],
        [5]: [5, 5, 5],
        [3]: [6, 6, 6],
        [1]: [4, 5, 6],
    },
}