// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ColorChange from "./ColorChange";

const {ccclass} = cc._decorator;

@ccclass
export default class BetTimer extends ColorChange {

    betEffect(second: number) {
        this.recover();
        this.node.getChildByName("Select").active = true;
        this.node.getChildByName("Run").active = false;
        return;
    }

    runEffect(second: number) {
        this.recover();
        this.node.getChildByName("Select").active = false;
        this.node.getChildByName("Run").active = true;
        return;
    }

    finalEffect() {
        this.node.getChildByName("Select").active = false;
        this.node.getChildByName("Run").active = true;
        this.dark();
        return;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onLoad () {
        this.init();
    }
}
