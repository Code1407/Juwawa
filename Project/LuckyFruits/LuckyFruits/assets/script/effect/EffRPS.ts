// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
const { ccclass, property } = cc._decorator;

@ccclass
export default class EffRPS extends cc.Component {

    // @property(cc.Animation)
    // darkBg: cc.Animation    //背景

    @property(sp.Skeleton)
    fx1: sp.Skeleton = null;  //小电视

    @property(sp.Skeleton)
    fx2: sp.Skeleton = null;    //彩灯

    @property(sp.Skeleton)
    fx3: sp.Skeleton = null;    //边缘灯左
    @property(sp.Skeleton)
    fx4: sp.Skeleton = null;    //边缘灯左

    showResultDuration: number = 3;


    Play() {
        this.node.active = true;
        // this.an.play();
        this.fx1.setAnimation(1, "1 putong", true);
        this.fx2.setAnimation(1, "1 putong", true);
        this.fx3.setAnimation(1, "1 putong", true);
        this.fx4.setAnimation(1, "1 putong", true);

        // cc.tween(this).delay(this.darkBg.defaultClip.duration).call(() => this.HideAll()).start();
    }
    ZJPlay() {
        this.fx1.setAnimation(1, "2 zhongjiang", true);
        this.fx2.setAnimation(1, "2 zhongjiang", true);
        this.fx3.setAnimation(1, "2 zhongjiang", true);
        this.fx4.setAnimation(1, "2 zhongjiang", true);
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
