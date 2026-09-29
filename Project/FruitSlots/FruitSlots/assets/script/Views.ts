// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BigWinView from "./view/BigWinView";
import FreeGameView from "./view/FreeGameView";
import FreeGameWinView from "./view/FreeGameWinView";
import JackpotView from "./view/JackpotView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Views extends cc.Component {

    @property(cc.Node)
    ruleView: cc.Node = null;

    @property(cc.Node)
    bigWinView: cc.Node = null;

    @property(cc.Node)
    jackpotView: cc.Node = null;

    @property(cc.Node)
    freeGameView: cc.Node = null;

    @property(cc.Node)
    freeGameWinView: cc.Node = null;

    static get Instance() {
        return cc.find("Canvas/Views").getComponent(Views);
    }

    closeAll() {
        /*
        this.bigWinView.active = false;
        this.jackpotView.active = false;
        this.freeGameView.active = false;
        this.freeGameWinView.active = false;
        */
    }

    isShow(): boolean {
        return this.bigWinView.active || this.jackpotView.active || this.freeGameView.active || this.freeGameWinView.active;
    }

    async showFreeGameWinView(winAmount: number) {
        if (this.bigWinView.active || this.jackpotView.active) {
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
        this.closeAll();
        this.freeGameWinView.getComponent(FreeGameWinView).setNumberLabel(winAmount);
        this.freeGameWinView.active = true;
    }

    async showBigWinView(winAmount: number) {
        this.bigWinView.getComponent(BigWinView).setNumberLabel(winAmount);
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

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
    }

    // update (dt) {}
}
