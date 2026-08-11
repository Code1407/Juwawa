// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

import WheelsEffect from "./effect/WheelsEffect";
import { EGameStatus } from "../shared3/interface/IGame";

@ccclass
export default class Wheels extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];

    @property(cc.Node)
    betTimer: cc.Node = null;

    // @property(cc.Node)
    // salad: cc.Node = null;

    // @property(cc.Node)
    // pizza: cc.Node = null;

    tick: number = 0;
    runIndex: number = 0;
    // grandPrize: boolean = false;

    effWheels: WheelsEffect = null;


    static get Instance() {
        return cc.find("Canvas/Game/Wheels").getComponent(Wheels);
    }

    changeGameStatus(status: EGameStatus) {
        switch (status) {
            case EGameStatus.bet:
                this.effWheels.enterBet();
                break;
            case EGameStatus.run:
                this.effWheels.enterRun();
                break;
        }
    }

    setRemainSecond(status: EGameStatus, remainSecond: number) {
        switch (status) {
            case EGameStatus.bet:
                cc.find("BetTime/Select/RemainSecond/Number", this.node).getComponent(cc.Label).string = Math.round(remainSecond).toString();
                // console.log("bet");

                break;
            case EGameStatus.run:
                cc.find("BetTime/Run/RemainSecond/Number", this.node).getComponent(cc.Label).string = Math.round(remainSecond).toString();
                // console.log("run");

                break;
            case EGameStatus.final:
                cc.find("BetTime/Run/RemainSecond/Number", this.node).getComponent(cc.Label).string = "0";
                // console.log("final");


                break;
        }
    }

    inBet(betSecond: number) {
        this.effWheels.betEffect(betSecond);
    }

    inRun(runSecond: number) {
        // [MARKER:WHEEL_ROLL] 滚动调用入口 - 每次调用滚动一格
        this.runIndex = this.effWheels.runEffect(runSecond);
    }
    stratRecoverItems() {
        this.effWheels.stratRecoverItems();
    }
    startADD() {
        this.effWheels.startADD();
    }

    // [MARKER:WHEEL_FINAL_CHECK] 精确对齐检查 - 确保最终停在result位置
    // 返回true表示已到达目标，返回false继续滚动
    inRun2Final(result: number): boolean {
        // Move first, then check immediately so reaching the result does not cost an extra tick.
        if (this.runIndex != result) {
            this.runIndex = this.effWheels.runEffect(0);
        }

        if (this.runIndex == result) {
            this.effWheels.finalEffect(this.runIndex);

            // this.effWheels.highlightItemend(result);

            return true;
        }
        // this.effWheels.finalEffect(this.runIndex);
        // if ((result == 8 && this.runIndex == 4) || (result == 9 && this.runIndex == 0))
        //     this.grandPrize = true;
        // if (this.grandPrize) {
        //     return this.inRun2FinalGP(result);
        // }

        // this.grandPrize = false;
        return false;
    }

    // inRun2FinalGP(result: number) {
    //     // if (this.runIndex == 7 ||  this.runIndex == 3) {
    //     //     this.effWheels.finalEffectGP();
    //     //     // this.grandPrize = false;
    //     //     return true;
    //     // }
    //     // this.runIndex = this.effWheels.runEffectGP(result);
    //     return false;
    // }

    init() {
        // this.effWheels = new WheelsEffect(this.items, this.betTimer, this.salad, this.pizza);
        this.effWheels = new WheelsEffect(this.items, this.betTimer);

        this.effWheels.init();
        // for (let i = 0; i < this.items.length; ++i) {
        //     let item = this.items[i];
        //     // let myBet = cc.find("WheelItem/MyBet", item);
        //     // myBet.active = false;
        // }
        //         for (let i = 0; i < this.items.length; ++i) {
        //             let item = this.items[i];
        //             // let goods = cc.find("WheelItem/Goods", item);
        //             // goods.getComponent(cc.Sprite).spriteFrame = ImageCache.Instance.goods[i];
        //             // console.log(i);

        //         //  let rate = cc.find("WheelItem/Rate", item);
        //         //    rate.getComponent(cc.Label).string = "with "+gGameData.rate[i]+" times";
        // // if(i <= 9){
        // //     let wheelUI = cc.find("WheelItem", item).getComponent(WheelItemUI);
        // //            wheelUI.buttonIndex = i;
        // //             console.log(i);
        // }


        //     // let isHot = cc.find("WheelItem/IsHot", item);
        //     // let h1 = cc.find("WheelItem/Hot/h1", item);
        //     // let h2 = cc.find("WheelItem/Hot/h2", item);
        //     // let h3 = cc.find("WheelItem/Hot/h3", item);
        //     // isHot.active = h1.active = h2.active = h3.active = false;
        // }
    }
    //钻石飞行
    // async autoBetEff(wheelAmount: number[]) {
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //     for (let i = 0; i < this.items.length; ++i) {
    //         if (wheelAmount[i] > 0) { 
    //             Effect.FlyDiamond(Game.Instance.account.myDiamond.node, cc.find("WheelItem", this.items[i]));
    //         }
    //     }
    //     // this.assignValue(wheelAmount);
    // }

    // assignHot(hots: number[]) {
    //     if (hots.length != this.items.length) {
    //         ErrorLog("assignHot:" + hots.length);
    //         return
    //     }

    //     // for (let i = 0; i < this.items.length; ++i) {
    //     //     // let item = this.items[i];
    //     //     // let hotNum = hots[i];

    //     //     // let isHot = cc.find("WheelItem/IsHot", item);
    //     //     // let h1 = cc.find("WheelItem/Hot/h1", item);
    //     //     // let h2 = cc.find("WheelItem/Hot/h2", item);
    //     //     // let h3 = cc.find("WheelItem/Hot/h3", item);
    //     //     // isHot.active = h1.active = h2.active = h3.active = false;
    //     //     // if (hotNum >= 7) isHot.active = true;

    //     //     // 随着下注时间减少，逐渐增加热度
    //     //     // if (gGameData.roundStep.remainSecond > 20) hotNum -= 3;
    //     //     // else if (gGameData.roundStep.remainSecond > 10) hotNum -= 2;

    //     //     // if (hotNum >= 3) h1.active = true;
    //     //     // if (hotNum >= 5) h2.active = true;
    //     //     // if (hotNum >= 7) h3.active = true;
    //     // }
    // }
    //更新界面下注区
    assignValue(values: number[]) {
        if (values.length != this.items.length) {
            cc.error("[GameError] " + "assignValue:" + values.length);
            return
        }
        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];
            let myBet = cc.find("WheelItem/MyBet", item);
            // let diamond = cc.find("Diamand", myBet);
            let amountLabel = cc.find("Amount", myBet).getComponent(cc.Label);
            let amountNum = values[i];
            if (amountNum == 0) {
                myBet.active = false;
                // diamond.active = false;
                // amountLabel.string = "You:";
            } else {
                myBet.active = true;
                let amountStr = amountNum < 1000 ? amountNum.toString() : amountNum / 1000 + "k";
                // diamond.active = true;
                amountLabel.string = amountStr;
            }
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.init();
    }

    // update (dt) {}
}
