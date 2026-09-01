// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import { gGameData } from "../GameData";
import { arraySum, calNumber, createEmptyBetNum, createEmptyBetPositions, getBetGradeAmounts } from "../interface/ILuckyFruits";
import Game from "../Game";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
const { ccclass, property } = cc._decorator;
const roundBetCountMax = 100;
const coolDownTime = 120;

@ccclass
export default class BetUI extends cc.Component {

    @property(cc.Node)
    player: cc.Node = null;
    @property(cc.Integer)
    indexRank: number = 0;


    kedong: boolean = false;
    coolDownTime = 200;
    private setCoolDown() {
        if (gGameData.coolDown == true) return;
        gGameData.coolDown = true;
        setTimeout(() => {
            gGameData.coolDown = false;
        }, coolDownTime);
    }

    async onClick(e: cc.Event, eventData: string) {
        if (gGameData.coolDown) {
            return;
        }
        this.setCoolDown();
        if (gGameData.roundBetCount > roundBetCountMax) {
            // Game.Instance.audio.playClick();
            return;
        }
        //console.log("gGameData.roundStep.status="+gGameData.roundStep.status);
        if (gGameData.roundStep.status != EGameStatus.bet && gGameData.roundStep.status != EGameStatus.run && gGameData.roundStep.status != EGameStatus.final) {
            // Game.Instance.audio.playClick();
            return;//非下注时return
        }
        else {
            if ((gGameData.roundStep.status == EGameStatus.bet && gGameData.roundStep.remainSecond <= 3) || gGameData.roundStep.status == EGameStatus.run || gGameData.roundStep.status == EGameStatus.final) {
                // Game.Instance.audio.playClick();
                Game.Instance.ShowStopBetView();
                return;
            }
        }
        let _player = Game.Instance.player;
        let batCount: number[] = _player.getNotedBatCount();
        // if(this.indexRank!=4 && arraySum(batCount)>=2 && batCount[this.indexRank-1]==0){
        //     Game.Instance.audio.playClick();
        //     Game.Instance.ShowBetLimitView();
        //     return;
        // }
        //console.log("gGameData.roundStep.remainSecond="+gGameData.roundStep.remainSecond);
        //let num=+(cc.find("AllNumber/num",this.node.parent).getComponent(cc.Label).string)
        //cc.find("AllNumber/num",this.node.parent).getComponent(cc.Label).string=num+this.obj[gGameData.betAmountIndex] as any as string;

        //let num2=+(cc.find("MineNumber/num",this.node.parent).getComponent(cc.Label).string)
        //cc.find("MineNumber/num",this.node.parent).getComponent(cc.Label).string=num+this.obj[gGameData.betAmountIndex] as any as string;

        //Effect.FlyChip(this.player, this.node,ChangeChip.Instance.chips[gGameData.betAmountIndex]);//改为由服务器推送，统一派发。投注，飞筹码

        let gradeAmounts = getBetGradeAmounts();
        if (gradeAmounts.length == 0 || gGameData.betAmountIndex < 0
            || gGameData.betAmountIndex >= gradeAmounts.length) {
            console.error("invalid server bet grade config", gradeAmounts);
            return;
        }
        let betGradeGame: number[] = createEmptyBetPositions();
        betGradeGame[this.indexRank - 1] = 1;
        let betGradeNum: number[][] = createEmptyBetNum();
        let betNum: number[] = betGradeNum[this.indexRank - 1];
        betNum[gGameData.betAmountIndex] = 1;

        let thisBet = calNumber(betNum);
        if (gGameData.betMax > 0 && gGameData.BetTotalNumber + thisBet > gGameData.betMax) {
            // Game.Instance.audio.playClick();
            let str = "You can only bet " + gGameData.betMax + " each round"
            Game.Instance.BetNumLimitView.setLabelValue(str);
            Game.Instance.BetNumLimitView.node.active = true;
            return;
        }
        gGameData.BetTotalNumber += thisBet;
        let needDiamon: number = 0;
        let gradeDiamon: number = 0;
        for (let i = 0; i < betGradeNum.length; i++) {
            gradeDiamon = calNumber(betGradeNum[i]);
            needDiamon += gradeDiamon;
        }
        for (let j = 0; j < Game.Instance.Desks.length; j++) {
            if (Game.Instance.Desks[j].active == false) {
                this.kedong = true;
            }
        }
        if (_player.accountDiamond >= needDiamon) {//做一次余额判断。余额本来不需要放里面的。
            _player.setNotedBatCount(betGradeGame);
            let chip: cc.Node = Game.Instance.FlyChipByPos(this.indexRank - 1, gGameData.betAmountIndex);//下注位置，下注挡位
            gGameData.roundBetCount++;
            let resp = await _player.onceBet(gGameData.roundStep.todayRound, betGradeGame, betGradeNum);
            if (resp == null || resp.code == ETradeCode.insufficient) {
                chip.active = false;
                gGameData.roundBetCount--;
            }
            //console.log(JSON.stringify(_player.wheelAmount));
        }
        else {
            // Game.Instance.audio.playClick();
            Game.Instance.ShowRechargeView(needDiamon);
        }
    }
    anYa01() {
        if (this.kedong) {
            Game.Instance.Anya1.setAnimation(0, "1 pg", false);
            this.kedong = false;
        }
    }
    anYa02() {
        if (this.kedong) {
            Game.Instance.Anya2.setAnimation(0, "animation", false);
            this.kedong = false;
        }
    }
    anYa03() {
        if (this.kedong) {
            Game.Instance.Anya3.setAnimation(0, "animation", false);
            this.kedong = false;
        }
    }
    anYa04() {
        if (this.kedong) {
            Game.Instance.Anya4.setAnimation(0, "animation", false);
            this.kedong = false;
        }
    }
    anYa05() {
        if (this.kedong) {
            Game.Instance.Anya5.setAnimation(0, "animation", false);
            this.kedong = false;
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
