// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ExtraView from "./ExtraView";
import BigWinView from "./view/BigWinView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Views extends cc.Component {

    @property(cc.Node)
    ruleView: cc.Node = null;

    @property(cc.Node)
    settingView: cc.Node = null;

    @property(cc.Node)
    noticeView: cc.Node = null;

    @property(cc.Node)
    playingView: cc.Node = null;

    @property(cc.Node)
    historyView:cc.Node = null;

    @property(cc.Node)
    confirm: cc.Node = null;

    static instance: Views = null;

    static get Instance() {
        if (!this.instance) this.instance =cc.find("Canvas/Views").getComponent(Views);
        return this.instance;
    }

    closeAll() {
        /*
        this.bigWinView.active = false;
        this.jackpotView.active = false;
        this.freeGameView.active = false;
        this.freeGameWinView.active = false;
        */
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.confirm.on(cc.Node.EventType.TOUCH_START, ()=>{
            ExtraView.Instance.ruleView.active = false;
            this.playingView.active = false;
        }, this);
    }

    // update (dt) {}
}
