// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";
import Audio from "../Audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BetAmountUI extends cc.Component {

    buttonIndex: number = 0;
    items: Array<cc.Node> = null;

    onClick(e: cc.Event) {
        //Audio.Instance.clickBet();
        Audio.Instance.playCardOut();
        gGameData.betAmountIndex = this.buttonIndex;
        let playerSettings = {
            soundVol: gGameData.soundVol,
            lastBetAmountButton: gGameData.betAmountIndex
        }
        Game.Instance.player.updateSettings(playerSettings);

        console.log("BetAmountUI onClick", this.items.length);

        for (let i = 0; i < this.items.length; ++i) {
            cc.find("BetAmount/Mask/dark", this.items[i]).active = true;
            cc.find("BetAmount/bg2", this.items[i]).active = (gGameData.betAmountIndex == i);
            cc.find("BetAmount/Mask/dark", this.items[i]).active = !(gGameData.betAmountIndex == i);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.scale = 1.2;
        });
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scale = 1;
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scale = 1;
        });
    }

    // update (dt) {}
}
