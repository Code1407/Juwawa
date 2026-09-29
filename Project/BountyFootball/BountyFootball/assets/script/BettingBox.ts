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
    allBetNum: Array<cc.Node> = [];
    @property(cc.Node)
    totalBet: cc.Node = null;
    @property(cc.Node)
    myTotalBet: cc.Node = null;


    @property(cc.Node)
    XzBtn: Array<cc.Node> = [];  //Button区域方框特效

    @property(cc.Color)
    myColor: cc.Color = null;
    @property(cc.Color)
    totalColor: cc.Color = null;

    start() {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let wheelUI = cc.find("WheelItem", item).getComponent(WheelItemUI);
            wheelUI.buttonIndex = i;
            let rate = cc.find("ScaleNode/Rate", item);
            rate.getComponent(cc.Label).string = "x" + gGameData.rate[i];
        }
    }

    updateBetAmount() {
        let numlist = Game.Instance.player.getWheelAmount();
        let totalWheelAmount = gGameData.totalWheelAmount || [0,0,0,0,0,0,0,0,0,0];
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let myBetNum = cc.find("myBetNum", item);
            let allBetNum = cc.find("allBetNum", item);
            let myAmount = Number(numlist[i]) || 0;
            let allAmount = Number(totalWheelAmount[i]) || 0;
            myBetNum.getComponent(cc.Label).string = DecimalUnit.humanReadable(myAmount);
            allBetNum.getComponent(cc.Label).string = DecimalUnit.humanReadable(allAmount);

            // 金额节点的显隐只由服务端确认后的下注数据决定。
            // 不能使用扣款后的剩余余额判断，否则余额推送先于下注回包时会把成功下注隐藏。
            myBetNum.active = myAmount > 0;
            allBetNum.active = allAmount > 0;
        }

        //累计金额展示
        let total = totalWheelAmount.reduce((accumulator, currentValue) => { return accumulator + currentValue; }, 0);
        let myTotal = numlist.reduce((accumulator, currentValue) => { return accumulator + currentValue; }, 0);
        let langContent = (<any>window).langContent;
        let totalCostPrefix = "TotalCost:";
        let myTotalCostPrefix = "My TotalCost:";
        if (langContent && langContent.game) {
            if (langContent.game.totalCost) totalCostPrefix = langContent.game.totalCost;
            if (langContent.game.myTotalCost) myTotalCostPrefix = langContent.game.myTotalCost;
        }
        this.totalBet.getComponent(cc.RichText).string = totalCostPrefix + "<color=#ecf3ff><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(total) + "</outline></color>";
        this.myTotalBet.getComponent(cc.RichText).string = myTotalCostPrefix + "<color=#ffeb61><outline color=#0d2454 width=1>" + DecimalUnit.humanReadable(myTotal) + "</outline></color>";
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

            for (let i = 0; i < this.XzBtn.length; i++) {
                cc.tween(this.XzBtn[i])
                .to(0.3, {opacity: 255})
                .to(0.3,{opacity:0})
                .union()
                .repeat(7)
                .call(()=> {
                }).start();
            }
            setTimeout(() => {
                effSp.active = false;
            }, 3500)
        }
    }
}
