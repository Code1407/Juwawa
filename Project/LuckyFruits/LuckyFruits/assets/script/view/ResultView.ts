// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BetView from "./BetView"

const {ccclass, property} = cc._decorator;

@ccclass
export default class ResultView extends cc.Component {
    
    @property(cc.Label)
    rewardNum: cc.Label = null;
    earnNum: number = 0;  //新增变量，记录奖励数

    protected onEnable(): void {
        this.node.opacity=0;
        this.node.runAction(
            cc.fadeIn(0.5)
        );

        setTimeout(() => {
            this.onHide();
        }, 2000);
    }

    onHide(){
        this.node.runAction(
            cc.fadeOut(0.5)
        );
        setTimeout(() => {
            this.node.active = false;
        }, 400);
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
