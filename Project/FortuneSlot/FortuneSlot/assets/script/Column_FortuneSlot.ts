// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import Game from "./Game";
import SlotsFortuneSlot from "./Slot_FortuneSlot";
import ImageCache from "./image/ImageCache";
import { extraMultiplesRate, rateRandomResult, slotProbabilitysDefault, specialMultiplesRate, stopCounts } from "./interface/IFruitSlots";
import ResultView from "./view/ResultView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ColumnFortuneSlot extends cc.Component {

    @property(cc.Integer)
    repeat:number = 11

    @property(cc.Integer)
    posBetweenEach:number = 160

    @property(cc.Integer)
    index:number = 0

    @property(cc.Node)
    items: Array<cc.Node> = []

    @property(cc.Sprite)
    slots: Array<cc.Sprite> = []

    timeOuts: number[] = []
    repeatCount: number = 0;
    nodePos: number = 0;
    rates: number[] = []
    callBack: Function = null;
    goodsIndexs: number[] = []
    originalPos: number[] = []
    stopCounts: number[] = []
    imageCache: ImageCache = null;
    slotFrame: Array<cc.SpriteFrame> = []

    init () {
        this.imageCache = ImageCache.Instance
        if(this.index == 0){
            this.rates = slotProbabilitysDefault;
            this.slotFrame = this.imageCache.goodsIcons;
        }else if(this.index == 1){
            this.rates = specialMultiplesRate
            this.slotFrame = this.imageCache.specialIcons;
        }
        for(let child of this.items){
            this.originalPos.push(child.y)
        }
        this.nodePos = JSON.parse(JSON.stringify(this.node.y))
        this.stopCounts = stopCounts
    }

    run(result: number[]){
        cc.tween(this.node)
           .by(0.11, {y: -this.posBetweenEach * 3})
           .call(()=>{
                this.repeatCount++;
                let startIndex = this.repeatCount % 2 == 0 ? 0 : 3
                let endIndex = startIndex + 3
                for(let i = startIndex; i < endIndex; i++){
                    let randomResult = rateRandomResult(this.rates);
                    this.items[i].y += this.posBetweenEach * 6
                    this.slots[i].spriteFrame = this.slotFrame[randomResult];
                }
                if((SlotsFortuneSlot.Instance.quickBet && this.stopCounts.includes(this.repeatCount)) || this.repeatCount == this.repeat){
                    cc.Tween.stopAllByTag(this.repeat)
                    if(result.includes(7)) Audio.Instance.playWild();
                    else Audio.Instance.playClick()
                      for(let i = 3; i < this.items.length; i++){
                          this.slots[i].spriteFrame = this.slotFrame[result[i - 3]]
                      }
                      cc.tween(this.node)
                        .by(0.11, {y: -this.posBetweenEach * 3})
                        .by(0.1, {y: -50})
                        .by(0.1, {y: 50})
                        .call(()=>{
                            // console.log("run end")
                            this.node.y = this.nodePos
                            for(let i = 0; i < this.items.length; i++){
                                this.items[i].y = this.originalPos[i]
                            }
                            if(this.index == 1) {
                                SlotsFortuneSlot.Instance.showRewardLine();
                            }
                        })
                        .start()
                }
           })
           .tag(this.repeat)
           .union()
           .repeat(this.repeat)
           .start()
    }

    initPos(){
        for(let i = 0; i < this.items.length; i++){
            this.items[i].y = this.originalPos[i]
        }
    }

    initSkin(index: number){
        if(this.index == 1){
            let multipleIndex = 1
            this.slotFrame = this.imageCache.specialIcons
            if(Game.Instance.player.isExtra){
                for(let i = 0; i < this.slots.length; i++){
                    this.slots[i].spriteFrame = this.slotFrame[multipleIndex]
                    multipleIndex = multipleIndex + 1
                }
            }else{
                for(let i = 0; i < this.slots.length; i++){
                    this.slots[i].spriteFrame = this.slotFrame[i]
                }
                this.slots[this.slots.length - 1].spriteFrame = this.slotFrame[this.slotFrame.length - 1]
            }
            if(Game.Instance.player.isExtra) this.rates = extraMultiplesRate;
            else this.rates = specialMultiplesRate
        }else{
            for(let slot of this.slots){
                slot.spriteFrame = this.slotFrame[index]
            }
        }
    }

    darkSkin(index: number){
        this.slots[index].node.color = cc.color(120,120,120)
    }

    lightSkin(index: number){
        // console.log(index)
        this.slots[index].node.color = cc.color(255,255,255)
    }

    darkAllSkin(){
        for(let i = 0; i < this.slots.length; i++){
            this.darkSkin(i)
        }
    }
    // update (dt) {}
}
