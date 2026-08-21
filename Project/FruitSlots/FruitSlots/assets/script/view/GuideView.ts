// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuideView extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    @property(cc.Node)
    pointer: cc.Node = null;

    onEnable() {
        let posOriginal = this.pointer.position.clone();
        let posTo = posOriginal.clone();
        posTo.y += 50;
        const __this = this;
        cc.tween(this.pointer)
                .to(0.35, {position: posTo})
                .to(0.35, {position: posOriginal})
                .to(0.35, {position: posTo})
                .to(0.35, {position: posOriginal})
                .to(0.35, {position: posTo})
                .to(0.35, {position: posOriginal})
                .to(0.35, {position: posTo})
                .to(0.35, {position: posOriginal})
                .call(()=> {__this.node.active = false;})
                .start();
    }

    // update (dt) {}
}
