// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Game from "../Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "../GameData";
import SlotSuperAce from "../Slot_SuperAce";
import Views from "../Views";
import AmountSelectorUI from "./AmountSelectorUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BetAmountItemUI extends cc.Component {

    betIndex: number = 0;

    start () {}
    

    onClick(){
        if(SlotSuperAce.Instance.isRunning || SlotSuperAce.Instance.isAuto || SlotSuperAce.Instance.freeMode) {
            Views.Instance.playingView.active = true;
            return;
        }
        let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
        AmountSelectorUI.Instance.BetAmountIndex = this.betIndex;
        AmountSelectorUI.Instance.setBetAmountLabel(betAmount[gGameData.betAmountIndex]);
        AmountSelectorUI.Instance.betAmountView.active = false;
        Audio.Instance.playClick();
        let playerSettings = {
            lastBetAmountButton: gGameData.betAmountIndex,
            soundVol: gGameData.soundVol
        }
        Game.Instance.player.updateSettings(playerSettings).catch(error => {
            console.warn("Save settings failed", error);
        });
    }

    // update (dt) {}
}
