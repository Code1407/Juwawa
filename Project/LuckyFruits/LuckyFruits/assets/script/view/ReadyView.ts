// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import BetView from "./BetView"

const { ccclass, property } = cc._decorator;

@ccclass
export default class ReadyView extends cc.Component {

    @property(cc.Label)
    time: cc.Label = null;

    @property(BetView)
    BetView: BetView = null;

    private isClosing: boolean = false;

    // protected onEnable(): void {
    //     this.node.opacity=0;
    //     this.node.runAction(
    //         cc.fadeIn(0.3)
    //     );
    // }

    showTime(timeNum: number) {
        // 玩家中途进入 final 阶段时，倒计时是唯一的中央展示；
        // 关闭可能残留的结算层，不能与 ReadyView 同屏。
        // 使用既有 API，避免 Creator 热编译时组件实例与新脚本方法不一致。
        Game.Instance.roundFinal.hideImmediate();
        this.node.stopAllActions();
        this.node.opacity = 255;
        this.node.active = true;
        this.isClosing = false;
        this.reduceTime(timeNum);
    }

    hideImmediate() {
        this.node.stopAllActions();
        this.node.opacity = 255;
        this.node.active = false;
        this.isClosing = false;
    }

    reduceTime(timeNum: number) {
        timeNum = Number(timeNum);
        if (!Number.isFinite(timeNum)) return;
        timeNum = Math.ceil(timeNum);

        if (timeNum < 0) {
            if (this.isClosing) return;
            this.isClosing = true;
            this.node.stopAllActions();
            this.node.runAction(
                cc.sequence(
                    cc.fadeOut(0.3),
                    cc.callFunc(() => {
                        this.node.active = false;
                        Game.Instance.roundFinal.enterReady();
                        this.node.opacity = 255;
                        this.isClosing = false;
                        Game.Instance.Desk02();
                    })
                )
            );
            return
        }

        this.isClosing = false;
        this.time.string = timeNum.toFixed(0);
    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
