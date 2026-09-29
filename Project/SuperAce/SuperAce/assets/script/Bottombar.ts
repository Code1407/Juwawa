// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import { Effect } from "./effect/BaseEffect";
import { gBetAmounts, gGameData } from "./GameData";
import SlotSuperAce from "./Slot_SuperAce";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import NoticeView from "./view/NoticeView";
import Views from "./Views";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Bottombar extends cc.Component {

    @property(cc.Label)
    winAmount: cc.Label = null;

    @property(cc.Node)
    diamondImage: cc.Node = null;

    @property(cc.Node)
    increaseAmount: cc.Node = null;

    @property(cc.Node)
    autoSuperAce: cc.Node = null;

    @property(cc.Node)
    autoIcon: cc.Node = null;

    @property(cc.Node)
    quickSuperAce: cc.Node = null;

    @property(cc.Node)
    quickIcon: cc.Node = null;

    @property(cc.Node)
    options: cc.Node = null;

    @property(cc.Node)
    optionsView: cc.Node = null;

    @property(cc.Node)
    autoView: cc.Node = null;

    @property(cc.Node)
    autoBtn: cc.Node = null;

    static instance: Bottombar = null;

    private inSwitch: boolean = false;
    private freeWinTotal: number = 0;
    private colorGolden = new cc.Color(0xFE, 0xEC, 0x51);

    static get Instance() {
        if (!this.instance) this.instance = cc.find("Canvas/Bottombar").getComponent(Bottombar);
        return this.instance;
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
        this.winAmount.string = Math.round(winAmount).toString();
        for (let i = 0; i < split; i++) {
            winAmount += amountSplit;
            this.winAmount.string = Math.round(winAmount).toString();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    isAutoBet() {
    }
    hideSpin() {
    }
    showSpin() {
    }
    resetSpin() {

    }

    setBetAmount(betAmount: number) {
        let totalAmount = betAmount;
        AmountSelectorUI.Instance.setBetAmountLabel(totalAmount);
    }

    setFreeTime(freeTime: number) {

    }

    async switch2Free() {
        this.inSwitch = true;

        this.freeWinTotal = 0;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;
    }

    async switch2Normal() {
        this.inSwitch = true;

        this.freeWinTotal = 0;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        let slotSuperAce = SlotSuperAce.Instance;
        this.autoSuperAce.on(cc.Node.EventType.TOUCH_START, () => {
            AmountSelectorUI.Instance.betAmountView.active = false;
            if (!slotSuperAce.isAuto) {
                // if(slotSuperAce.freeMode) {
                //     Views.Instance.playingView.active = true;
                //     return;
                // }
                if (slotSuperAce.startAuto(false)) {
                    Views.Instance.noticeView.active = true;
                    NoticeView.Instance.label.string = (<any>window).langContent?.notice.autoEnable || "Auto Spin Enable"
                }
            } else {
                slotSuperAce.stopAuto();
            }
            Audio.Instance.playClick();
        })

        //游戏前后台切换监听




        //


        this.quickSuperAce.on(cc.Node.EventType.TOUCH_START, () => {
            AmountSelectorUI.Instance.betAmountView.active = false;
            slotSuperAce.quickMode = !slotSuperAce.quickMode;
            if (slotSuperAce.quickMode) this.quickIcon.active = true;
            else this.quickIcon.active = false;
            Audio.Instance.playClick();
        })

        this.options.on(cc.Node.EventType.TOUCH_START, () => {
            AmountSelectorUI.Instance.betAmountView.active = false;
            this.optionsView.active = !this.optionsView.active;
        })

        this.autoBtn.on(cc.Node.EventType.TOUCH_START, () => {
            AmountSelectorUI.Instance.betAmountView.active = false;
            this.autoView.active = true;
            this.optionsView.active = false;
        })
    }

    // update (dt) {}
}
