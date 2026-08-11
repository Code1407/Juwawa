// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../../shared/Common";
import Game from "../Game";

const {ccclass, property} = cc._decorator;

@ccclass
export default class FreeGameWinView extends cc.Component {

    @property(cc.Node)
    contentView: cc.Node = null;

    @property(cc.Label)
    numberLabel: cc.Label = null;

    private winViewEff() {
        const __this = this;
        this.contentView.scale = 0.3;
        cc.tween(this.contentView).to(0.2, {scale: 1}).start();
        cc.tween(this.contentView).to(4, {}).call(()=>{
            __this.node.active = false;
            this.numberLabel.string = "";
        }).start();
    }

    setNumberLabel(n: number) {
        this.numberLabel.string = toThousands(n);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onEnable() {
        this.winViewEff();
    }

    start () {

    }

    // update (dt) {}
}
