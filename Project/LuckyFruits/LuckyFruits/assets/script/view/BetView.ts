// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import Audio from "../Audio";
import { EGameStatus } from "../../shared3/interface/IGame";
import { gGameData } from "../GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BetView extends cc.Component {

    @property(cc.Node)
    BetTime: cc.Node = null;

    @property(cc.Label)
    time: cc.Label = null;

    protected onEnable(): void {
        // this.time.node.color = cc.Color.WHITE;
        let sprite = this.node.getChildByName("sprite");
        cc.Tween.stopAllByTarget(sprite);
        cc.Tween.stopAllByTarget(this.BetTime);
        cc.Tween.stopAllByTarget(this.time.node);
        // sprite.scaleX=0;
        this.BetTime.scaleX = 0;
        this.BetTime.opacity = 255;
        this.time.node.opacity = 255;
        // for(let child of cc.find("Canvas/Game/Cards").children){
        //     let back=child.getChildByName("AllPoker").getChildByName("back")
        //     PokerEffect.FlyPoker(back)
        // }

        cc.tween(sprite)
            .to(0.4, { scaleX: 1 })
            .call(() => {
                cc.tween(this.BetTime)
                    .to(0.2, { scaleX: 1 })
                    .call(() => {
                        this.BetTime.scaleX = 1;
                    })
                    .start();
            })
            .start();
    }

    reduceTime(timeNum: number) {
        // this.BetTime.runAction(
        //     cc.fadeIn(0.3)
        // );
        this.time.node.opacity = 255;
        if (timeNum < 0) return;
        this.time.string = timeNum.toFixed(0);
        if (timeNum == 0) {
            Audio.Instance.TimeOver();
            cc.Tween.stopAllByTarget(this.time.node)
            this.toString00();
            // this.BetTime.runAction(
            //     cc.repeat(
            //     cc.sequence(
            //     cc.rotateTo(0.07,10.0),
            //     cc.rotateTo(0.07,0.0),
            //     cc.rotateTo(0.07,-10.0),
            //     cc.rotateTo(0.07,0.0)
            //     ),7)
            // );
            // Audio.Instance.TimeOver();
           Game.Instance.notInTime=false;
        }
        else if (timeNum > 0) {
            // 这里只停止数字的闪烁动画，不能停止 BetTime 的入场展开动画，
            // 否则登录时可能把 scaleX 停在 0~1 之间，造成倒计时横向压缩。
            cc.Tween.stopAllByTarget(this.time.node)
            // this.time.node.color = cc.Color.RED;
            // if(this.isShake == 0){
            //     this.doShake();
            // }
            if (timeNum > 1 && timeNum < 5)
                for (let i = 0; i <= timeNum; i++) {
                    setTimeout(() => {
                        Audio.Instance.TimeStart();
                    }, 1000)
                }
        }
        timeNum--;
    }
    // isShake = 0;
    // doShake(){
    //     this.isShake = 1;
    // let action = cc.repeatForever(
    // cc.sequence(
    // cc.rotateTo(0.07,-15),
    // cc.rotateTo(0.07,0),
    // cc.rotateTo(0.07,15),
    // cc.rotateTo(0.07,0),
    //  )
    // )
    //     this.BetTime.runAction(action);
    //     setTimeout(() =>{
    //         this.BetTime.stopAction(action);
    //         this.BetTime.angle = 0; 
    //         this.isShake = 0;
    //     }, 4000);
    // }
    // LIFE-CYCLE CALLBACKS:
    toString00() {
        this.time.string ="0";
        cc.tween(this.time.node)
            .repeatForever(
                cc.sequence(
                    cc.fadeTo(0.7, 0),
                    cc.fadeTo(0.7, 255)
                )
            )
            .start();
       
    }
    onLoad() {
    }

    start() {

    }

    // update (dt) {}
}
