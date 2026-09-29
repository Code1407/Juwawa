// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { coolDownTime, gGameData, roundBetCountMax } from "../GameData";
import Game from "../Game";
import Audio from "../Audio";
import { Effect } from "../effect/FlyDiamond";
import { EGameStatus } from "../../shared3/interface/IGame";
import ChipMoveNodeUI from "./ChipMoveNodeUI";
import { setRechargeView } from "../../shared2/GlobalViewsLoader";



const { ccclass, property } = cc._decorator;

@ccclass
export default class WheelItemUI extends cc.Component {

    @property(cc.Node)
    scaleNode: cc.Node = null;

    buttonIndex: number = 0;

    onClick(e: cc.Event, eventData: string) {
        (<any>window).updateAutoQuit?.();
        if (gGameData.status != EGameStatus.bet) return;
        if(gGameData.status==EGameStatus.bet&&gGameData.roundStep.remainSecond<=3)return;
        this.playerBet(this.buttonIndex);
        // console.log("this.buttonIndex:"+this.buttonIndex);
        
    }
    //冷却
    private setCoolDown() {
        gGameData.roundBetCount++;
        gGameData.coolDown = true;
        setTimeout(() => {
            gGameData.coolDown = false;
        }, coolDownTime);
    }

    async playerBet(which: number) {
        if (gGameData.coolDown || gGameData.roundBetCount > roundBetCountMax) return;
        this.setCoolDown();


        //let notedWheel = Game.Instance.player.getNotedWheel();
        //if (notedWheel.length < 6 || notedWheel.includes(which)) {
        let player = Game.Instance.player;
        // if (player.getAccountDiamond() >= betAmount) {

        //     await player.bet(gGameData.roundStep.todayRound, which, betAmount);
        // } else {
        //     Game.Instance.poppusViewUI.rechargeView.active = true;
        // }
        let betGrade = (<any>window).betGrade;

        let betGradeIndex: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        betGradeIndex[this.buttonIndex] = 1;
        let gradeAmounts = betGrade && Array.isArray(betGrade.gradeAmounts)
            ? betGrade.gradeAmounts
            : (betGrade && typeof betGrade.getGradeAmounts === "function" ? betGrade.getGradeAmounts() : []);
        let gradeCount = gradeAmounts.length;
        if (gradeCount <= 0 || gGameData.betAmountIndex >= gradeCount) return;
        let betGradeNum: number[][] = [];
        for (let i = 0; i < 10; i++) {
            betGradeNum.push(new Array(gradeCount).fill(0));
        }
        let betNum: number[] = new Array(gradeCount).fill(0);
        betNum[gGameData.betAmountIndex] = 1;
        betGradeNum[this.buttonIndex] = betNum;

        let needDiamon: number = 0;
        let gradeDiamon: number = 0;
        for (let i = 0; i < betGradeNum.length; i++) {
            gradeDiamon = 0;
            for (let j = 0; j < betGradeNum[i].length; j++) {
                if (betGradeNum[i][j] > 0) {
                    gradeDiamon += betGrade.getGradeAmount(j) * betGradeNum[i][j]
                }
            }
            needDiamon += gradeDiamon;
            Game.Instance.balanceNum = needDiamon;
        }
        // 本地显示余额不足时先同步，以服务端余额为准。
        if (!(<any>window).enoughMoney(needDiamon)) {
            await player.synchronize();
        }
        if (player.accountDiamond >= needDiamon) {//做一次余额判断。余额本来不需要放里面的。
            Audio.Instance.playsendBet();
            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode[gGameData.betAmountIndex], ChipMoveNodeUI.Instance.items[this.buttonIndex], gGameData.betAmountIndex, this.buttonIndex, true, 2000);
            //player.setNotedBatCount(betGrade);
            await player.bet(gGameData.roundStep.todayRound, betGradeIndex, betGradeNum);
            gGameData.roundBetCount++;
        }
        else {
            Audio.Instance.playClick();
            setRechargeView(true);
        }
    }


    start() {
        // this.node.on(cc.Node.EventType.TOUCH_START, () => {
        //     if (gGameData.status == EGameStatus.bet) {
        //         this.scaleNode.scaleX = this.scaleNode.scaleY = 1.2; // this.dark(); 
        //     }
        // });
        // this.node.on(cc.Node.EventType.TOUCH_END, () => {
        //     this.scaleNode.scaleX = this.scaleNode.scaleY = 1; // this.recover();
        // });
        // this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
        //     this.scaleNode.scaleX = this.scaleNode.scaleY = 1; // this.recover();
        // });
    }
}
