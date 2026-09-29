// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import SlotSuperAce from "../Slot_SuperAce";
import FreeEndView from "./FreeEndView";
import FreeView from "./FreeView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class WinnigView extends cc.Component {

    @property(cc.ParticleSystem)
    coinEffect: cc.ParticleSystem = null;

    @property(cc.Label)
    winLabel: cc.Label = null;

    @property(cc.Node)
    winWord: cc.Node = null;

    @property(cc.Node)
    wordEffect: cc.Node[] = [];

    timeOut1: number = 0;
    timeOut2: number = 0;
    winNum: number = 0;
    isPlaying: boolean = false;
    isFreeEnd: boolean = false;
    numFunction: Function = null;
    animeNames = ['bigWin', 'megaWin', 'superWin'];
    static instance: WinnigView = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    static get Instance(): WinnigView{
        if (!this.instance) this.instance = cc.find("Canvas/Views/WinView").getComponent(WinnigView);
        return this.instance;
    }

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, ()=>{
            if(!this.isPlaying) return;
            // console.log("winView touch start");
            Audio.Instance.stopWinViews();
            this.isPlaying = false;
            this.node.getComponent(cc.Animation).stop("winView");
            this.unschedule(this.numFunction);
            this.node.opacity = 255;
            this.winLabel.string = this.winNum.toString();
            this.winWord.scale = 1.2;
            this.coinEffect.stopSystem();
            clearTimeout(this.timeOut1);
            clearTimeout(this.timeOut2);
            for(let i = 0; i < this.wordEffect.length; i++){
                this.wordEffect[i].opacity = 0;
            }
            cc.tween(this.node)
                .delay(0.5)
                .to(0.3, {opacity: 0})
                .call(()=>{
                    this.node.active = false;
                    if(!this.isFreeEnd) SlotSuperAce.Instance.startAuto(true);
                    else FreeEndView.Instance.onFreeEnd();

                    if(SlotSuperAce.Instance.freeMode && SlotSuperAce.Instance.enterFree){
                        FreeView.Instance.node.active = true;
                    }
                })
                .start();
        });
    }

    onWin(multiple: number, betAmount: number, freeEnd: boolean = false) {
        if (this.isPlaying) return;
        this.isFreeEnd = freeEnd;
        this.isPlaying = true;
        this.winNum = Math.round(multiple * betAmount);
        let winLevel = Math.floor(multiple / 10) > 5 ? 5 : Math.floor(multiple / 10);
        let winAmount = Math.round(betAmount * multiple);
        let addAmount = winAmount / 200;
        let labelNum = 0;
        // console.log("winLevel: ", winLevel);
        this.winLabel.string = '0'
        this.node.active = true;
        this.node.opacity = 0;
        switch (winLevel) {
            // case 0: 
            case 1: 
                this.node.getComponent(cc.Animation).play("bigWin"); 
                Audio.Instance.playWinViews(0);
                break;
            case 2:
            case 3:
            case 4: 
                this.node.getComponent(cc.Animation).play('megaWin'); 
                Audio.Instance.playWinViews(1);
                break;
            case 5: 
                this.node.getComponent(cc.Animation).play('superWin');
                Audio.Instance.playWinViews(2);
                break;
        }
        this.node.getComponent(cc.Animation).once("finished",()=>{
            this.node.getComponent(cc.Animation).play("winView");
            this.timeOut1 = setTimeout(() => {
                this.isPlaying = false;
                this.node.active = false;
                if(!freeEnd) SlotSuperAce.Instance.startAuto(true);
                else FreeEndView.Instance.onFreeEnd();

                if(SlotSuperAce.Instance.freeMode && SlotSuperAce.Instance.enterFree){
                    FreeView.Instance.node.active = true;
                }
            }, 5500);
            this.coinEffect.resetSystem();
            this.timeOut2 = setTimeout(() => {
                this.coinEffect.stopSystem();
            }, 4000);
            this.schedule(this.numFunction = ()=>{
                labelNum += addAmount;
                this.winLabel.string = labelNum.toFixed(0);
                if(labelNum >= winAmount) this.winLabel.string = Math.round(winAmount).toString();
            },0.015, 199)
        })
    }

    // update (dt) {}
}
