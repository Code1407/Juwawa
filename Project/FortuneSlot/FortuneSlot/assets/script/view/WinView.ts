// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../../shared/Common";
import Audio from "../Audio";
import SlotsFortuneSlot from "../Slot_FortuneSlot";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WinView extends cc.Component {

    @property(cc.Label)
    mulLabel: cc.Label = null;

    @property(cc.Node)
    blackBg: cc.Node = null;

    @property(cc.ParticleSystem)
    particle: cc.ParticleSystem = null;

    @property(dragonBones.ArmatureDisplay)
    bigWin: dragonBones.ArmatureDisplay = null;

    @property(dragonBones.ArmatureDisplay)
    megaWin: dragonBones.ArmatureDisplay = null;

    @property(dragonBones.ArmatureDisplay)
    superWin: dragonBones.ArmatureDisplay = null;

    multiple: number = 0;
    isClick: boolean = false;
    isStart: boolean = false;
    isStop: boolean = false;
    animNow: dragonBones.ArmatureDisplay = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.blackBg.on(cc.Node.EventType.TOUCH_START, () => {
            if (this.isClick || !this.isStart) return;
            this.isClick = true;
            this.stop();
        })
    }

    protected onEnable(): void {
        let winNum = 0
        cc.Tween.stopAllByTag(1);
        this.node.opacity = 0;
        this.node.scale = 1;
        this.mulLabel.string = "0.00";
        this.multiple = SlotsFortuneSlot.Instance.runStatus.result.multiple;
        this.particle.resetSystem();
        this.bigWin.node.active = false;
        this.megaWin.node.active = false;
        this.superWin.node.active = false;
        let index = Math.floor(this.multiple / 10) > 5 ? 5 : Math.floor(this.multiple / 10);
        switch (index) {
            case 1: {
                this.bigWin.node.active = true;
                this.bigWin.playAnimation("newAnimation", 1)
            } break;
            case 2:
            case 3:
            case 4: {
                this.megaWin.node.active = true;
                this.megaWin.playAnimation("newAnimation", 1)
            } break;
            case 5: {
                this.superWin.node.active = true;
                this.superWin.playAnimation("newAnimation", 1)
            } break;
        }
        Audio.Instance.playBow();
        Audio.Instance.playRoll();
        cc.tween(this.node)
            .to(0.2, { opacity: 255 })
            .call(() => {
                this.isStart = true;
                cc.tween(this.node)
                    .by(0.01, { scale: 0.0010 })
                    .call(() => {
                        let mul = parseFloat(SlotsFortuneSlot.Instance.runStatus.result.multiple.toFixed(2))
                        winNum += mul * SlotsFortuneSlot.Instance.runStatus.result.calculateAmount / 400;
                        this.mulLabel.string = toThousands(winNum);
                    })
                    .union()
                    .repeat(400)
                    .tag(593)
                    .call(() => {
                        this.stop();
                    })
                    .start();
            })
            .start();
    }

    stop() {
        if (this.isStop) return;
        this.isStop = true;
        cc.Tween.stopAllByTag(593);
        this.node.scale = 1.2;
        this.multiple = SlotsFortuneSlot.Instance.runStatus.result.multiple;
        let mul = parseFloat(SlotsFortuneSlot.Instance.runStatus.result.multiple.toFixed(2))
        let winNum = mul * SlotsFortuneSlot.Instance.runStatus.result.calculateAmount
        this.mulLabel.string = toThousands(winNum);
        let index = Math.floor(this.multiple / 10) > 5 ? 5 : Math.floor(this.multiple / 10);
        switch (index) {
            case 1: this.animNow = this.bigWin; break;
            case 2:
            case 3:
            case 4: this.animNow = this.megaWin; break;
            case 5: this.animNow = this.superWin; break;
        }
        Audio.Instance.stopBow();
        Audio.Instance.stopRoll();
        Audio.Instance.playEnd();
        this.animNow.node.active = true;
        this.animNow.playAnimation("newAnimation", 1)
        cc.tween(this.node)
            .to(0.2, { scale: 1 }, cc.easeBackOut())
            .start();
        this.animNow.once(dragonBones.EventObject.COMPLETE, () => {
            this.particle.stopSystem();
            cc.tween(this.node)
                .delay(0.5)
                .tag(1)
                .to(0.5, { opacity: 0 })
                .call(() => {
                    this.isClick = false;
                    this.isStart = false;
                    this.isStop = false;
                    this.node.active = false;
                    this.node.opacity = 255;
                    this.node.scale = 1;
                    SlotsFortuneSlot.Instance.winLabelShow(SlotsFortuneSlot.Instance.runStatus.result.multiple * SlotsFortuneSlot.Instance.runStatus.result.calculateAmount)
                    if(SlotsFortuneSlot.Instance.isAuto) {
                        setTimeout(() => {
                            SlotsFortuneSlot.Instance.startAuto(true);
                        }, 500);
                    }
                })
                .start();
        })
    }

    // update (dt) {}
}
