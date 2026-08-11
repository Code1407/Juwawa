// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import CCDate from "../CCDate";
import { NodePool } from "../PrefabPool_shared3";
import { ArraySum } from "../function";

const { ccclass, property } = cc._decorator;

export enum SlotDirection {
    Up,
    Down,
    Left,
    Right,
}

export const slot_Event_Once_slotOut = "slot_Event_Once_slotOut"

let deleteLength = 0;//剔除量
let displayIndex1 = 0;
let displayIndex2 = 1;
let display1: cc.Node = null;
let display2: cc.Node = null;
let child: cc.Node = null;

export class SlotNodeElementResult {
    id: number;
    duration?: number;
    progress?: (input: number) => number;
    callback?: () => void
}

function defaultTimeLerp(t: number) {
    return t;
}

@ccclass
export default class SlotNodeElement extends cc.Component {
    @property({ type: cc.Enum(SlotDirection) })
    direction: SlotDirection = SlotDirection.Up;
    @property(cc.Node)
    cfg: cc.Node = null;
    @property(cc.Node)
    allDisplay: cc.Node[] = [];
    curResults: number[] = [];

    results: SlotNodeElementResult[] = [];

    GetMotion: () => ConstructorType<cc.Node>;
    SetMotion: (rata: number) => void;
    GetFirstIndex: (index: number) => number;

    initialPos: cc.Vec3;
    tw: () => cc.Tween<cc.Node> = () => cc.tween(this.node);
    tws: cc.Tween<cc.Node>[] = [];

    isPlaying: boolean = false;
    startPlayTime: number = 0;
    timeStep: number[] = [];
    initialResults: number[] = [];
    totalResults: number[] = [];

    totalDuration: number = 0;
    timeLerp: (t: number) => number = defaultTimeLerp;

    isIniit = false
    protected start(): void {
        if (!this.isIniit)
            this.Init();
    }

    Init() {
        this.isIniit = true;
        this.initialPos = this.node.position;
        this.InitMotion(this.direction);
        this.tw = () => cc.tween(this.node);
        this.curResults = new Array<number>(this.allDisplay.length);
    }

    InitMotion(dir: SlotDirection) {
        switch (dir) {
            case SlotDirection.Up:
                this.GetMotion = () => { return { y: this.node.height / this.allDisplay.length + this.initialPos.y } }
                this.SetMotion = (rate) => this.node.y = this.node.height / this.allDisplay.length * rate + this.initialPos.y;
                this.GetFirstIndex = (index) => index;
                break;
            case SlotDirection.Down:
                this.GetMotion = () => { return { y: -this.node.height / this.allDisplay.length + this.initialPos.y } }
                this.SetMotion = (rate) => this.node.y = -this.node.height / this.allDisplay.length * rate + this.initialPos.y;
                this.GetFirstIndex = (index) => this.allDisplay.length - 1 - index;
                break;
            case SlotDirection.Left:
                this.GetMotion = () => { return { x: -this.node.width / this.allDisplay.length + this.initialPos.x } }
                this.SetMotion = (rate) => this.node.x = -this.node.width / this.allDisplay.length * rate + this.initialPos.x;
                this.GetFirstIndex = (index) => index;
                break;
            case SlotDirection.Right:
                this.GetMotion = () => { return { x: this.node.width / this.allDisplay.length + this.initialPos.x } }
                this.SetMotion = (rate) => this.node.x = this.node.width / this.allDisplay.length * rate + this.initialPos.x;
                this.GetFirstIndex = (index) => this.allDisplay.length - 1 - index;
                break;
        }
    }

    ClearDisplay() {
        for (let display of this.allDisplay) {
            child = display.children[0];
            display.removeChild(child);
            NodePool.Recycle(child);
        }
    }

    AddNewResults(results: number[]) {
        if (results.length > 0) {
            deleteLength = Math.min(results.length, this.allDisplay.length);//剔除量

            for (let i = 0; i < deleteLength; i++) {//剔除
                displayIndex1 = this.GetFirstIndex(i);
                display1 = this.allDisplay[displayIndex1];
                while (display1.children.length > 0) {
                    child = display1.children[0];
                    display1.removeChild(child);
                    child.emit(slot_Event_Once_slotOut);
                    NodePool.Recycle(child);
                }
            }

            for (let i = 0; i < this.allDisplay.length - deleteLength; i++) {//移位
                displayIndex1 = this.GetFirstIndex(i);
                displayIndex2 = this.GetFirstIndex(i + deleteLength);
                display1 = this.allDisplay[displayIndex1];
                display2 = this.allDisplay[displayIndex2];
                while (display2.children.length > 0) {
                    child = display2.children[0];
                    // display2.removeChild(child);
                    // display1.addChild(child);
                    child.setParent(display1);
                    child.position = cc.Vec3.ZERO;
                }
                this.curResults[displayIndex1] = this.curResults[displayIndex2];
            }

            for (let i = 0; i < deleteLength; i++) {//补位
                displayIndex1 = this.GetFirstIndex(i + this.allDisplay.length - deleteLength)
                display1 = this.allDisplay[displayIndex1];
                child = NodePool.Spawn(this.cfg.children[results[i]]);
                child.setParent(display1);
                child.position = cc.Vec3.ZERO;
                this.curResults[displayIndex1] = results[i];
            }
        }
    }

    /**比如end为0，则全删，比如end为1，保留倒数1个，比如end为2，保留倒数2个*/
    CutResult(offset: number, end: number) {//删除后续动画，直接停止
        let curTime = CCDate.runTime;
        let curResultIndex = 0;
        for (let i = 0; i < this.timeStep.length - 1; i++) {
            if (curTime > this.timeStep[i]) {
                curResultIndex = i;
            }
        }
        let deleteCount = this.results.length - end - curResultIndex - offset;
        if (deleteCount > 0) {
            this.results.splice(curResultIndex + offset, deleteCount);
        }
    }

    SetStep() {
        this.timeStep = [];//所有图帧的出现时间点
        this.totalDuration = 0;
        this.totalResults = [];//所有图帧
        if (!this.isPlaying) {
            this.initialResults = [];
            for (let i = 0; i < this.allDisplay.length - 1; i++) {
                this.initialResults.push(this.curResults[this.GetFirstIndex(i)]);
            }
        }
        for (let i = 0; i < this.initialResults.length; i++) {
            this.totalResults.push(this.initialResults[i]);
        }
        this.timeStep.push(this.startPlayTime);
        for (let i = 0; i < this.results.length; i++) {
            this.timeStep.push(this.startPlayTime);
            this.totalResults.push(this.results[i].id);
            if (this.results[i].duration != null) {
                for (let j = 0; j < i + 1; j++) {
                    this.timeStep[i + 1] += this.results[j].duration;
                }
                this.totalDuration += this.results[i].duration;
            }
        }
    }

    thread: Promise<any>;

    async Play(setStep = true) {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.thread = new Promise(async (res, rej) => {
                this.startPlayTime = CCDate.runTime;
                let curResultIndex = 0;
                let preResultIndex = 0;
                let repeat = cc.tween(this.node).repeatForever(cc.tween(this.node).delay(0).call(() => {
                    let curOffset = CCDate.runTime - this.startPlayTime
                    let curTime = this.startPlayTime + this.totalDuration * this.timeLerp(curOffset / this.totalDuration);
                    curResultIndex = 0;
                    let duration = 0;
                    for (let i = 0; i < this.timeStep.length - 1; i++) {
                        if (curTime > this.timeStep[i]) {
                            curResultIndex = i;
                            duration = (curTime - this.timeStep[i]);
                        }
                    }
                    if (this.results.length > 0) {
                        let curResult = this.results[curResultIndex];
                        if (curResult.progress != null)
                            this.SetMotion(curResult.progress(duration / curResult.duration));
                        else
                            this.SetMotion(duration / curResult.duration);
                        if (curResultIndex > preResultIndex) {
                            let incr = curResultIndex - preResultIndex;
                            let incrResult: number[] = [];
                            for (let i = 0; i < incr; i++) {
                                incrResult.push(this.results[preResultIndex + i].id);
                            }
                            this.AddNewResults(incrResult);
                            for (let i = 0; i < incr; i++) {
                                this.results[preResultIndex + i].callback?.();
                            }
                            preResultIndex = curResultIndex;
                        }
                    }
                    if (curTime > this.timeStep[this.timeStep.length - 1]) {
                        this.SetMotion(0);
                        let incr = this.results.length - preResultIndex;
                        let incrResult: number[] = [];
                        for (let i = 0; i < incr; i++) {
                            incrResult.push(this.results[preResultIndex + i].id);
                        }
                        this.AddNewResults(incrResult);
                        for (let i = 0; i < incr; i++) {
                            this.results[preResultIndex + i].callback?.();
                        }
                        repeat.stop();
                        console.log("stop");
                        this.isPlaying = false;
                        this.results = [];
                        this.timeLerp = defaultTimeLerp;
                        res(0);
                    }
                })).start();
            });
        }
        if (setStep)
            this.SetStep();
        await this.thread;
    }
    SetDisplay(displayIndex: number, configIndex: number) {
        if (this.curResults[displayIndex] != configIndex) {
            this.curResults[displayIndex] = configIndex;
            let display = this.allDisplay[displayIndex];
            while (display.children.length > 0) {
                let child = display.children[0];
                display.removeChild(child);
                NodePool.Recycle(child);
            }
            if (this.cfg.children[configIndex] == null) {
                console.error("[configIndex] == null", configIndex);
                console.error("curResults", this.curResults);
                return;
            }
            let child = NodePool.Spawn(this.cfg.children[configIndex]);
            child.setParent(display);
            child.position = cc.Vec3.ZERO;
        }
    }
}
