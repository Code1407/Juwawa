
import YummySlotScene from "./YummySlotScene";
import { ILineSame, IResults, gConst } from "../../interface/IYummySlot";
import { connectMultiples, bigWinMultiple, specailID, wildID, bonusID, linePaths, baseBet, specailCountProbability345, specailCountProbability012, jackpotID, scatterID, freeTimesDef, jackpotCountProbability, jackpotIncrRate, defaultRate } from "./YummySlotConfig";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import { ERateType } from "../../database/entity/SDKEntity";
import YummySlotPlayer, { IFreeRound } from "./YummySlotPlayer";
import { randomInt } from "crypto";
import { arraySum } from "../../interface/IGame";
import { getLogger } from "pinus";
let logger = getLogger(gConst.gameName, __filename);

export interface IGameRate extends IGameRateBase {
    rateType: ERateType;
    slot: number[][];
    free: number;
    jackpot: number;
    bonus: number;
    freeTimes: number[];
    freeCountProbability345: number[];
    bonusGameWeight: number[],
    bonusGameResult: number[],
    regenerateCount: number,
    regenerateRange: IRegenerateRange;
}

export interface IRegenerateRange {
    min: number;
    max: number;
}
function isExpect(multiple: number, expectMultiples: IRegenerateRange, lineCount: number) {
    return multiple >= expectMultiples.min && multiple <= expectMultiples.max * lineCount;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = defaultRate

    return JSON.parse(JSON.stringify(gameRateDefault));
}

const multipleJp = 425; // 200*0.45 + 400*0.4 + 1000*0.145 + 6000*0.005 = 425。收集到5次bonus，就会触发。所以，每轮出bonus时，价值为425/5倍。
const multipleFree = 425; // 随便给一个值
export default class YummySlotMachine extends MachineShiftBase<IGameRate> {
    constructor(protected scene: YummySlotScene, protected player: YummySlotPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple, multipleFree, multipleJp);
    }

    private generateResultsByRate(slotProbabilitys: number[][]): number[] {
        let results = [];

        for (let i = 0; i < 15; i++) {
            let result = rateRandomResult(slotProbabilitys[i % 5]);
            results.push(result);
        }

        // return [11, 11, 7, 6, 3, 3, 9, 11, 0, 8, 6, 0, 11, 11, 5];
        return results;
    }

    generateResults(roundId: number, betAmount: number, lineCount: number, lastResult: IResults): IResults {
        let balanceCount = 0;
        let isFreeRound: boolean = lastResult?.freeCount > 0;//是否已经在free中

        let gameRate: IGameRate = JSON.parse(JSON.stringify(this.getGameRate(betAmount)));
        let result = this.doGenerateResults(roundId, betAmount, lineCount, lastResult, gameRate);
        let freeRound: IFreeRound = this.player.freeRound;
        let multiple = freeRound ? freeRound.multiple : result.multiple;
        let revenue = betAmount * multiple;

        let isRegenerate = false;
        // isRegenerate = true;

        if (!isFreeRound && isRegenerate && result.freeCount <= 0 && result.multiple <= 0 && result.jackpotAmount <= 0 && result.bonusAmount <= 0) { //底层接口返回需要重随，并且没中奖。
            let totalMultiple = 0;
            gameRate.free = 0;
            gameRate.jackpot = 0;
            gameRate.bonus = 0;
            let newResult: IResults = null
            for (let i = 0; i < gameRate.regenerateCount; i++) {//有限次数下重随直到成功
                newResult = this.doGenerateResults(roundId, betAmount, lineCount, lastResult, gameRate);
                totalMultiple = newResult.multiple;
                //logger.warn(`slot regenerate: (totalMultiple = ${totalMultiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                if (isExpect(totalMultiple, gameRate.regenerateRange, lineCount)) {
                    result = newResult;
                    break;
                }
            }
        }
        //推翻超过平衡的free
        while (!isFreeRound && freeRound && this.balanceKill(betAmount, betAmount * lineCount, betAmount * multiple) == ERateType.kill) {
            logger.warn(`free kill: (freeCount = ${freeRound.roundResults.length}), (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
            gameRate.free = 1;
            gameRate.freeCountProbability345 = [0.8, 0.2, 0];
            gameRate.jackpot = 0;
            gameRate.bonus = 0;
            this.player.freeRound = null;
            result = this.doGenerateResults(roundId, betAmount, lineCount, lastResult, gameRate);
            if (balanceCount++ > 5) {
                logger.warn(`free kill fail: (freeCount = ${freeRound.roundResults.length}), (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                gameRate.free = 0;
                this.player.freeRound = null;
                result = this.doGenerateResults(roundId, betAmount, lineCount, lastResult, gameRate);
                break;
            }
            freeRound = this.player.freeRound;
            multiple = freeRound ? freeRound.multiple : result.multiple;
            revenue = betAmount * multiple;
        }

        multiple = result.multiple;
        revenue = betAmount * multiple + result.jackpotAmount + result.bonusAmount;
        //推翻超过平衡的jackpot或bonus
        while (!isFreeRound && this.balanceKill(betAmount, betAmount * lineCount, revenue) == ERateType.kill) {
            logger.warn(`kill: (multiple = ${multiple}), (jackpotAmount = ${result.jackpotAmount}), (bonusAmount = ${result.bonusAmount}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
            gameRate.free = 0;
            gameRate.jackpot = 0;
            gameRate.bonus = 0;
            this.player.freeRound = null;
            result = this.doGenerateResults(roundId, betAmount, lineCount, lastResult, gameRate);
            multiple = result.multiple;
            revenue = betAmount * multiple + result.jackpotAmount + result.bonusAmount;
            if (balanceCount++ > 5) {
                logger.warn(`kill fail: (multiple = ${multiple}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                break;
            }
        }
        if (!result.isFreeRound) {
            this.scene.IncrJackpotPool(betAmount * lineCount * jackpotIncrRate)
        }
        if (result.jackpotAmount) {
            this.scene.DecrJackpotPool(result.jackpotAmount);
            this.scene.saveJackpotPool();
        }

        return result;
    }

    resultsDev: number[] = null;

    doGenerateResults(roundId: number, betAmount: number, lineCount: number, lastResult: IResults, gameRate: IGameRate): IResults {
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
                results: [],
                roundId: roundId,
                bonus: [],
                bonusIndexs: [],
                betAmount: 0,
                lineCount: 0,
                targets: [],
                lineSames: [],
                multiples: [],
                multiple: 0,
                isFreeRound: false,
                freeWinAmount: 0,
                freeCount: 0,
                jackpotPoolValue: 0,
                jackpotAmount: 0,
                bonusAmount: 0,
                stopRound: false,
                timestamp: 0,
            };
        }
        else {
            thisResult = JSON.parse(JSON.stringify(lastResult));
            thisResult.jackpotAmount = 0;
            thisResult.bonusAmount = 0;
            thisResult.bonus = [];
            thisResult.bonusIndexs = [];
            thisResult.stopRound = false;
        }
        thisResult.betAmount = betAmount;
        thisResult.lineCount = lineCount;
        thisResult.results = this.generateResultsByRate(gameRate.slot);
        if (this.resultsDev?.length == 15) {
            thisResult.results = this.resultsDev;
            this.resultsDev = null;
        }
        thisResult.lineSames = []
        thisResult.isFreeRound = thisResult.freeCount > 0;
        thisResult.timestamp = Date.now();
        let FinishResult = () => {
            thisResult.lineSames.push(...this.lineSamesByResults(thisResult.results, linePaths, lineCount));
            thisResult.multiples = this.calculateMultiples(thisResult.results, linePaths, lineCount);
            thisResult.multiple = arraySum(thisResult.multiples);
            thisResult.targets = [];
            for (let i = 0; i < thisResult.lineSames.length; i++) {
                if (!thisResult.targets.includes(thisResult.lineSames[i].target))
                    thisResult.targets.push(thisResult.lineSames[i].target);
            }
        }
        if (thisResult.isFreeRound) {
            FinishResult();
            thisResult.freeCount--;
            thisResult.freeWinAmount += betAmount * thisResult.multiple;
            if (thisResult.freeFromRound == null) {
                console.warn("freeFromRound null");
            }
        }
        else {//normal局
            delete thisResult.freeFromRound;
            thisResult.jackpotPoolValue = this.scene.jackpotPool;
            thisResult.freeWinAmount = 0;
            let free = gameRate.free;
            let bonus = gameRate.bonus * lineCount / linePaths.length;
            let jackpot = gameRate.jackpot * lineCount / linePaths.length;
            if (Math.random() < free) {//中了free
                let freeIDCount = rateRandomResult(gameRate.freeCountProbability345)
                let lineIndex = this.insertSpecail(thisResult.results, linePaths, lineCount, scatterID, freeIDCount);
                thisResult.freeCount = gameRate.freeTimes[freeIDCount];
                thisResult.lineSames = [{
                    lineNum: lineIndex,
                    target: scatterID,
                    count: freeIDCount,
                }];
                thisResult.freeFromRound = roundId;
                this.player.freeRound = this.GetFreeRound(thisResult);
                this.player.freeRoundId = 0;
            }
            else if (Math.random() < bonus) {//中了bonus
                this.insertSpecail345(thisResult.results, linePaths, lineCount, bonusID)
                thisResult.bonusIndexs = DisarrayByWeight([0, 1, 2, 3, 4, 5], gameRate.bonusGameWeight);
                thisResult.bonus = [
                    gameRate.bonusGameResult[thisResult.bonusIndexs[0]],
                    gameRate.bonusGameResult[thisResult.bonusIndexs[1]],
                    gameRate.bonusGameResult[thisResult.bonusIndexs[2]],
                ]
                thisResult.bonusAmount = arraySum(thisResult.bonus) * betAmount;
            }
            else if (Math.random() < jackpot) {//中了jackpot
                thisResult.jackpotAmount = Math.round(this.scene.jackpotPool * betAmount * lineCount / linePaths.length / this.player.maxBetAmount);
                if (thisResult.jackpotAmount > 0) {
                    let lineIndex = this.insertSpecail(thisResult.results, linePaths, lineCount, jackpotID, 5);
                    thisResult.lineSames = [{
                        lineNum: lineIndex,
                        target: jackpotID,
                        count: 5,
                    }];
                }
            }
            else {//什么大奖都不中
                let specailIDArray = [
                    ...new Array<number>(rateRandomResult(specailCountProbability012)).fill(scatterID),
                    ...new Array<number>(rateRandomResult(specailCountProbability012)).fill(bonusID),
                    ...new Array<number>(rateRandomResult(jackpotCountProbability)).fill(jackpotID),
                ]
                let notConnectedIndex = this.findNotConnectedIndex(thisResult.results, linePaths, lineCount);
                Disarray(notConnectedIndex);
                Disarray(specailIDArray);
                for (let i = 0; i < Math.min(notConnectedIndex.length, specailIDArray.length); i++) {
                    thisResult.results[notConnectedIndex[i]] = specailIDArray[i];
                }
            }
            FinishResult();
        }
        return thisResult;
    }

    GetFreeRound(lastResult: IResults): IFreeRound {
        let freeResult: IResults = JSON.parse(JSON.stringify(lastResult));
        //freeResult.freeCount--;
        //在拳击那边无论是normal局还是free局，在generateResults方法最后都要freeCount--，就使得中奖free时还得先freeCount+1
        //而此处还未走到generateResults方法最后，就要开始预算下一局来制作预制菜，所以需要立刻执行一次freeCount--
        //yummy这里做了优化，仅在free局中才会freeCount--，所以将其注释
        let freeRound: IFreeRound = { betAmount: freeResult.betAmount, multiple: 0, roundResults: [] };
        do {
            freeResult = this.generateResults(lastResult.freeFromRound, freeResult.betAmount, lastResult.lineCount, freeResult);
            freeRound.multiple += freeResult.multiple;
            freeRound.roundResults.push(freeResult);
        } while (freeResult.freeCount > 0)

        return freeRound;
    }
    getProbability(nums: number[]): number {
        const len = nums.length;
        let sum = nums.reduce((sum, e) => sum + e);
        let section = 0;
        const randomNum = Math.random();
        for (let index = 0; index < len; index++) {
            if (randomNum >= section && randomNum < section + (nums[index] / sum)) {
                return index;
            }
            else {
                section += (nums[index] / sum);
            }
        }
    }

    private lineSamesByResults(results: number[], linePaths: number[][], lineCount: number): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < Math.min(linePaths.length, lineCount); i++) {
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

    private calculateMultiples(results: number[], linePaths: number[][], lineCount: number): number[] {
        let multiples = [];
        for (let i = 0; i < Math.min(linePaths.length, lineCount); i++) {
            let linePath = linePaths[i];
            let target = this.findLineTarget(results, linePath);
            let multiple = 0;
            if (target > -1) {
                let targetIndexs = this.getLineTargetIndexs(results, linePath, target);
                multiple = connectMultiples[target][targetIndexs.length] / baseBet;
            }
            multiples.push(multiple);
        }
        return multiples;
    }

    findLineTarget(results: number[], linePath: number[]): number {
        return results[linePath[0] - 1];
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
            if (wildID == id || id == target) {
                indexs.push(linePath[i] - 1);
            }
            else {
                break;
            }
        }
        return indexs;
    }

    findAllConnectedIndex(results: number[], linePaths: number[][], lineCount: number): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < Math.min(linePaths.length, lineCount); i++) {
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

    findNotConnectedIndex(results: number[], linePaths: number[][], lineCount: number): number[] {
        let indexs: number[] = [];
        for (let i = 0; i < results.length; i++) {
            indexs.push(i);
        }
        let allConnectedIndex = this.findAllConnectedIndex(results, linePaths, lineCount);
        for (let i = 0; i < allConnectedIndex.length; i++) {
            indexs.splice(indexs.indexOf(allConnectedIndex[i]), 1);
        }
        return indexs;
    }

    insertSpecail345(results: number[], linePaths: number[][], lineCount: number, id: number) {
        let iconNum = rateRandomResult(specailCountProbability345);
        let notConnectedIndex = this.findNotConnectedIndex(results, linePaths, lineCount);
        Disarray(notConnectedIndex);
        iconNum = Math.min(notConnectedIndex.length, iconNum);
        for (let i = 0; i < iconNum; i++) {
            results[notConnectedIndex[i]] = id;
        }
    }

    insertSpecail(results: number[], linePaths: number[][], lineCount: number, id: number, count: number) {
        let lineIndex = randomInt(0, Math.min(linePaths.length, lineCount));
        let path = linePaths[lineIndex];
        for (let i = 0; i < count; i++) {
            results[path[i] - 1] = id;
        }
        return lineIndex;
    }
}

export function rateRandom(probability: number[], errorBegin: number, errorEnd: number): number {
    if (probability.length == 1)
        return 0
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

export function DisarrayByWeight<T>(arry: T[], weight: number[]) {
    let exValue: T = null;
    let exIndex: number = 0;
    let wIndex: number = 0;
    let w1: number[] = JSON.parse(JSON.stringify(weight));
    for (let i = 0; i < arry.length; i++) {
        wIndex = rateRandomResult(w1)
        exIndex = wIndex + i;
        exValue = arry[exIndex];
        if (exValue == null) {
            console.log("error exIndex", exIndex, "i", i);
        }
        arry[exIndex] = arry[i];
        arry[i] = exValue;
        w1.splice(wIndex, 1);
    }
    return arry
}

export function GetResultRevenue(result: IResults) {
    return Math.round((result.betAmount * result.multiple) + result.jackpotAmount + result.bonusAmount);
}