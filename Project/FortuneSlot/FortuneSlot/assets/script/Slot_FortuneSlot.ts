// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";
import { ETradeCode } from "../shared3/interface/IGame";
import Audio from "./Audio";
import AutoCtrl from "./AutoCtrl";
import Bottombar from "./Bottombar";
import ColumnFortuneSlot from "./Column_FortuneSlot";
import ExtraView from "./ExtraView";
import Game from "./Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "./GameData";
import Views from "./Views";
import ImageCache from "./image/ImageCache";
import { IBetResp, arraySum, connectIndexs, rateRandomResult, wheelAngle, wheelExtraMultiples, wheelExtraRate, wheelMultiples } from "./interface/IFruitSlots";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import SpinFortune from "./ui/Spin_Fortune";
import NoticeView from "./view/NoticeView";
import ResultView from "./view/ResultView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotsFortuneSlot extends cc.Component {

    @property(ColumnFortuneSlot)
    Columns: Array<ColumnFortuneSlot> = [];

    @property(cc.Node)
    multipleGood: cc.Node = null

    @property(cc.Sprite)
    multiple: cc.Sprite = null

    @property(cc.Node)
    rewardView: cc.Node = null

    @property(cc.Node)
    multipleFrame: cc.Node = null

    @property(cc.Animation)
    lightRing: cc.Animation = null

    @property(cc.Node)
    normalView: cc.Node = null

    @property(cc.Node)
    wheelView: cc.Node = null

    @property(cc.Node)
    blackBg: cc.Node = null

    @property(dragonBones.ArmatureDisplay)
    wheelAnim: dragonBones.ArmatureDisplay = null

    @property(dragonBones.ArmatureDisplay)
    iconAnim: dragonBones.ArmatureDisplay = null

    @property(dragonBones.ArmatureDisplay)
    frameAnim: dragonBones.ArmatureDisplay = null

    @property(dragonBones.ArmatureDisplay)
    firesAnims: dragonBones.ArmatureDisplay[] = []

    @property(cc.Node)
    wheelView1: cc.Node = null

    @property(cc.Label)
    winLabel: cc.Label = null

    @property(cc.Label)
    multipleLabel: cc.Label = null

    @property(cc.Label)
    wheelMultipleLabel1: cc.Label = null

    @property(cc.Label)
    wheelMultipleLabel2: cc.Label = null

    @property(cc.Node)
    sceneWheel: cc.Node = null;

    @property(cc.Node)
    sceneWheelMain: cc.Node = null;

    @property(cc.Node)
    sceneWheelFrame: cc.Node = null;

    @property(cc.Node)
    autoCount: cc.Node = null;

    @property(cc.Integer)
    autoRepeat: number = 1000;

    @property(cc.Node)
    wheelExtraMultiple: Array<cc.Node> = [];

    @property(cc.SpriteFrame)
    extraMultipleIcons: Array<cc.SpriteFrame> = [];

    @property(cc.Node)
    bigWinView: cc.Node = null;

    @property(cc.Node)
    resultView: cc.Node = null;

    @property(cc.ParticleSystem)
    tailEffect: cc.ParticleSystem = null;

    static _instance: any = null;
    isRunning: boolean = false;
    isAuto: boolean = false;
    runStatus: IBetResp = null;
    rewardIndexs: number[][] = [];
    rewardCount: number = 0;
    callBack: Function = null;
    quickBet: boolean = false;
    quickMode: boolean = false;
    imageCache: ImageCache = null;
    timeOut: number = 0;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    static get Instance(): SlotsFortuneSlot {
        if (!this._instance) {
            this._instance = cc.find("Canvas/Game/Slot_FortuneSlot/mask/Slot").getComponent(SlotsFortuneSlot);
        }
        return this._instance
    }

    set IsRunning(value: boolean) {
        this.isRunning = value;
        if (value) {
            (<any>window).updateAutoQuit()
            SpinFortune.Instance.darkNode();
            AmountSelectorUI.Instance.decr.children[2].color = cc.color(128, 128, 128);
            AmountSelectorUI.Instance.incr.children[2].color = cc.color(128, 128, 128);
            AmountSelectorUI.Instance.betTotal.node.color = cc.color(128, 128, 128);
        }else {
            SpinFortune.Instance.lightNode();
            if(gGameData.betAmountIndex != 0) AmountSelectorUI.Instance.decr.children[2].color = cc.color(255, 255, 255);
            if (gGameData.betAmountIndex != gBetAmounts.length - 1) AmountSelectorUI.Instance.incr.children[2].color = cc.color(255, 255, 255);
            AmountSelectorUI.Instance.betTotal.node.color = cc.color(255, 255, 255);
        }
    }

    set IsAuto(value: boolean) {
        this.isAuto = value;
        if (value) Bottombar.Instance.autoIcon.active = false;
        else Bottombar.Instance.autoIcon.active = true;
    }

    set QuickMode(value: boolean) {
        this.quickMode = value;
        if (value) Bottombar.Instance.quickIcon.active = true;
        else Bottombar.Instance.quickIcon.active = false;
    }

    start() {
        Game.Instance.wheelAnim.play();
        this.imageCache = ImageCache.Instance;
        this.IsRunning = false;

        this.imageCache.specialIcons.push(this.imageCache.specialWheeles[0])

        for (let i = 0; i < this.Columns.length; i++) {
            this.Columns[i].init();
        }
    }

    /**
     * 自动开始
     */
    startAuto(init: boolean = false) {
        if(this.isAuto != init) return;
        // if(this.isRunning)  return;
        let config = (<any>window).config;
        let autoUnlimit = config && config.gameExtra && config.gameExtra.autoUnlimit;
        Game.Instance.autoBtnEffect.active = false;
        this.IsAuto = true;
        this.autoCount.active = true;
        if(!autoUnlimit) this.autoRepeat--;
        //this.autoCount.string = this.autoRepeat.toString();
        if (this.autoRepeat <= 0) {
            this.stopAuto();
            return;
        }
        if (!this.isRunning) {
            Game.Instance.player.betNormal(gGameData.betAmountIndex);
        }
    }

    /**
     * 自动停止
     */
    stopAuto() {
        clearTimeout(this.timeOut);
        this.IsAuto = false;
        this.autoCount.active = false;
        this.autoRepeat = 100000000000;
        AutoCtrl.Instance.stopAuto();
        Views.Instance.noticeView.active = true;
        NoticeView.Instance.label.string = (<any>window).langContent?.notice.autoDisable || "Auto Spin Disable"
    }

    /**
     * slot滚动（按每行为一组滚动）
     * @param result 服务器下发结果
     * @returns 
     */
    run(result: IBetResp) {
        this.resultView.active = false;
        Bottombar.Instance.optionsView.active = false;
        ExtraView.Instance.closeExtraView();
        if (this.isRunning) return;
        let anim = this.sceneWheelMain.getComponent(cc.Animation)
        if(!anim.getAnimationState("wheel").isPlaying) {
            let angle = this.sceneWheelMain.angle;
            let time = ((360 - angle) / 360) * 30;
            anim.play("wheel");
            anim.setCurrentTime(time, "wheel");
        }
        this.sceneWheelFrame.getComponent(cc.Animation).stop();
        this.closeAllSelected();
        this.rewardCount = 0;
        for(let i = 0; i < this.sceneWheelFrame.childrenCount; i++){
            this.sceneWheelFrame.children[i].active = false;
        }
        setTimeout(() => {
            SpinFortune.Instance.lightNode();
        }, 500)
        if (result.result.slotResults.length == 0) return;
        if (result.code != ETradeCode.success) return;
        this.runStatus = result;
        let columnResult = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
        for (let i = 0; i < columnResult.length; i++) {           //将结果修改为每一行为一组的形式
            for (let j = 0; j < columnResult[i].length; j++) {
                columnResult[i][j] = result.result.slotResults[i + j * 4]
            }
        }
        // console.log(JSON.stringify(columnResult));
        this.IsRunning = true;
        this.resultView.getComponent(ResultView).removeAll();
        this.resultView.getComponent(ResultView).closeAll();
        for (let i = 0; i < this.Columns.length; i++) {
            this.Columns[i].run(columnResult[i]);
            if (i < 3) this.resultView.getComponent(ResultView).setColumn(i, columnResult[i]);
        }
    }

    //停止滚动
    stop() {
        this.quickBet = true;
    }

    /**
     * 展示中奖连线
     * @returns 
     */
    async showRewardLine() {
        this.winLabel.string = "0";
        for (let column of this.Columns) column.initPos();              //每行子节点位置初始化
        if (this.runStatus.result.multiple <= 0) {
            // console.log("showRewardLine end" + this.runStatus.result.multiple);
            Game.Instance.player.stopRound(this.runStatus.roundId);
            return;
        }
        // if(this.runStatus.roundId != Game.Instance.player.roundId){
        //     // console.log("showRewardLine roundId not match" + this.runStatus.roundId + "  " + Game.Instance.player.roundId);
        //     let resp = await Game.Instance.player.synchronize();
        //     this.runStatus.result = resp.lastResult;
        // }
        let connectIndexs = this.getConnectIndexs();
        this.rewardIndexs = connectIndexs;
        this.resultView.active = true;
        for (let i = 0; i < this.Columns.length; i++) {
            if (this.Columns[i].index == 0) this.Columns[i].darkAllSkin();
            else if (this.Columns[i].index == 1) {
                this.Columns[i].darkSkin(0);
                this.Columns[i].darkSkin(1);
                this.Columns[i].darkSkin(2);
                this.Columns[i].darkSkin(3);
                this.Columns[i].darkSkin(5);
            }
        }
        for (let i = 0; i < connectIndexs.length; i++) {
            for (let j = 0; j < connectIndexs[i].length; j++) {
                let index1 = connectIndexs[i][j] % 4;
                let index2 = Math.floor(connectIndexs[i][j] / 4);
                // this.Columns[index1].lightSkin(index2 + 3);
                this.resultView.getComponent(ResultView).showRewardLine(index1, index2)
            }
        }
        this.resultView.getComponent(ResultView).setMultiple(this.runStatus.result.slotResults[7])
        setTimeout(() => {
            this.showRewardView();
        }, 500);
    }

    //展示结果
    async showRewardView() {
        if (this.runStatus.result.multiple <= 0) {
            // console.log("showRewardView end" + this.runStatus.result.multiple);
            return;
        }
        this.resultView.active = true;
        let delayTime = this.initMultipleView(this.runStatus.result.wheelMultipleIndex);
        let delayTime1 = this.wheelRun(this.runStatus.result.wheelMultipleIndex, this.runStatus.result.wheelExtraIndex);
        setTimeout(() => {
            Audio.Instance.playWin();
        }, delayTime * 1000);
        cc.tween(this.multipleFrame)
            .delay(delayTime + delayTime1)
            .to(0.4, { scale: 1 }, cc.easeBackOut())
            .call(() => {
                let isOneOrWheel = this.runStatus.result.slotResults[7] == 0 || this.runStatus.result.slotResults[7] == 6;
                if (isOneOrWheel) {
                    this.multipleGood.active = false;
                    let wheelMul = 0
                    let delayTime = this.runStatus.result.slotResults[7] == 6? 2.5 : 0.5
                    if (this.runStatus.result.wheelMultipleIndex >= 0) wheelMul = wheelMultiples[this.runStatus.result.wheelMultipleIndex]
                    if (this.runStatus.result.wheelExtraIndex >= 0) wheelMul = wheelMul * wheelExtraMultiples[this.runStatus.result.wheelExtraIndex]
                    wheelMul = Math.round(wheelMul * this.runStatus.result.calculateAmount);
                    let numStr = 0;
                    let repeat = 0;
                    this.schedule(()=>{
                        let addNum = wheelMul / 50;
                        numStr = numStr + addNum;
                        repeat++;
                        this.wheelMultipleLabel2.string = numStr.toFixed(0);
                        if (repeat >= 50) this.wheelMultipleLabel2.string = numStr > 1000 ? (numStr / 1000) + "K" : numStr.toFixed(0);
                    },0.01, 49, 1)
                    cc.tween(this.multipleFrame)
                        .delay(delayTime)
                        .to(0.25, { scale: 0 })
                        .call(async () => {
                            // console.log("isOneOrWheel stopRound");
                            Game.Instance.player.stopRound(this.runStatus.roundId);
                        })
                        .start();
                } 
                else {
                    this.multipleGood.active = true;
                    this.multipleGood.opacity = 0;
                    this.multiple.spriteFrame = this.imageCache.specialIcons[this.runStatus.result.slotResults[7]];
                    if (!isOneOrWheel) {
                        Audio.Instance.playFly();
                        setTimeout(() => {
                            Audio.Instance.playCombine();
                        }, 500);
                    }
                    this.tailEffect.resetSystem();
                    cc.tween(this.multipleGood)
                        .to(0.5, { opacity: 255 })
                        .delay(0.3)
                        .to(0.4, { x: 10 }, cc.easeQuadraticActionIn())
                        .call(() => {
                            let multiple = parseFloat(this.runStatus.result.multiple.toFixed(2));
                            let numStr = Math.round(multiple * this.runStatus.result.calculateAmount);
                            // console.log("showRewardView " + multiple +"  "+ this.runStatus.result.calculateAmount + "  " + numStr);
                            if (numStr % 1 == 0) {
                                this.wheelMultipleLabel1.string = this.multipleLabel.string = numStr > 1000 ? (numStr / 1000) + "K" : numStr.toFixed(0);
                            } else {
                                this.wheelMultipleLabel1.string = this.multipleLabel.string = numStr.toFixed(2);
                            }
                            this.tailEffect.stopSystem();
                            this.lightRing.node.active = true;
                            this.lightRing.play();
                        })
                        .to(0.2, { opacity: 0 })
                        .call(() => {
                            cc.tween(this.multipleFrame)
                                .delay(0.5)
                                .to(0.25, { scale: 0 })
                                .call(async () => {
                                    // console.log("showRewardView stopRound");
                                    Game.Instance.player.stopRound(this.runStatus.roundId);
                                    this.lightRing.node.active = false;
                                })
                                .start();
                        })
                        .start();
                }
            })
            .start();
    }

    /**
     * 根据结果获取中奖索引
     * @returns 中奖索引
     */
    getConnectIndexs(): number[][] {
        let results = JSON.parse(JSON.stringify(this.runStatus.result.slotResults));
        let rewardIndexs = []
        for (let i = 0; i < connectIndexs.length; i++) {
            let target = results[connectIndexs[i][0]];
            let connectPaths = connectIndexs[i];
            let count = 1;
            for (let j = 1; j < connectPaths.length; j++) {
                if (target == 7) target = results[connectPaths[j]]
                if (results[connectPaths[j]] == target || results[connectPaths[j]] == 7) {
                    count++;
                }
                if (count == 3) rewardIndexs.push(connectPaths);
            }
        }
        return rewardIndexs;
    }

    /**
     * 中奖金额文本展示
     * @param win 中奖金额
     * @returns 
     */
    winLabelShow(win: number) {
        if (win == 0) return;
        win = parseFloat(win.toFixed(0));
        let addNum = win / 10;
        this.schedule(() => {
            this.winLabel.string = toThousands(addNum);
            addNum = addNum + win / 10
        }, 0.01, 9)
        cc.tween(this.winLabel.node)
            .to(0.2, { scale: 1.6 })
            .to(0.05, { scale: 0.8 })
            .delay(0.1)
            .to(0.05, { scale: 1.3 })
            .to(0.05, { scale: 1 })
            .call(() => { })
            .start();
    }

    /**
     * 服务器发送结束回合信息
     */
    async stopRound() {
        // console.log("stopRound");
        clearTimeout(this.timeOut)
        this.rewardView.active = false;
        this.IsRunning = false;
        SpinFortune.Instance.isClicked = false;
        // console.log(stopResp, this.isRunning);
        let continueOrNot = AutoCtrl.Instance.continueOrNot(this.runStatus.result.multiple);
        if (this.rewardIndexs.length > 1) this.rewardShow();
        if (this.isAuto && this.autoRepeat > 0 && continueOrNot) {
            this.timeOut = setTimeout(() => {
                this.startAuto(true);
            }, 300);
        }
        if (this.runStatus.result.multiple >= 10) {
            clearTimeout(this.timeOut);
            this.bigWinView.active = true;
        }
        if (!this.bigWinView.active) this.winLabelShow(this.runStatus.result.multiple * this.runStatus.result.calculateAmount);
        else if (this.autoRepeat <= 0 || !continueOrNot) this.stopAuto();
    }

    /**
     * 初始化结算视图
     * @param wheelMultipleIndex 轮盘倍数索引
     * @returns 
     */
    initMultipleView(wheelMultipleIndex: number): number {
        let delayTime = 0.5;
        let wheelMultiple = wheelMultiples[wheelMultipleIndex];
        if (wheelMultiple > 0) {
            this.normalView.active = false;
            this.wheelView.active = true;
            this.wheelMultipleLabel2.string = "0.00"
            delayTime = 12
        } else {
            this.normalView.active = true;
            this.wheelView.active = false;
        }
        this.rewardView.active = true;
        this.multipleFrame.scale = 0;
        this.multipleGood.x = 430;
        let multiple = parseFloat(arraySum(this.runStatus.result.multiples).toFixed(2));
        let numStr = Math.round(multiple * this.runStatus.result.calculateAmount);
        if (numStr % 1 == 0) {
            this.wheelMultipleLabel1.string = this.multipleLabel.string = numStr > 1000? (numStr / 1000) + "K" : numStr.toFixed(0);
        } else {
            this.wheelMultipleLabel1.string = this.multipleLabel.string = numStr.toFixed(2);
        }
        return delayTime;
    }

    /**
     * 轮盘转动
     * @param wheelMultipleIndex 轮盘倍数索引
     * @param wheelExtraIndex 在extra状态下，轮盘额外倍数索引
     * @returns 
     */
    wheelRun(wheelMultipleIndex: number, wheelExtraIndex: number): number {
        // console.log("wheelRun", wheelMultipleIndex, wheelExtraIndex)
        if (wheelMultipleIndex < 0) return 0;
        let angle = wheelAngle[wheelMultipleIndex] - 360 * 5;
        let extraMultiples: number[] = [];
        let extraWheels: number[] = [];
        let extraNum = Math.floor(Math.random() * 6);
        if (wheelExtraIndex >= 0) {
            for (let i = 0; i < extraNum; i++) {
                extraMultiples.push(rateRandomResult(wheelExtraRate));
                let extraWheel = Math.floor(Math.random() * 12);
                while (extraWheel == wheelMultipleIndex || extraWheels.includes(extraWheel)) {
                    extraWheel = Math.floor(Math.random() * 12);
                }
                extraWheels.push(extraWheel);
            }
        }
        for (let i = 0; i < this.wheelExtraMultiple.length; i++) this.wheelExtraMultiple[i].active = false;
        let pos = Math.floor(Math.random() * extraNum)
        extraMultiples.splice(pos, 0, wheelExtraIndex)
        extraWheels.splice(pos, 0, wheelMultipleIndex)
        // console.log(extraMultiples, extraWheels)
        let delayTime = wheelExtraIndex >= 0 ? extraWheels.length * 0.45 : 1;
        cc.tween(this.sceneWheel)
            .to(1, { scale: 0 }, cc.easeBackIn())
            .call(() => {
                let frameNode = this.frameAnim.node;
                let iconNoe = this.iconAnim.node;
                let wheelNode = this.wheelAnim.node.parent;
                let fireNode1 = this.firesAnims[0].node;
                let fireNode2 = this.firesAnims[1].node;
                frameNode.opacity = 0;
                frameNode.y = 290;
                wheelNode.angle = 0;
                this.wheelView1.active = true;
                this.wheelView1.scale = 1;
                this.blackBg.active = true;
                this.blackBg.opacity = 0;
                cc.Tween.stopAllByTag(825);
                cc.tween(this.blackBg)
                    .to(0.5, { opacity: 150 })
                    .call(() => {
                        for (let i = 0, index = 0; i < extraWheels.length; i++) {
                            if (extraMultiples[i] == 0) continue;
                            index++
                            let extraWheel = this.wheelExtraMultiple[extraWheels[i]]
                            extraWheel.getComponent(cc.Sprite).spriteFrame = this.extraMultipleIcons[extraMultiples[i]];
                            extraWheel.scale = 0;
                            extraWheel.active = true;
                            cc.tween(extraWheel)
                                .delay((index + 1) * 0.45)
                                .to(0, { scale: 2.5})
                                .to(0.2, { scale: 1 })
                                .to(0.1, { scale: 1.7 })
                                .to(0.1, { scale: 1.3 })
                                .call(() => { })
                                .tag(825)
                                .start();
                        }
                    })
                    .tag(825)
                    .start();
                this.wheelAnim.playAnimation("newAnimation", 1);
                this.iconAnim.armatureName = "moren01"
                this.iconAnim.playAnimation("newAnimation", 1);
                this.frameAnim.armatureName = "moren"
                this.frameAnim.playAnimation("newAnimation", 1);

                this.wheelAnim.once(dragonBones.EventObject.COMPLETE, async () => {
                    this.iconAnim.armatureName = "moren02"
                    this.iconAnim.playAnimation("newAnimation", -1);
                    cc.tween(frameNode)
                        .delay(delayTime - 0.45)
                        .to(0.5, { y: 210 }, cc.easeBackOut())
                        .call(() => {
                            cc.tween(frameNode)
                                .delay(0.3)
                                .to(0.5, { y: 250 }, cc.easeBackOut())
                                .call(() => {
                                    Audio.Instance.playWheel();
                                    cc.tween(wheelNode)
                                        .to(6, { angle: angle }, cc.easeCubicActionInOut())
                                        .call(() => {
                                            fireNode1.active = true;
                                            fireNode2.active = true;
                                            this.firesAnims[0].armatureName = "huo"
                                            this.firesAnims[1].armatureName = "huo"
                                            this.frameAnim.armatureName = "moren1"
                                            this.frameAnim.playAnimation("newAnimation", 1);
                                            this.firesAnims[0].playAnimation("huo", 1);
                                            this.firesAnims[1].playAnimation("huo", 1);
                                            Audio.Instance.playWheelStop();
                                            cc.tween(frameNode)
                                                .to(0.5, { y: 210 }, cc.easeBackOut())
                                                .delay(1.5)
                                                .call(() => {
                                                    cc.tween(this.wheelView1)
                                                        .to(0.8, { scale: 0 }, cc.easeBackIn())
                                                        .call(() => {
                                                            for(let i = 0; i < this.sceneWheelFrame.childrenCount; i++){
                                                                this.sceneWheelFrame.children[i].active = true;
                                                            }
                                                            wheelNode.angle = 0;
                                                            this.wheelView1.active = false;
                                                            this.sceneWheelMain.angle = wheelAngle[wheelMultipleIndex];
                                                            this.sceneWheelMain.getComponent(cc.Animation).stop();
                                                            this.sceneWheelFrame.getComponent(cc.Animation).play("frame");
                                                            cc.tween(this.sceneWheel)
                                                                .to(0.5, { scale: 1 }, cc.easeBackOut())
                                                                .call(() => {})
                                                                .start();
                                                        })
                                                        .tag(825)
                                                        .start();
                                                    cc.tween(this.blackBg)
                                                        .to(0.8, { opacity: 0 })
                                                        .call(() => {
                                                            this.blackBg.active = false;
                                                        })
                                                        .tag(825)
                                                        .start();
                                                })
                                                .tag(825)
                                                .start();
                                            cc.tween(iconNoe)
                                                .to(0.5, { scale: 1.5 }, cc.easeBackOut())
                                                .call(() => {
                                                    fireNode1.active = false;
                                                    fireNode2.active = false;
                                                })
                                                .tag(825)
                                                .start();
                                        })
                                        .tag(825)
                                        .start();
                                })
                                .tag(825)
                                .start();

                            cc.tween(iconNoe)
                                .delay(0.3)
                                .to(0.5, { scale: 1.7 }, cc.easeBackOut())
                                .call(() => { })
                                .tag(825)
                                .start();
                        })
                        .tag(825)
                        .start();
                    cc.tween(frameNode)
                        .delay(delayTime - 0.45)
                        .to(0.5, { opacity: 255 })
                        .tag(825)
                        .start();
                })
            })
            .start();
        return delayTime;
    }

    /**
     * 每行子节点皮肤初始化
     */
    initSkin() {
        let index = 7;
        if (Game.Instance.player.isExtra) {
            this.imageCache.specialIcons.pop();
            this.imageCache.specialIcons.push(this.imageCache.specialWheeles[1])
        }
        else {
            this.imageCache.specialIcons.pop();
            this.imageCache.specialIcons.push(this.imageCache.specialWheeles[0])
        }
        for (let i = 0; i < this.Columns.length; i++) {
            this.Columns[i].initSkin(index);
            index--;
        }
        ResultView.Instance.switchMode(Game.Instance.player.isExtra);
        this.unschedule(this.callBack);
        this.resultView.active = false;
    }

    /**
     * 中奖路径轮播
     */
    rewardShow() {
        let rewardIndexs = this.rewardIndexs;
        this.schedule(this.callBack = () => {
            if (rewardIndexs.length <= 1) return;
            this.resultView.getComponent(ResultView).closeAll();
            // console.log(JSON.stringify(rewardIndexs), this.rewardCount);
            for (let i = 0; i < rewardIndexs[this.rewardCount].length || 0; i++) {
                let index1 = rewardIndexs[this.rewardCount][i] % 4;
                let index2 = Math.floor(rewardIndexs[this.rewardCount][i] / 4);
                // this.Columns[index1].lightSkin(index2 + 3);
                this.resultView.getComponent(ResultView).showRewardLine(index1, index2)
            }
            this.rewardCount = (this.rewardCount + 1) % rewardIndexs.length;
        }, 1.5, cc.macro.REPEAT_FOREVER)
    }

    closeAllSelected() {
        if (!this.quickMode) this.quickBet = false;
        this.unschedule(this.callBack);
        for (let i = 0; i < this.Columns.length; i++) {
            this.Columns[i].repeatCount = 0;
            this.Columns[i].slots.forEach((slot: cc.Sprite) => {
                slot.node.color = cc.color(255, 255, 255)
            })
        }
    }
    // update (dt) {}
}
