import { ERateType } from "../../database/entity/SDKEntity";
import { IResults, ILineSame, rateRandomDefault, getRandomNumInt, 
    rateRandomResult, bigWinMultiple, linePaths, collectConnectedIndex, 
    collectNotConnectedIndex, 
    lineCount,
    gConst} from "../../interface/IFruitSlots";
import FruitSlotsScene from "./FruitSlotsScene";
import { arraySum } from "../../interface/IGame";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import FruitSlotsPlayer from "./FruitSlotsPlayer";

import { getLogger } from "pinus";
import { newUserRoundDefault } from "../GameBase/ShiftGame/ConfigShiftDefault";
let logger = getLogger(gConst.gameName, __filename);

const slotProbabilitysDefault = [
    [0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0],
    [0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4],
    [0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4],
    [0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1],
    [0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1]
];

const connectMultiples: number[][] = [
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
    [3, 4, 5],
    [3, 5, 10],
    [3, 5, 10],
    [5, 10, 20]
];

const freeProbabilityDefault = 0.01; // 0.02;
const freeCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0]; // 0,1,2个出现的概率
const freeCountProbability345 = [0, 0, 0, 0.6, 0.3, 0.1]; // 3,4,5个出现的概率
const freeTimes = [0, 0, 0, 5, 8, 12]; // 当出现以上个数时，有多少次 free game

const jackpotProbabilityDefault = 0.1; // 0.01;
const jackpotCountProbability012 = [0.5, 0.3, 0.2, 0, 0, 0]; // 0,1,2个出现的概率
const jackpotCountProbability345 = [0, 0, 0, 0.7, 0.3, 0]; // 3,4,5个出现的概率
const jackpotPercentage = [0, 0, 0, 0.05, 0.15, 0.5]; // 当出现以上个数时，可以分jackpot的比例
const jackpotPoolIncrRate = 0.02;
const minJackpotPoolAmount = 1 / jackpotPercentage[3]; // 至少要保证给到玩家的Jackpot要大于1。

interface IFruitSlotRate {
    slot: number[][];
    free: number;
}

export interface IGameRate extends IGameRateBase {
    rateType: ERateType;
    slot: number[][];
    free: number;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        slot: slotProbabilitysDefault,
        free: freeProbabilityDefault
    }

    return JSON.parse(JSON.stringify(gameRateDefault));
}

export class FruitSlotsMachine 
    extends MachineShiftBase<IGameRate> 
{
    constructor(protected scene: FruitSlotsScene, player: FruitSlotsPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple);
    }

    private generateResultsByRate(slotProbabilitys: number[][]): number[] {
        let results = [];

        for (let i = 0; i < 15; i++) {
            let result = rateRandomResult(slotProbabilitys[i%5]);
            results.push(result);
        }

        return results;
    }
    
    async generateResults(betAmount: number, jackpot: boolean, freeWinAmount: number, freeCount: number): Promise<IResults> {
        let gameRate = this.getGameRate(betAmount);

        let random = Math.random();
        let free = random < gameRate.free;

        let results = [];
        if (gameRate.rateType == ERateType.new_user) {
            results = this.generateResultsByNewUser(gameRate.mutiple);
        }

        if (results.length == 0) {
            results = this.generateResultsByRate(gameRate.slot);
        }

        let lineSames = this.lineSamesByResults(results);
        let multiples = this.calculateMultiples(lineSames);
        let multiple = arraySum(multiples);
    
        let connectedIndex = collectConnectedIndex(lineSames);
        let notConnectedIndex = collectNotConnectedIndex(connectedIndex, results);
    
        await this.scene.jackpotAmountPool.initJackpotPool();

        let jackpotPercentage = 0;
        let jackpotAmount = 0;
        if (multiple < bigWinMultiple) {
            let JackpotPoolAmount = this.scene.jackpotAmountPool.getPoolAmount(betAmount);
            if (freeCount == 0 && JackpotPoolAmount > minJackpotPoolAmount) {
                let jackpotCountProbability = jackpot ? jackpotCountProbability345: jackpotCountProbability012;
                let jackpotIndexs = this.randomNotConnectedIndex(jackpotCountProbability, notConnectedIndex);
                if (this.player.getBetDetail(betAmount).betCount < newUserRoundDefault) {
                    jackpotIndexs = jackpotIndexs.slice(0, 3);
                }
                jackpotPercentage = this.getJackpotPercentage(jackpotIndexs.length);
                jackpotAmount = Math.round(JackpotPoolAmount * jackpotPercentage)
                let targetCount = this.findTargetCount(results, 9);
                for (let i = targetCount; i < jackpotIndexs.length; i++) results[jackpotIndexs[i]] = 9;
                jackpotPercentage = this.getJackpotPercentage(jackpotIndexs.length);
                jackpotAmount = Math.round(JackpotPoolAmount * jackpotPercentage);
                this.scene.jackpotAmountPool.decreasePoolAmount(betAmount, jackpotAmount);
            }
            if (freeCount == 0 && jackpotAmount == 0) {
                let freeCountProbability = free ? freeCountProbability345 : freeCountProbability012;
                let freeIndexs = this.randomNotConnectedIndex(freeCountProbability, notConnectedIndex);
                if (this.player.getBetDetail(betAmount).betCount < newUserRoundDefault) {
                    freeIndexs = freeIndexs.slice(0, 3);
                }
                let targetCount = this.findTargetCount(results, 8);
                for (let i = targetCount; i < freeIndexs.length; i++) results[freeIndexs[i]] = 8;
                freeCount = this.getFreeTime(freeIndexs.length) + 1; // 为了下面的代码：本局减1。
            }
        }
        if (freeCount > 0) freeCount--;
        let winAmount = betAmount * multiple;
        this.scene.jackpotAmountPool.increasePoolAmount(betAmount, winAmount*jackpotPoolIncrRate);
        
        await this.scene.jackpotAmountPool.saveJackpotPool();

        return { 
            betAmount: betAmount,
            results: results, 
            lineSames: lineSames,
            multiple: multiple,
            multiples: multiples,
            freeWinAmount: freeWinAmount + winAmount,
            freeCount: freeCount,
            jackpotAmount: jackpotAmount,
            jackpotAmountPool: this.scene.jackpotAmountPool.getAllPool()
        };
    }

    private validRate(rate: IFruitSlotRate): boolean {
        if(!rate) return false;

        if (!rate.slot || rate.slot.length != 5) {
            logger.error(rate);
            return false;
        }
        for (let i = 0; i < rate.slot.length; i++) {
            if (rate.slot[i].length != 8) {
                logger.error(rate);
                return false;
            }
        }
        return true;
    }

    private lineSamesByResults(results: number[]): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = results[linePath[0]-1];
            let count = 1;
            for (let j = 1; j < linePath.length; j++) {
                let goods = results[linePath[j]- 1];
                if (goods == 7 || goods == target) {
                    count++;
                } else {
                    break;
                }
            }
            if (count >= 3) {
                lineSames.push({lineNum: i, target: target, count: count});
            }
        }
        return lineSames;
    }

    private calculateMultiples(lineSames: ILineSame[]): number[] {
        let multiples = [];
        for (let i = 0; i < lineSames.length; i++) {
            let lineSame = lineSames[i];
            let multiple = connectMultiples[lineSame.target][lineSame.count - 3];
            if (multiple > 0) multiples.push(multiple);
        }
        return multiples;
    }

    private randomNotConnectedIndex(probability: number[], notConnectedIndex: number[]): number[] {
        let indexs: number[] = []
        let count = rateRandomDefault(probability);
        count = Math.min(count, notConnectedIndex.length);
        for (let i = 0; i < count; i++) {
            let index = getRandomNumInt(0, notConnectedIndex.length - 1);
            indexs.push(notConnectedIndex[index]);
            notConnectedIndex.splice(index, 1);
        }
        return indexs;
    }

    private getFreeTime(count: number) {
        return count >= 0 && count < freeTimes.length ? freeTimes[count] : 0;
    }

    private getJackpotPercentage(count: number) {
        return count >= 0 && count < jackpotPercentage.length ? jackpotPercentage[count] : 0;
    }

    private findTargetCount(arr: number[], target: number): number {
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == target) count++;
        }
        return count;
    }
} 