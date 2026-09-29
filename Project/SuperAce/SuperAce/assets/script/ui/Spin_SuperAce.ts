// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Game from "../Game";
import { gGameData } from "../GameData";
import SlotSuperAce from "../Slot_SuperAce";
import { EGameStatus } from "../../shared3/interface/IGame";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SpinSuperAce extends cc.Component {
    
    static _instance: any = null;

    static get Instance(): SpinSuperAce {
        if(!this._instance){
            this._instance = cc.find("Canvas/Bottombar/Spin_SuperAce").getComponent(SpinSuperAce);
        }
        return this._instance
    }

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, ()=>{
            Audio.Instance.playSpinClick();
            if(SlotSuperAce.Instance.isRunning == true) return;
            if(gGameData.status != EGameStatus.bet || Game.Instance.isRecoveringRound()) {
                console.warn("Ignore spin while server round is not ready", gGameData.status);
                return;
            }
            if(SlotSuperAce.Instance.multipleBar.freeEffOn){
                SlotSuperAce.Instance.multipleBar.stopEff();
            }
            // console.log("SpinSuperAce start");
            SlotSuperAce.Instance.IsRunning = true;
            if(SlotSuperAce.Instance.freeMode)
                Game.Instance.player.betFree();
            else 
                Game.Instance.player.betNormal(gGameData.betAmountIndex);
        })
    }

    darkNode() {
        this.node.color = cc.color(128,128,128);
        for(let i = 0; i < this.node.childrenCount; i++){
            this.node.children[i].color = cc.color(128,128,128);
        }
    }

    lightNode() {
        this.node.color = cc.color(255,255,255);
        for(let i = 0; i < this.node.childrenCount; i++){
            this.node.children[i].color = cc.color(255,255,255);
        }
    }

}
