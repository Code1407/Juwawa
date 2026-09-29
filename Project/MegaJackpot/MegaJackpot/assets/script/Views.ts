// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BigWinView from "./view/BigWinView";
import FreeGameView from "./view/FreeGameView";
import JackpotView from "./view/JackpotView";
import BonusWheelView from "./view/BonusWheelView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Views extends cc.Component {

    @property(cc.Node)
    ruleView: cc.Node = null;

    @property(cc.Node)
    historyListView: cc.Node = null;

    @property(cc.Node)
    bigWinView: cc.Node = null;

    @property(cc.Node)
    jackpotView: cc.Node = null;

    @property(cc.Node)
    freeGameView: cc.Node = null;

    /** 手工绑定幸运转盘根节点；未绑定时服务端奖励仍会正常结算。 */
    @property(cc.Node)
    bonusWheelView: cc.Node = null;

    static get Instance() {
        return cc.find("Canvas/Views").getComponent(Views);
    }

    closeAll() {
        /*
        this.bigWinView.active = false;
        this.jackpotView.active = false;
        this.freeGameView.active = false;
        */
    }

    isShow(): boolean {
        return this.bigWinView.active || this.jackpotView.active || this.freeGameView.active
            || !!(this.bonusWheelView && this.bonusWheelView.active);
    }

    async showBigWinView(winAmount: number, betAmount?: number) {
        this.bigWinView.getComponent(BigWinView).setNumberLabel(winAmount, betAmount);
        this.bigWinView.active = true;
    }

    showJackpotView(jackpotAmount: number) {
        this.jackpotView.getComponent(JackpotView).winAmount = jackpotAmount;
        Views.Instance.jackpotView.getComponent(JackpotView).setNumberLabel(jackpotAmount);
        this.jackpotView.active = true;
    }

    showFreeGameView(freeTime: number) {
        this.freeGameView.getComponent(FreeGameView).setNumberLabel(freeTime);
        this.freeGameView.active = true;
    }

    hideFreeGameView() {
        this.freeGameView.active = false;
    }

    async showBonusWheel(bonusSegmentIndex: number, bonusMultiplier: number): Promise<void> {
        if (!this.bonusWheelView) {
            console.warn("Bonus wheel view is not bound; bonus reward is settled without a client animation.");
            return;
        }
        const view = this.bonusWheelView.getComponent(BonusWheelView);
        if (!view || !view.hasWheelBinding()) {
            console.warn("Bonus wheel view is missing BonusWheelView or its wheel binding.");
            return;
        }
        await view.play(bonusSegmentIndex, bonusMultiplier);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
    }

    // update (dt) {}
}
