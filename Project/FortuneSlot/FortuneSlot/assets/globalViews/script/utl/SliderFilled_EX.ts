// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

//cocos的滑动条组件可能没有实现填充功能，所以可以通过此类来补充

const { ccclass, property } = cc._decorator;
@ccclass
export default class SliderFilled extends cc.Component {
    @property(cc.Slider)
    slider: cc.Slider;
    protected start(): void {
        cc.tween(this.node).repeatForever(cc.tween(this.node).call(() => {
            this.node.width = this.node.parent.width * this.slider.progress;
        }).delay(0)).start();
    }
}
