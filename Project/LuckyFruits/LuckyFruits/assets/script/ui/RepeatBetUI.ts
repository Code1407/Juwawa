// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";
import { setRechargeView } from "../../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import { IBetResp, arraySum, calNumber, createEmptyBetNum, createEmptyBetPositions, getBetGradeAmounts } from "../interface/ILuckyFruits";
import Audio from "../Audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RepeatBetUI extends cc.Component {

    @property(cc.Node)
    RepeatBtn: cc.Node = null;

    @property(sp.Skeleton)
    RepeatAnimation: sp.Skeleton= null;

    coolDownTime = 200;
    private setCoolDown() {
        gGameData.coolDown = true;
        setTimeout(() => {
            gGameData.coolDown = false;
        }, this.coolDownTime);
    }

    async onClick(e: cc.Event) {
        // Audio.Instance.clickBet();
        this.RepeatAnimation.setAnimation(1,"1",false);
        // if(Game.Instance.autoBet == true){
        //     Game.Instance.autoBet = false;
        //     this.switchButton();
        // }
        // else{
        //     Game.Instance.autoBet = true;
        //     this.switchButton();
        // }   

        if (gGameData.coolDown) {
            return;
        }
        if (gGameData.roundStep.status != EGameStatus.bet || gGameData.roundStep.remainSecond <= 3) {
            Game.Instance.ShowStopBetView();
            return;
        }
        this.setCoolDown();
        if (gGameData.roundStep.status == EGameStatus.bet) {
            let player = Game.Instance.player;
            let wheelAmount = player.getAutoBetAmount();
            if (wheelAmount.length == 0) {
                return;
            }
            let batCount: number[] = player.getNotedBatCount().concat();
            for (let index = 0; index < batCount.length; index++) {
                if (batCount[index] == 0) {
                    batCount[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
                }
            }
            // if(arraySum(batCount) >=3){
            //     Audio.Instance.playClick();
            //     Game.Instance.ShowBetLimitView();
            //     return;
            // }
            if (player.autoRecordBetSum() <= player.accountDiamond) {
                let gradeList = createEmptyBetPositions();
                if (wheelAmount && wheelAmount.length > 0) {
                    if (wheelAmount[0].length > 0) {
                        for (let index = 0; index < wheelAmount.length; index++) {
                            gradeList[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
                            if (player.curBetLimit[index] == 0) {
                                player.curBetLimit[index] = gradeList[index];
                            }
                        }
                        let betTotal = 0;
                        for (let side = 0; side < wheelAmount.length; side++) {
                            betTotal += calNumber(wheelAmount[side]);
                        }
                        if (gGameData.betMax > 0 && gGameData.BetTotalNumber + betTotal > gGameData.betMax) {
                            Audio.Instance.playClick();
                            const langInCode = (<any>window).langInCode;
                            let str = (langInCode && langInCode.globalContent.betMaxLimit || "You can only cost {0} each round").replace("{0}", gGameData.betMax.toString());
                            Game.Instance.BetNumLimitView.setLabelValue(str);
                            Game.Instance.BetNumLimitView.node.active = true;
                            return;
                        }
                        let resp: IBetResp = await player.bet(gGameData.roundStep.todayRound, gradeList, wheelAmount);
                        //player.wheelAmount = wheelAmount;
                        if (resp && resp.code == ETradeCode.success) {
                            gGameData.BetTotalNumber += betTotal;
                            Game.Instance.FlyChip({ batIndex: gradeList, num: wheelAmount });

                        }
                        let msg = {
                            auto: Game.Instance.autoBet,
                            round: gGameData.roundStep.todayRound,
                            lastItems: wheelAmount,
                            account: player.accountDiamond
                        };
                        player.actionRecord(JSON.stringify(msg));
                    }
                }
            }
            else {
                setRechargeView(true);
            }
        }
    }

    async allBetClick(e: cc.Event) {
        Audio.Instance.playClick();
        // if(Game.Instance.autoBet == true){
        //     Game.Instance.autoBet = false;
        //     this.switchButton();
        // }
        // else{
        //     Game.Instance.autoBet = true;
        //     this.switchButton();
        // }   
        if (gGameData.coolDown) {
            return;
        }
        if (gGameData.roundStep.status != EGameStatus.bet || gGameData.roundStep.remainSecond <= 3) {
            Game.Instance.ShowStopBetView();
            return;
        }
        this.setCoolDown();
        if (gGameData.roundStep.status == EGameStatus.bet) {
            let player = Game.Instance.player;
            let wheelAmount = createEmptyBetNum();
            let gradeAmounts = getBetGradeAmounts();
            let selectedGrade = gGameData.betAmountIndex;
            if (gradeAmounts.length == 0 || selectedGrade < 0 || selectedGrade >= gradeAmounts.length) {
                console.error("invalid server bet grade config", gradeAmounts);
                return;
            }
            let betSUM = 0;
            for (let i = 0; i < wheelAmount.length; i++) {
                wheelAmount[i][selectedGrade] = 1;
                betSUM += gradeAmounts[selectedGrade];
            }
            // console.log(betSUM);
            // return;
            if (wheelAmount.length == 0) {
                return;
            }

            // let batCount:number[] = player.getNotedBatCount().concat();
            // for (let index = 0; index < batCount.length; index++) {
            //     if(batCount[index] == 0){
            //         batCount[index] = arraySum(wheelAmount[index])>0?1:0;
            //     }
            // }
            // if(arraySum(batCount) >=3){
            //     Audio.Instance.playClick();
            //     Game.Instance.ShowBetLimitView();
            //     return;
            // }
            if (betSUM <= player.accountDiamond) {
                let gradeList = createEmptyBetPositions();
                if (wheelAmount && wheelAmount.length > 0) {
                    if (wheelAmount[0].length > 0) {
                        for (let index = 0; index < wheelAmount.length; index++) {
                            gradeList[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
                            if (player.curBetLimit[index] == 0) {
                                player.curBetLimit[index] = gradeList[index];
                            }
                        }
                        let betTotal = 0;
                        for (let side = 0; side < wheelAmount.length; side++) {
                            betTotal += calNumber(wheelAmount[side]);
                        }

                        if (gGameData.betMax > 0 && gGameData.BetTotalNumber + betTotal > gGameData.betMax) {
                            Audio.Instance.playSendBet();
                            const langInCode = (<any>window).langInCode;
                            let str = (langInCode && langInCode.globalContent.betMaxLimit || "You can only cost {0} each round").replace("{0}", gGameData.betMax.toString());
                            Game.Instance.BetNumLimitView.setLabelValue(str);
                            Game.Instance.BetNumLimitView.node.active = true;
                            return;
                        }

                        let resp: IBetResp = await player.bet(gGameData.roundStep.todayRound, gradeList, wheelAmount);
                        //player.wheelAmount = wheelAmount;
                        if (resp && resp.code == ETradeCode.success) {
                            
                            gGameData.BetTotalNumber += betTotal;
                            Game.Instance.FlyChip({ batIndex: gradeList, num: wheelAmount });
                        }
                        let msg = {
                            auto: Game.Instance.autoBet,
                            round: gGameData.roundStep.todayRound,
                            lastItems: wheelAmount,
                            account: player.accountDiamond
                        };
                        player.actionRecord(JSON.stringify(msg));
                    }
                }
            }
            else {
                setRechargeView(true);
            }
        }
    }

    switchButton() {
        cc.find("Button/bg1", this.node).active = !Game.Instance.autoBet;
        cc.find("Button/bg2", this.node).active = Game.Instance.autoBet;
    }
    StopBtn() {
        Audio.Instance.playCardOut();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_START, () => {
            //this.node.scale = 1.2;
            cc.find("Button/bg2", this.node).active = true;
        });
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scale = 1;
            cc.find("Button/bg2", this.node).active = false;
        });
        cc.find("Button", this.node).on(cc.Node.EventType.MOUSE_UP, () => {
            this.node.scale = 1;
            cc.find("Button/bg2", this.node).active = false;
        });
        //this.switchButton();
    }

    // update (dt) {}
}
