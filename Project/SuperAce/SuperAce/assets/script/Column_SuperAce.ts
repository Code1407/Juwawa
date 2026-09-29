// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import Poker from "./Poker";
import SlotSuperAce from "./Slot_SuperAce";
import FlyEffect from "./effect/FlyEffect";
import { rateRandom, slotProbabilitysDefault } from "./interface/ISuperAce";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ColumnSuperAce extends cc.Component {

    @property(cc.Node)
    item: cc.Node[] = [];

    @property(cc.Node)
    effects: cc.Node = null;

    @property(cc.Node)
    pokerEffects: cc.Node = null;

    @property(cc.Node)
    draw: cc.Node = null;

    @property(cc.Node)
    lightEffect: cc.Node = null;

    @property(cc.Node)
    lightEffect2: cc.Node = null;

    columnHeight:number = 0;
    originY: number[] = [];
    changeWildIndexs: number[] = [];

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.ensureLayoutInitialized();
    }

    private ensureLayoutInitialized() {
        if (this.originY.length === this.item.length) return;
        for (let i = 0; i < this.item.length; i++) {
            this.originY[i] = this.item[i].y;
        }
        this.columnHeight = this.node.height;
    }

    fall(result: number[], index: number, scatterCount: number, no1ScatterIndex: number, no2ScatterIndex: number, no3ScatterIndex: number,
        resultGeneration: number = SlotSuperAce.Instance.ResultGeneration) {
        if (resultGeneration != SlotSuperAce.Instance.ResultGeneration) return;
        for(let i = 0; i < this.item.length; i++){
            this.item[i].active = true;
            this.pokerEffects.children[i].active = false;
        }
        cc.tween(this.node)
            .by(0.13, { y: -this.columnHeight })
            .call(() => {
                if (resultGeneration != SlotSuperAce.Instance.ResultGeneration) return;
                for (let i = 0; i < this.item.length; i++) {
                    this.item[i].y = this.originY[i] + this.columnHeight;
                    this.node.y = 0;
                }
                this.run(result, index, scatterCount, no1ScatterIndex, no2ScatterIndex, no3ScatterIndex, resultGeneration);
            })
            .start();
    }

    run(result: number[], index: number, scatterCount: number, no1ScatterIndex: number, no2ScatterIndex: number, no3ScatterIndex: number,
        resultGeneration: number = SlotSuperAce.Instance.ResultGeneration) {
        let j = 1;
        let quickMode = SlotSuperAce.Instance.quickMode;
        let delayTime1 = quickMode ? 0 : index * 0.07;
        let delayTime2 = quickMode ? 0 : 0.08;
        let delayTime3 = no2ScatterIndex >= 0 && (no3ScatterIndex < 0 || (no3ScatterIndex > 0 && no3ScatterIndex == 4))? 800 : 500;
        let rollTime = quickMode ? 0.2 : 0.1;
        let sumDelay = delayTime1;
        if(!quickMode){
            if(index > no2ScatterIndex && no2ScatterIndex >= 0){
                sumDelay = delayTime1 + 0.5 * (index - no2ScatterIndex + 0.5)
            }
            if(index > no3ScatterIndex && no3ScatterIndex >= 0 && scatterCount >= 3) {
                sumDelay = delayTime1 + 0.5 * (no3ScatterIndex - no2ScatterIndex + 2.5);
            }
        }
        let rollTimeChange = quickMode ? 0.03 : 0;
        let scatterNum = 0;
        let scatterNum2 = 0;
        setTimeout(() => {
            Audio.Instance.playDraw();
        }, sumDelay * 1000);
        for (let i = this.item.length - 1; i >= 0; i--) {
            this.item[i].active = true;
            this.item[i].getComponent(Poker).setPoker(result[i])
            this.pokerEffects.children[i].getComponent(Poker).setPoker(result[i]);
            if(result[i] == 0 && i != 0) scatterNum++;
            cc.tween(this.item[i])
                .delay(sumDelay)
                .call(() => {
                    if(index > no2ScatterIndex && scatterCount >= 2 && no2ScatterIndex >= 0){
                        SlotSuperAce.Instance.darkAll(index);
                        this.recoverAll();
                        this.lightEffect.active = true;
                        this.lightEffect2.active = true;
                        this.lightEffect.getComponent(cc.Animation).play('lightEff');
                        Audio.Instance.playScatterWait();
                    }
                    if(index > no3ScatterIndex && no3ScatterIndex >= 0){
                        SlotSuperAce.Instance.recoverAll(); 
                        SlotSuperAce.Instance.stopScatterWait();
                    }
                })
                .delay(delayTime2 * j)
                .call(()=>{
                    this.draw.getComponent(cc.Animation).playAdditive('draw');
                    if(result[i] == 0 ){
                        scatterNum2++;
                        if(no2ScatterIndex == index && index != 4 && !(no1ScatterIndex == 4 && no1ScatterIndex == no2ScatterIndex) ){
                            SlotSuperAce.Instance.darkAll(index);
                            this.recoverAll();
                            if((no1ScatterIndex != index || scatterNum2 == 2) && i != 0){
                                this.lightEffect.active = true;
                                this.lightEffect2.active = true;
                                this.lightEffect.getComponent(cc.Animation).play('lightEff');
                                Audio.Instance.playScatterWait();
                            }
                        }
                    }
                })
                .to(rollTime + rollTimeChange * i, { y: this.originY[i] })
                .call(() => {
                    if (result[i] < 0 && index > no2ScatterIndex) {
                        this.pokerEffects.children[i].active = true;
                        this.pokerEffects.children[i].getComponent(cc.Animation).play('goldenPoker1');
                        this.pokerEffects.children[i].getComponent(cc.Animation).once("finished", () => {
                            this.pokerEffects.children[i].active = false;
                        })
                    }
                    if(!quickMode){
                        if (index == 4 && i == 0) {
                            setTimeout(() => {
                                if(no3ScatterIndex < 0 || no3ScatterIndex == 4) {
                                    SlotSuperAce.Instance.recoverAll();
                                    SlotSuperAce.Instance.stopScatterWait();
                                }
                                SlotSuperAce.Instance.eliminate(resultGeneration);
                            }, delayTime3);
                            this.initPos();
                        }
                    }else{
                        if(index == 4 && i == 3){
                            setTimeout(() => {
                                SlotSuperAce.Instance.eliminate(resultGeneration);
                            }, 500);
                            this.initPos();
                        }
                    }
                    if(result[i]  == 0 ){
                        this.pokerEffects.children[i].active = true;
                        this.item[i].active = false;
                        Audio.Instance.playScatters();
                        FlyEffect.Instance.FlyScatter(FlyEffect.Instance.node,this.pokerEffects.children[i]);
                        this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterStart');
                        if(index == no2ScatterIndex && no2ScatterIndex >= 0){
                            this.item[i].active = false;
                            this.pokerEffects.children[i].active = true;
                            if(index != 4) {
                                this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterWait');
                                SlotSuperAce.Instance.playScatterWait(no1ScatterIndex);
                            }else{
                                this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterStart');
                            }
                        }else if(index == no3ScatterIndex && no3ScatterIndex >= 0){
                            this.item[i].active = false;
                            this.pokerEffects.children[i].active = true;
                            this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterWait');
                        }else if(index == no1ScatterIndex){
                            let currentClip = this.pokerEffects.children[i].getComponent(cc.Animation).currentClip;
                            this.item[i].active = false;
                            this.pokerEffects.children[i].active = true;
                            if(currentClip.name != 'scatterWait'){
                                this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterStart');
                            }
                        }
                    }
                })
                .start();
                // if(no2ScatterIndex == index && no2ScatterIndex >= 0 && result[i] == 0 && !quickMode){
                //     if(no1ScatterIndex != index){
                //         sumDelay = sumDelay + 0.7
                //     }else if(scatterNum == 2){
                //         sumDelay = sumDelay + 0.7
                //     }
                // }
            j++;
        }
    }

    runContinue(result: number[], copyWildIndexs: number[], changeGoldenIndexs: number[], index: number, fromNodeIndex?: number): number {
        let isDraw = false;
        let delayTime1 = SlotSuperAce.Instance.quickMode ? 0 : 0.08;
        let delayTime2 = 0;
        let addTime2 = 0;
        for (let i = this.item.length - 1; i >= 0; i--) {
            this.item[i].active = true;
            if(this.item[i].y == this.originY[i] && result[i] == 0) {
                this.item[i].active = false;
            }else this.pokerEffects.children[i].getComponent(Poker).setPoker(result[i]);
            if (copyWildIndexs.includes(i) && fromNodeIndex) {
                this.effects.children[i].active = false;
                let randomResult = rateRandom(slotProbabilitysDefault[index], 1, 8);
                if(this.item[i].y != this.originY[i]) this.item[i].getComponent(Poker).setPoker(randomResult);
                let time = FlyEffect.Instance.FlyWild(this.pokerEffects.children[i], 0.5, fromNodeIndex);
                delayTime2 = time > delayTime2 ? time : delayTime2;
                addTime2 = 1000;
                this.item[i].getComponent(Poker).recover();
                setTimeout(() => {
                    this.item[i].getComponent(Poker).setPoker(result[i]);
                }, time * 1000);
            } else if (changeGoldenIndexs.includes(i)) {
                this.item[i].getComponent(Poker).setPoker(result[i] < 0 ? -result[i] : result[i]);
                this.item[i].getComponent(Poker).recover();
            } else if (this.changeWildIndexs.includes(i)) {
                this.pokerEffects.children[i].active = true;
                this.item[i].active = false;
                this.item[i].getComponent(Poker).setPoker(result[i]);
                this.pokerEffects.children[i].getComponent(Poker).setPoker(result[i]);
                this.pokerEffects.children[i].getComponent(cc.Animation).play('clip');
                setTimeout(() => {
                    this.effects.children[i].active = false;
                    this.effects.children[i].children[2].active = false;
                }, 50);
                this.pokerEffects.children[i].getComponent(cc.Animation).once("finished", () => {
                    this.pokerEffects.children[i].active = false;
                    this.item[i].active = true;
                })
            } else {
                this.item[i].getComponent(Poker).setPoker(result[i]);
            }
            if (this.item[i].y == this.originY[i]) {
                continue;
            } else isDraw = true;
            setTimeout(() => {
                Audio.Instance.playAdd();
            }, delayTime1 * index);
            cc.tween(this.item[i])
                .delay(delayTime1 * index)
                .call(()=>{
                    if (isDraw) {
                        let animeState = this.draw.getComponent(cc.Animation).play('draw');
                        animeState.repeatCount = 1;
                    }
                })
                .to(0.15, { y: this.originY[i] })
                .call(() => {
                    this.initPos();
                    if(result[i]  == 0 ){
                        this.item[i].active = false;
                        this.pokerEffects.children[i].active = true;
                        FlyEffect.Instance.FlyScatter(FlyEffect.Instance.node, this.pokerEffects.children[i]);
                        this.pokerEffects.children[i].getComponent(cc.Animation).play('scatterStart');
                    }
                })
                .start();
        }
        this.changeWildIndexs = [];
        return delayTime2 * 1000 + addTime2;
    }

    changeGolden(result: number[], changeGoldenIndexs: number[], index: number): number {
        let delayTime = 0;
        let addTime = 0;
        for(let i = 0; i < changeGoldenIndexs.length; i++){
            let iIndex = changeGoldenIndexs[i];
            let time = FlyEffect.Instance.Fly(this.pokerEffects.children[iIndex], 0.2 * index);
            this.item[iIndex].active = true;
            this.pokerEffects.children[iIndex].getComponent(Poker).setPoker(result[iIndex]);
            delayTime = time > delayTime ? time : delayTime;
            addTime = 500;
            setTimeout(() => {
                this.pokerEffects.children[iIndex].active = true;
                this.pokerEffects.children[iIndex].getComponent(cc.Animation).play('changeGolden');
                this.pokerEffects.children[iIndex].getComponent(cc.Animation).once("finished", () => {
                    this.pokerEffects.children[iIndex].getComponent(cc.Animation).play('goldenPoker')
                    this.pokerEffects.children[iIndex].getComponent(cc.Animation).once("finished", () => {
                        this.pokerEffects.children[iIndex].active = false;
                    })
                })
                this.item[iIndex].getComponent(Poker).setPoker(result[iIndex]);
            }, time * 1000)
        }
        return delayTime * 1000 + addTime;
    }

    initPos() {
        this.ensureLayoutInitialized();
        for (let i = 0; i < this.item.length; i++) {
            this.item[i].y = this.originY[i];
        }
        this.node.y = 0;
    }

    cancelPendingAnimations() {
        cc.Tween.stopAllByTarget(this.node);
        for (let i = 0; i < this.item.length; i++) {
            cc.Tween.stopAllByTarget(this.item[i]);
        }
        this.initPos();
    }

    /** 进入场景时直接显示服务端保存的盘面，不播放下落/消除流程。 */
    showSnapshot(result: number[]) {
        if (!Array.isArray(result) || result.length !== this.item.length) return;
        this.cancelPendingAnimations();
        this.changeWildIndexs = [];
        this.lightEffect.active = false;
        this.lightEffect2.active = false;
        for (let i = 0; i < this.item.length; i++) {
            this.item[i].active = true;
            if (this.effects.children[i]) this.effects.children[i].active = false;
            if (this.pokerEffects.children[i]) this.pokerEffects.children[i].active = false;
            this.item[i].getComponent(Poker).setPoker(result[i]);
        }
    }

    darkAll() {
        for (let i = 0; i < this.item.length; i++) {
            this.item[i].getComponent(Poker).dark();
        }
    }

    recoverAll() {
        for (let i = 0; i < this.item.length; i++) {
            this.item[i].getComponent(Poker).recover();
        }
    }

    eliminate(index: number, nextWildIndex: number = 999) {
        // console.log(index);
        let eliminatePoker = this.item[index];
        let pokerEffect = this.pokerEffects.children[index];
        eliminatePoker.getComponent(Poker).recover();
        if (eliminatePoker.getComponent(Poker).spriteIndex <= 4 && eliminatePoker.getComponent(Poker).spriteIndex > 0) {
            eliminatePoker.active = false;
            pokerEffect.active = true;
            pokerEffect.getComponent(cc.Animation).play('reward');
        } else if (eliminatePoker.getComponent(Poker).spriteIndex == 9 || eliminatePoker.getComponent(Poker).spriteIndex == 10) {
            eliminatePoker.active = false;
            pokerEffect.active = true;
            pokerEffect.getComponent(cc.Animation).play('rewardWild');
        } else {
            eliminatePoker.active = false;
            pokerEffect.active = true;
            pokerEffect.getComponent(cc.Animation).play('reward1');
        }
        let effect = this.effects.children[index];
        pokerEffect.getComponent(cc.Animation).once("finished", () => {
            effect.active = true;
            pokerEffect.active = false;
            // eliminatePoker.active = true;
            // console.log("effect finish");
            Audio.Instance.playBreak();
            if (nextWildIndex == 999) {
                eliminatePoker.y += this.columnHeight;
                effect.getComponent(cc.Animation).play('break');
                effect.getComponent(cc.Animation).once("finished", () => {
                    effect.active = false;
                    // console.log("effect finish");
                })
            }
            else {
                this.changeWildIndexs.push(index);
                eliminatePoker.active = false;
                effect.getComponent(cc.Animation).play('break1');
            }
        })
    }

    // update (dt) {}
}
