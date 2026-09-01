// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { gGameData } from "./GameData";
import { getBetGradeAmounts } from "./interface/ILuckyFruits";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BetNumView extends cc.Component {

    @property(cc.Node)
    decrease: cc.Node = null;
    @property(cc.Node)
    increase: cc.Node = null;
    @property(cc.Label)
    num: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    static get instance(): BetNumView {
        return cc.find("Canvas/Game/BetNumView").getComponent(BetNumView);
    }
    start () {
        this.decrease.on(cc.Node.EventType.TOUCH_START, () => {
            gGameData.betAmountIndex = Math.max(gGameData.betAmountIndex - 1, 0);
            this.BetAmountChange();
        });

        this.increase.on(cc.Node.EventType.TOUCH_START, () => {
            let maxIndex = Math.max(0, getBetGradeAmounts().length - 1);
            gGameData.betAmountIndex = Math.min(gGameData.betAmountIndex + 1, maxIndex);
            this.BetAmountChange();
        });
    }

    BetAmountChange(){
        let gradeAmounts = getBetGradeAmounts();
        if (gradeAmounts.length == 0) {
            this.num.string = "0";
            return;
        }
        gGameData.betAmountIndex = Math.max(0, Math.min(gGameData.betAmountIndex, gradeAmounts.length - 1));
        this.num.string = gradeAmounts[gGameData.betAmountIndex].toString();
    }

    // update (dt) {}
}
