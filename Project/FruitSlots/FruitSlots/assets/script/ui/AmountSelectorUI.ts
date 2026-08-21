// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gBetAmounts, gGameData } from "../GameData";
import Jackpot from "../Jackpot";
import { EBetAmountIndex, lineCount } from "../interface/IFruitSlots";
import SpinUI from "./SpinUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AmountSelectorUI extends cc.Component {

    @property(cc.Label)
    betTotal: cc.Label = null;

    @property(cc.Node)
    decr: cc.Node = null;

    @property(cc.Node)
    incr: cc.Node = null;

    @property(cc.Node)
    decrDown: cc.Node = null;
    @property(cc.Node)
    decrUp: cc.Node = null;
    @property(cc.Node)
    incrDown: cc.Node = null;
    @property(cc.Node)
    incrUp: cc.Node = null;

    static get Instance() {
        return cc.find("Canvas/Bottombar/BetAmountSelector").getComponent(AmountSelectorUI);
    }

    setBetAmountLabel(totalAmount: number) {
        this.betTotal.string = totalAmount.toString(); // totalAmount < 1000 ? totalAmount.toString() : (totalAmount / 1000) + "k";
    }

    // LIFE-CYCLE CALLBACKS:

    start () {
        const __this = this;
        this.decr.on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.betAmountIndex > EBetAmountIndex.single && SpinUI.Instance.canSpin()) {
                gGameData.betAmountIndex--;
                Game.Instance.player.setBetAmountButton(gGameData.betAmountIndex);
                Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
                __this.setBetAmountLabel(gBetAmounts[gGameData.betAmountIndex] * lineCount);

                __this.decrUp.active = false;
                __this.decrDown.active = true;
            }
        });

        this.decr.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.decrUp.active = true;
            __this.decrDown.active = false;
        });
        this.decr.on(cc.Node.EventType.TOUCH_END, () => {
            __this.decrUp.active = true;
            __this.decrDown.active = false;
        });

        this.incr.on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.betAmountIndex < gBetAmounts.length - 1 && SpinUI.Instance.canSpin()) {
                gGameData.betAmountIndex++;
                Game.Instance.player.setBetAmountButton(gGameData.betAmountIndex);
                Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
                __this.setBetAmountLabel(gBetAmounts[gGameData.betAmountIndex] * lineCount);

                __this.incrUp.active = false;
                __this.incrDown.active = true;
            }
        });

        this.incr.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.incrUp.active = true;
            __this.incrDown.active = false;
        });
        this.incr.on(cc.Node.EventType.TOUCH_END, () => {
            __this.incrUp.active = true;
            __this.incrDown.active = false;
        });
    }

    // update (dt) {}
}
