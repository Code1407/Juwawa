// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import ExtraView from "../ExtraView";
import Game from "../Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "../GameData";
import SlotsFortuneSlot from "../Slot_FortuneSlot";
import AmountSelectorUI from "./AmountSelectorUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SpinFortune extends cc.Component {
    
    isClicked: boolean = false;
    static _instance: any = null;

    static get Instance(): SpinFortune {
        if(!this._instance){
            this._instance = cc.find("Canvas/Game/Bottombar/Spin_Fortune").getComponent(SpinFortune);
        }
        return this._instance
    }

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, ()=>{
            if(ExtraView.Instance.isfly) return;
            if(this.isClicked) return;
            this.isClicked = true;
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            // console.log(SlotsFortuneSlot.Instance.isRunning)
            if(SlotsFortuneSlot.Instance.isRunning) {
                SlotsFortuneSlot.Instance.stop();
            }else if(!SlotsFortuneSlot.Instance.isAuto){
                Game.Instance.player.betNormal(gGameData.betAmountIndex);
            }
            Audio.Instance.playClickSpin();
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
