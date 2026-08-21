// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import Audio from "../Audio";
import { Effect } from "../effect/FlyDiamond";
import Game from "../Game";
import { coolDownTime, gGameData, roundBetCountMax } from "../GameData";
import { arraySum } from "../interface/IBountyFootball";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import PlayerAccount from "../PlayerAccount";
import ChipMoveNodeUI from "./ChipMoveNodeUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AutoBetUI extends cc.Component {

    @property(cc.Node)
    AutoBg2: cc.Node = null;
    @property(cc.Node)
    NCAutoBg2: cc.Node = null;

    private autoBet: boolean = false;
    private NcAuto: boolean = false;

    private setCoolDown() {
        gGameData.roundBetCount++;
        gGameData.coolDown = true;
        setTimeout(() => {
            gGameData.coolDown = false;
        }, coolDownTime);
    }
    async onClick(e: cc.Event) {//连续自动下注
        (<any>window).updateAutoQuit?.();
        if ([EGameStatus.stop].includes(gGameData.status)) return;
        if (gGameData.coolDown || gGameData.roundBetCount > roundBetCountMax) return;

        this.setCoolDown();

        let player = PlayerAccount.Instance;
        let autoBetSum = player.hasLastWheel();
        this.NcAuto = !this.NcAuto
        this.switchNcButton();

        let moreChip: number = 0;
        if (this.NcAuto && gGameData.status == EGameStatus.bet && autoBetSum && !player.getHasBet()) {
            let wheelAmount = player.lastWheelChipAmount;
            let gradeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (let index = 0; index < wheelAmount.length; index++) {
                gradeList[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
            }
            let betResp = await player.bet(gGameData.roundStep.todayRound, gradeList, wheelAmount);
            for (let index = 0; index < wheelAmount.length; index++) {
                const element = wheelAmount[index];
                for (let j = 0; j < element.length; j++) {
                    let flyNum = element[j];
                    if (flyNum > 10) {
                        flyNum = 10;
                    }
                    moreChip += flyNum;
                    if (betResp && (await betResp).code == ETradeCode.success) {
                        for (let k = 0; k < flyNum; k++) {
                            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode[j], ChipMoveNodeUI.Instance.items[index], j, index, true, 2000);

                            if (Game.Instance.player.accountDiamond >= Game.Instance.balanceNum) {
                                for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
                                    Game.Instance.bettingBox.myBetNum[index].active = true;
                                    Game.Instance.bettingBox.allBetNum[index].active = true;

                                }
                            }
                        }
                    }
                }
            }
            if (moreChip > 1) {
                Audio.Instance.playfly();
            }
            else {
                Audio.Instance.playsendBet();
            }
        }
    }


    async onRepeat(e: cc.Event) {//单次再下注
        if ([EGameStatus.stop].includes(gGameData.status)) return;
        if (gGameData.coolDown || gGameData.roundBetCount > roundBetCountMax) return;
        if (gGameData.status != EGameStatus.bet) return;
        if(this.AutoBg2.active==true)return;//让它一回合只执行一次

        this.setCoolDown();

        let player = PlayerAccount.Instance;
        let autoBetSum = player.hasLastWheel();
        this.autoBet = !this.autoBet;
        if (this.autoBet) {
            this.switchButton();
        }

        let moreChip: number = 0;
        if (this.autoBet && gGameData.status == EGameStatus.bet && autoBetSum) {
            let wheelAmount = player.lastWheelChipAmount;
            // console.log("lastWheelChipAmount:"+JSON.stringify(wheelAmount));//上回合数
            
            let gradeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (let index = 0; index < wheelAmount.length; index++) {
                gradeList[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
            }
            let betResp = await player.bet(gGameData.roundStep.todayRound, gradeList, wheelAmount);
            for (let index = 0; index < wheelAmount.length; index++) {
                const element = wheelAmount[index];
                for (let j = 0; j < element.length; j++) {
                    let flyNum = element[j];
                    if (flyNum > 10) {
                        flyNum = 10;
                    }
                    moreChip += flyNum;
                    if (betResp && (await betResp).code == ETradeCode.success) {
                        for (let k = 0; k < flyNum; k++) {
                            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode[j], ChipMoveNodeUI.Instance.items[index], j, index, true, 2000);

                            if (Game.Instance.player.accountDiamond >= Game.Instance.balanceNum) {
                                for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
                                    Game.Instance.bettingBox.myBetNum[index].active = true;
                                    Game.Instance.bettingBox.allBetNum[index].active = true;

                                }
                            }
                        }
                    }
                }
            }
            if (moreChip > 1) {
                Audio.Instance.playfly();
            }
            else {
                Audio.Instance.playsendBet();
            }
        }
    }
    getAutoBet() {
        return this.autoBet;
    }

    setAutoBet(autoBet: boolean) {
        this.autoBet = autoBet;
        this.switchButton();
    }

    switchButton() {//Repeat按钮
        (<any>window).isAutoBetActive = this.NcAuto || this.autoBet;
        if (this.NCAutoBg2.active == true) {
            console.log("请不要开启(内测AUTO),再来使用这个Repeat!!");
            return;
        }
        
        if (Game.Instance.player.accountDiamond < Game.Instance.balanceNum && Game.Instance.player.hasLastWheel()) {
            this.AutoBg2.active = this.autoBet;
        }
        if (Game.Instance.player.hasLastWheel() == false) return;
        this.AutoBg2.active = this.autoBet;
    }

    ///////////////////////////////////////////////////////////////////
    ///内测AUTO  
    getNcAuto() {
        return this.NcAuto;
    }

    setNcAuto(NcAuto: boolean) {
        this.NcAuto = NcAuto;
        this.switchNcButton();
    }

    switchNcButton() {
        this.NCAutoBg2.active = this.NcAuto;
        (<any>window).isAutoBetActive = this.NcAuto || this.autoBet;
    }

    onDestroy() {
        (<any>window).isAutoBetActive = false;
    }
    ////////////////////////////////////////////////////////////////////
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        // this.switchButton();

        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.coolDown == true) return;
            // this.node.scaleX = this.node.scaleY = 1.2;
        });
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
    }

    // update (dt) {}
}
