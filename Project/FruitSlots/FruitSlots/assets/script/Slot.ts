// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import SlotItemEff from "./effect/SlotItemEff";
import ImageCache from "./image/ImageCache";
import { getRandomNumInt, rateRandomResult } from "./interface/IFruitSlots";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Slot extends cc.Component {

    @property(cc.Prefab)
    slotItemPrefab: cc.Prefab = null;

    groupCount = 0;

    private results: number[] = [];
    private remainRunCount = 0;
    private runCount = 0;
    private toSetRemain = 0;

    reset(probability: number[]) {
        this.resetPos();

        this.toSetRemain = 0;
        this.runCount = 0;
        this.remainRunCount = this.groupCount - 3;
        for (let i = 0; i < this.groupCount; i++) {
            let childNode = this.node.children[i];
            let result = rateRandomResult(probability);
            this.assignGoods(childNode, result);
        }
        this.fixedValue(this.results, this.groupCount - this.results.length); // 底部固定为上局的值
    }

    setResults(results: number[]) {
        this.results = results;
        this.fixedValue(results, 0); // 顶部固定为这局的值
    }

    setRemainRunCount(remain: number) {
        this.toSetRemain = remain;
    }

    toSetRemainRunCount() {
        if (this.remainRunCount > this.toSetRemain) {
            this.remainRunCount = this.toSetRemain;
            this.fixedValue(this.results, this.groupCount - this.runCount - this.remainRunCount - 3); // 剩下的固定为这局的值
        }
    }
    
    getRemainRunCount() {
        return this.remainRunCount;
    }

    run() {
        if (this.toSetRemain > 0) {
            this.toSetRemainRunCount();
            this.toSetRemain = 0;
        }
        const distance = 120;
        if (this.remainRunCount > 0) {
            this.runCount++;
            this.remainRunCount--;
            let toPos = this.node.position.clone();
            let targetY = -distance * this.runCount;
            toPos.y = targetY;
            if (this.remainRunCount == 0) {
                let toPosLow = toPos.clone();
                toPosLow.y -= 50;
                cc.tween(this.node)
                .to(0.15, {position: toPos})
                .to(0.1, {position: toPosLow})
                .to(0.1, {position: toPos})
                .start();
            } else {
                /* 逐渐减速
                let speed = 0.05;
                if (this.remainRunCount == 2) speed = 0.08;
                if (this.remainRunCount == 1) speed = 0.1;
                */
                const __this = this;
                cc.tween(this.node).to(0.05, {position: toPos}).call(()=>{
                    __this.run();
                }).start();
            }
        }
    }

    shakeChild(index: number, wide: boolean) {
        let childIndex = this.groupCount - this.runCount  - 3 + index;
        let childNode = cc.find(childIndex.toString(), this.node);
        if (!childNode) {
            // console.log("shakeChild", 27, 25, 0);
            console.log("shakeChild", this.node.name, this.groupCount, this.runCount, index);
            return;
        }
        childNode.getComponent(SlotItemEff).shake(wide);
    }

    assignGoods(node: cc.Node, goodsIndex: number) {
        /*
        node.removeAllChildren(true);
        let goods = cc.instantiate(ImageCache.Instance.goods[goodsIndex].node);
        goods.scale = 0.8;
        node.addChild(goods);
        */
       let goods = ImageCache.Instance.goods[goodsIndex];
       let child = node.getChildByName("goods");
       child.getComponent(cc.Sprite).spriteFrame = goods.spriteFrame;
       child.getComponent(cc.Sprite).trim = false;
       child.width = child.height = 90;
    }

    private init() {
        this.resetPos();
        this.node.removeAllChildren(true);
        this.runCount = 0;
        this.remainRunCount = this.groupCount - 3;
        for (let i = 0; i < this.groupCount; i++) {
            let result = getRandomNumInt(0, 7);
            let itemNode = cc.instantiate(this.slotItemPrefab);
            itemNode.name = i.toString();
            this.assignGoods(itemNode, result);
            this.node.addChild(itemNode);
            if (i >= this.groupCount - 3) {
                this.results.push(result);
            }
        }
    }

    private resetPos() {
        let toPos = this.node.position.clone();
        toPos.y = 0;
        this.node.setPosition(toPos);
    }
    
    private fixedValue(valuses: number[], beginIndex: number) {
        for (let i = beginIndex; i < beginIndex + valuses.length; i++) {
            let result = this.results[i - beginIndex];
            this.assignGoods(this.node.children[i], result);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.init();
    }

    // update (dt) {}
}
