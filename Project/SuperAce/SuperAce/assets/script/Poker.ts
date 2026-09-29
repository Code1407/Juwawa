// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ColorChange from "./effect/ColorChange";
import ImageCache from "./image/ImageCache";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Poker extends ColorChange {

    @property(cc.Sprite)
    frame: cc.Sprite = null;

    @property(cc.Sprite)
    icon: cc.Sprite = null;

    @property(cc.Sprite)
    word: cc.Sprite = null;

    @property(cc.Sprite)
    bg: cc.Sprite = null;

    spriteIndex: number = 0;
    pokerIndex: number = 0;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.init();
    }

    setPoker(pokerIndex: number){
        this.spriteIndex = pokerIndex;
        this.pokerIndex = pokerIndex;
        // this.node.active = true;
        this.node.getComponent(cc.Animation).play('poker');
        this.bg.node.active = true;
        this.recover();
        if(pokerIndex < 9 && pokerIndex != 0) {
            this.word.node.active = false;
            if(pokerIndex < 0){
                this.spriteIndex = -pokerIndex;
                this.frame.node.active = true;
                this.frame.spriteFrame = ImageCache.Instance.frames[0];
                this.bg.spriteFrame = ImageCache.Instance.pokerBgs[1];
            }else{
                this.frame.node.active = false;
                this.bg.spriteFrame = ImageCache.Instance.pokerBgs[0];
            }
        }else{
            if(this.spriteIndex == 0){
                this.bg.node.active = false;
                this.frame.node.active = false;
                this.word.node.active = true;
                this.word.spriteFrame = ImageCache.Instance.words[0];
            }else if(this.spriteIndex == 9 || this.spriteIndex == 10){
                let wordIndex = this.spriteIndex - 8;
                this.bg.node.active = true;
                this.frame.node.active = true;
                this.word.node.active = true;
                this.bg.spriteFrame = ImageCache.Instance.pokerBgs[1];
                this.frame.spriteFrame = ImageCache.Instance.frames[wordIndex];
                this.word.spriteFrame = ImageCache.Instance.words[wordIndex];
            }
        }
        this.icon.spriteFrame = ImageCache.Instance.pokerIcons[this.spriteIndex];
    }

    // update (dt) {}
}
