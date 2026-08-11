// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:

import Game from "../Game";
import Audio from "../Audio";

//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
const { ccclass, property } = cc._decorator;

@ccclass
export default class EffRPS extends cc.Component {

    // @property(cc.Animation)
    // darkBg: cc.Animation    //背景

    @property(sp.Skeleton)
    fx1: sp.Skeleton = null;  //车跑出
    @property(cc.Node)
    ziStart: cc.Node = null;
    @property(cc.Node)
    car: cc.Node = null;
    @property(cc.Node)
    light: cc.Node = null;


    Play() {
        this.node.active = true;
        this.fx1.setAnimation(1, "bet_start", false);
        Audio.Instance.carAmation();

        // this.fx1.setAnimation(2, "bet_stop", false);

        let move01 = cc.moveTo(0.3, 1.5, 0);        //start
        let move02 = cc.moveTo(0, 628, 0);          //重置

        let move03 = cc.moveTo(0.3, -700, 0);        //car
        let move04 = cc.moveTo(0, 197, 0);          //重置

        setTimeout(() => {
            this.ziStart.runAction(move01);
            this.car.runAction(move03);
            setTimeout(() => {
                this.node.active = false;
                this.ziStart.runAction(move02);
                this.car.runAction(move04);

                cc.Tween.stopAllByTarget(this.light);
                this.light.active = true;
                cc.tween(this.light)
                    .to(0.1, { opacity:255 })
                    .delay(0.5)
                    .to(0.6, { opacity: 0 })
                    .call(() => {
                        this.light.active = false;
                    })
                    .start();
            }, 1500)

        }, 1000)


        // cc.tween(this).delay(this.darkBg.defaultClip.duration).call(() => this.HideAll()).start();
    }
    // ShowResult( result: number) {
    //     let random = Math.floor(this.seed * this.leftFrames.length);
    //     // console.log(this.seed);
    //     let loseFrameIdx: number = random;   
    //     let winFrameIdx: number = (random + 1) % 3;    
    //     this.leftResult.node.parent.active = true;
    //     this.rightResult.node.parent.active = true;
    //     switch (result) {
    //         case 0:
    //             this.SetFrame(winFrameIdx, loseFrameIdx);   
    //             break;
    //         case 1:
    //             this.SetFrame(winFrameIdx, winFrameIdx);    
    //             break;
    //         case 2:
    //             this.SetFrame(loseFrameIdx, winFrameIdx);   
    //             break;
    //     }
    // }

    // SetFrame(leftIdx: number, rightIdx: number) {
    //     this.leftResult.spriteFrame = this.anLeftResult.spriteFrame = this.leftFrames[leftIdx];
    //     this.rightResult.spriteFrame = this.anRightResult.spriteFrame = this.rightFrames[rightIdx];
    // }

    HideAll() {
        this.node.active = false;
        // cc.tween(this.leftResult).delay(this.showResultDuration).call(() => {
        //     this.leftResult.node.parent.active = false;
        //     this.rightResult.node.parent.active = false;
        // }).start();
    }

}
