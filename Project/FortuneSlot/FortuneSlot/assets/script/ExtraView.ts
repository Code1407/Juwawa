// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import Game from "./Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "./GameData";
import SlotsFortuneSlot from "./Slot_FortuneSlot";
import Views from "./Views";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import SpinFortune from "./ui/Spin_Fortune";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExtraView extends cc.Component {

    @property(cc.Node)
    button: cc.Node = null;

    @property(cc.Node)
    land: cc.Node = null;

    @property(cc.Node)
    switch: cc.Node = null;

    @property(cc.Node)
    switchOn: cc.Node = null;

    @property(cc.Node)
    switchOff: cc.Node = null;

    @property(cc.Node)
    ruleButton: cc.Node = null;

    @property(cc.Node)
    ruleView: cc.Node = null;

    @property(cc.Node)
    extraIcon: cc.Node = null;

    @property(cc.Node)
    flyNodes: cc.Node[] = [];

    @property(cc.Animation)
    ringAnims: cc.Animation[] = [];

    @property(cc.Animation)
    shinyFrameAnim: cc.Animation = null;

    @property(cc.ParticleSystem)
    shinyParticles: cc.ParticleSystem = null;

    @property(cc.Node)
    effectAnim: cc.Node = null;

    expand: boolean = false;
    click: boolean = false;
    isfly: boolean = false
    flyPos: Array<cc.Vec3> = []
    finishCount: number = 0
    static instance: ExtraView = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    static get Instance(): ExtraView {
        if (!this.instance) this.instance = cc.find("Canvas/Game/Topbar/extra").getComponent(ExtraView);
        return this.instance;
    }

    set IsFly(value: boolean) {
        this.isfly = value;
        if (value) SpinFortune.Instance.darkNode();
        else SpinFortune.Instance.lightNode();
    }

    start() {
        this.button.on(cc.Node.EventType.TOUCH_START, () => {
            this.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            if (this.click) return;
            if (SlotsFortuneSlot.Instance.isRunning || SlotsFortuneSlot.Instance.isAuto) {
                Views.Instance.playingView.active = true;
                return;
            }
            this.click = true;
            if (!this.expand) {
                cc.tween(this.land)
                    .to(0.3, { scaleX: 1 }, cc.easeBackOut())
                    .call(() => { })
                    .start();
                cc.tween(this.ruleButton)
                    .to(0.3, { x: 425 }, cc.easeBackOut())
                    .call(() => {
                        this.expand = true;
                        this.click = false;
                    })
                    .start();
            } else {
                cc.tween(this.land)
                    .to(0.3, { scaleX: 0 }, cc.easeBackIn())
                    .call(() => {
                        this.expand = false;
                        this.click = false;
                    })
                    .start();
                cc.tween(this.ruleButton)
                    .to(0.3, { x: 90 }, cc.easeBackIn())
                    .call(() => { })
                    .start();
            }
            Audio.Instance.playClick();
        });

        this.switch.on(cc.Node.EventType.TOUCH_START, () => {
            this.ruleView.active = false;
            AmountSelectorUI.Instance.betAmountView.active = false;
            if (SlotsFortuneSlot.Instance.isRunning || SlotsFortuneSlot.Instance.isAuto) {
                Views.Instance.playingView.active = true;
                return;
            }
            let isExtra = Game.Instance.player.isExtra = !Game.Instance.player.isExtra
            if (isExtra) Audio.Instance.playExtra();
            let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
            SlotsFortuneSlot.Instance.initSkin();
            this.extraIcon.active = isExtra;
            this.switchOn.active = isExtra;
            this.switchOff.active = !isExtra;
            this.effectAnim.active = isExtra;
            if (isExtra && !this.isfly) {
                this.shinyFrameAnim.stop("shinyFrame");
                this.shinyFrameAnim.node.active = false;
                cc.Tween.stopAllByTag(777)
                this.flyNode();
                this.IsFly = true;
            }
            else if (!isExtra) {
                for (let i = 0; i < this.flyNodes.length; i++) this.flyNodes[i].active = false;
                this.shinyFrameAnim.stop("shinyFrame");
                this.shinyFrameAnim.node.active = false;
                cc.Tween.stopAllByTag(777)
                this.IsFly = false;
                this.finishCount = 0
            }
            SlotsFortuneSlot.Instance.closeAllSelected();
            AmountSelectorUI.Instance.setBetAmountLabel(betAmount[gGameData.betAmountIndex]);
            AmountSelectorUI.Instance.BetAmountIndex = gGameData.betAmountIndex;
            AmountSelectorUI.Instance.initBetAmountView();
        })

        this.ruleButton.on(cc.Node.EventType.TOUCH_START, () => {
            AmountSelectorUI.Instance.betAmountView.active = false;
            this.ruleView.active = !this.ruleView.active;
        })
        this.flyPos = [
            cc.v3(725, -557, 0),
            cc.v3(725, -393, 0),
            cc.v3(725, -230, 0),
        ]
    }

    flyNode() {
        if (this.isfly) return;
        this.shinyParticles.resetSystem()
        this.shinyFrameAnim.play("shinyFrame");
        this.shinyFrameAnim.node.active = true;
        this.IsFly = true;
        for (let i = 0; i < this.flyNodes.length; i++) {
            let flyNode = this.flyNodes[i]
            flyNode.position = new cc.Vec3(0, 0, 0)
            flyNode.active = true
            flyNode.scale = 0
            flyNode.opacity = 0
            let randomY = Math.random() * 50 + 120
            let randomX = Math.random() * 100 - 18
            cc.tween(flyNode)
                .to(0.7, { scale: 0.7, opacity: 200, y: randomY, x: randomX }, cc.easeBackOut())
                .call(() => {
                    cc.tween(flyNode)
                        .to(0.8, { position: this.flyPos[i], scale: 1.1 }, cc.easeQuadraticActionOut())
                        .call(() => {
                            cc.tween(flyNode)
                                .to(0.5, { opacity: 0 })
                                .call(() => {
                                    flyNode.active = false
                                    flyNode.position = new cc.Vec3(0, 0, 0)
                                    this.finishCount++
                                    if (this.finishCount == 3) {
                                        this.IsFly = false
                                        this.finishCount = 0
                                    }
                                })
                                .tag(777)
                                .start()
                            this.ringAnims[i].node.active = true;
                            this.ringAnims[i].play("ring");
                            this.ringAnims[i].once("finished", () => {
                                this.ringAnims[i].node.active = false;
                                // this.shinyFrameAnim.node.active = false;
                            })
                            this.shinyParticles.stopSystem();
                            this.shinyFrameAnim.stop("shinyFrame");
                        })
                        .tag(777)
                        .start();
                })
                .tag(777)
                .start()
        }
    }

    closeExtraView() {
        cc.tween(this.land)
            .to(0.3, { scaleX: 0 }, cc.easeBackIn())
            .call(() => {
                this.expand = false;
                this.click = false;
            })
            .start();
        cc.tween(this.ruleButton)
            .to(0.3, { x: 90 }, cc.easeBackIn())
            .call(() => { })
            .start();
    }

    // update (dt) {}
}
