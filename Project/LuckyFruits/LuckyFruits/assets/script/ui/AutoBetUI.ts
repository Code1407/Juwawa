// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";
import { checkTradeCode, setRechargeView } from "../../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import { IBetResp, arraySum, calNumber, createEmptyBetPositions } from "../interface/ILuckyFruits";
import Audio from "../Audio";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RepeatBetUI extends cc.Component {
    @property(cc.Node)
    ClickImage: cc.Node = null;

    coolDownTime = 200;
    private setCoolDown() {
        gGameData.coolDown = true;
        setTimeout(()=>{
            gGameData.coolDown = false;
        }, this.coolDownTime);
    } 

    onClick(e: cc.Event) {
        Audio.Instance.playClick();
        if(Game.Instance.autoBet == true){
            Game.Instance.autoBet = false;
            this.switchButton();
        }
        else{
            Game.Instance.autoBet = true;
            this.switchButton();
        }   
        if (Game.Instance.autoBet && gGameData.roundStep.status == EGameStatus.bet
            && gGameData.roundStep.remainSecond > 3) {
            let player = Game.Instance.player;
            if (player.getNotedBat() == false && player.autoRecordBetSum() <= player.accountDiamond) {
                let wheelAmount = player.getAutoBetAmount();
                let gradeList = createEmptyBetPositions();
                if(wheelAmount && wheelAmount.length > 0){
                    if(wheelAmount[0].length > 0){
                        for (let index = 0; index < wheelAmount.length; index++) {
                            player.curBetLimit[index] = gradeList[index] = arraySum(wheelAmount[index])>0?1:0;
                        }
                        let betTotal = 0;
                        for(let side=0;side<wheelAmount.length;side++)
                        {
                            betTotal += calNumber(wheelAmount[side]);
                        }
                        gGameData.BetTotalNumber+=betTotal;
                        player.bet(gGameData.roundStep.todayRound,gradeList,wheelAmount);
                        player.setNotedBetCount(gradeList);
                        Game.Instance.isSendAutoBetOnce = true;//加个保护，避免 start 开局瞬间点击autobet onclick()会一共发了两次
                        //player.wheelAmount = wheelAmount;
                        Game.Instance.FlyChip({batIndex:gradeList,num:wheelAmount});
                        
                    }
                }
            }
        }  
    }
    switchButton() {
        this.ClickImage.active = Game.Instance.autoBet;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.switchButton();
    }

    // update (dt) {}
}
