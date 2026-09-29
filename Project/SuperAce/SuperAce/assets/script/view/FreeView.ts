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
export default class FreeView extends cc.Component {

    @property(cc.Node)
    coin: cc.Node = null;

    @property(cc.Prefab)
    coinPrefab: cc.Prefab = null;
    
    @property(cc.Node)
    tweenNode: cc.Node = null;
    
    @property(cc.Node)
    blast: cc.Node = null;

    @property(cc.Node)
    tenWord: cc.Node = null;
    
    isClicked: boolean = false;
    coinPrefabs: cc.Node[] = [];
    originalPos: cc.Vec3[] = [];
    static instance: FreeView = null;

    static get Instance(): FreeView {
        if (!this.instance) this.instance = cc.find("Canvas/Views/FreeView").getComponent(FreeView);
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
            this.coinPrefabs.push(coin);
        }
        for (let i = 0; i < this.coinPrefabs.length; i++) {
            this.originalPos.push(this.coinPrefabs[i].position);
        }
        this.node.on(cc.Node.EventType.TOUCH_START, this.onClick, this);
    }
    protected onEnable(): void {
        // this.init();
        this.node.opacity = 0;
        this.tweenNode.scale = 1;
        this.blast.scale = 3.5;
        this.tenWord.scale = 1;
        cc.Tween.stopAllByTag(231);
        cc.Tween.stopAllByTag(232);
        cc.Tween.stopAllByTag(233);
        Audio.Instance.playFree();
        for (let i = 0; i < this.coinPrefabs.length; i++) {
            this.coinPrefabs[i].position = this.originalPos[i];
            this.coinPrefabs[i].opacity = 0;
            this.coinPrefabs[i].scale = 1.5;
            this.coinPrefabs[i].angle = 45;
            let animeState = this.coinPrefabs[i].getComponent(cc.Animation).play('coin');
            let targetX =( this.originalPos[i].x < 0 ? -1 : 1) * (Math.random() * 1200);
            let targetY =( this.originalPos[i].y < 0 ? -1 : 1) * (targetX > 600 || targetX < -600? (Math.random() * 300) : (Math.random() * 200 + 700));
            let duration = animeState.duration;
            animeState.time = Math.random() * duration;
            let targetPos = cc.v3(this.originalPos[i].x + targetX, this.originalPos[i].y + targetY, 0);
            let random = Math.random() * 2;
            let runTime = Math.random() + 2;
            let tween1 = cc.tween(this.coinPrefabs[i]).to(runTime, { position: targetPos, angle: Math.random() * 720 }, cc.easeQuadraticActionOut());
            let tween2 = cc.tween(this.coinPrefabs[i]).to(0.3, { opacity: 200 });
            cc.tween(this.coinPrefabs[i])
                .delay(random)
                .call(()=>{
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
                        .tag(231)
                        .start();
                })
                .tag(231)
                .start();
        }
        cc.tween(this.node)
            .to(0.2, { opacity: 255 })
            .delay(1)
            .call(() => {
                this.isClicked = true;
                cc.tween(this.node)
                    .call(() => { })
                    .delay(1.5)
                    .to(0.3, { opacity: 0 })
                    .call(() => {
                        this.node.active = false;
                        SlotSuperAce.Instance.multipleBar.freeEffect();
                        cc.Tween.stopAllByTag(231);
                        for (let i = 0; i < this.coinPrefabs.length; i++) {
                            this.coinPrefabs[i].getComponent(cc.Animation).stop();
                        }
                        this.isClicked = false;
                        Audio.Instance.stopFree();
                            setTimeout(() => {
                                if(SlotSuperAce.Instance.isAuto){
                                    SlotSuperAce.Instance.startAuto(true);
                                }
                            }, 3000);
                    })
                    .tag(232)
                    .start();
            })
            .tag(232)
            .start();
        cc.tween(this.tweenNode)
            .to(0.3, { scale: 1.6, opacity: 120 })
            .to(0.3, { scale: 1.2, opacity: 255 }, cc.easeBackOut())
            .call(() => {
                cc.tween(this.tenWord)
                    .to(0.05, {scale: 1.1})
                    .to(0.5, {scale: 1.0})
                    .union()
                    .repeat(2)
                    .tag(233)
                    .start();
                SlotSuperAce.Instance.freeViewDisapper(false);
            })
            .tag(233)
            .start();
        cc.tween(this.blast)
            .to(0.3, { scale: 5.3, opacity: 255 })
            .to(0.3, { scale: 4.2, opacity: 150 }, cc.easeBackOut())
            .tag(233)
            .start();
    }


    onClick() {
        if (this.isClicked) return;
        this.isClicked = true;
        this.node.opacity = 255;
        cc.Tween.stopAllByTag(232);
        cc.tween(this.node)
            .call(() => {
                SlotSuperAce.Instance.freeViewDisapper(false);
            })
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.node.active = false;
                SlotSuperAce.Instance.multipleBar.freeEffect();
                cc.Tween.stopAllByTag(231);
                for (let i = 0; i < this.coinPrefabs.length; i++) {
                    this.coinPrefabs[i].getComponent(cc.Animation).stop();
                }
                this.isClicked = false;
                Audio.Instance.stopFree();

                    setTimeout(() => {
                        if(SlotSuperAce.Instance.isAuto){
                            SlotSuperAce.Instance.startAuto(true);
                        }
                    }, 3000);
            })
            .tag(232)
            .start();
    }

    // update (dt) {}
}
