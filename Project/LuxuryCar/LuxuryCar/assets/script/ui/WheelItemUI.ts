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
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import ChipMoveNodeUI from "./ChipMoveNodeUI";



const {ccclass,property} = cc._decorator;

@ccclass
export default class WheelItemUI extends cc.Component {

    @property(cc.Node)
    scaleNode: cc.Node = null;

    buttonIndex: number = 0;

    onClick(e: cc.Event, eventData: string) {
        if (gGameData.status != EGameStatus.bet) return;
        this.playerBet(this.buttonIndex); 
    }
//冷却
    private setCoolDown() {
        gGameData.roundBetCount++;
        gGameData.coolDown = true;
        setTimeout(()=>{
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

        let betGradeIndex:number[] = [0,0,0,0,0,0,0,0,0,0];
        betGradeIndex[this.buttonIndex] = 1;
        let gradeCount = betGrade && betGrade.gradeAmounts ? betGrade.gradeAmounts.length : 4;
        let betGradeNum:number[][] = [];
        for (let i = 0; i < 10; i++) {
            betGradeNum.push(new Array(gradeCount).fill(0));
        }
        let betNum:number[] = new Array(gradeCount).fill(0);
        betNum[gGameData.betAmountIndex] = 1;
        betGradeNum[this.buttonIndex] = betNum;

        let needDiamon:number = 0;
        let gradeDiamon:number = 0;
        for(let i=0;i < betGradeNum.length;i++){
            gradeDiamon = 0;
            for(let j=0;j < betGradeNum[i].length;j++){
                if(betGradeNum[i][j] > 0){
                    let gradeAmount = betGrade && typeof betGrade.getGradeAmount === "function" ? betGrade.getGradeAmount(j) : 0;
                    gradeDiamon += gradeAmount * betGradeNum[i][j]
                }
            }
            needDiamon += gradeDiamon;
            Game.Instance.balanceNum=needDiamon;
        }
        Audio.Instance.playsendBet();
        //player.setNotedBatCount(betGrade);
        let waitresp = await player.bet(gGameData.roundStep.todayRound, betGradeIndex, betGradeNum);
        //console.log(JSON.stringify(_player.wheelAmount));
        if (waitresp?.code == ETradeCode.success) {
            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode, ChipMoveNodeUI.Instance.items[this.buttonIndex],gGameData.betAmountIndex,this.buttonIndex,true,2000);
            gGameData.roundBetCount++;
        }
    }


    start () {
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
