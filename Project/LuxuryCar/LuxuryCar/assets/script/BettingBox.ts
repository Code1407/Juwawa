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
        }
    }
    resultEff() {
        let result: number = gGameData.roundStep.result;
        let resultPos = gGameData.indexArr[result];//拿到压中的车标的编号
        let item = this.items[resultPos];
        let effSp: cc.Node = cc.find("WheelItem/Button", item);
        if (effSp) {
            effSp.active = true;
            effSp.opacity = 0;
            cc.tween(effSp)
                .to(0.5, { opacity: 255 })
                .to(0.5, { opacity: 0 })
                .union()
                .repeat(3)
                .call(() => {
                    effSp.active = false;
                }).start();
        }
    }
}