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
    reconnectButton: cc.Node = null;

    @property(cc.Node)
    exitButton: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.reconnectButton.on(cc.Node.EventType.TOUCH_START, async () => {
            if (!this.reconnectButton.active) return;
            this.reconnectButton.active = false;
            try {
                const success = await (<any>window).HotGameReconnect?.();
                if (success) this.node.active = false;
            }
            finally {
                if (this.node && this.node.isValid) {
                    this.reconnectButton.active = true;
                }
            }
        });
        this.exitButton.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.quit(); 
        });
    }

    // update (dt) {}
}
