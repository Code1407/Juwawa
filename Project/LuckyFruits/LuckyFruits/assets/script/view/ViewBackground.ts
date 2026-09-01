// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";
//import { EGameStatus } from "../interface/IFerrisWheel";

const {ccclass} = cc._decorator;

@ccclass
export default class ViewBackground extends cc.Component {

    // onClick(e: cc.Event) {
    //     this.node.parent.active = false;
    // }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        // this.node.on(cc.Node.EventType.TOUCH_START, () => {
        //     if (gGameData.status == EGameStatus.stop) Game.Instance.start();
        //     else this.node.parent.active = false;
        // });

    }

    // update (dt) {}
}
