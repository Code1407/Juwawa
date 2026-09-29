// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";
import { Effect } from "./effect/BaseEffect";
import { gBetAmounts, gGameData } from "./GameData";
import { EBetAmountIndex } from "./interface/IMageJackpot";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Jackpot extends cc.Component {

    @property(cc.Node)
    jackpotRoot: cc.Node = null;

    @property(cc.Label)
    jackpotAmount: cc.Label = null;

    //spine动画
    @property({type: sp.Skeleton,displayName:"Spine节点"})
    SpineNode: sp.Skeleton = null;

    private isIncr: boolean = false;
    private amountAnimationVersion: number = 0;
    private betAmountIndex: EBetAmountIndex = EBetAmountIndex.unknow;


    //spine动画名字定义【show2,flow】
    private SpineAnimationName: string[] = ["idle","shine","star","vertical"];

    static get Instance() {
        return cc.find("Canvas/Game/Jackpot").getComponent(Jackpot);
    }

    switchIndex(betAmountIndex: EBetAmountIndex) {
        this.amountAnimationVersion++;
        this.isIncr = false;
        this.betAmountIndex = betAmountIndex;
        let betAmount = gBetAmounts[betAmountIndex];
        this.jackpotAmount.string = toThousands(gGameData.jackpotAmountPool[betAmount]).toString();
    }

    async incrAmount(jackpotAmountBefor: number, jackpotAmountCurrent: number) {
        if (this.betAmountIndex == EBetAmountIndex.unknow) return;
        if (!Number.isFinite(jackpotAmountBefor) || !Number.isFinite(jackpotAmountCurrent)) {
            this.switchIndex(this.betAmountIndex);

            this.SpineNode.setAnimation(0,this.SpineAnimationName[3],false)
            this.SpineNode.addAnimation(0,this.SpineAnimationName[0],true)

            return;
        }
        if (this.isIncr) return;
        this.isIncr = true;
        const animationVersion = ++this.amountAnimationVersion;

        let incrJackpotAmount = jackpotAmountCurrent - jackpotAmountBefor;
      
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
        this.SpineNode.setAnimation(0,this.SpineAnimationName[3],false)
        this.SpineNode.addAnimation(0,this.SpineAnimationName[2],true)
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.SpineNode.setAnimation(0,this.SpineAnimationName[3],false)
        this.SpineNode.addAnimation(0,this.SpineAnimationName[0],true)
    }

    // update (dt) {}
}
