// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

import WheelsEffect from "./effect/WheelsEffect";
import { EGameStatus } from "../shared3/interface/IGame";
import Audio from "./Audio";


@ccclass
export default class Wheels extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];

    @property(cc.Node)
    betTimer: cc.Node = null;

    @property(cc.Node)
    shake: cc.Node = null;

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
                setTimeout(() => {
                    this.betTimer.active = true;
                }, 1000)
                cc.find("BetTime/Select/RemainSecond/Number", this.node).getComponent(cc.Label).string = Math.round(remainSecond).toString();
                // console.log("bet:"+Math.round(remainSecond).toString());
                if (remainSecond == 1) {
                    this.betTimer.runAction(
                        cc.repeat(
                            cc.sequence(
                                cc.rotateTo(0.07, 10.0),
                                cc.rotateTo(0.07, 0.0),
                                cc.rotateTo(0.07, -10.0),
                                cc.rotateTo(0.07, 0.0)
                            ), 7)
                    )
                }
                else if (remainSecond < 4 && remainSecond > 0) {
                    if (this.isShake == 0) {
                        this.doShake();
                    }
                }
                else if (remainSecond <= 1) {
                    this.betTimer.active = false;
                }
                break;
            case EGameStatus.run:
                this.betTimer.active = false;
                this.betTimer.angle = 0;
                this.isShake = 0;
                cc.Tween.stopAllByTarget(this.betTimer);
                cc.Tween.stopAllByTarget(this.shake);
                this.shake.opacity = 0;
                cc.find("BetTime/Run/RemainSecond/Number", this.node).getComponent(cc.Label).string = Math.round(remainSecond).toString();
                // console.log("run:" + Math.round(remainSecond).toString());
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
    isShake = 0;
    doShake() {
        this.isShake = 1;
        let action = cc.repeatForever(
            cc.sequence(
                cc.rotateTo(0.07, -15),
                cc.rotateTo(0.07, 0),
                cc.rotateTo(0.07, 15),
                cc.rotateTo(0.07, 0),
            )
        )
        cc.tween(this.shake)
            .to(0.7, { opacity: 255 })
            .to(0.7, { opacity: 0 })
            .to(0.7, { opacity: 255 })
            .to(1, { opacity: 0 })
            .start();

        this.betTimer.runAction(action);
        setTimeout(() => {
            this.betTimer.stopAction(action);
        }, 3000);
    }
    inRun(runSecond: number) {
        this.runIndex = this.effWheels.runEffect(runSecond);
    }
    stratRecoverItems() {
        this.effWheels.stratRecoverItems();
    }
    startADD() {
        this.effWheels.startADD();
    }

    inRun2Final(result: number): boolean {
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
        this.runIndex = this.effWheels.runEffect(0);
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
