// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SettingBtnUI extends cc.Component {
    @property(cc.Node)
    content: cc.Node = null;
    

    start () {
        this.content.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
    }

    // update (dt) {}
}
