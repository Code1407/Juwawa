import { randomInt } from "crypto";
import { ERateType } from "../../database/entity/SDKEntity";
import { arraySum, get2ArrAverage } from "../../interface/IGame";
import { gConst, ILineSame, IResults } from "../../interface/IFightSlot";
import {
    bigWinMultiple, connectMultiples, freeCount012ProDef, freeGameID, freeGameProDef, freeSlotIndex, freeTimeDef, freeTimesDef, freeTimesProDef,
    incrFreeTimeProDef, jackpotProDef, jackpotProgressProDef, jackpotRateDef, jackpotWinWeightDef, linePaths,
    slotProbabilitysDefault, specailID, wildID, wildx2ID, wildx3ID, lineCount, superGameProDef, superGameID, superTimeDef, incrSuperTimeProDef, incrSuperTimeAwardDef, incrSuperTimeAwardProDef, superTimesDef, superTimesProDef,
    jackpotPoolMultiple
} from "./FightSlotConfig";
import FightSlotScene from "./FightSlotScene";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import FightSlotPlayer, { IFreeRound } from "./FightSlotPlayer";
import { getLogger } from "pinus";
let logger = getLogger(gConst.gameName, __filename);

export interface IGameRate extends IGameRateBase {
    rateType: ERateType;
    slot: number[][];
    free: number;
    jackpot: number;
    jackpotBar: number;
    jackpotRate: number;
    jackpotWinPro: number[];
    freeBar: number;
    freeTimes: number[];
    freeTimesWeights: number[];
    super: number;
    superBar: number;
    incrSuperTimeAward: number[];
    incrSuperTimeAwardWeights: number[];
    superTimes: number[];
    superTimesWeights: number[];
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        slot: slotProbabilitysDefault,
        free: freeGameProDef,
        jackpot: jackpotProDef,
        jackpotBar: jackpotProgressProDef,
        jackpotRate: jackpotRateDef,
        jackpotWinPro: jackpotWinWeightDef,
        freeBar: incrFreeTimeProDef,
        freeTimes: freeTimesDef,
        freeTimesWeights: freeTimesProDef,
        super: superGameProDef,
        superBar: incrSuperTimeProDef,
        incrSuperTimeAward: incrSuperTimeAwardDef,
        incrSuperTimeAwardWeights: incrSuperTimeAwardProDef,
        superTimes: superTimesDef,
        superTimesWeights: superTimesProDef,
    }

    return JSON.parse(JSON.stringify(gameRateDefault));
}

const multipleJp = get2ArrAverage(jackpotPoolMultiple, jackpotWinWeightDef); // 200*0.45 + 400*0.4 + 1000*0.145 + 6000*0.005 = 425。
const multipleFree = lineCount * 20; // 随便给一个值 todo ......

export class FightSlotMachine extends MachineShiftBase<IGameRate> {
    constructor(protected scene: FightSlotScene, protected player: FightSlotPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple, multipleFree, multipleJp);
    }

    private generateResultsByRate(slotProbabilitys: number[][]): number[] {
        let results = [];

        for (let i = 0; i < 15; i++) {
            let result = rateRandomResult(slotProbabilitys[i % 5]);
            results.push(result);
        }

        return results;
    }

    GetFreeRound(lastResult: IResults): IFreeRound {
        let freeResult: IResults = JSON.parse(JSON.stringify(lastResult));
        freeResult.freeCount--;
        let freeRound: IFreeRound = { betAmount: freeResult.betAmount, multiple: 0, roundResults: [] };
        do {
            freeResult = this.generateResults(freeResult.betAmount, freeResult);
            freeRound.multiple += freeResult.multiple;
            freeRound.roundResults.push(freeResult);
        } while (freeResult.freeCount > 0)

        return freeRound;
    }

    resultsDev: number[] = null;

    generateResults(betAmount: number, lastResult: IResults): IResults {
        let balanceCount = 0;
        let lastInFree: boolean = lastResult ? lastResult.freeCount > 0 : false;

        let forceRateType = null;
        if (lastInFree) forceRateType = this.getLastRoundRateType();
        let gameRate: IGameRate = this.getGameRate(betAmount);

        //上一局的百搭
        let lastWildx2Indexs: number[] = [];
        let lastWildx3Indexs: number[] = [];
        if (lastInFree) {            
            lastWildx2Indexs = this.findTargets(lastResult.results, wildx2ID);
            lastWildx3Indexs = this.findTargets(lastResult.results, wildx3ID);
            let wildCount = lastWildx2Indexs.length + lastWildx3Indexs.length;

            let rateharvest = 0;
            if (wildCount >= 5) rateharvest = 0.8;
            else if (wildCount >= 4) rateharvest = 0.6;
            else if (wildCount >= 3) rateharvest = 0.4;
            else if (wildCount >= 2) rateharvest = 0.3;

            let reduce = 1;
            if (lastResult.freeCountMax >= 12) reduce = 0.3;
            else if (lastResult.freeCountMax >= 11) reduce = 0.5;
            else if (lastResult.freeCountMax >= 10) reduce = 0.6;
            else if (lastResult.freeCountMax >= 9) reduce = 0.7;
            gameRate.freeBar = gameRate.freeBar * reduce;

            let freeTimesWeights = gameRate.freeTimesWeights;
            if (lastResult.freeCountMax >= 12) freeTimesWeights = [1, 0, 0];
            else if (lastResult.freeCountMax >= 11) freeTimesWeights = [0.8, 0.2, 0];
            else if (lastResult.freeCountMax >= 10) freeTimesWeights = [0.65, 0.3, 0.05];
            else if (lastResult.freeCountMax >= 9) freeTimesWeights = [0.6, 0.3, 0.1];
            gameRate.freeTimesWeights = freeTimesWeights;
        }

        let result = this.doGenerateResults(betAmount, lastResult, gameRate);
        let freeRound: IFreeRound = this.player.freeRound;
        let multiple = freeRound ? freeRound.multiple : result.multiple;
        let revenue = betAmount * multiple;
        let betTotal = betAmount * lineCount;
        if (!lastInFree && freeRound) {
            while (freeRound && this.balanceKill(betAmount, betTotal, revenue) == ERateType.kill) {
                logger.warn(`free kill: (freeCount = ${freeRound.roundResults.length}), (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                gameRate.free = 1;
                gameRate.freeBar = gameRate.freeBar / 2;
                gameRate.jackpot = 0;
                gameRate.jackpotBar = 0;
                this.player.freeRound = null;
                this.player.freeRoundId = 0;
                lastResult.freeCount = 0;
                lastResult.freeCountMax = 0;
                result.freeCount = 0;
                result.freeCountMax = 0;
                if (balanceCount++ > 5) {
                    logger.warn(`free kill fail: (freeCount = ${freeRound.roundResults.length}), (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                    gameRate.free = 0;
                    result = this.doGenerateResults(betAmount, lastResult, gameRate);
                    break;
                }
                result = this.doGenerateResults(betAmount, lastResult, gameRate);
                freeRound = this.player.freeRound;
                multiple = freeRound ? freeRound.multiple : result.multiple;
                revenue = betAmount * multiple;
            }
        }

        // jp 如果被推翻，则降低一点
        revenue = betAmount * multiple + result.jackpotAmount;
        if (result.jackpotAmount && this.balanceKill(betAmount, betTotal, revenue) == ERateType.kill) {
            logger.warn(`jp kill: (multiple = ${multiple}), (jp = ${result.jackpotAmount}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
            result.jackpotWinIndex = rateRandomResult([2, 1]);
            result.jackpotAmount = this.scene.jackpotAmountPool.getPoolAmount(betAmount, result.jackpotWinIndex);
        }

        multiple = result.multiple;
        revenue = betAmount * multiple + result.jackpotAmount; // 前面推翻free时，不考虑jp。这次推翻整体时，要考虑jp。
        while (!lastInFree && this.balanceKill(betAmount, betTotal, revenue) == ERateType.kill) {
            logger.warn(`kill: (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
            gameRate.free = 0;
            gameRate.jackpot = 0;
            gameRate.jackpotBar = 0;
            this.player.freeRound = null;
            result = this.doGenerateResults(betAmount, lastResult, gameRate);
            multiple = result.multiple;
            revenue = betAmount * multiple + result.jackpotAmount;
            balanceCount++;
            if (balanceCount > 5) {
                logger.warn(`kill fail: (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                break;
            }
        }

        return result;
    }

    doGenerateResults(betAmount: number, lastResult: IResults, gameRate: IGameRate): IResults {
        let thisResult: IResults;

        if (this.player.freeRound != null && this.player.freeRoundId < this.player.freeRound.roundResults.length) {
            thisResult = this.player.freeRound.roundResults[this.player.freeRoundId];
            this.player.freeRoundId++;
            if (this.player.freeRoundId >= this.player.freeRound.roundResults.length) {
                this.player.freeRound = null;
                this.player.freeRoundId = 0;
            }
            return thisResult;
        }

        if (lastResult == null) {
            thisResult = {
                betAmount: 0,
                results: [],
                lineSames: [],
                multiple: 0,
                multiples: [],
                superResults: [],
                isFreeRound: false,
                isSuperRound: false,
                freeWinAmount: 0,
                freeCount: 0,
                freeCountMax: 0,
                progressOfFree: 0,
                progressOfJackpot: {},
                jackpotAmount: 0,
                jackpotWinIndex: -1,
            };
        }
        else {
            thisResult = JSON.parse(JSON.stringify(lastResult));
            thisResult.jackpotAmount = 0;
            thisResult.jackpotWinIndex = -1;
        }

        thisResult.isFreeRound = thisResult.isSuperRound = false;
        if (thisResult.freeCount > 0) {
            if (thisResult.superResults.length > 0) {
                thisResult.isSuperRound = true;
                thisResult.results = [];
            }
            else
                thisResult.isFreeRound = true;
        }
        else {
            thisResult.superResults = [];
        }

        if (!thisResult.isSuperRound)
            thisResult.results = this.generateResultsByRate(gameRate.slot);

        if (this.resultsDev != null) {
            thisResult.results = this.resultsDev;
            this.resultsDev = null;
        }

        let freeGame = Math.random() < gameRate.free;
        let superGame = Math.random() < gameRate.super;

        if (thisResult.progressOfJackpot == null)
            thisResult.progressOfJackpot = {};
        if (thisResult.progressOfJackpot[betAmount] == null) {
            thisResult.progressOfJackpot[betAmount] = 0;
        }

        if (!thisResult.isFreeRound && !thisResult.isSuperRound) {//normal状态

            thisResult.betAmount = betAmount;

            let wildx2Indexs = this.findTargets(thisResult.results, wildx2ID);
            let wildx3Indexs = this.findTargets(thisResult.results, wildx3ID);

            if (wildx2Indexs.length + wildx3Indexs.length > 0) {//可能中jackpot
                let jackpotProgress = false;
                let jackpot = false;
                /*
                for (let tryCount = 0; tryCount < wildx2Indexs.length + wildx3Indexs.length; tryCount++) {
                    if (Math.random() < gameRate.jackpotBar) {
                        jackpotProgress = true;
                        break;
                    }
                }
                */

                jackpot = Math.random() < gameRate.jackpot;
                jackpotProgress = Math.random() < gameRate.jackpotBar;  // 原生概率

                if (jackpot) {
                    thisResult.progressOfJackpot[betAmount] = 5;
                }
                else if (jackpotProgress) {
                    thisResult.progressOfJackpot[betAmount]++;
                }
                if (thisResult.progressOfJackpot[betAmount] >= 5) {//中jackpot
                    thisResult.progressOfJackpot[betAmount] = 0;
                    let poolIndex = rateRandomResult(gameRate.jackpotWinPro);
                    thisResult.jackpotWinIndex = poolIndex;
                    thisResult.jackpotAmount = this.scene.jackpotAmountPool.getPoolAmount(betAmount, poolIndex);
                }
            }

            if (thisResult.jackpotAmount == 0) {//不中jackpot

                if (freeGame) {//中freeGame
                    thisResult.results[freeSlotIndex[0][rateRandomResult([1, 1, 1])]] = freeGameID;
                    thisResult.results[freeSlotIndex[1][rateRandomResult([1, 1, 1])]] = freeGameID;
                    thisResult.results[freeSlotIndex[2][rateRandomResult([1, 1, 1])]] = freeGameID;
                    thisResult.freeCount = freeTimeDef + 1; // 为了下面的代码：本局减1。
                    thisResult.freeCountMax = freeTimeDef;
                    this.player.freeRound = this.GetFreeRound(thisResult);
                    this.player.freeRoundId = 0;
                }
                else if (superGame) {//中superGame
                    thisResult.superResults = [{
                        lockIds: {},
                        results: [],
                        lineSames: [],
                        multiples: []
                    }];
                    thisResult.results[freeSlotIndex[0][rateRandomResult([1, 1, 1])]] = freeGameID;
                    thisResult.results[freeSlotIndex[1][rateRandomResult([1, 1, 1])]] = freeGameID;
                    thisResult.results[freeSlotIndex[2][rateRandomResult([1, 1, 1])]] = superGameID;
                    thisResult.freeCount = superTimeDef + 1; // 为了下面的代码：本局减1。
                    thisResult.freeCountMax = superTimeDef;
                    this.player.freeRound = this.GetFreeRound(thisResult);
                    this.player.freeRoundId = 0;
                }
                else {//什么都不中
                    let freeTargetCount = rateRandomResult(freeCount012ProDef);
                    let notConnectedIndex = this.findNotConnectedIndex(thisResult.results).filter((index) => index % 5 == 0 || index % 5 == 2 || index % 5 == 4);
                    Disarray(notConnectedIndex);
                    let clown: number[] = [];
                    let notConnectedFreeIndex: number[] = [];
                    for (let i = 0; i < notConnectedIndex.length; i++) {
                        if (!clown.includes(notConnectedIndex[i] % 5)) {
                            clown.push(notConnectedIndex[i] % 5);
                            notConnectedFreeIndex.push(notConnectedIndex[i]);
                        }
                    }
                    for (let i = 0; i < freeTargetCount && i < notConnectedFreeIndex.length; i++) {
                        thisResult.results[notConnectedFreeIndex[i]] = freeGameID;
                    }
                }
            }
        }
        else {//freeGame状态

            if (thisResult.isFreeRound) {
                //留下上一局的百搭
                let lastWildx2Indexs: number[] = [];
                let lastWildx3Indexs: number[] = [];

                lastWildx2Indexs = this.findTargets(lastResult.results, wildx2ID);
                lastWildx3Indexs = this.findTargets(lastResult.results, wildx3ID);

                for (let i = 0; i < lastWildx2Indexs.length; i++) {
                    thisResult.results[lastWildx2Indexs[i]] = wildx2ID;//将x2覆盖到结果中
                }
                for (let i = 0; i < lastWildx3Indexs.length; i++) {
                    thisResult.results[lastWildx3Indexs[i]] = wildx3ID;//将x3覆盖到结果中
                }

                let incrFreeTime = Math.random() < gameRate.freeBar;
                if (incrFreeTime) {//获得铃铛
                    if (thisResult.progressOfFree == null)
                        thisResult.progressOfFree = 0;
                    let notConnectedIndex = this.findNotConnectedIndex(thisResult.results).filter(
                        (index) =>
                            (index % 5 == 0 || index % 5 == 2 || index % 5 == 4) &&//筛选出1、3、5列
                            !lastWildx2Indexs.includes(index) &&//不能覆盖百搭
                            !lastWildx3Indexs.includes(index)//不能覆盖百搭
                    );
                    if (notConnectedIndex.length > 0) {
                        Disarray(notConnectedIndex);
                        thisResult.results[notConnectedIndex[0]] = freeGameID;
                        thisResult.progressOfFree++;
                        if (thisResult.progressOfFree >= 3) {//集满
                            thisResult.progressOfFree -= 3;
                            let incr = gameRate.freeTimes[rateRandomResult(gameRate.freeTimesWeights)];
                            thisResult.freeCount += incr;
                            thisResult.freeCountMax += incr;
                        }
                    }
                }
            }
            else if (thisResult.isSuperRound) {//super game状态
                for (let i = 0; i < thisResult.superResults.length - 1; i++) {
                    let superResult = thisResult.superResults[i];
                    superResult.results = this.generateResultsByRate(gameRate.slot);
                    for (let i in superResult.lockIds) {
                        superResult.results[i] = superResult.lockIds[i];
                    }
                }
                let superResult = thisResult.superResults[thisResult.superResults.length - 1];
                superResult.results = this.generateResultsByRate(gameRate.slot);
                for (let i in superResult.lockIds) {
                    superResult.results[i] = superResult.lockIds[i];
                }
                //留下上一局的百搭
                let lastWildx2Indexs = this.findTargets(lastResult.superResults[lastResult.superResults.length - 1].results, wildx2ID);
                let lastWildx3Indexs = this.findTargets(lastResult.superResults[lastResult.superResults.length - 1].results, wildx3ID);

                for (let i = 0; i < lastWildx2Indexs.length; i++) {
                    superResult.results[lastWildx2Indexs[i]] = wildx2ID;//将x2覆盖到结果中
                }
                for (let i = 0; i < lastWildx3Indexs.length; i++) {
                    superResult.results[lastWildx3Indexs[i]] = wildx3ID;//将x3覆盖到结果中
                }

                //记住本局的百搭
                let thisWildx2Indexs = this.findTargets(superResult.results, wildx2ID);
                let thisWildx3Indexs = this.findTargets(superResult.results, wildx3ID);

                for (let i = 0; i < thisWildx2Indexs.length; i++) {//锁定的index
                    superResult.lockIds[thisWildx2Indexs[i]] = wildx2ID;
                }
                for (let i = 0; i < thisWildx3Indexs.length; i++) {//锁定的index
                    superResult.lockIds[thisWildx3Indexs[i]] = wildx3ID;
                }

                let incrSuperTime = Math.random() < gameRate.superBar && thisResult.superResults.length < 3;
                if (incrSuperTime) {//获得铃铛
                    if (thisResult.progressOfFree == null)
                        thisResult.progressOfFree = 0;
                    let progressIncr = gameRate.incrSuperTimeAward[rateRandomResult(gameRate.incrSuperTimeAwardWeights)];
                    let notConnectedIndex = this.findNotConnectedIndex(superResult.results).filter(
                        (index) =>
                            (index % 5 == 0 || index % 5 == 2 || index % 5 == 4) &&//筛选出1、3、5列
                            !thisWildx2Indexs.includes(index) &&//不能覆盖百搭
                            !thisWildx3Indexs.includes(index)//不能覆盖百搭
                    );

                    if (notConnectedIndex.length > 0) {
                        Disarray(notConnectedIndex);
                        let col = [0, 0, 0, 0, 0];
                        notConnectedIndex = notConnectedIndex.filter((index) => col[index % 5]++ < 1)//为了使两个铃铛不在同一列出现
                        progressIncr = Math.min(progressIncr, notConnectedIndex.length, 3 - thisResult.progressOfFree)
                        for (let i = 0; i < progressIncr; i++) {
                            superResult.results[notConnectedIndex[i]] = freeGameID;
                        }
                        thisResult.progressOfFree += progressIncr;
                        if (progressIncr != superResult.results.filter((e) => e == 13).length) {
                            console.log(progressIncr, JSON.stringify(superResult.results));
                        }
                        if (thisResult.progressOfFree >= 3) {//集满
                            thisResult.progressOfFree -= 3;

                            let incr = gameRate.superTimes[rateRandomResult(gameRate.superTimesWeights)];
                            thisResult.freeCount += incr;
                            thisResult.freeCountMax += incr;
                            thisResult.superResults.push({//增加一个slot面板
                                lockIds: JSON.parse(JSON.stringify(superResult.lockIds)),
                                results: [],
                                lineSames: [],
                                multiples: []
                            });
                        }
                    }
                }
            }
        }
        if (thisResult.freeCount > 0)
            thisResult.freeCount--;

        let superMultiple = 0
        for (let i in thisResult.superResults) {
            let superResult = thisResult.superResults[i];
            superResult.lineSames = this.lineSamesByResults(superResult.results);
            superResult.multiples = this.calculateMultiples(superResult.results);
            superMultiple += arraySum(superResult.multiples);
        }

        thisResult.lineSames = this.lineSamesByResults(thisResult.results);
        thisResult.multiples = this.calculateMultiples(thisResult.results);
        thisResult.multiple = arraySum(thisResult.multiples) + superMultiple;

        let winAmount = betAmount * thisResult.multiple;
        if (thisResult.isFreeRound || thisResult.isSuperRound)
            thisResult.freeWinAmount += winAmount;

        return thisResult;
    }

    private lineSamesByResults(results: number[]): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = this.findLineTarget(results, linePath)
            if (target > -1) {
                let count = this.getLineTargetIndexs(results, linePath, target).length;
                if (connectMultiples[target][count] > 0) {
                    lineSames.push({ lineNum: i, target: target, count: count });
                }
            }
        }
        return lineSames;
    }

    private calculateMultiples(results: number[]): number[] {
        let multiples = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = this.findLineTarget(results, linePath);
            let multiple = 0;
            if (target > -1) {
                let targetIndexs = this.getLineTargetIndexs(results, linePath, target);
                multiple = connectMultiples[target][targetIndexs.length];
                if (multiple > 0) {
                    let wildx2Indexs = this.findTargetsInLine(results, linePath, wildx2ID, targetIndexs.length);
                    let wildx3Indexs = this.findTargetsInLine(results, linePath, wildx3ID, targetIndexs.length);
                    let extraMulti = wildx2Indexs.length * 2 + wildx3Indexs.length * 3;
                    if (extraMulti > 0)
                        multiple *= extraMulti;
                }
            }
            multiples.push(multiple);
        }
        return multiples;
    }

    findLineTarget(results: number[], linePath: number[]): number {
        let target = -1;
        for (let i = 0; i < linePath.length; i++) {
            let id = results[linePath[i] - 1];
            if (!specailID.includes(id)) {
                target = id;
                break;
            }
        }
        return target;
    }

    getLineTargetIndexs(results: number[], linePath: number[], target: number): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < linePath.length; i++) {
            let id = results[linePath[i] - 1];
            if (wildID.includes(id) || id == target) {
                indexs.push(linePath[i] - 1);
            }
            else {
                break;
            }
        }
        return indexs;
    }

    findAllConnectedIndex(results: number[]): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = this.findLineTarget(results, linePath);
            if (target > -1) {
                let targetIndexs = this.getLineTargetIndexs(results, linePath, target);
                if (connectMultiples[target][targetIndexs.length] > 0) {
                    for (let j = 0; j < targetIndexs.length; j++) {
                        if (!indexs.includes(targetIndexs[j]))
                            indexs.push(targetIndexs[j]);
                    }
                }
            }
        }
        return indexs;
    }

    findNotConnectedIndex(results: number[]): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < results.length; i++) {
            indexs.push(i);
        }
        let allConnectedIndex = this.findAllConnectedIndex(results);
        for (let i = 0; i < allConnectedIndex.length; i++) {
            indexs.splice(indexs.indexOf(allConnectedIndex[i]), 1);
        }
        return indexs;
    }

    private findTargets(results: number[], target: number): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < results.length; i++) {
            if (results[i] == target)
                indexs.push(i);
        }
        return indexs;
    }

    private findTargetsInLine(results: number[], linePath: number[], target: number, maxLength: number): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < linePath.length && i < maxLength; i++) {
            if (results[linePath[i] - 1] == target)
                indexs.push(linePath[i] - 1);
        }
        return indexs;
    }
}

export function rateRandom(probability: number[], errorBegin: number, errorEnd: number): number {
    let rate = 0;
    let probabilitySum = arraySum(probability);
    let random = Math.random();
    for (let i = 0; i < probability.length; ++i) {
        if (random < (rate += (probability[i] / probabilitySum)))
            return i;
    };
    console.error("rateResult error");
    return randomInt(errorBegin, errorEnd + 1);
}

export function rateRandomResult(probability: number[]): number {
    return rateRandom(probability, 0, 6);
}

export function Disarray<T>(arry: T[]) {
    let exValue: T = null;
    let exIndex: number = 0;
    for (let i = 0; i < arry.length; i++) {
        exIndex = randomInt(i, arry.length);
        exValue = arry[exIndex];
        arry[exIndex] = arry[i];
        arry[i] = exValue;
    }
}