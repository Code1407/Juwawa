import { ERateType } from "../../database/entity/SDKEntity";
import { IResults, ILineSame, rateRandomDefault, getRandomNumInt, rateRandomResult } from "../../interface/IPirateKing";
import { bigWinMultiple, collectConnectedIndex, collectNotConnectedIndex, connectMultiples, jackpotCountProbability012, jackpotCountProbability3456, jackpotMutiple, jackpotProbabilityDefault, lineCount, linePaths, slotProbabilitysDefault } from "./PirateKingConfig";
import { arraySum } from "../../interface/IGame";
import PirateKingScene from "./PirateKingScene";
import { IGameRateBase, MachineShiftBase } from "../GameBase/ShiftGame/MachineShiftBase";
import PirateKingPlayer from "./PirateKingPlayer";

import { gConst } from "../../interface/IPirateKing";
import { getLogger } from "pinus";
import { newUserRoundDefault } from "../GameBase/ShiftGame/ConfigShiftDefault";
let logger = getLogger(gConst.gameName, __filename);

export interface IGameRate extends IGameRateBase {
    rateType: ERateType;
    slot: number[][];
    jackpot: number;
}

export function defaultGameRate(): IGameRate {
    let gameRateDefault: IGameRate = {
        rateType: ERateType.normal,
        slot: slotProbabilitysDefault,
        jackpot: jackpotProbabilityDefault
    }

    return JSON.parse(JSON.stringify(gameRateDefault));
}

export class PirateKingMachine
    extends MachineShiftBase<IGameRate>
{
    constructor(protected scene: PirateKingScene, player: PirateKingPlayer) {
        let gameRate = defaultGameRate();
        super(scene, player, gameRate, bigWinMultiple);
    }

    private generateResultsByRate(slotProbabilitys: number[][]): number[] {
        let results = [];

        for (let i = 0; i < 15; i++) {
            let result = rateRandomResult(slotProbabilitys[i % 5]);
            results.push(result);
        }

        return results;
    }

    generateResults(betAmount: number): IResults {
        let gameRate = this.getGameRate(betAmount);

        let random = Math.random();
        let jackpot = random < gameRate.jackpot;

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
        let notConnectedIndex = collectNotConnectedIndex(connectedIndex);

        let jackpotAmount = 0;
        if (multiple < bigWinMultiple) {
            let jackpotCountProbability = jackpot ? jackpotCountProbability3456 : jackpotCountProbability012;
            let jackpotIndexs = this.randomNotConnectedIndex(jackpotCountProbability, notConnectedIndex);
            if (this.player.getBetDetail(betAmount).betCount < newUserRoundDefault) {
                let random = Math.random();
                let jpIndex = random > 0.3 ? 3 : 4;
                jackpotIndexs = jackpotIndexs.slice(0, jpIndex);
            }
            jackpotAmount = this.getJackpotPercentage(jackpotIndexs.length) * betAmount * linePaths.length;
            let random = Math.random();
            let jackpotCount = jackpotIndexs.length < 3 ? jackpotIndexs.length : (random < 0.3 ? 4 : 3);
            let targetCount = this.findTargetCount(results, 11);
            for (let i = targetCount; i < jackpotCount; i++) {
                results[jackpotIndexs[i]] = 11;
            }
            jackpotAmount = this.getJackpotPercentage(jackpotIndexs.length) * betAmount * linePaths.length;
        }

        return {
            betAmount: betAmount,
            results: results,
            lineSames: lineSames,
            multiple: multiple,
            multiples: multiples,
            jackpotAmount: jackpotAmount,
        };
    }

    private lineSamesByResults(results: number[]): ILineSame[] {
        let lineSames: ILineSame[] = [];
        for (let i = 0; i < linePaths.length; i++) {
            let linePath = linePaths[i];
            let target = results[linePath[0] - 1];
            let count = 1;
            for (let j = 1; j < linePath.length; j++) {
                let goods = results[linePath[j] - 1];
                if (goods == 10 || goods == target) {
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

    private getJackpotPercentage(count: number) {
        return count >= 0 && count < jackpotMutiple.length ? jackpotMutiple[count] : 0;
    }

    private findTargetCount(arr: number[], target: number): number {
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == target) count++;
        }
        return count;
    }
} 