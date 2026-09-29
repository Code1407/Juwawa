import { _decorator, tween } from 'cc';
import { UIRewardItem } from './UIRewardItem';
import ColorChange from './ColorChange';
import { v3 } from 'cc';
import { Tween } from 'cc';
const { ccclass } = _decorator;

@ccclass('WheelsEffect')
export default class WheelsEffect {
    private itemIndex: number = 0;

    constructor(private items: Array<UIRewardItem>) {
        items.forEach(item => {
            for (let i = 0; i < item.node.children.length; ++i) {
                item.node.children[i].addComponent(ColorChange);
            }
        });
    }

    init() {
        this.enterBet();
    }

    betEffect(second: number) {
        this.bg1Item(this.itemIndex);
        this.indexIncrease();
        this.fingerAndbg2Item(this.itemIndex);
    }

    runEffect(second: number): number {
        this.bg1Item(this.itemIndex);
        this.darkItem(this.itemIndex);
        this.indexIncrease();
        this.bg2Item(this.itemIndex);
        this.recoverItem(this.itemIndex);
        return this.itemIndex;
    }

    finalEffect(index: number) {
        let godds = this.items[index].icon.node;
        Tween.stopAllByTarget(godds);
        tween(godds)
            .to(0.3, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: v3(1.0, 1.0, 1.0) })
            .to(0.3, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: v3(1.0, 1.0, 1.0) })
            .to(0.3, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: v3(1.0, 1.0, 1.0) })
            .to(0.3, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: v3(1.0, 1.0, 1.0) })
            .start();
    }


    enterBet() {
        this.recoverItems();
        this.bg1Items();
    }

    darkItem(index: number) {
        let item = this.items[index];
        for (let i = 0; i < item.node.children.length; ++i) {
            let itemEff = item.node.children[i].getComponent(ColorChange);
            itemEff.dark();
        }
    }

    recoverItem(index: number) {
        let item = this.items[index];
        for (let i = 0; i < item.node.children.length; ++i) {
            let itemEff = item.node.children[i].getComponent(ColorChange);
            itemEff.recover();
        }
    }

    bg1Item(index: number) {
        this.items[index].nod_select.active = false;
        this.items[index].nod_finger.active = false;
    }

    bg2Item(index: number) {
        this.items[index].nod_select.active = true;
        this.items[index].nod_finger.active = false;
    }

    fingerAndbg2Item(index: number) {
        this.items[index].nod_select.active = true;
        this.items[index].nod_finger.active = true;
        let godds = this.items[index].icon.node;
        Tween.stopAllByTarget(godds);
        tween(godds)
            .to(0.3, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.3, { scale: v3(1.0, 1.0, 1.0) })
            .start();
    }

    darkItems() {
        for (let i = 0; i < this.items.length; ++i) {
            this.darkItem(i);
        }
    }

    recoverItems() {
        for (let i = 0; i < this.items.length; ++i) {
            this.recoverItem(i);
        }
    }

    bg1Items() {
        for (let i = 0; i < this.items.length; ++i) {
            this.bg1Item(i);
        }
    }

    enterRun() {
        this.items[this.itemIndex].nod_select.active = false;
        this.darkItems();
    }

    clearRunAni() {
        this.items.forEach(item => {
            Tween.stopAllByTarget(item.icon.node);
        });
    }

    private indexIncrease() {
        this.itemIndex = ++this.itemIndex % this.items.length;
    }
}


