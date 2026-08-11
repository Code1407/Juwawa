import { ERateType } from "../../../database/entity/SDKEntity";
import { getRandomNumInt } from "../../../interface/IGame";
import { ShiftEntity, PlayerShiftBase } from "./PlayerShiftBase";
import { SceneShiftBase } from "./SceneShiftBase";

export interface IGameRateBase {
    rateType: ERateType;
    capture_rate?: number;
    slot?: number[][];
    jp?: number;
    free?: number;
    mutiple?: { min: number, max: number };
}


type ShiftPlayer = PlayerShiftBase<ShiftEntity<any>, any>;

export abstract class MachineShiftBase<GameRateType extends IGameRateBase> {
    protected roundRateType: ERateType = ERateType.normal;

    constructor(protected scene: SceneShiftBase<ShiftPlayer, GameRateType>, protected player: ShiftPlayer, protected gameRate: GameRateType, 
        bigWinMultiple: number = 0, protected mutipleFree: number = 0, protected mutipleJp: number = 0) 
    {
    }

    getGameRate(buttonAmount: number): GameRateType {
        if (this.scene.gameRates && this.scene.gameRates[buttonAmount]) {
            return this.scene.gameRates[buttonAmount]
        } else {
            let gameRate: GameRateType = JSON.parse(JSON.stringify(this.scene.gameRateDefault));
            return gameRate;
        }
    }

    setLastRoundRateType(rateType: ERateType) {
        this.roundRateType = rateType;
    }

    getLastRoundRateType(): ERateType {
        return this.roundRateType;
    }

    generateResultsByNewUser(multiple: {min: number, max: number}): number[] {
        if (!multiple) return [];

        let temResults: number[][] = [];
        for (let keyStr in this.scene.newUserResult) {
            let key = Number(keyStr);
            if (key >= multiple.min && key <= multiple.max) {
                let temResult = this.scene.newUserResult[key];
                temResults.push(...temResult);
            }
        }

        if (temResults.length) {
            let index = getRandomNumInt(0, temResults.length - 1);
            return temResults[index];
        }
        return [];
    }

    balanceKill(buttonAmount: number, curBet: number, curRevenue: number): ERateType {
        let rateType = ERateType.normal;
        if (buttonAmount > 1000 && curRevenue > curBet * 10) rateType = ERateType.kill;
        if (rateType == ERateType.kill) this.setLastRoundRateType(ERateType.kill)
        return rateType;
    }
}