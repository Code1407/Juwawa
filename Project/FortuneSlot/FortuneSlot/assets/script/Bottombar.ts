// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import { Effect } from "./effect/BaseEffect";
import ExtraView from "./ExtraView";
import { gBetAmounts, gGameData } from "./GameData";
import SlotsFortuneSlot from "./Slot_FortuneSlot";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import NoticeView from "./view/NoticeView";
import Views from "./Views";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bottombar extends cc.Component {

    @property(cc.Label)
    winAmount: cc.Label = null;

    @property(cc.Node)
    diamondImage: cc.Node = null;

    @property(cc.Node)
    increaseAmount: cc.Node = null;

    @property(cc.Node)
    autoFortune: cc.Node = null;

    @property(cc.Node)
    autoIcon: cc.Node = null;

    @property(cc.Node)
    quickFortune: cc.Node = null;

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
        if(!this.instance) this.instance = cc.find("Canvas/Game/Bottombar").getComponent(Bottombar);
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
    isAutoBet(){
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

    start () {
        let slotFortune = SlotsFortuneSlot.Instance;
        this.autoFortune.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            if (!slotFortune.isAuto) {
                Views.Instance.noticeView.active = true;
                NoticeView.Instance.label.string = (<any>window).langContent?.notice.autoEnable || "Auto Spin Enable"
                slotFortune.startAuto(false);
                this.autoIcon.active = false;
            } else {
                slotFortune.stopAuto();
                this.autoIcon.active = true;
            }
            Audio.Instance.playClick();
        })

        this.quickFortune.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            slotFortune.QuickMode = !slotFortune.quickMode;
            slotFortune.quickBet = slotFortune.quickMode;
            let game = cc.find("Canvas/Game")?.getComponent("Game") as any;
            game?.player?.updateSettings({
                lastBetAmountButton: gGameData.betAmountIndex,
                soundVol: gGameData.soundVol,
                isSpeed: slotFortune.quickMode
            });
            Audio.Instance.playClick();
        })

        this.options.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            this.optionsView.active = !this.optionsView.active;
        })

        this.autoBtn.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            this.autoView.active = true;
            this.optionsView.active = false;
        })
    }

    // update (dt) {}
}
