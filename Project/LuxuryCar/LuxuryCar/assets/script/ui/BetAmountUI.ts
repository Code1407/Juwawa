// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import Audio from "../Audio";
import { gGameData } from "../GameData";
import { EGameStatus } from "../../shared3/interface/IGame";


const {ccclass} = cc._decorator;

@ccclass
export default class BetAmountUI extends cc.Component {

    buttonIndex: number = 0;
    items: Array<cc.Node> = null;

    onClick(e: cc.Event) {
        (<any>window).updateAutoQuit?.();
        if ([EGameStatus.final, EGameStatus.stop].includes(gGameData.status)) return;

        Audio.Instance.playchangebet();
        gGameData.betAmountIndex = this.buttonIndex;
        Game.Instance.player.setBetAmountButton(gGameData.betAmountIndex);
        for (let i = 0; i < this.items.length; ++i) {
            cc.find("BetAmount/bg2", this.items[i]).active = (gGameData.betAmountIndex == i);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {    
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.status in [EGameStatus.bet, EGameStatus.run, EGameStatus.run2final]) 
                this.node.scaleX = this.node.scaleY = 1.2; // this.dark(); 
        });
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
    }

    // update (dt) {}
}
