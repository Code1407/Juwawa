// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gBetAmounts, gGameData } from "../GameData";
import Bottombar from "../Bottombar";
import { lineCount } from "../interface/IFruitSlots";
import { setRechargeView, updateAutoQuit } from "../../shared2/GlobalViewsLoader";
import { EGameStatus } from "../../shared3/interface/IGame";
import AudioCtrl from "../../shared3/AudioCtrl_shared3";
import { AudioClip } from "../AudioClip_FruitSlots";

const { ccclass, property } = cc._decorator;

const coolDownTime = 2000;

@ccclass
export default class SpinUI extends cc.Component {

    @property(cc.Node)
    auto_up: cc.Node = null;

    @property(cc.Node)
    auto_down: cc.Node = null;

    @property(cc.Node)
    spin_up: cc.Node = null;

    @property(cc.Node)
    spin_down: cc.Node = null;

    coolDown: boolean = false;
    canPress: boolean = true;

    setCanPress(canPress: boolean) {
        this.canPress = canPress;
        this.switchButton(canPress);
    }

    static get Instance() {
        return cc.find("Canvas/Bottombar/Spin").getComponent(SpinUI);
    }

    reset() {
        if (this.canPress) this.switchButton(true);
    }

    canSpin() {
        return !Bottombar.Instance.isFreeStatus() && !this.isAuto()
            && gGameData.status == EGameStatus.bet && this.canPress && this.spin_up.active;
    }

    canStop() {
        return !Bottombar.Instance.isFreeStatus() && !this.isAuto()
            && gGameData.status == EGameStatus.run && this.canPress && this.spin_up.active;
    }

    isAuto() {
        return this.auto_down.active;
    }

    setAutoBet(auto: boolean) {
        this.auto_down.active = auto;
        this.auto_up.active = !auto;
        (<any>window).isAutoBetActive = auto;
    }

    onDestroy() {
        (<any>window).isAutoBetActive = false;
    }

    private switchButton(status: boolean) {
        this.spin_up.active = status;
        this.spin_down.active = !status;
    }

    private setCoolDown() {
        return;
        this.coolDown = true;
        Game.Instance.changeGameStatus(EGameStatus.coolDown);
        const __this = this;
        setTimeout(() => {
            __this.coolDown = false;
            if (gGameData.status = EGameStatus.coolDown) gGameData.status = EGameStatus.bet;
        }, coolDownTime);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.reset();

        const __this = this;

        this.auto_up.on(cc.Node.EventType.TOUCH_START, () => {
            if (__this.canSpin() && !__this.coolDown) {
                __this.setAutoBet(true);
                updateAutoQuit();
                AudioCtrl.PlayAsync(AudioClip.click);
                __this.switchButton(false);
                __this.setCoolDown();
                Game.Instance.newRound();
            }
        });

        this.auto_down.on(cc.Node.EventType.TOUCH_START, () => {
            AudioCtrl.PlayAsync(AudioClip.click);
            __this.setAutoBet(false);
            updateAutoQuit();
        });

        this.spin_up.on(cc.Node.EventType.TOUCH_START, () => {
            AudioCtrl.PlayAsync(AudioClip.click);
            if (__this.canSpin() && !__this.coolDown) {
                if (Game.Instance.player.accountDiamond < gBetAmounts[gGameData.betAmountIndex] * lineCount) {
                    setRechargeView(true);
                    return;
                }
                __this.setCoolDown();
                __this.switchButton(false);
                Game.Instance.newRound();
            }

            if (__this.canStop()) {
                Game.Instance.finishRound();
                __this.switchButton(false);
            }
        });

        /*
        this.spin_down.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playClick();
            __this.switchButton(true);
            __this.setAutoBet(false);
            if (__this.canPress && gGameData.status == EGameStatus.run) {
                Game.Instance.finishRound();
                Bottombar.Instance.hideSpin();
            }
        });
        */
    }

    // update (dt) {}
}
