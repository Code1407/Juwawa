// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gBetAmounts, gGameData } from "../GameData";
import Jackpot from "../Jackpot";
import { EBetAmountIndex } from "../interface/IMageJackpot";
import Bottombar from "../Bottombar";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AmountSelectorUI extends cc.Component {

    @property(cc.Label)
    betTotal: cc.Label = null;

    //增加减少按钮
    @property(cc.Node)
    but_add: cc.Node = null;

    @property(cc.Node)
    but_sub: cc.Node = null;

    static get Instance() {
        return cc.find("Canvas/Bottombar/BetAmountSelector").getComponent(AmountSelectorUI);
    }

    setBetAmountLabel(totalAmount: number) {
        this.betTotal.string = totalAmount.toString(); // totalAmount < 1000 ? totalAmount.toString() : (totalAmount / 1000) + "k";
    }

    // LIFE-CYCLE CALLBACKS:

    start () {
        this.but_sub.on(cc.Node.EventType.TOUCH_END, this.decreaseBetAmount, this);
        this.but_add.on(cc.Node.EventType.TOUCH_END, this.increaseBetAmount, this);
        this.updateButtonState();
    }

    private decreaseBetAmount() {
        if (!this.canChangeBetAmount() || gGameData.betAmountIndex <= EBetAmountIndex.single) return;

        gGameData.betAmountIndex--;
        this.applyBetAmount();
    }

    private increaseBetAmount() {
        if (!this.canChangeBetAmount() || gGameData.betAmountIndex >= gBetAmounts.length - 1) return;

        gGameData.betAmountIndex++;
        this.applyBetAmount();
    }

    private canChangeBetAmount(): boolean {
        // canSpin 为 false 时表示正在滚动、免费游戏或自动游戏等不可改下注状态。
        return !!Bottombar.Instance && Bottombar.Instance.canSpin();
    }

    private applyBetAmount() {
        Game.Instance.player.setBetAmountButton(gGameData.betAmountIndex);
        Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
        this.setBetAmountLabel(gBetAmounts[gGameData.betAmountIndex]);
        this.updateButtonState();
    }

    update () {
        // 每帧同步：转轮进入 run 状态后 canSpin() 会变为 false，两个按钮随即禁用。
        this.updateButtonState();
    }

    private updateButtonState() {
        const canChange = this.canChangeBetAmount();
        this.setButtonInteractable(this.but_sub, canChange && gGameData.betAmountIndex > EBetAmountIndex.single);
        this.setButtonInteractable(this.but_add, canChange && gGameData.betAmountIndex < gBetAmounts.length - 1);
    }

    private setButtonInteractable(node: cc.Node, interactable: boolean) {
        if (!node) return;
        const button = node.getComponent(cc.Button);
        if (button) button.interactable = interactable;
    }
}
