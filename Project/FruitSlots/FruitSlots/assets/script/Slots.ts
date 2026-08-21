// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { EGameStatus } from "../shared3/interface/IGame";
import { linePaths } from "./interface/IFruitSlots";
import Slot from "./Slot";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Slots extends cc.Component {

    @property(Slot)
    slots: Slot[] = [];

    newRound() {
        // 显示机率
        let probabilitys = [
            [0.18, 0.18, 0.18, 0.18, 0.18, 0.1, 0.1, 0, 0.05, 0.05],
            [0.08, 0.08, 0.08, 0.08, 0.08, 0.05, 0.05, 0.4, 0.05, 0.05],
            [0.08, 0.08, 0.08, 0.08, 0.08, 0.05, 0.05, 0.4, 0.05, 0.05],
            [0.18, 0.18, 0.18, 0.08, 0.08, 0.05, 0.05, 0.1, 0.05, 0.05],
            [0.18, 0.18, 0.18, 0.08, 0.08, 0.05, 0.05, 0.1, 0.05, 0.05]
        ];

        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.reset(probabilitys[i]);
        }
    }

    run() {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.run();
        }
    }

    getSlotsStatus(): EGameStatus {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            if (slot.getRemainRunCount() != 0) return EGameStatus.run;
        }
        return EGameStatus.final;
    }

    setResults(results: number[]) {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            let slotResult: number[] = [];
            slotResult.push(results[i]);
            slotResult.push(results[i + this.slots.length]);
            slotResult.push(results[i + this.slots.length*2]);
            slot.setResults(slotResult);
        }
    }

    setSlotRemain(remain: number) {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.setRemainRunCount(remain);
        }
    }

    shakeSame(connectedIndex: number[], wide: boolean) {
        for (let i = 0; i < connectedIndex.length; i++) {
            let index = connectedIndex[i];
            let slotIndex = index % 5;
            let childIndex = (index - slotIndex) / linePaths[0].length;
            this.slots[slotIndex].shakeChild(childIndex, wide);
        }
    }

    shakeSameWide(connectedIndex: number[]) {
        this.shakeSame(connectedIndex, true);
    }

    shakeSameMinor(connectedIndex: number[]) {
        this.shakeSame(connectedIndex, false);
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.newRound();
        const groupCount = 9;
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            let slotGroupCount = 3 * groupCount + groupCount * i;
            slot.groupCount = slotGroupCount;
        }
    }

    // start () {}

    // update (dt) {}
}
