// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass} = cc._decorator;

@ccclass
export default class SlotItemEff extends cc.Component {
    shake(wide: boolean) {
        if (wide) this.shakeWide();
        else this.shakeMinor();
    }

    shakeMinor() {
        const __this = this;
        cc.tween(this.node).to(0.1, {scale: 1.08}).to(0.1, {scale: 1}).start();
    }

    shakeWide() {
        const __this = this;
        cc.tween(this.node).to(0.05, {angle: 15}).to(0.1, {angle: -15}).to(0.05, {angle: 0}).start();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
    }

    // update (dt) {}
}
