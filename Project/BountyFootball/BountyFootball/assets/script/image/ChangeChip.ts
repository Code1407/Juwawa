// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class ChangeChip extends cc.Component {

    @property(cc.SpriteFrame)
    chips: Array<cc.SpriteFrame> = [];

    @property(cc.Label)
    NumLabel:cc.Label=null;

    static get Instance() {
        return cc.find("Template/ChangeChip").getComponent(ChangeChip);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
