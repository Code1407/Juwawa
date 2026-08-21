//cocos的滑动条组件可能没有实现填充功能，所以可以通过此类来补充

const { ccclass, property } = cc._decorator;
@ccclass
export default class SliderFilled extends cc.Component {
    @property(cc.Slider)
    slider: cc.Slider = null;
    protected start(): void {
        cc.tween(this.node).repeatForever(cc.tween(this.node).call(() => {
            this.node.width = this.node.parent.width * this.slider.progress;
        }).delay(0)).start();
    }
}
