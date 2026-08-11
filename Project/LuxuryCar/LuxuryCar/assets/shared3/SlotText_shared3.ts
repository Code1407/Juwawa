import SlotNode from "./SlotNode/SlotNode";
import SlotNodeElement, { SlotDirection, SlotNodeElementResult } from "./SlotNode/SlotNodeElement";
import { NodePool } from "./PrefabPool_shared3";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotText extends cc.Component {
    @property(SlotNode)
    slots: SlotNode = null;
    @property(SlotNodeElement)
    slotElementPrefab: SlotNodeElement = null;
    @property(cc.Node)
    offsetPos: cc.Node = null;
    lastValue = 0;
    //从个位数开始先转，且个位数最后一个停
    setNum(value: number, duration: number) {
        if (this.lastValue == value)
            return;
        let addone = value > this.lastValue ? 1 : -1;
        //this.slotElementPrefab.InitMotion(addone > 0 ? SlotDirection.Up : SlotDirection.Down)
        let valueOffset = value - this.lastValue;
        this.lastValue = value;
        let valueNumLength = numLength(value)
        let valueOffsetNumLength = numLength(valueOffset)
        let maxLength = Math.max(valueNumLength, this.slots.slotElements.length);
        console.log({ numLength: valueNumLength, slotLength: this.slots.slotElements.length });
        cc.tween(this.node).delay(duration + 0.5).call(() => {
            console.log({ numLength: valueNumLength, slotLength: this.slots.slotElements.length });
        }).start();
        for (let i = 0; i < maxLength; i++) {
            let aryNum = numChar(value, i);
            let slotElement = this.slots.slotElements[i];
            let delayStart = 0;
            if (maxLength > 1 && i > 0)
                delayStart = duration / 2 * Math.pow(1 / 2, maxLength - i);
            let elementDuration = (duration / 2 - delayStart) + duration / 2 * Math.pow(1 / 2, i + 1)
            let indexI = i;
            cc.tween(this.node).delay(delayStart).call(() => {
                let isNew = slotElement == null;
                if (slotElement == null) {
                    slotElement = NodePool.Spawn(this.slotElementPrefab.node.parent).children[0].getComponent(SlotNodeElement)
                    slotElement.node.parent.setSiblingIndex(0);
                    slotElement.Init();
                    slotElement.curResults = [0, 0, 0];
                    this.slots.slotElements.push(slotElement);
                    if (indexI > 0) {
                        cc.Tween.stopAllByTarget(this.offsetPos);
                        this.offsetPos.x -= slotElement.node.parent.width / 2
                        cc.tween(this.offsetPos).to(elementDuration / 2, { x: 0 }).start();
                    }
                }
                slotElement.InitMotion(addone > 0 ? SlotDirection.Up : SlotDirection.Down)
                let lastResult = slotElement.curResults[1] || 0;
                let pushCount = 0;
                pushCount += 10 * Math.max(valueOffsetNumLength - indexI - 1, 0);
                for (let j = 0; floor10(lastResult + j * addone) != aryNum; j++) {
                    pushCount++;
                    if (j > 950) {
                        console.warn("death loop", { j, lastResult, addone, cal: floor10(lastResult + (j + 1) * addone), aryNum });
                        //return;
                    }
                    if (j > 1000) {
                        console.error("death loop", { lastResult, aryNum, slotElement });
                        return;
                    }
                }
                if (pushCount > 0) {
                    if (isNew)
                        pushCount++;
                    let reaultElementDuration = elementDuration / pushCount
                    for (let j = 0; j < pushCount; j++) {
                        let curId = floor10(lastResult + (j + (isNew ? 1 : 2)) * addone);
                        let slotElementResult: SlotNodeElementResult = {
                            id: curId,
                            duration: reaultElementDuration,
                        }
                        slotElement.results.push(slotElementResult);
                        if (indexI > 0 && indexI >= valueNumLength && j > pushCount - 3) {
                            slotElementResult.callback = () => {
                                slotElement.ClearDisplay();
                                this.slots.slotElements.splice(this.slots.slotElements.indexOf(slotElement), 1);
                                NodePool.Recycle(slotElement.node.parent);
                                cc.Tween.stopAllByTarget(this.offsetPos);
                                this.offsetPos.x += slotElement.node.parent.width / 2
                                cc.tween(this.offsetPos).to(elementDuration / 2, { x: 0 }).start();
                                // slotElement.node.parent.destroy();
                                // console.log("delete", indexI);
                            }
                            break;
                        }
                    }
                    slotElement.timeLerp = cc.easeCubicActionOut().easing;
                    slotElement.Play();
                }
            }).start();
        }
    }
}

function numChar(value: number, index: number) {
    return Math.floor(value / Math.pow(10, index) % 10);
}

function numLength(value: number) {
    return Math.floor(Math.log10(Math.abs(value))) + 1;
}
function floor10(value: number) {
    return value % 10 < 0 ? value % 10 + 10 : value % 10
}