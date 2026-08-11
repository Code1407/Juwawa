import { ERateType } from "../../database/entity/SDKEntity";
import { IResults, ILineSame, gConst, IHoneyJarItem } from "../../interface/IBeeSlot";
import BeeSlotScene from "./BeeSlotScene";
import { arraySum, get2ArrAverage, getRandomNumInt, rateRandom } from "../../interface/IGame";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import BeeSlotPlayer from "./BeeSlotPlayer";
import { getLogger } from "pinus";
import {
    bigWinMultiple, connectMultiples, freeCountProbability012, freeCountProbability345, freeGameWildMultiples, freeGameWildProbability, freeProbabilityDefault, freeTimes,
    honeyJarCountProbability, honeyJarJackpotPoolIndexs, honeyJarJackpotPoolProbability, honeyJarMultipleProbability, honeyJarMultiples, honeyJarPrizeDrawProbabilityDefault,
    honeyJarProbabilityDefault, jackpotPoolMultiples, killCount, lineCount, linePaths, regenerateCount, regenerateRange, slotProbabilitysDefault, wheelJackpotPoolIndexs, wheelJackpotPoolProbability
} from "./BeeSlotConfig";

let logger = getLogger(gConst.gameName, __filename);

export interface IGameRate extends IGameRateBase {
    rateType: ERateType;
    slot: number[][];
    free: number;
    freeMultiple: number[];
    freeCountProbability345: number[];
    honeyJar: number;
    honeyJarCount: number[];
    honeyJarPrizeDraw: number;
    honeyJarMultiple: number[];
    honeyJarJackpotPool: number[];
    wheelJackpotPool: number[];
    regenerateCount: number;
    regenerateRange: IRegenerateRange;
}

export interface IRegenerateRange {
    min: number;
    max: number;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        slot: slotProbabilitysDefault,
        free: freeProbabilityDefault,
        freeMultiple: freeGameWildProbability,
        freeCountProbability345: freeCountProbability345,
        honeyJar: honeyJarProbabilityDefault,
        honeyJarCount: honeyJarCountProbability,
        honeyJarPrizeDraw: honeyJarPrizeDrawProbabilityDefault,
        honeyJarMultiple: honeyJarMultipleProbability,
        honeyJarJackpotPool: honeyJarJackpotPoolProbability,
        wheelJackpotPool: wheelJackpotPoolProbability,
        regenerateCount: regenerateCount,
        regenerateRange: regenerateRange
    }
    return JSON.parse(JSON.stringify(gameRateDefault));
}

const multipleJp = get2ArrAverage(jackpotPoolMultiples, wheelJackpotPoolProbability) * lineCount;
const multipleFree = lineCount * get2ArrAverage(freeTimes, freeCountProbability345);

export class BeeSlotMachine
    extends MachineShiftBase<IGameRate> {
    constructor(protected scene: BeeSlotScene, protected player: BeeSlotPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple, multipleFree, multipleJp);
    }

    private doGenerateResults(betAmount: number, isFreeGame: boolean, honeyJarDataByBet: IHoneyJarItem[], gameRate: IGameRate): IResults {
        let thisResults: IResults = {
            betAmount: 0,
            results: [],
            lineSames: [],
            multiple: 0,
            multiples: [],
            freeCount: 0,
            freeTotalCount: 0,
            freeWinAmount: 0,
            freeGameWildMultiple: 0,
            jackpotAmount: 0,
            honeyJarDataByBet: null,
            honeyJarRunItems: null,
            honeyJarArrayLine: null,
            wheelJackpotPoolIndex: null,
        };

        thisResults.betAmount = betAmount;
        thisResults.results = this.getFirstResults(gameRate.slot);
        thisResults.lineSames = this.lineSamesByResults(thisResults.results);
        let connectedIndex = this.collectConnectedIndex(thisResults.lineSames);
        let notConnectedIndexs = this.collectNotConnectedIndex(connectedIndex, thisResults.results);

        //这里出蜜罐
        let isAppearHoneyJar = Math.random() < gameRate.honeyJar;
        let honeyJarIndexs = [];
        if (isAppearHoneyJar) {
            let isHoneyJarPrizeDraw = Math.random() < gameRate.honeyJarPrizeDraw;
            let honeyJarEmptyIndexs = this.findHoneyJarEmptyIndexs(honeyJarDataByBet);
            if (isHoneyJarPrizeDraw && honeyJarEmptyIndexs.length > 0) {
                //这个函数可以拿到蜜罐满四个后缺的那个索引，并且根据奖励金额从小到大排序
                let honeyJarEmptyIndexsBySort = this.sorthoneyJarEmptyIndexsByAward(betAmount, honeyJarDataByBet, honeyJarEmptyIndexs);
                //如果开奖，罐子就生成在必定连线的地方并且只生成一个，按返奖金额最少的三条连线选一条
                let emptyIndexCount = Math.min(honeyJarEmptyIndexsBySort.length, 3);
                let randomPrizeDrawIndex = Math.floor(Math.random() * emptyIndexCount);
                honeyJarIndexs.push(honeyJarEmptyIndexsBySort[randomPrizeDrawIndex]);
            } else {
                //如果不开奖，罐子就生成在不能完成连线的地方
                notConnectedIndexs = this.removeCommonElements(honeyJarEmptyIndexs, notConnectedIndexs);
                let generateCount = 5;//要是生成五次都没有满足不在slot连线上，也不能完成蜜罐连线的，就不生成了。
                for (let i = 0; i < generateCount; i++) {
                    let copyNotConnectedIndexs = JSON.parse(JSON.stringify(notConnectedIndexs));
                    honeyJarIndexs = this.randomNotConnectedIndex(gameRate.honeyJarCount, copyNotConnectedIndexs);
                    let currentHoneyJarIndexs = this.collectHoneyJarIndexs(honeyJarDataByBet, honeyJarIndexs);
                    if (!this.isOnLine(currentHoneyJarIndexs)) break;
                    if (i === generateCount - 1) honeyJarIndexs = [];
                }
            }

            if (honeyJarIndexs.length > 0) {
                for (let i = 0; i < honeyJarIndexs.length; i++) {
                    thisResults.results[honeyJarIndexs[i]] = 12;
                }
                thisResults.honeyJarRunItems = this.gethoneyJarRunItems(betAmount, honeyJarIndexs, honeyJarDataByBet, gameRate);
                honeyJarDataByBet = this.incraeseHoneyJar(honeyJarDataByBet, thisResults.honeyJarRunItems);
                //收集连线蜜罐
                thisResults.honeyJarArrayLine = this.checkHoneyJarLine(honeyJarDataByBet);
                if (thisResults.honeyJarArrayLine) {
                    for (let i = 0; i < thisResults.honeyJarArrayLine.length; i++) {
                        if (thisResults.honeyJarArrayLine[i].id === 12) {
                            thisResults.wheelJackpotPoolIndex = this.getDataByWeights(wheelJackpotPoolIndexs, gameRate.wheelJackpotPool);
                            const wheelJackpotPoolMultiple = jackpotPoolMultiples[thisResults.wheelJackpotPoolIndex]
                            const wheelJackpotPoolAmount = wheelJackpotPoolMultiple * betAmount * lineCount;
                            thisResults.jackpotAmount += wheelJackpotPoolAmount;
                        } else {
                            const awardAmount = thisResults.honeyJarArrayLine[i].awardAmount;
                            const jackpotPoolIndex = thisResults.honeyJarArrayLine[i].jackpotPoolIndex;
                            if (jackpotPoolIndex !== null) {
                                const jackpotPoolMultiple = jackpotPoolMultiples[jackpotPoolIndex];
                                const jackpotPoolAmount = jackpotPoolMultiple * betAmount * lineCount;
                                thisResults.jackpotAmount += jackpotPoolAmount;
                            }
                            thisResults.jackpotAmount += awardAmount;
                        }
                    }
                }
            }
        }
        thisResults.honeyJarDataByBet = honeyJarDataByBet;

        //计算倍数
        if (thisResults.honeyJarArrayLine) thisResults.lineSames = this.lineSamesByResults(thisResults.results);
        if (isFreeGame) {
            thisResults.freeGameWildMultiple = this.getDataByWeights(freeGameWildMultiples, gameRate.freeMultiple);
            thisResults.multiples = this.calculateMultiplesByFreeGame(thisResults.lineSames, thisResults.freeGameWildMultiple);
        } else {
            thisResults.multiples = this.calculateMultiples(thisResults.lineSames);
        }
        thisResults.multiple = arraySum(thisResults.multiples);

        return thisResults;
    }

    public generateResults(betAmount: number, honeyJarDataByBet: IHoneyJarItem[]): IResults {
        let normalGameRate = this.getGameRate(betAmount);
        let linesBetAmount = betAmount * lineCount;
        let firstHoneyJarDataByBet = JSON.parse(JSON.stringify(honeyJarDataByBet));
        let result: IResults = this.doGenerateResults(betAmount, false, firstHoneyJarDataByBet, normalGameRate);
        let normalAddRevenue = this.calculateAddRevenue(result);

        if (normalGameRate.rateType == ERateType.water && result.multiple + result.jackpotAmount <= 0) {
            //this.player.regenerateCount++; //跑数值时记录重随了多少次
            normalGameRate.free = 0;
            for (let i = 0; i < normalGameRate.regenerateCount; i++) {
                let regenerateHoneyJarDataByBet = JSON.parse(JSON.stringify(honeyJarDataByBet));
                let regenerateResults = this.doGenerateResults(betAmount, false, regenerateHoneyJarDataByBet, normalGameRate);
                let regenerateAddRevenue = this.calculateAddRevenue(regenerateResults);
                if (this.isExpect(linesBetAmount, regenerateAddRevenue, normalGameRate.regenerateRange)) {
                    //this.player.regenerateWinCount++; //跑数值时记录重随中奖的次数
                    result = regenerateResults;
                    normalAddRevenue = regenerateAddRevenue;
                    break;
                }
            }
        }

        let isKillNormal = false;
        for (let i = 0; i <= killCount; i++) {
            isKillNormal = this.balanceKill(betAmount, linesBetAmount, normalAddRevenue) == ERateType.kill;
            if (isKillNormal) {
                logger.warn(`slot kill: (multiple = ${result.multiple}),(addRevenue = ${normalAddRevenue}),(uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                normalGameRate.free = 0;
                this.maxProbabilityToZero(normalGameRate.honeyJarCount, 1);
                this.maxProbabilityToZero(normalGameRate.honeyJarMultiple);
                this.maxProbabilityToZero(normalGameRate.wheelJackpotPool);
                let killHoneyJarDataByBet = JSON.parse(JSON.stringify(honeyJarDataByBet));
                result = this.doGenerateResults(betAmount, false, killHoneyJarDataByBet, normalGameRate);
                normalAddRevenue = this.calculateAddRevenue(result);
            }
            else break;
        }
        if (isKillNormal) logger.warn(`slot kill fail: (multiple = ${result.multiple}),(addRevenue = ${normalAddRevenue}),(uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);

        let isWinFree = Math.random() < normalGameRate.free;
        let freeCountProbability = isWinFree ? normalGameRate.freeCountProbability345 : freeCountProbability012;
        let connectedIndex = this.collectConnectedIndex(result.lineSames);
        let notConnectedIndexs = this.collectNotConnectedIndex(connectedIndex, result.results);
        let freeIndexs = this.randomNotConnectedIndex(freeCountProbability, notConnectedIndexs);
        if (freeIndexs.length > 0) {
            let freeTime = freeIndexs.length;
            let freeCount = isWinFree ? freeTimes[freeIndexs.length] : 0;
            let freeTotalCount = freeCount;
            if (freeCount > 0) {
                let freeGameRate = this.getGameRate(betAmount);
                let freeHandselHoneyJars = this.getFreeHandselHoneyJars(betAmount);
                let clientFreeHandselHoneyJars = JSON.parse(JSON.stringify(freeHandselHoneyJars));
                let freeHoneyJarDataByBet = result.honeyJarArrayLine ? freeHandselHoneyJars.shift() : result.honeyJarDataByBet;
                let totalFreeResults = [];
                let freeAddRevenue = 0;
                let isKillFree = false;
                for (let i = 0; i <= killCount; i++) {
                    let copyHoneyJarDataByBet = JSON.parse(JSON.stringify(freeHoneyJarDataByBet));
                    let copyFreeHandselHoneyJars = JSON.parse(JSON.stringify(freeHandselHoneyJars));
                    totalFreeResults = this.getTotalFreeResults(betAmount, freeCount, freeTotalCount, copyHoneyJarDataByBet, copyFreeHandselHoneyJars, freeGameRate);
                    freeAddRevenue = this.calculateFreeAddRevenu(totalFreeResults);
                    isKillFree = this.balanceKill(betAmount, linesBetAmount, freeAddRevenue) == ERateType.kill;
                    if (isKillFree) {
                        logger.warn(`free kill: (freeCount = ${totalFreeResults.length}), (freeAddRevenue = ${freeAddRevenue}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                        let freeCountIndex = freeTimes.indexOf(freeCount);
                        freeCount = Math.max(freeTimes[freeCountIndex - 1], freeTimes[3]);
                        freeTotalCount = freeCount;
                        this.maxProbabilityToZero(freeGameRate.freeMultiple);
                        this.maxProbabilityToZero(freeGameRate.honeyJarCount, 1);
                        this.maxProbabilityToZero(freeGameRate.honeyJarMultiple);
                        this.maxProbabilityToZero(freeGameRate.wheelJackpotPool);
                    }
                    else break;
                }
                if (isKillFree) {
                    logger.warn(`free kill all: (freeCount = ${freeCount}), (freeAddRevenue = ${freeAddRevenue}), (uid = ${this.player.uid}), (round=${this.scene.todayRound()})`);
                    freeCount = 0;
                    freeTotalCount = 0;
                    totalFreeResults = [];
                }
                freeTime = freeTimes.indexOf(totalFreeResults.length);
                if (totalFreeResults.length > 0) {
                    this.player.saveFreeData(totalFreeResults, clientFreeHandselHoneyJars);
                }
            }
            for (let i = 0; i < freeTime; i++) {
                result.results[freeIndexs[i]] = 13;
            }
            result.freeCount = freeCount;
            result.freeTotalCount = freeTotalCount;
        }

        return result;
    }

    private getFirstResults(slotProbabilitys: number[][]): number[] {
        let results = [];
        for (let i = 0; i < 25; i++) {
            let result = i === 12 ? 11 : rateRandom(slotProbabilitys[i % 5]);
            results.push(result);
        }
        return results;
    }

    private collectConnectedIndex(lineSames: ILineSame[]): number[] {
        let connectedIndex: number[] = [];
        for (let i = 0; i < lineSames.length; i++) {
            let lineSame = lineSames[i];
            let linePath = linePaths[lineSame.lineNum];
            for (let j = 0; j < lineSame.count; j++) {
                let pathIndex = linePath[j] - 1;
                if (!connectedIndex.includes(pathIndex)) connectedIndex.push(pathIndex);
            }
        }
        return connectedIndex;
    }

    private collectNotConnectedIndex(connectedIndex: number[], results: number[]): number[] {
        let fullIndex = [];
        for (let i = 0; i < 25; i++) fullIndex.push(i);
        return fullIndex.filter(diff => { return !connectedIndex.includes(diff) && results[diff] != 11 && results[diff] != 12 && results[diff] != 13 });
    }

    private lineSamesByResults(results: number[]): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = results[linePath[0] - 1];
            let count = 1;
            for (let j = 1; j < linePath.length; j++) {
                let goods = results[linePath[j] - 1];
                if ((goods !== 12 && goods !== 13) && (goods === 11 || goods === target)) {
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
            let multiple = connectMultiples[lineSame.target][lineSame.count];
            if (multiple > 0) multiples.push(multiple);
        }
        return multiples;
    }

    private randomNotConnectedIndex(probability: number[], notConnectedIndex: number[]): number[] {
        let indexs: number[] = []
        let count = rateRandom(probability);
        count = Math.min(count, notConnectedIndex.length);
        for (let i = 0; i < count; i++) {
            let index = getRandomNumInt(0, notConnectedIndex.length - 1);
            indexs.push(notConnectedIndex[index]);
            notConnectedIndex.splice(index, 1);
        }
        return indexs;
    }

    //权重算法
    private getDataByWeights(datas: number[], weights: number[]): number {
        if (datas.length !== weights.length || datas.length === 0) {
            throw new Error("Datas and weights arrays must have the same non-zero length.");
        }
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const randomWeight = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (let i = 0; i < datas.length; i++) {
            cumulativeWeight += weights[i];
            if (randomWeight < cumulativeWeight) {
                return datas[i];
            }
        }
        return datas[0];
    }

    //拿到每轮蜜罐的数据
    private gethoneyJarRunItems(betAmount: number, honeyJarIndexs: number[], honeyJarDataByBet: IHoneyJarItem[], gameRate: IGameRate): IHoneyJarItem[] | null {
        let honeyJarRunItems = [];
        for (let i = 0; i < honeyJarIndexs.length; i++) {
            let honeyJarItem: IHoneyJarItem = {
                id: null,
                awardAmount: 0,
                jackpotPoolIndex: null,
            }
            let awardAmount = 0;
            let multiplier = this.getDataByWeights(honeyJarMultiples, gameRate.honeyJarMultiple);
            let jackpotPoolIndex = null;

            if (multiplier === 0) {
                jackpotPoolIndex = this.getDataByWeights(honeyJarJackpotPoolIndexs, gameRate.honeyJarJackpotPool);
            }

            //如果蜜罐罐上有奖金池了，重新随机蜜罐的奖励，不能再随出奖金池
            let existingItem = honeyJarDataByBet.find(item => item.id === honeyJarIndexs[i])
            if (existingItem && existingItem.jackpotPoolIndex !== null) {
                let honeyJarMultipleTmp = JSON.parse(JSON.stringify(gameRate.honeyJarMultiple));
                honeyJarMultipleTmp[honeyJarMultipleTmp.length - 1] = 0;
                multiplier = this.getDataByWeights(honeyJarMultiples, honeyJarMultipleTmp);
                jackpotPoolIndex = null;
            }

            awardAmount = betAmount * lineCount * multiplier;
            honeyJarItem.id = honeyJarIndexs[i];
            honeyJarItem.awardAmount = awardAmount;
            honeyJarItem.jackpotPoolIndex = jackpotPoolIndex;
            honeyJarRunItems.push(honeyJarItem);
        }
        return honeyJarRunItems;
    }

    //增加蜜罐数据
    incraeseHoneyJar(honeyJarDataByBet: IHoneyJarItem[], honeyJarRunItems: IHoneyJarItem[]): IHoneyJarItem[] {
        for (let i = 0; i < honeyJarRunItems.length; i++) {
            let honeyJarItem = honeyJarRunItems[i];
            let existingItem = honeyJarDataByBet.find(item => item.id === honeyJarItem.id);
            if (existingItem) {
                // 如果找到相同 id 的对象，则累加奖励
                existingItem.awardAmount += honeyJarItem.awardAmount;
                // 如果奖金池不为空，则更新奖金池
                if (existingItem.jackpotPoolIndex === null && honeyJarItem.jackpotPoolIndex !== null) {
                    existingItem.jackpotPoolIndex = honeyJarItem.jackpotPoolIndex;
                }
            } else {
                // 如果没有找到相同 id 的对象，则添加新的对象
                honeyJarDataByBet.push(honeyJarItem);
            }
        }
        return honeyJarDataByBet;
    }

    //检查蜜罐的连线
    private checkHoneyJarLine(honeyJarDataByBet: IHoneyJarItem[]): IHoneyJarItem[] | null {
        const gridSize = 5; // 5x5的网格
        const grid: IHoneyJarItem[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
        const resultSet: Set<IHoneyJarItem> = new Set();

        // 将 honeyJarDataByBet 转换为二维数组 grid
        for (const item of honeyJarDataByBet) {
            const row = Math.floor(item.id / gridSize);
            const col = item.id % gridSize;
            grid[row][col] = item;
        }

        // 检查连线
        const checkDirection = (startRow: number, startCol: number, rowStep: number, colStep: number): IHoneyJarItem[] => {
            const line: IHoneyJarItem[] = [];
            for (let i = 0; i < gridSize; i++) {
                const row = startRow + i * rowStep;
                const col = startCol + i * colStep;
                if (row >= 0 && row < gridSize && col >= 0 && col < gridSize && grid[row][col]) {
                    line.push(grid[row][col]);
                } else {
                    break;
                }
            }
            return line.length === gridSize ? line : [];
        };
        // 检查所有行、列和对角线
        for (let i = 0; i < gridSize; i++) {
            // 检查行
            let line = checkDirection(i, 0, 0, 1);
            if (line.length === gridSize) line.forEach(item => resultSet.add(item));

            // 检查列
            line = checkDirection(0, i, 1, 0);
            if (line.length === gridSize) line.forEach(item => resultSet.add(item));
        }
        // 检查对角线
        let line = checkDirection(0, 0, 1, 1);
        if (line.length === gridSize) line.forEach(item => resultSet.add(item));
        line = checkDirection(0, gridSize - 1, 1, -1);
        if (line.length === gridSize) line.forEach(item => resultSet.add(item));
        return resultSet.size > 0 ? Array.from(resultSet) : null;
    }

    //计算免费游戏的倍数
    private calculateMultiplesByFreeGame(lineSames: ILineSame[], WildMultiple: number): number[] {
        let multiples = [];
        for (let i = 0; i < lineSames.length; i++) {
            let lineSame = lineSames[i];
            let multiple = connectMultiples[lineSame.target][lineSame.count];
            if (linePaths[lineSame.lineNum].includes(13)) multiple = multiple * WildMultiple;
            if (multiple > 0) multiples.push(multiple);
        }
        return multiples;
    }

    //新用户或者完成蜜罐连线后赠送罐子
    public handselHoneyJar(betAmount: number): IHoneyJarItem[] {
        let gameRate = this.getGameRate(betAmount);

        let honeyJarItems = [];
        let collectIds = [12];
        let honeyJarCount = Math.floor(Math.random() * 3) + 2;
        let randomHoneyJarIndexs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        for (let i = 0; i < honeyJarCount; i++) {
            let honeyJarItem: IHoneyJarItem = {
                id: null,
                awardAmount: 0,
                jackpotPoolIndex: null,
            }
            let id = null;
            let awardAmount = 0;
            let multiplier = this.getDataByWeights(honeyJarMultiples, gameRate.honeyJarMultiple);
            let jackpotPoolIndex = null;

            //随机的id不要和之前的id重复
            let randomIndex = Math.floor(Math.random() * randomHoneyJarIndexs.length);
            id = randomHoneyJarIndexs[randomIndex];
            randomHoneyJarIndexs.splice(randomIndex, 1);
            collectIds.push(id);

            // 送的那些不要连成线
            if (collectIds.length >= 5 && this.isOnLine(collectIds)) {
                randomHoneyJarIndexs.filter(item => item !== collectIds[collectIds.length - 1]);
                let randomIndex = Math.floor(Math.random() * randomHoneyJarIndexs.length);
                id = randomHoneyJarIndexs[randomIndex];
                randomHoneyJarIndexs.splice(randomIndex, 1);
            }

            if (multiplier === 0) {
                jackpotPoolIndex = this.getDataByWeights(honeyJarJackpotPoolIndexs, gameRate.honeyJarJackpotPool);
            }

            awardAmount = betAmount * lineCount * multiplier;
            honeyJarItem.id = id;
            honeyJarItem.awardAmount = awardAmount;
            honeyJarItem.jackpotPoolIndex = jackpotPoolIndex;
            honeyJarItems.push(honeyJarItem);
        }
        honeyJarItems.push({ id: 12, awardAmount: 0, jackpotPoolIndex: null });
        return honeyJarItems;
    }

    //检查是否在同一条线上
    private isOnLine(indexes: number[]): boolean {
        if (indexes.length < 5) return false;
        const positions = indexes.map(index => ({
            row: Math.floor(index / 5),
            col: index % 5,
        }));

        const checkLine = (subset: { row: number, col: number }[]) => {
            const sameRow = subset.every(pos => pos.row === subset[0].row);
            const sameCol = subset.every(pos => pos.col === subset[0].col);
            const mainDiagonal = subset.every(pos => pos.row === pos.col);
            const antiDiagonal = subset.every(pos => pos.row + pos.col === 4);
            return sameRow || sameCol || mainDiagonal || antiDiagonal;
        };
        // 生成所有可能的5个索引的组合
        const combinations = this.getCombinations(positions, 5);
        // 对每个组合进行检查
        for (const subset of combinations) {
            if (checkLine(subset)) {
                return true;
            }
        }
        return false;
    }

    // 生成所有组合的辅助函数
    private getCombinations(arr: { row: number, col: number }[], k: number): { row: number, col: number }[][] {
        const result: { row: number, col: number }[][] = [];
        const generateCombination = (start: number, chosen: { row: number, col: number }[]) => {
            if (chosen.length === k) {
                result.push([...chosen]);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                chosen.push(arr[i]);
                generateCombination(i + 1, chosen);
                chosen.pop();
            }
        };
        generateCombination(0, []);
        return result;
    }

    //找蜜罐满四个之后的空位的索引
    private findHoneyJarEmptyIndexs(honeyJarDataByBet: IHoneyJarItem[]): number[] {
        let emptyIndexs = [];
        // 构建一个5x5的网格，初始化为null
        let grid = Array.from({ length: 5 }, () => Array(5).fill(null));
        // 将honeyJarDataByBet的索引放入网格中
        honeyJarDataByBet.forEach(item => {
            const index = item.id;
            const row = Math.floor(index / 5);
            const col = index % 5;
            grid[row][col] = item;
        });
        // 检查每一行、每一列以及两条对角线
        const checkAndAddEmptyIndex = (positions: { row: number, col: number }[]) => {
            const filled = positions.filter(pos => grid[pos.row][pos.col] !== null);
            if (filled.length === 4) {
                const empty = positions.find(pos => grid[pos.row][pos.col] === null);
                if (empty) {
                    const emptyIndex = empty.row * 5 + empty.col;
                    if (!emptyIndexs.includes(emptyIndex)) {
                        emptyIndexs.push(emptyIndex);
                    }
                }
            }
        };
        // 检查行
        for (let row = 0; row < 5; row++) {
            checkAndAddEmptyIndex(
                Array.from({ length: 5 }, (_, col) => ({ row, col }))
            );
        }
        // 检查列
        for (let col = 0; col < 5; col++) {
            checkAndAddEmptyIndex(
                Array.from({ length: 5 }, (_, row) => ({ row, col }))
            );
        }
        // 检查主对角线 (从左上到右下)
        checkAndAddEmptyIndex(
            Array.from({ length: 5 }, (_, i) => ({ row: i, col: i }))
        );
        // 检查副对角线 (从右上到左下)
        checkAndAddEmptyIndex(
            Array.from({ length: 5 }, (_, i) => ({ row: i, col: 4 - i }))
        );
        return emptyIndexs;
    }

    // 计算完成将完成蜜罐连线后的奖励，按从小到大排序，返回空位索引
    private sorthoneyJarEmptyIndexsByAward(betAmount: number, honeyJarDataByBet: IHoneyJarItem[], honeyJarEmptyIndexs: number[]): number[] {
        const results: { index: number, value: number }[] = [];
        for (const emptyIndex of honeyJarEmptyIndexs) {
            let totalValue = 0;
            const directions = this.getLinesForIndex(emptyIndex);
            for (const direction of directions) {
                let lineValue = 0;
                let itemsInLine = 0;
                for (const itemIndex of direction) {
                    const item = honeyJarDataByBet.find(i => i.id === itemIndex);
                    if (item) {
                        itemsInLine++;
                        let itemValue = 0;
                        if (item.id === 12) {
                            itemValue = this.getWheelAverage(betAmount);
                        } else {
                            let awardAmount = item.awardAmount;
                            if (item.jackpotPoolIndex !== null) {
                                const jackpotPoolMultiple = jackpotPoolMultiples[item.jackpotPoolIndex];
                                const jackpotPoolAmount = jackpotPoolMultiple * betAmount * lineCount;
                                awardAmount += jackpotPoolAmount;
                            }
                            itemValue = awardAmount;
                        }
                        lineValue += itemValue;
                    }
                }
                if (itemsInLine === 4) { // 检查是否已有4个item在连线上
                    totalValue += lineValue;
                }
            }
            if (totalValue > 0) {
                results.push({ index: emptyIndex, value: totalValue });
            }
        }
        // 按照连线的总值从小到大排序
        results.sort((a, b) => a.value - b.value);
        // 只返回索引，不包括值
        return results.map(result => result.index);
    }

    // 获取当前索引所在的所有可能连线（行、列、对角线）
    private getLinesForIndex(index: number): number[][] {
        const row = Math.floor(index / 5);
        const col = index % 5;
        const rowLine = Array.from({ length: 5 }, (_, i) => row * 5 + i);
        const colLine = Array.from({ length: 5 }, (_, i) => i * 5 + col);
        const mainDiagonal = row === col ? Array.from({ length: 5 }, (_, i) => i * 5 + i) : [];
        const antiDiagonal = row + col === 4 ? Array.from({ length: 5 }, (_, i) => i * 5 + (4 - i)) : [];
        return [rowLine, colLine, mainDiagonal, antiDiagonal].filter(line => line.length > 0);
    }

    //算平均值
    private getWheelAverage(betAmount: number): number {
        let arrJackPollAmount = [];
        for (let i = 0; i < jackpotPoolMultiples.length; i++) {
            let jackpotPoolAmount = jackpotPoolMultiples[i] * betAmount * lineCount;
            arrJackPollAmount.push(jackpotPoolAmount);
        }
        let gameRate = this.getGameRate(betAmount);
        let averageAmount = get2ArrAverage(arrJackPollAmount, gameRate.wheelJackpotPool);
        return averageAmount;
    }

    private removeCommonElements(array1: number[], array2: number[]): number[] {
        // 使用 filter 过滤 array2 中存在于 array1 的元素
        return array2.filter(element => !array1.includes(element));
    }

    private collectHoneyJarIndexs(honeyJarDataByBet: IHoneyJarItem[], willGenerateIndexs: number[]): number[] {
        let collectIndexs = [];
        for (let item of honeyJarDataByBet) {
            collectIndexs.push(item.id);
        }
        for (let index of willGenerateIndexs) {
            collectIndexs.push(index);
        }
        return Array.from(new Set(collectIndexs));
    }

    public getTotalFreeResults(betAmount: number, freeCount: number, freeTotalCount: number, honeyJarDataByBet: IHoneyJarItem[], freeHandselHoneyJars: IHoneyJarItem[][], gameRate: IGameRate): IResults[] {
        let totalFreeResults = [];
        let totalFreeWinAmount = 0;
        let lastFreeCount = freeCount;//为了兼容旧数据，没玩好的freeCount;
        for (let i = 0; i < lastFreeCount; i++) {
            let copyHoneyJarDataByBet = JSON.parse(JSON.stringify(honeyJarDataByBet));
            let result: IResults = this.doGenerateResults(betAmount, true, copyHoneyJarDataByBet, gameRate);
            freeCount--;
            result.freeCount = freeCount;
            result.freeTotalCount = freeTotalCount;
            totalFreeWinAmount += betAmount * result.multiple + result.jackpotAmount;
            result.freeWinAmount = totalFreeWinAmount;
            honeyJarDataByBet = result.honeyJarArrayLine ? freeHandselHoneyJars.shift() : result.honeyJarDataByBet;
            totalFreeResults.push(result);
        }
        return totalFreeResults;
    }

    public getFreeHandselHoneyJars(betAmount: number): IHoneyJarItem[][] {
        let freeHandselHoneyJars: IHoneyJarItem[][] = [];
        for (let i = 0; i < 12; i++) {
            let honeyJarItems = this.handselHoneyJar(betAmount);
            freeHandselHoneyJars.push(honeyJarItems);
        }
        return freeHandselHoneyJars;
    }

    private isExpect(linesBetAmount: number, revenue: number, regenerateRange: IRegenerateRange) {
        return revenue > linesBetAmount * regenerateRange.min && revenue <= linesBetAmount * regenerateRange.max;
    }

    private calculateAddRevenue(result: IResults): number {
        let slotRevenue = result.betAmount * result.multiple;
        let honeyJarRevenu = 0;
        let wheelRevenu = 0;
        if (result.honeyJarRunItems) {
            for (let runHoneyJar of result.honeyJarRunItems) {
                honeyJarRevenu += runHoneyJar.awardAmount;
                if (runHoneyJar.jackpotPoolIndex !== null) {
                    const jackpotPoolMultiple = jackpotPoolMultiples[runHoneyJar.jackpotPoolIndex];
                    const jackpotPoolAmount = jackpotPoolMultiple * result.betAmount * lineCount;
                    honeyJarRevenu += jackpotPoolAmount;
                }
            }
        }
        if (result.wheelJackpotPoolIndex !== null) {
            wheelRevenu = jackpotPoolMultiples[result.wheelJackpotPoolIndex] * result.betAmount * lineCount;
        }
        return slotRevenue + honeyJarRevenu + wheelRevenu;
    }

    private calculateFreeAddRevenu(totalFreeResults: IResults[]): number {
        let freeAddRevenu = 0;
        for (let result of totalFreeResults) {
            freeAddRevenu += this.calculateAddRevenue(result);
        }
        return freeAddRevenu;
    }

    private maxProbabilityToZero(probability: number[], minIndex = 0) {
        for (let i = probability.length - 1; i > minIndex; i--) {
            if (probability[i] === 0) continue;
            probability[i] = 0;
            break;
        }
    }
}