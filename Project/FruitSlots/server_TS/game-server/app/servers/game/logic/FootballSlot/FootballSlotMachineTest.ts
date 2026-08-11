import { IResults } from "../../interface/IFootballSlot";
import { connectMultiples, freeProbabilityDefault, jackpotProbabilityDefault, linePaths, shootGameResult, shootGameWeight, slotProbabilitysDefault, wildProbabilitysOnFreeGame } from "./FootballSlotConfig";

function WeightToIndex(weights: number[]): number {
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
let round = 0;
let totalBet = 0;
let totalRevenue = 0;
let freeGame = 0;

function GetResults(isFree: boolean): number[] {
    let results = [];

    let pro = slotProbabilitysDefault;

    for (let i = 0; i < 15; i++) {
        let result = WeightToIndex(pro[i % 5]);
        results.push(result);
    }
    if (isFree) {
        let column = [1, 2, 3][WeightToIndex(wildProbabilitysOnFreeGame)];
        results[0 + column] = 9;
        results[5 + column] = 9;
        results[10 + column] = 9;
    }

    return results;
}
export async function Run() {
    totalBet = 0;
    totalRevenue = 0;
    freeGame = 0;
    let loopTimes = 40000000;
    for (round = 0; round < loopTimes; round++) {
        round = Math.floor(round);
        TBet(1);
        if ((round + 1) % 1000000 == 0) {
            console.log("round", round + 1, "bet", totalBet, "totalRevenue", totalRevenue, "rate", totalRevenue / totalBet);
        }
    }
    console.log("final", "bet", totalBet, "totalRevenue", totalRevenue, "rate", totalRevenue / totalBet);
}
export function TBet(amount: number): IResults {
    freeGame = Math.round(freeGame);
    let result: IResults = {
        wildOfFree: -1,
        betAmount: amount,
        results: [],
        lineSames: [],
        multiple: 0,
        multiples: [],
        shootGame: [],
        freeCount: 0,
        roundId: 0,
        shootGameChance: 0
    }
    if (freeGame <= 0)
        totalBet += amount * linePaths.length;
    result.results = GetResults(freeGame > 0);
    let analyse = Analyse(result.results)
    result.multiple = analyse.multiple;
    if (freeGame > 0) {
        freeGame--;
    }
    let isFree = Math.random() < freeProbabilityDefault;
    let isJackpot = Math.random() < jackpotProbabilityDefault;
    if (isFree)
        freeGame += 5;
    let shootGameAward = 0;
    if (isJackpot) {
        for (let i = 0; i < 5; i++) {
            shootGameAward += shootGameResult[WeightToIndex(shootGameWeight)] * linePaths.length;
            result.shootGame.push(shootGameResult[WeightToIndex(shootGameWeight)]);
        }
    }
    result.freeCount = freeGame;
    totalRevenue += (result.multiple + shootGameAward) * amount;
    return result;
}
function Analyse(indexs: number[]): { multiple: number, unConnPoint: number[] } {
    let res: { multiple: number, unConnPoint: number[] } = { multiple: 0, unConnPoint: [] };
    for (let i = 0; i < 15; i++) {
        res.unConnPoint.push(i);
    }
    for (let i = 0; i < linePaths.length; i++) {
        let path = linePaths[i];
        let id = 9;
        for (let j = 0; j < path.length; j++) {
            if (indexs[path[j]] < 9) {
                id = indexs[path[j]];
                break;
            }
        }
        if (id >= 9)
            continue;
        let idCount = 0;
        for (let j = 0; j < path.length; j++) {
            if (indexs[path[j]] == 9 || indexs[path[j]] == id) {
                idCount++
            }
            else {
                break;
            }
        }
        if (idCount > 2) {
            res.multiple += connectMultiples[id][idCount - 3];
            for (let j = 0; j < idCount; j++) {
                if (res.unConnPoint.includes(path[j])) {
                    res.unConnPoint.splice(res.unConnPoint.indexOf(path[i]), 1);
                }
            }
        }
    }
    return res;
}