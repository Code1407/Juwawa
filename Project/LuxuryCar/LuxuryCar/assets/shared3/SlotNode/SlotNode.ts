import CCDate from "../CCDate";
import { WeightToIndex } from "../function";
import SlotNodeElement from "./SlotNodeElement";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotNode extends cc.Component {

    @property(cc.Node)
    cfg: cc.Node = null;
    @property()
    interval: number = 0.1;
    @property(SlotNodeElement)
    slotElements: SlotNodeElement[] = [];

    isPlaying: boolean;

    protected start(): void {
        this.Init();
    }

    Init() {
        this.slotElements.forEach(element => {
            element.cfg = this.cfg;
            element.Init();
        });
    }

    thread: Promise<any>;
    async Play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            for (let i = 0; i < this.slotElements.length; i++) {
                let element = this.slotElements[i];
                element.Play(false);
                element.startPlayTime = CCDate.runTime + i * this.interval;
                element.SetStep();
            }
            this.thread = new Promise(async (res, rej) => {
                for (let i = 0; i < this.slotElements.length; i++) {
                    let element = this.slotElements[i];
                    await element.thread;
                }
                this.isPlaying = false;
                res(0);
            })
        }
        await this.thread;
    }

    RandomResult(count: number, interval: number, weights: number[][]) {
        for (let i = 0; i < this.slotElements.length; i++) {
            let slotElement = this.slotElements[i];
            for (let j = 0; j < count; j++) {
                slotElement.results.push({
                    id: WeightToIndex(weights[i]),
                    duration: interval,
                })
            }
        }
    }
}
