// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Effect } from "./effect/BaseEffect";
import { gBetAmounts, gGameData } from "./GameData";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import SpinUI from "./ui/SpinUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bottombar extends cc.Component {

    @property(cc.Label)
    winAmount: cc.Label = null;

    @property(cc.Node)
    freeNode: cc.Node = null;

    @property(cc.Label)
    freeTime: cc.Label = null;

    @property(cc.Node)
    diamondImage: cc.Node = null;

    @property(cc.Node)
    increaseAmount: cc.Node = null;

    private inSwitch: boolean = false;
    private freeWinTotal: number = 0;
    private colorGolden = new cc.Color(0xFE, 0xEC, 0x51);

    static get Instance() {
        return cc.find("Canvas/Bottombar").getComponent(Bottombar);
    }

    isFreeStatus() {
        return this.freeNode.active == true;
    }

    inSwitchStatus() {
        return this.inSwitch;
    }

    getWinAmountLabel() {
        return this.winAmount;
    }

    getFreeWinTotal() {
        return this.freeWinTotal;
    }

    resetNormal() {
        this.winAmount.string = "0";
        this.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
    }

    resetFree() {
        this.winAmount.string = "0";
        this.freeTime.string = gGameData.freeCount.toString();
        this.hideSpin();
    }

    showIncreaseAmount(amount: number) {
        Effect.flyIncrAmount(this.increaseAmount.parent, this.increaseAmount, amount);
    }

    initBottomData() {
        this.freeWinTotal = 0;
    }

    async setWinAmount(amount: number) {
        this.winAmount.node.color = amount == 0 ? cc.Color.WHITE : this.colorGolden;
        this.winAmount.node.color = this.freeWinTotal == 0 && amount == 0 ? cc.Color.WHITE : this.colorGolden;
        
        let split = amount > 10 ? 10 : amount;
        let amountSplit = amount / split;
        let winAmount = this.freeWinTotal;
        this.freeWinTotal += this.isFreeStatus() ? amount : 0;
        this.winAmount.string = Math.round(winAmount).toString();
        for (let i = 0; i < split; i++) {
            winAmount += amountSplit;
            this.winAmount.string = Math.round(winAmount).toString();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    isAutoBet(){
        return SpinUI.Instance.isAuto();
    }
    hideSpin() {
        if (!SpinUI.Instance.isAuto()) {
            SpinUI.Instance.setCanPress(false);
        }
    }
    showSpin() {
        if (!SpinUI.Instance.isAuto()) {
            SpinUI.Instance.setCanPress(true);
        }
    }
    resetSpin() {
        if (!this.isFreeStatus() && !SpinUI.Instance.isAuto()) {
            SpinUI.Instance.reset();
        }
    }

    setBetAmount(betAmount: number) {
        let totalAmount = betAmount * 30;
        AmountSelectorUI.Instance.setBetAmountLabel(totalAmount);
        if (this.isFreeStatus()) {
            this.switch2Normal();
        }
    }

    setFreeTime(freeTime: number) {        
        this.freeTime.string = freeTime.toString();
        if (!this.isFreeStatus() && freeTime > 0) {
            this.switch2Free();
        }
    }

    async switch2Free() {
        this.inSwitch = true;

        this.freeWinTotal = 0;
        this.freeNode.active = true;
        SpinUI.Instance.node.active = false;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;
    }

    async switch2Normal() {
        this.inSwitch = true;

        this.freeWinTotal = 0;
        this.freeNode.active = false;
        SpinUI.Instance.node.active = true;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
    }

    // update (dt) {}
}
