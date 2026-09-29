// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import Views from "./Views";
import NoticeView from "./view/NoticeView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AutoCtrl extends cc.Component {

    @property(cc.Node)
    countBtns: cc.Node[] = [];

    @property(cc.Label)
    countLabel: cc.Label = null;

    @property(cc.Label)
    minLabel: cc.Label = null;

    @property(cc.Label)
    maxLabel: cc.Label = null;

    @property(cc.Label)
    multipleLabel: cc.Label = null;

    @property(cc.Node)
    startBtn: cc.Node = null;

    @property(cc.Node)
    cancelBtn:cc.Node = null;

    @property(cc.Node)
    multiSelect: cc.Node = null;

    @property(cc.Node)
    minSelect: cc.Node = null;

    @property(cc.Node)
    maxSelect: cc.Node = null;

    @property(cc.Node)
    multiSelectBtn: cc.Node = null;

    @property(cc.Node)
    multiSelectFrame: cc.Node = null;

    @property(cc.Node)
    minSelectBtn: cc.Node = null;

    @property(cc.Node)
    minSelectFrame: cc.Node = null;

    @property(cc.Node)
    maxSelectBtn: cc.Node = null;

    @property(cc.Node)
    maxSelectFrame: cc.Node = null;

    @property(cc.Node)
    maxInc: cc.Node = null;

    @property(cc.Node)
    minInc: cc.Node = null;

    @property(cc.Node)
    multiInc: cc.Node = null;

    @property(cc.Node)
    countInc: cc.Node = null;

    @property(cc.Node)
    maxDec: cc.Node = null;

    @property(cc.Node)
    minDec: cc.Node = null;

    @property(cc.Node)
    multiDec: cc.Node = null;

    @property(cc.Node)
    countDec: cc.Node = null;

    @property(cc.Node)
    closeBtn: cc.Node = null;

    @property(cc.Node)
    bg: cc.Node = null;

    limitMin: boolean = false;
    limitMax: boolean = false;
    limitMulti: boolean = false;
    minNum: number = 800;
    maxNum: number = 3000;
    multipleNum: number = 0;
    betCount: number = 50;
    betCounts: number[] = [];
    static instance:AutoCtrl = null;
    isClicked: boolean = false;
    scheduleFunc: Function = null;
    scheduleFunc1: Function = null;
    scheduleFunc2: Function = null;
    timeInterval: number = 0.15;
    pressTime: number = 0.5;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    static get Instance(): AutoCtrl {
        if (!AutoCtrl.instance) this.instance = cc.find("Canvas/Views/AutoView").getComponent(AutoCtrl);
        return AutoCtrl.instance;
    }

    init(){
        if(this.scheduleFunc) this.unschedule(this.scheduleFunc);
        if(this.scheduleFunc1) this.unschedule(this.scheduleFunc1);
        if(this.scheduleFunc2) this.unschedule(this.scheduleFunc2);
        this.limitMax = false;
        this.limitMin = false;
        this.limitMulti = false;
        this.maxSelectBtn.active = false;
        this.minSelectBtn.active = false;
        this.multiSelectBtn.active = false;
        this.maxSelectFrame.active = false;
        this.minSelectFrame.active = false;
        this.multiSelectFrame.active = false;
        this.maxLabel.string = this.maxNum.toString();
        this.minLabel.string = this.minNum.toString();
        this.multipleLabel.string = this.multipleNum.toString();
        this.countLabel.string = this.betCount.toString();
    }

    start () {
        this.betCounts = [10,20,30,40,50];

        this.startBtn.on(cc.Node.EventType.TOUCH_START,()=>{
            // SlotsFortuneSlot.Instance.autoRepeat = this.betCount;
            // if(this.continueOrNot && !SlotsFortuneSlot.Instance.isAuto) {
            //     Views.Instance.noticeView.active = true;
            //     NoticeView.Instance.label.string = (<any>window).langContent?.notice.autoEnable || "Auto Spin Enable"
            //     SlotsFortuneSlot.Instance.startAuto(false);
            //     this.node.active = false;
            // }
        });

        this.cancelBtn.on(cc.Node.EventType.TOUCH_START,()=>{
            this.node.active = false;
            this.init();
        });
        this.countBtns.forEach((btn,index)=>{
            btn.on(cc.Node.EventType.TOUCH_START,()=>{
                this.betCount = this.betCounts[index];
                this.countLabel.string = this.betCount.toString();
            })
        });
        this.minSelect.on(cc.Node.EventType.TOUCH_START,()=>{
            this.limitMin = !this.limitMin;
            this.minSelectBtn.active = this.limitMin;
            this.minSelectFrame.active = this.limitMin;
        });
        this.maxSelect.on(cc.Node.EventType.TOUCH_START,()=>{
            this.limitMax = !this.limitMax;
            this.maxSelectBtn.active = this.limitMax;
            this.maxSelectFrame.active = this.limitMax;
        });
        this.multiSelect.on(cc.Node.EventType.TOUCH_START,()=>{
            this.limitMulti = !this.limitMulti;
            this.multiSelectBtn.active = this.limitMulti;
            this.multiSelectFrame.active = this.limitMulti;
        });
        this.minInc.on(cc.Node.EventType.TOUCH_START,()=>{
            // this.unschedule(this.scheduleFunc);
            if(this.isClicked) return;
            this.isClicked = true;
            let minNum = this.minNum;
            this.minNum += Math.pow(10,Math.floor(Math.log10(minNum)) - 1 || 0);
            this.minLabel.string = this.minNum.toString();
            this.schedule(this.scheduleFunc = ()=>{
                minNum = this.minNum;
                this.minNum += Math.pow(10,Math.floor(Math.log10(minNum)) - 1 || 0);
                this.minLabel.string = this.minNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.minDec.on(cc.Node.EventType.TOUCH_START,()=>{
            this.unschedule(this.scheduleFunc);
            if(this.isClicked) return;
            this.isClicked = true;
            let minNum = this.minNum
            this.minNum -= Math.pow(10,Math.floor(Math.log10(minNum)) - 1 || 0);
            if(this.minNum < 0) this.minNum = 0;
            this.minLabel.string = this.minNum.toString();
            this.schedule(this.scheduleFunc = ()=>{
                minNum = this.minNum;
                this.minNum -= Math.pow(10,Math.floor(Math.log10(minNum)) - 1 || 0);
                if(this.minNum < 0) this.minNum = 0;
                this.minLabel.string = this.minNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.maxInc.on(cc.Node.EventType.TOUCH_START,()=>{
            this.unschedule(this.scheduleFunc1);
            if(this.isClicked) return;
            this.isClicked = true;
            let maxNum = this.maxNum
            this.maxNum += Math.pow(10,Math.floor(Math.log10(maxNum)) - 1 || 0);
            this.maxLabel.string = this.maxNum.toString();
            this.schedule(this.scheduleFunc1 = ()=>{
                maxNum = this.maxNum
                this.maxNum += Math.pow(10,Math.floor(Math.log10(maxNum)) - 1 || 0);
                this.maxLabel.string = this.maxNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.maxDec.on(cc.Node.EventType.TOUCH_START,()=>{
            this.unschedule(this.scheduleFunc1);
            if(this.isClicked) return;
            this.isClicked = true;
            let maxNum = this.maxNum;
            this.maxNum -= Math.pow(10,Math.floor(Math.log10(maxNum)) - 1 || 0);
            if(this.maxNum < 0) this.maxNum = 0;
            this.maxLabel.string = this.maxNum.toString();
            this.schedule(this.scheduleFunc1 = ()=>{
                let maxNum = this.maxNum;
                this.maxNum -= Math.pow(10,Math.floor(Math.log10(maxNum)) - 1 || 0);
                if(this.maxNum < 0) this.maxNum = 0;
                this.maxLabel.string = this.maxNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.multiInc.on(cc.Node.EventType.TOUCH_START,()=>{
            this.unschedule(this.scheduleFunc2);
            if(this.isClicked) return;
            this.isClicked = true;
            this.multipleNum += 10;
            this.multipleLabel.string = this.multipleNum.toString();
            this.schedule(this.scheduleFunc2 = ()=>{
                this.multipleNum += 10;
                this.multipleLabel.string = this.multipleNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.multiDec.on(cc.Node.EventType.TOUCH_START,()=>{
            this.unschedule(this.scheduleFunc2);
            if(this.isClicked) return;
            this.isClicked = true;
            this.multipleNum -= 10;
            if(this.multipleNum < 0) this.multipleNum = 0;
            this.multipleLabel.string = this.multipleNum.toString();
            this.schedule(this.scheduleFunc2 = ()=>{
                this.multipleNum -= 10;
                if(this.multipleNum < 0) this.multipleNum = 0;
                this.multipleLabel.string = this.multipleNum.toString();
            },this.timeInterval,cc.macro.REPEAT_FOREVER,this.pressTime)
        });
        this.minDec.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc);
            this.isClicked = false;
        });
        this.minInc.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc);
            this.isClicked = false;
        });
        this.maxDec.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc1);
            this.isClicked = false;
        });
        this.maxInc.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc1);
            this.isClicked = false;
        });
        this.multiDec.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc2);
            this.isClicked = false;
        });
        this.multiInc.on(cc.Node.EventType.TOUCH_END,()=>{
            this.unschedule(this.scheduleFunc2);
            this.isClicked = false;
        });
        this.countInc.on(cc.Node.EventType.TOUCH_START,()=>{
            this.betCount += 1;
            if(this.betCount > 50) this.betCount = 50;
            this.countLabel.string = this.betCount.toString();
        });
        this.countDec.on(cc.Node.EventType.TOUCH_START,()=>{
            this.betCount -= 1;
            if(this.betCount < 0) this.betCount = 0;
            this.countLabel.string = this.betCount.toString();
        });
        this.closeBtn.on(cc.Node.EventType.TOUCH_START,()=>{
            this.node.active = false;
            this.init();
        });
        this.bg.on(cc.Node.EventType.TOUCH_START,()=>{
            this.node.active = false;
            this.init();
        });
    }

    protected onEnable(): void {
        this.init();
    }

    continueOrNot(multiple:number):boolean{
        if(this.limitMin && Game.Instance.player.accountDiamond < this.minNum){
            return false;
        }
        if(this.limitMax && Game.Instance.player.accountDiamond > this.maxNum){
            return false;
        }
        if(this.limitMulti && multiple > this.multipleNum){
            return false;
        }
        return true;
    }

    stopAuto(){
        this.limitMax = false;
        this.limitMin = false;
        this.limitMulti = false;
    }

    // update (dt) {}
}
