// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../../shared/Common";
import { gBetAmounts, gGameData } from "../GameData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BigWinView extends cc.Component {

    @property({type: sp.Skeleton,displayName:"Spine节点"})
    SpineNode: sp.Skeleton = null;

    @property(cc.Label)
    numberLabel: cc.Label = null;

    winAmount: number = 0;
    private betAmount: number = 0;

    bigWinEff() {
        const currentBetAmount = this.betAmount > 0
            ? this.betAmount
            : Number(gBetAmounts[gGameData.betAmountIndex]) || 1;

        if (this.winAmount < currentBetAmount * 5) {
            this.SpineNode.setSkin("Bigwin");
        } else if (this.winAmount < currentBetAmount * 10) {
            this.SpineNode.setSkin("Megawin");
        } else {
            this.SpineNode.setSkin("Superwin");
        }
        this.SpineNode.setSlotsToSetupPose();
        this.SpineNode.setAnimation(0, "show2", false);
        this.SpineNode.addAnimation(0, "flow", false);
    }

    setNumberLabel(n: number, betAmount?: number) {
        this.winAmount = Number(n) || 0;
        if (betAmount != null && Number(betAmount) > 0) {
            this.betAmount = Number(betAmount);
        }
        this.numberLabel.string = toThousands(n);
    }


    onEnable() {
        this.bigWinEff();
    }

    start () {
        let self = this;
        this.SpineNode.setCompleteListener((trackEntry) => {
            if (trackEntry.animation.name == "flow") {
                self.node.active = false;
            }
        });
    }

    // update (dt) {}
}
