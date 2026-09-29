// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import ImageCache from "./image/ImageCache";
import { IHistoryItem } from "./interface/ILuckyFruits";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Historyicon extends cc.Component {

    @property(cc.SpriteFrame)
    icon: Array<cc.SpriteFrame> = [];

    // @property(cc.Node)
    // icon: Array<cc.Node> = [];

    @property(cc.Node)
    items: cc.Node = null;

    @property(cc.Sprite)
    goods: Array<cc.Sprite> = []

    private itemsBasePosition: cc.Vec3 = null;
    private animationEpoch: number = 0;

    static get Instance() {
        return cc.find("Canvas/Game/HistoryBtn").getComponent(Historyicon);
    }

    private ensureItemsBasePosition() {
        if (!this.itemsBasePosition && this.items) {
            this.itemsBasePosition = this.items.position.clone();
        }
    }

    private resetAnimationState() {
        this.ensureItemsBasePosition();
        this.animationEpoch++;
        if (this.items) {
            cc.Tween.stopAllByTarget(this.items);
            this.items.stopAllActions();
            if (this.itemsBasePosition) {
                this.items.position = this.itemsBasePosition.clone();
            }
        }
        if (this.items && this.items.children[0]) {
            cc.Tween.stopAllByTarget(this.items.children[0]);
            this.items.children[0].stopAllActions();
            this.items.children[0].opacity = 0;
        }
    }

    setIcon(itemValues: IHistoryItem[]) {
        this.resetAnimationState();
        let historyList = (itemValues || []).concat();
        historyList = historyList.reverse();
        historyList.splice(6)

        for (let i = 1; i < this.goods.length; i++) {
            if (!this.goods[i]) continue;
            this.goods[i].node.active = i <= historyList.length;
            if (i > historyList.length) {
                this.goods[i].getComponent(cc.Sprite).spriteFrame = null;
            }
        }

        for (let i = 0; i < historyList.length && i + 1 < this.goods.length; i++) {
            if (!this.goods[i + 1]) continue;
            this.goods[i + 1].node.active = true;
            this.goods[i + 1].getComponent(cc.Sprite).spriteFrame = this.icon[historyList[i].roundResult];
        }
    }

    addIcon(itemValues: IHistoryItem[]) {
        this.resetAnimationState();
        const animationEpoch = this.animationEpoch;
        let historyList = (itemValues || []).concat();
        historyList = historyList.reverse();
        historyList.splice(6)

        for (let i = 0; i < historyList.length && i < this.goods.length; i++) {
            if (!this.goods[i]) continue;
            this.goods[i].getComponent(cc.Sprite).spriteFrame = this.icon[historyList[i].roundResult];
        }
        this.items.children[0].opacity = 0;
        let pos = this.itemsBasePosition ? this.itemsBasePosition.clone() : this.items.position.clone();
        let targetPos = cc.v3(pos.x + 106, pos.y, pos.z);
        cc.tween(this.items)
            .to(0.5, { position: targetPos }, cc.easeBackOut())
            .call(() => {
                if (this.animationEpoch != animationEpoch) return;
                cc.tween(this.items.children[0])
                    .to(0.3, { opacity: 255 })
                    .call(() => {
                        if (this.animationEpoch != animationEpoch) return;
                        this.setIcon(itemValues)
                        this.items.position = pos;
                        this.items.children[0].opacity = 0;
                    })
                    .start();
            })

            .start();
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.ensureItemsBasePosition();
    }

    // start () {}

    // update (dt) {}
}
