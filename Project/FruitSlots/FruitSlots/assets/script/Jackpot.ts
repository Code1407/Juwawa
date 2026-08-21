// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";
import { Effect } from "./effect/BaseEffect";
import { gBetAmounts, gGameData } from "./GameData";
import { EBetAmountIndex } from "./interface/IFruitSlots";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Jackpot extends cc.Component {

    @property(cc.Node)
    jackpotRoot: cc.Node = null;

    @property(cc.Label)
    jackpotAmount: cc.Label = null;

    private isIncr: boolean = false;
    private betAmountIndex: EBetAmountIndex = EBetAmountIndex.unknow;

    static get Instance() {
        return cc.find("Canvas/Game/Jackpot").getComponent(Jackpot);
    }

    switchIndex(betAmountIndex: EBetAmountIndex) {
        this.betAmountIndex = betAmountIndex;
        let betAmount = gBetAmounts[betAmountIndex];
        this.jackpotAmount.string = toThousands(gGameData.jackpotAmountPool[betAmount]).toString();
    }

    async incrAmount(jackpotAmountBefor: number, jackpotAmountCurrent: number) {
        if (this.betAmountIndex == EBetAmountIndex.unknow) return;
        if (this.isIncr) return;
        this.isIncr = true;

        let incrJackpotAmount = jackpotAmountCurrent - jackpotAmountBefor;
        // Effect.flyIncrAmount(this.jackpotRoot, this.jackpotIncrFlyNode, incrJackpotAmount);

        let split = 10;
        let amountSplit = incrJackpotAmount / split;
        let jackpotAmount = jackpotAmountBefor;
        for (let i = 0; i < split; i++) {
            jackpotAmount += amountSplit;
            this.jackpotAmount.string = toThousands(jackpotAmount);
            await new Promise(resolve => setTimeout(resolve, 95));
        }

        this.isIncr = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
