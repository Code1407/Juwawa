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
export default class BigWinView extends cc.Component {

    @property(cc.Node)
    js_bj2: cc.Node = null;

    @property(cc.ParticleSystem)
    jb_tx: cc.ParticleSystem = null;

    @property(cc.Node)
    contentView: cc.Node = null;

    @property(cc.Label)
    numberLabel: cc.Label = null;

    winAmount: number = 0;

    private bigWinEff() {
        const __this = this;
        this.contentView.scale = 0.3;
        cc.tween(this.contentView).to(0.2, {scale: 1}).call(()=>{
            Game.Instance.player.increaseAmount(__this.winAmount);
        }).start();
        this.js_bj2.opacity = 0;
        cc.tween(this.js_bj2).to(3, {opacity: 255}).start();
        cc.tween(this.js_bj2).to(4, {angle: 359}).call(()=>{
            __this.node.active = false;
            __this.winAmount = 0;
            __this.numberLabel.string = "";
        }).start();
    }

    setNumberLabel(n: number) {
        this.numberLabel.string = toThousands(n);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onEnable() {
        this.js_bj2.angle = 0;
        this.js_bj2.scale = 1;
        this.bigWinEff();
        this.jb_tx?.resetSystem();
    }

    start () {

    }

    // update (dt) {}
}
