// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import Game from "./Game";
import SlotSuperAce from "./Slot_SuperAce";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MultipleBar extends cc.Component {

    @property(cc.Node)
    normalMultipleBar: cc.Node = null;

    @property(cc.Node)
    freeMultipleBar: cc.Node = null;

    @property(cc.Node)
    normalMultiples: cc.Node[] = [];

    @property(cc.Node)
    freeMultiples: cc.Node[] = [];

    @property(cc.Animation)
    blast: cc.Animation = null;

    freeEffOn: boolean = false;
    scheduleFunc: Function = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.init();
    }

    switchMode(mode: boolean) {
        if (mode) this.normalMultipleBar.active = false;
        else this.normalMultipleBar.active = true;
        this.freeMultipleBar.active = !this.normalMultipleBar.active;
    }

    init() {
        // this.normalMultipleBar.active = true;
        // this.freeMultipleBar.active = false;
        for (let i = 0; i < this.normalMultiples.length; i++) {
            this.normalMultiples[i].active = false;
            this.freeMultiples[i].active = false;
        }
        for (let i = 0; i < this.freeMultiples.length; i++) {
            this.freeMultiples[i].active = false;
            this.normalMultiples[i].active = false;
        }
        this.blast.node.x = this.normalMultiples[0].x
        this.setMultiple(0);
    }

    setMultiple(index: number) {
        if (index < 0) return;
        if (index > 4) return;
        for (let i = 0; i < this.normalMultiples.length; i++) {
            this.normalMultiples[i].active = false;
        }
        for (let i = 0; i < this.freeMultiples.length; i++) {
            this.freeMultiples[i].active = false;
        }
        this.blast.node.x = this.normalMultiples[index].x;
        if (index > 0) {
            this.blast.play("blast");
            this.blast.once("finished", () => {
                this.blast.play("blastStand");
            })
        }
        this.normalMultiples[index].active = true;
        this.freeMultiples[index].active = true;
    }

    freeEffect(index: number = 0) {
        this.init();
        this.freeEffOn = true;
        this.schedule(this.scheduleFunc = () => {
            Audio.Instance.playMultipleBars(index);
            this.freeMultiples[0].active = true;
            this.freeMultiples[index].active = true;
            this.blast.node.active = true;
            this.blast.node.x = this.normalMultiples[index].x;
            this.blast.play("blast");
            this.blast.once("finished", () => {
                this.blast.node.active = false;
                if(index != 0) this.freeMultiples[index].active = false;
                if (index >= 4) {
                    this.stopEff();
                }
                index++;
            });
        }, 0.5, 4);
    }

    stopEff() {
        Audio.Instance.stopMultipleBars();
        this.unschedule(this.scheduleFunc);
        this.blast.node.x = this.normalMultiples[0].x;
        this.blast.node.active = true;
        this.blast.play("blastStand");
        this.init();
        this.freeEffOn = false;
    }

    // update (dt) {}
}
