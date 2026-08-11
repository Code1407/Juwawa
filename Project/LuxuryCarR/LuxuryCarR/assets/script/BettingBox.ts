// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { DecimalUnit } from "../shared/Common";
import Game from "./Game";
import { gGameData } from "./GameData";
import { Effect } from "./effect/FlyDiamond";
import WheelItemUI from "./ui/WheelItemUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BettingBox extends cc.Component {
    @property(cc.Node)
    items: Array<cc.Node> = [];
    @property(cc.Node)
    myBetNum: Array<cc.Node> = [];
    @property(cc.Node)
    totalBet: cc.Node = null;
    @property(cc.Node)
    myTotalBet: cc.Node = null;


    @property(sp.Skeleton)
    tx01: Array<sp.Skeleton> = [];  //xuanzhong
    
    @property(cc.Color)
    myColor: cc.Color = null;
    @property(cc.Color)
    totalColor: cc.Color = null;

    start() {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let wheelUI = cc.find("WheelItem", item).getComponent(WheelItemUI);
            wheelUI.buttonIndex = i;
            let rate = cc.find("WheelItem/ScaleNode/Rate", item);
            rate.getComponent(cc.Label).string = "x" + gGameData.rate[i];
        }
    }

    updateBetAmount() {
        let numlist = Game.Instance.player.getWheelAmount();
        let totalWheelAmount = gGameData.totalWheelAmount;
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let myBetNum = cc.find("WheelItem/myBetNum", item);
            myBetNum.getComponent(cc.RichText).string = "<b><color=#ecf3ff><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(totalWheelAmount[i]) + "/</outline></color>" + "<color=#ffeb61><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(numlist[i]) + "</outline></color></b>";
            // The nodes are hidden after settlement. Rebuild their visibility
            // from the synchronized round data when entering or reconnecting.
            const shouldShowBet = (Number(totalWheelAmount[i]) || 0) > 0
                || (Number(numlist[i]) || 0) > 0;
            // 直接控制当前下注区域中用于写文字的节点，避免编辑器序列化数组缺项或顺序不一致。
            myBetNum.active = shouldShowBet;
            if (this.myBetNum[i] && this.myBetNum[i] !== myBetNum) {
                this.myBetNum[i].active = shouldShowBet;
            }
        }

        //累计金额展示
        let total = totalWheelAmount.reduce((accumulator, currentValue) => { return accumulator + currentValue; }, 0);
        let myTotal = numlist.reduce((accumulator, currentValue) => { return accumulator + currentValue; }, 0);
        this.totalBet.getComponent(cc.RichText).string = "totalCost:" + "<color=#ecf3ff><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(total) + "</outline></color>";
        this.myTotalBet.getComponent(cc.RichText).string = "myTotalCost:" + "<color=#ffeb61><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(myTotal) + "</outline></color>";
    }
    resultEff() {
        let result: number = gGameData.roundStep.result;
        let resultPos = gGameData.indexArr[result];//拿到压中的车标的编号
        let item = this.items[resultPos];
        let effSp: cc.Node = cc.find("WheelItem/Button", item);
        if (effSp) {
            effSp.active = true;
            // effSp.opacity = 0;
            // cc.tween(effSp)
            //     .to(0.5, { opacity: 255 })
            //     .to(0.5, { opacity: 0 })
            //     .union()
            //     .repeat(3)
            //     .call(() => {
            //         effSp.active = false;
            //     }).start();

            for(let i=0;i<this.tx01.length;i++){

                this.tx01[i].setAnimation(1, "1", true);
            }
            setTimeout(() => {
                effSp.active = false;
            },3500)
        }
    }
}
