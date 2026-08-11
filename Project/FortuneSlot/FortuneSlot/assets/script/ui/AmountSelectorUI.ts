// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Bottombar from "../Bottombar";
import ExtraView from "../ExtraView";
import Game from "../Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "../GameData";
import SlotsFortuneSlot from "../Slot_FortuneSlot";
import Views from "../Views";
import { goodsMultiples, wheelMultiples } from "../interface/IFruitSlots";
import BetAmountItemUI from "./BetAmountItemUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AmountSelectorUI extends cc.Component {

    @property(cc.Label)
    betTotal: cc.Label = null;

    @property(cc.Node)
    decr: cc.Node = null;

    @property(cc.Node)
    incr: cc.Node = null;

    @property(cc.Node)
    decrDown: cc.Node = null;

    @property(cc.Node)
    decrUp: cc.Node = null;
    
    @property(cc.Node)
    incrDown: cc.Node = null;

    @property(cc.Node)
    incrUp: cc.Node = null;

    @property(cc.Node)
    betAmountBtn: cc.Node = null;

    @property(cc.Node)
    betAmountView: cc.Node = null;

    @property(cc.Prefab)
    betAmountPrefab: cc.Prefab = null;

    @property(cc.Label)
    wheelNums: cc.Label[] = []

    @property(cc.Label)
    wheelNums1: cc.Label[] = []

    @property(cc.RichText)
    ruleNums: cc.RichText[] = []

    static instance: AmountSelectorUI = null;

    static get Instance() {
        if(!this.instance) this.instance = cc.find("Canvas/Game/Bottombar/BetAmountSelector").getComponent(AmountSelectorUI);
        return this.instance
    }

    setBetAmountLabel(totalAmount: number) {
        let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
        if(totalAmount <= 0){
            for(let i = 0; i < betAmount.length; i++){
                if(betAmount[i] > 0){
                    gGameData.betAmountIndex = i;
                    totalAmount = betAmount[i];
                    break;
                }
            }
        }
        this.betTotal.string = totalAmount.toString(); // totalAmount < 1000 ? totalAmount.toString() : (totalAmount / 1000) + "k";
    }

    set BetAmountIndex(value: number){
        gGameData.betAmountIndex = value;
        let betAmount = JSON.parse(JSON.stringify(gBetAmounts));
        for(let i = 0; i < wheelMultiples.length; i++){
            let wheelNum = betAmount[value] * wheelMultiples[i]
            let wheelNumStr = wheelNum >= 1000 ? (wheelNum / 1000) + "K" : wheelNum.toString();
            this.wheelNums[i].string = wheelNumStr
            this.wheelNums1[i].string = wheelNumStr
        }

        for(let i = 0; i < goodsMultiples.length; i++){
            let ruleNum = betAmount[value] * goodsMultiples[i];
            let ruleNumStr = ruleNum >= 1000 ? (ruleNum / 1000) + "K" : ruleNum.toString();
            this.ruleNums[i].string = ruleNumStr
        }

        if(gGameData.betAmountIndex == 0) {
            // this.decr.children[1].color = cc.color(128, 128, 128);
            this.decr.children[2].color = cc.color(128, 128, 128);
            this.incr.children[2].color = cc.color(255, 255, 255);
        }else if(gGameData.betAmountIndex == betAmount.length - 1){
            // this.incr.children[1].color = cc.color(128, 128, 128);
            this.incr.children[2].color = cc.color(128, 128, 128);
            this.decr.children[2].color = cc.color(255, 255, 255);
        }else{
            // this.decr.children[1].color = cc.color(255, 255, 255);
            this.decr.children[2].color = cc.color(255, 255, 255);
            // this.incr.children[1].color = cc.color(255, 255, 255);
            this.incr.children[2].color = cc.color(255, 255, 255);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    start () {
        const __this = this;
        this.decr.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            this.betAmountView.active = false;
            let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
            if (!SlotsFortuneSlot.Instance.isRunning && !SlotsFortuneSlot.Instance.isAuto && gGameData.betAmountIndex > 0) {
                gGameData.betAmountIndex--;
                this.BetAmountIndex = gGameData.betAmountIndex;
                let playerSettings = {
                    lastBetAmountButton: gGameData.betAmountIndex,
                    soundVol: gGameData.soundVol
                }
                Game.Instance.player.updateSettings(playerSettings);
                __this.setBetAmountLabel(betAmount[gGameData.betAmountIndex]);
                Audio.Instance.playClick();
            }else if(SlotsFortuneSlot.Instance.isRunning || SlotsFortuneSlot.Instance.isAuto){
                Views.Instance.playingView.active = true;
            }
        });

        this.incr.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            this.betAmountView.active = false;
            let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
            if (!SlotsFortuneSlot.Instance.isRunning && !SlotsFortuneSlot.Instance.isAuto && gGameData.betAmountIndex < betAmount.length - 1) {
                gGameData.betAmountIndex++;
                this.BetAmountIndex = gGameData.betAmountIndex;
                let playerSettings = {
                    lastBetAmountButton: gGameData.betAmountIndex,
                    soundVol: gGameData.soundVol
                }
                Game.Instance.player.updateSettings(playerSettings);
                __this.setBetAmountLabel(betAmount[gGameData.betAmountIndex]);
                Audio.Instance.playClick();
            }else if((SlotsFortuneSlot.Instance.isRunning || SlotsFortuneSlot.Instance.isAuto)){
                Views.Instance.playingView.active = true;
            }
        });

        this.betAmountBtn.on(cc.Node.EventType.TOUCH_START, () => {
            ExtraView.Instance.ruleView.active = false;
            Bottombar.Instance.optionsView.active = false;
            if (SlotsFortuneSlot.Instance.isRunning) return; 
            this.betAmountView.active = !this.betAmountView.active;
            Audio.Instance.playClick();
        });
        this.initBetAmountView();
    }

    initBetAmountView(){
        let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
        this.betAmountView.removeAllChildren();
        for (let i = 0; i < betAmount.length; i++) {
            let item = cc.instantiate(this.betAmountPrefab);
            item.parent = this.betAmountView;
            item.getChildByName("num").getComponent(cc.Label).string = betAmount[i] >= 1000 ? betAmount[i] / 1000 + "K" : betAmount[i].toString();
            item.getComponent(BetAmountItemUI).betIndex = i;
        }
        this.betAmountView.active = false;
    }

    // update (dt) {}
}
