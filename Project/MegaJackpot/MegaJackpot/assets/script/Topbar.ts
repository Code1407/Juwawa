// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../shared/Common";
import Views from "./Views";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Topbar extends cc.Component {

    @property(cc.Node)
    exit: cc.Node = null;

    @property(cc.Node)
    rule: cc.Node = null;

    @property(cc.Node)
    ruleDown: cc.Node = null;

    @property(cc.Node)
    ruleUp: cc.Node = null;

    @property(cc.Node)
    history: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.exit.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.quit();
        });
        let __this = this;
        this.rule.on(cc.Node.EventType.TOUCH_START, () => {
            Views.Instance.ruleView.active = true;

            __this.ruleUp.active = false;
            __this.ruleDown.active = true;
        });
        this.rule.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.ruleUp.active = true;
            __this.ruleDown.active = false;
        });
        this.rule.on(cc.Node.EventType.TOUCH_END, () => {
            __this.ruleUp.active = true;
            __this.ruleDown.active = false;
        });


        this.history.on(cc.Node.EventType.TOUCH_END, () => {
            Views.Instance.historyListView.active = true;
        });
    }

    // update (dt) {}
}
