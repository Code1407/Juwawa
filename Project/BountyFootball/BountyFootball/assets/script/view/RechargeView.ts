// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../../shared/Common";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RechargeView extends cc.Component {

    @property(cc.Node)
    confirmButton: cc.Node = null;

    @property(cc.Node)
    cancelButton: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.confirmButton.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.recharge();
            this.node.active = false;
        });
        this.cancelButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false; 
        });
    }

    // update (dt) {}
}
