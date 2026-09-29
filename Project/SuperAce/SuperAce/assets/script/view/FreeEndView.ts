// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Game from "../Game";
import SlotSuperAce from "../Slot_SuperAce";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FreeEndView extends cc.Component {

    @property(cc.Node)
    coin: cc.Node = null;

    @property(cc.Prefab)
    coinPrefab: cc.Prefab = null;

    @property(cc.Node)
    tweenNode: cc.Node = null;

    @property(cc.Node)
    blast: cc.Node = null;

    @property(cc.Label)
    winNum: cc.Label = null;

    isClicked: boolean = false;
    sumWinNum: number = 0;
    scheduleFunc: Function = null;
    coinPrefabs: cc.Node[] = [];
    originalPos: cc.Vec3[] = [];
    static instance: FreeEndView = null;

    static get Instance(): FreeEndView {
        if (!this.instance) this.instance = cc.find("Canvas/Views/FreeEndView").getComponent(FreeEndView);
        return this.instance;
    }

    init(): void {
        this.coinPrefabs = [];
        for (let i = 0; i < 70; i++) {
            let posX = Math.random() * 100 + -50;
            let posY = Math.random() * 1000 + -550;
            let coin = cc.instantiate(this.coinPrefab);
            coin.parent = this.coin;
            coin.position = cc.v3(posX, posY, 0);
            coin.opacity = 0;
            this.coinPrefabs.push(coin);
        }
        for (let i = 0; i < this.coinPrefabs.length; i++) {
            this.originalPos.push(this.coinPrefabs[i].position);
        }
        this.node.on(cc.Node.EventType.TOUCH_START, this.onClick, this);
    }

    onFreeEnd(): void {
        // this.init();
        let freeWinNum = SlotSuperAce.Instance.freeWinNum;
        this.isClicked = true;
        this.winNum.string = "0";
        this.winNum.node.opacity = 0;
        this.node.active = true;
        this.node.opacity = 0;
        this.tweenNode.scale = 1;
        this.blast.scale = 3.5;
        this.sumWinNum = freeWinNum;
        for (let i = 0; i < this.coinPrefabs.length; i++) {
            this.coinPrefabs[i].position = this.originalPos[i];
            this.coinPrefabs[i].opacity = 0;
            this.coinPrefabs[i].scale = Math.random() + 0.6;
            this.coinPrefabs[i].angle = 45;
        }
        Audio.Instance.playFreeEnd();
        cc.Tween.stopAllByTag(331);
        cc.Tween.stopAllByTag(332);
        cc.Tween.stopAllByTag(333);
        cc.tween(this.node)
            .to(0.2, { opacity: 255 })
            .delay(0.5)
            .call(() => {
                this.isClicked = false;
                this.LabelEffect(freeWinNum);
                for (let i = 0; i < this.coinPrefabs.length; i++) {
                    let animeState = this.coinPrefabs[i].getComponent(cc.Animation).play('coin');
                    let targetX = (this.originalPos[i].x < 0 ? -1 : 1) * (Math.random() * 150 + 550);
                    let targetY = (this.originalPos[i].y < 0 ? -1 : 1) * (Math.random() * 500);
                    let duration = animeState.duration;
                    animeState.time = Math.random() * duration;
                    let targetPos = cc.v3(this.originalPos[i].x + targetX, this.originalPos[i].y + targetY, 0);
                    let random = Math.random() * 5;
                    let runTime = Math.random() + 2;
                    let tween1 = cc.tween(this.coinPrefabs[i]).to(runTime, { position: targetPos, angle: Math.random() * 720 }, cc.easeQuadraticActionOut());
                    let tween2 = cc.tween(this.coinPrefabs[i]).to(0.3, { opacity: 200 });
                    cc.tween(this.coinPrefabs[i])
                        .delay(random)
                        .call(() => {
                            cc.tween(this.coinPrefabs[i])
                                .parallel(tween1, tween2)
                                .call(() => {
                                    this.coinPrefabs[i].position = this.originalPos[i];
                                    this.coinPrefabs[i].opacity = 0;
                                    this.coinPrefabs[i].scale = Math.random() + 0.8;
                                    this.coinPrefabs[i].angle = 45;
                                })
                                .union()
                                .repeatForever()
                                .tag(331)
                                .start();
                        })
                        .tag(331)
                        .start();
                }
                cc.tween(this.winNum.node)
                    .to(0.2, { opacity: 255 })
                    .call(() => {
                        cc.tween(this.node)
                            .call(() => { })
                            .delay(5)
                            .to(0.3, { opacity: 0 })
                            .call(() => {
                                this.node.active = false;
                                cc.Tween.stopAllByTag(331);
                                for (let i = 0; i < this.coinPrefabs.length; i++) {
                                    this.coinPrefabs[i].getComponent(cc.Animation).stop();
                                }
                                SlotSuperAce.Instance.startAuto(true);
                                Audio.Instance.stopFreeEnd();
                            })
                            .tag(332)
                            .start();
                    })
                    .tag(332)
                    .start();
            })
            .tag(332)
            .start();
        this.tweenNode.opacity = 0;
        cc.tween(this.tweenNode)
            .to(0.3, { scale: 3, opacity: 120, y: -600 })
            .to(0.3, { scale: 1, opacity: 255, y: 0 }, cc.easeBackOut())
            .call(() => { })
            .tag(333)
            .start();
        cc.tween(this.blast)
            .to(0.3, { scale: 5.3, opacity: 50 })
            .to(0.3, { scale: 4.2, opacity: 30 }, cc.easeBackOut())
            .tag(333)
            .start();
    }

    onClick() {
        if (this.isClicked) return;
        this.isClicked = true;
        cc.Tween.stopAllByTag(332);
        this.node.opacity = 255;
        this.winNum.node.opacity = 255;
        this.winNum.string = this.sumWinNum.toString();
        this.unschedule(this.scheduleFunc);
        cc.tween(this.node)
            .delay(1.5)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.node.active = false;
                cc.Tween.stopAllByTag(331);
                for (let i = 0; i < this.coinPrefabs.length; i++) {
                    this.coinPrefabs[i].getComponent(cc.Animation).stop();
                }
                SlotSuperAce.Instance.startAuto(true);
                this.isClicked = false;
                Audio.Instance.stopFreeEnd();
            })
            .tag(332)
            .start();
    }

    LabelEffect(freeWinNum: number) {
        let addNum = freeWinNum / 250;
        let winNum = 0;
        this.winNum.string = "0";
        SlotSuperAce.Instance.freeWinNum = 0;
        this.schedule(this.scheduleFunc = () => {
            winNum += addNum;
            this.winNum.string = winNum.toFixed(0);
            if(winNum >= freeWinNum) this.winNum.string = Math.round(freeWinNum).toString();
        }, 0.012, 249)
    }
}
