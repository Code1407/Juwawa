// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../shared/Common";
import Audio from "./Audio";
import Bottombar from "./Bottombar";
import ExtraView from "./ExtraView";
import Views from "./Views";
import AmountSelectorUI from "./ui/AmountSelectorUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Topbar extends cc.Component {

    @property(cc.Node)
    exit: cc.Node = null;

    @property(cc.Node)
    rule: cc.Node = null;

    @property(cc.Node)
    setting: cc.Node = null;

    @property(cc.Node)
    history: cc.Node = null;

    static instance: Topbar = null;

    static get Instance():Topbar {
        if(!this.instance) this.instance = cc.find("Canvas/Game/Topbar").getComponent(Topbar);
        return this.instance;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.exit.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            sdk.quit();
        });
        let __this = this;
        this.setting.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            Bottombar.Instance.optionsView.active = false;
            Views.Instance.settingView.active = true;
            Audio.Instance.playClick();
        });
        this.rule.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            Bottombar.Instance.optionsView.active = false;
            Views.Instance.ruleView.active = true;
            Audio.Instance.playClick();
        });
        this.history.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            Bottombar.Instance.optionsView.active = false;
            Views.Instance.historyView.active = true;
            Audio.Instance.playClick();
        });
    }

    // update (dt) {}
}
