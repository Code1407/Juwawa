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
    private amountAnimationVersion: number = 0;
    private betAmountIndex: EBetAmountIndex = EBetAmountIndex.unknow;

    static get Instance() {
        return cc.find("Canvas/Game/Jackpot").getComponent(Jackpot);
    }

    switchIndex(betAmountIndex: EBetAmountIndex) {
        // 档位切换或入场恢复后，旧动画不能继续覆盖当前档位的奖池。
        this.amountAnimationVersion++;
        this.isIncr = false;
        this.betAmountIndex = betAmountIndex;
        let betAmount = gBetAmounts[betAmountIndex];
        this.jackpotAmount.string = toThousands(gGameData.jackpotAmountPool[betAmount]).toString();
    }

    async incrAmount(jackpotAmountBefor: number, jackpotAmountCurrent: number) {
        if (this.betAmountIndex == EBetAmountIndex.unknow) return;
        // 旧快照缺少当前档位时，NaN 插值会被格式化成 0，直接显示实时奖池。
        if (!Number.isFinite(jackpotAmountBefor) || !Number.isFinite(jackpotAmountCurrent)) {
            this.switchIndex(this.betAmountIndex);
            return;
        }
        if (this.isIncr) return;
        this.isIncr = true;
        const animationVersion = ++this.amountAnimationVersion;

        let incrJackpotAmount = jackpotAmountCurrent - jackpotAmountBefor;
        // Effect.flyIncrAmount(this.jackpotRoot, this.jackpotIncrFlyNode, incrJackpotAmount);

        //如果小于10 则直接显示
        if (incrJackpotAmount < 10) {
            this.jackpotAmount.string = toThousands(jackpotAmountCurrent).toString();
            return;
        }

        let split = 10;
        let amountSplit = incrJackpotAmount / split;
        let jackpotAmount = jackpotAmountBefor;
        for (let i = 0; i < split; i++) {
            if (animationVersion !== this.amountAnimationVersion) return;
            jackpotAmount += amountSplit;
            this.jackpotAmount.string = toThousands(jackpotAmount);
            await new Promise(resolve => setTimeout(resolve, 95));
        }

        if (animationVersion === this.amountAnimationVersion) this.isIncr = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
