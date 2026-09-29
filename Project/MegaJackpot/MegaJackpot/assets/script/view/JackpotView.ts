// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../../shared/Common";
import Bottombar from "../Bottombar";


const {ccclass, property} = cc._decorator;

@ccclass
export default class JackpotView extends cc.Component {
    // LIFE-CYCLE CALLBACKS:


    @property({type: sp.Skeleton,displayName:"Spine节点"})
    SpineNode: sp.Skeleton = null;

    @property(cc.Label)
    numberLabel: cc.Label = null;

    winAmount: number = 0;
    bigWinEff() {
        this.SpineNode.setAnimation(0, "show2", false);
        this.SpineNode.addAnimation(0, "flow", true);
    }

    onLoad() {
        this.SpineNode.setCompleteListener((trackEntry) => {
            if (trackEntry.animation.name !== "flow" || !this.node.active) return;

            this.node.active = false;
            void Bottombar.Instance.setWinAmount(this.winAmount);
        });
    }

    setNumberLabel(n: number) {
        this.winAmount = Number(n) || 0;
        this.numberLabel.string = toThousands(this.winAmount);
    }

    onEnable() {
     
        this.bigWinEff();
       
    }

    // update (dt) {}
}
