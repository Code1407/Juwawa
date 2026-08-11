// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../../shared/Common";
import Game from "../Game";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RechargeView extends cc.Component {

    @property(cc.Node)
    reconnectButton: cc.Node = null;

    @property(cc.Node)
    exitButton: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.reconnectButton.on(cc.Node.EventType.TOUCH_START, () => {
            Game.Instance.start();
            this.node.active = false; 
        });
        this.exitButton.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.quit(); 
        });
    }

    // update (dt) {}
}
