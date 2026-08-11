import { IResults, ILineSame, gConst } from "../../interface/IFootballSlot";
import {
    bigWinMultiple, connectMultiples, freeCountProbability012, freeCountProbability345, freeProbabilityDefault, jackpotCountProbability012, jackpotCountProbability3456,
    jackpotProbabilityDefault, killCount, lineCount, linePaths, regenerateCount, regenerateRange, shootGameResult, shootGameWeight, slotProbabilitysDefault, wildProbabilitysOnFreeGame
} from "./FootballSlotConfig";
import { randomInt } from "crypto";
import { arraySum } from "../../interface/IGame";
import { FootballSlotScene } from "./FootballSlotScene";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import { FootballSlotPlayer } from "./FootballSlotPlayer";
import { ERateType } from "../../database/entity/SDKEntity";

import { getLogger } from "pinus";
let logger = getLogger(gConst.gameName, __filename);

export interface IRegenerateRange {
    min: number;
    max: number;
}

export interface IGameRate extends IGameRateBase {
    slot: number[][];
    free: number;
    jackpot: number;
    shootGame: number[];
    wildOnFree: number[];
    regenerateCount: number;
    regenerateRange: IRegenerateRange;
}

export function defaultGameRate(): IGameRate {
    let gameRate: IGameRate = {
        rateType: ERateType.normal,
        slot: slotProbabilitysDefault,
        free: freeProbabilityDefault,
        jackpot: jackpotProbabilityDefault,
        shootGame: shootGameWeight,
        wildOnFree: wildProbabilitysOnFreeGame,
        regenerateCount: regenerateCount,
        regenerateRange: regenerateRange
    }
    return JSON.parse(JSON.stringify(gameRate));
}

export class FootballSlotMachine
    extends MachineShiftBase<IGameRate> {
    constructor(protected scene: FootballSlotScene, protected player: FootballSlotPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple);
    }

    private doGenerateResults(betAmount: number, isFreeGame: boolean, gameRate: IGameRate) {
        let thisResults: IResults = {
            wildOfFree: -1,
            betAmount: 0,
            results: [],
            lineSames: [],
            multiple: 0,
            multiples: [],
            freeCount: 0,
            shootGame: [],
            shootGameChance: 0,
            roundId: 0,
        }

        thisResults.betAmount = betAmount;
        let results = [];
        if (gameRate.rateType == ERateType.new_user) {
            results = this.generateResultsByNewUser(gameRate.mutiple);
        }
        if (results.length == 0) {
            results = this.generateResultsByRate(gameRate.slot);
            if (isFreeGame) {
                let wildOfFree = [1, 2, 3][rateRandomResult(gameRate.wildOnFree)];
                results[0 + wildOfFree] = 9;
                results[5 + wildOfFree] = 9;
                results[10 + wildOfFree] = 9;
                thisResults.wildOfFree = wildOfFree;
            }
        }
        thisResults.results = results;
        thisResults.lineSames = this.lineSamesByResults(thisResults.results);
        thisResults.multiples = this.calculateMultiples(thisResults.lineSames);
        thisResults.multiple = arraySum(thisResults.multiples);
        let connectedIndex = collectConnectedIndex(thisResults.lineSames);
        let notConnectedIndex = collectNotConnectedIndex(connectedIndex);

        let shootGameAward: number = 0;
        if (!isFreeGame && thisResults.multiple < bigWinMultiple) {
            let isWinJackpot = Math.random() < gameRate.jackpot;
            let jackpotCountProbability = isWinJackpot ? jackpotCountProbability3456 : jackpotCountProbability012;
            let jackpotIndexs = this.randomNotConnectedIndex(jackpotCountProbability, notConnectedIndex);
            let random = Math.random();
            let jackpotCount = jackpotIndexs.length < 3 ? jackpotIndexs.length : (random < 0.3 ? 4 : 3);
            let targetCount = this.findTargetCount(results, 10);
            for (let i = targetCount; i < jackpotCount; i++) results[jackpotIndexs[i]] = 10;
            if (jackpotCount > 2) {
                for (let i = 0; i < 5; i++) {
                    let _shootGameResult = shootGameResult[rateRandomResult(gameRate.shootGame)];
                    thisResults.shootGame.push(_shootGameResult);
                    shootGameAward += _shootGameResult;
                }
                thisResults.shootGameChance = 5;
            }
        }

        if (!isFreeGame && shootGameAward == 0 && thisResults.multiple < bigWinMultiple) {
            let isWinFree = Math.random() < gameRate.free;
            let notConnectedIndex_free: number[] = [];
            notConnectedIndex.forEach(element => {
                if (element % 5 != 0 && element % 5 != 4) notConnectedIndex_free.push(element);
            });
            let freeCountProbability = isWinFree ? freeCountProbability345 : freeCountProbability012;
            let freeIndexs = this.randomNotConnectedIndex(freeCountProbability, notConnectedIndex_free);
            let targetCount = this.findTargetCount(results, 11);
            for (let i = targetCount; i < freeIndexs.length; i++) results[freeIndexs[i]] = 11;
            if (isWinFree) thisResults.freeCount = 5;
        }

        return thisResults;
    }

    public generateResults(betAmount: number): IResults {
        let normalGameRate = this.getGameRate(betAmount);
        let results = this.doGenerateResults(betAmount, false, normalGameRate);
        let linesBetAmount = betAmount * lineCount;
        let shootGameAward = arraySum(results.shootGame) * linesBetAmount;
        let normalRevenue = betAmount * results.multiple + shootGameAward;

        if (normalGameRate.rateType == ERateType.water && results.freeCount <= 0 && normalRevenue <= 0) {
            normalGameRate.free = 0;
            for (let i = 0; i < normalGameRate.regenerateCount; i++) {
                //this.player.regenerateCount++; //跑数值时记录重随了多少次
                let regenerateResults = this.doGenerateResults(betAmount, false, normalGameRate);
                let regenerateShootGameAward = arraySum(regenerateResults.shootGame) * linesBetAmount;
                let regenerateRevenue = betAmount * regenerateResults.multiple + regenerateShootGameAward;
                if (this.isExpect(linesBetAmount, regenerateRevenue, normalGameRate.regenerateRange)) {
                    //this.player.regenerateWinCount++; //跑数值时记录重随中奖的次数
                    results = regenerateResults;
                    normalRevenue = regenerateRevenue;
                    break;
                }
            }
        }

        let isKillNormal = false;
        for (let i = 0; i < killCount; i++) {
            isKillNormal = this.balanceKill(betAmount, linesBetAmount, normalRevenue) == ERateType.kill;
            if (isKillNormal) {
                logger.warn(`slot kill: (multiple = ${results.multiple}),(jackpotAmount = ${shootGameAward}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                normalGameRate.jp = 0;
                normalGameRate.free = 0;
                results = this.doGenerateResults(betAmount, false, normalGameRate);
                shootGameAward = arraySum(results.shootGame) * linesBetAmount;
                normalRevenue = betAmount * results.multiple + shootGameAward;
            }
            else break;
        }
        if (isKillNormal) logger.warn(`slot kill fail: (multiple = ${results.multiple}),(jackpotAmount = ${shootGameAward}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);

        if (results.freeCount > 0) {
            let freeGameRate = this.getGameRate(betAmount);
            let totalFreeResults: IResults[] = [];
            let freeRevenue = 0;
            let isKillFree = false;
            freeGameRate.jp = 0;
            for (let i = 0; i <= killCount; i++) {
                totalFreeResults = this.getTotalFreeResults(betAmount, results.freeCount, freeGameRate);
                freeRevenue = this.calculateFreeRevenue(totalFreeResults);
                isKillFree = this.balanceKill(betAmount, linesBetAmount, freeRevenue) == ERateType.kill;
                if (isKillFree) logger.warn(`free kill: (freeCount = ${totalFreeResults.length}), (freeRevenue = ${freeRevenue}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                else break;
            }
            if (isKillFree) {
                logger.warn(`free kill all: (freeCount = ${totalFreeResults.length}), (freeRevenuet = ${freeRevenue}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                totalFreeResults = [];
                freeGameRate.free = 0;
                results = this.doGenerateResults(betAmount, false, freeGameRate);
            }

            if (totalFreeResults.length > 0) this.player.saveTotalFreeResults(totalFreeResults);
        }

        return results;
    }

    private generateResultsByRate(slotProbabilitys: number[][]): number[] {
        let results = [];

        for (let i = 0; i < 15; i++) {
            let result = rateRandomResult(slotProbabilitys[i % 5]);
            results.push(result);
        }

        return results;
    }

    private lineSamesByResults(results: number[]): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = 9;// results[linePath[0]];
            for (let j = 0; j < linePath.length; j++) {
                if (results[linePath[j]] != 9) {
                    target = results[linePath[j]];
                    break;
                }
            }
            if (target > 8)
                continue;
            let count = 1;
            for (let j = 1; j < linePath.length; j++) {
                let goods = results[linePath[j]];
                if (goods == 9 || goods == target) {
                    count++;
                } else {
                    break;
                }
            }
            if (count >= 3) {
                lineSames.push({ lineNum: i, target: target, count: count });
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

    private findTargetCount(arr: number[], target: number): number {
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == target) count++;
        }
        return count;
    }

    public getTotalFreeResults(betAmount: number, freeCount: number, gameRate: IGameRate): IResults[] {
        let totalResults: IResults[] = [];
        let totalFreeCount = freeCount;
        for (let i = 0; i < totalFreeCount; i++) {
            let results: IResults = this.doGenerateResults(betAmount, true, gameRate);
            freeCount--;
            results.freeCount = freeCount;
            totalResults.push(results);
        }
        return totalResults;
    }

    private isExpect(linesBetAmount: number, revenue: number, regenerateRange: IRegenerateRange) {
        return revenue > linesBetAmount * regenerateRange.min && revenue <= linesBetAmount * regenerateRange.max;
    }

    private calculateFreeRevenue(totalFreeResults: IResults[]): number {
        let freeRevenue = 0;
        for (let i = 0; i < totalFreeResults.length; i++) {
            let results = totalFreeResults[i];
            freeRevenue += results.betAmount * results.multiple;
        }
        return freeRevenue;
    }
}

export function collectConnectedIndex(lineSames: ILineSame[]): number[] {
    let connectedIndex: number[] = [];
    for (let i = 0; i < lineSames.length; i++) {
        let lineSame = lineSames[i];
        let linePath = linePaths[lineSame.lineNum];
        for (let j = 0; j < lineSame.count; j++) {
            let pathIndex = linePath[j];
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

export function ErrorLog(msg: any) {
    console.trace("[FootballSlot GameError:]" + msg);
}

export function getRandomNumInt(min: number, max: number): number {
    return randomInt(Math.round(min), Math.round(max + 1));
    var Range = max - min;
    var Rand = Math.random(); //获取[0-1)的随机数
    let numInt = (min + Math.round(Rand * Range)); //放大取整
    return numInt;
}

export function arrayIncludes(arr1: string[], arr2: string[]): boolean {
    return arr2.every(element => arr1.includes(element));
}

export function rateRandom(probability: number[], errorBegin: number, errorEnd: number): number {
    let rate = 0;
    let probabilitySum = arraySum(probability);
    let random = Math.random();
    for (let i = 0; i < probability.length; ++i) {
        if (random < (rate += (probability[i] / probabilitySum)))
            return i;
    };
    ErrorLog("rateResult error");
    return getRandomNumInt(errorBegin, errorEnd);
}

export function rateRandomResult(probability: number[]): number {
    return rateRandom(probability, 0, 6);
}

export function rateRandomDefault(probability: number[]): number {
    return rateRandom(probability, 0, probability.length - 1);
}