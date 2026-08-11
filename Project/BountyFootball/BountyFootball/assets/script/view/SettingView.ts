// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import Audio from "../Audio";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SettingView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    switchButton: cc.Node = null;

    @property(cc.Node)
    onNode: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.onNode.active = Audio.Instance.audioOn;
        
        this.switchButton.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.audioOn = !Audio.Instance.audioOn;
            this.onNode.active = Audio.Instance.audioOn;  
        });

        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
    }

    // update (dt) {}
}
