// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RuleView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.ScrollView)
    view: cc.ScrollView = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playClick();
            this.node.active = false;
        });

        this.bg.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
    }

    protected onEnable(): void {
        this.view.scrollToTop(0.3);
    }

    // update (dt) {}
}
