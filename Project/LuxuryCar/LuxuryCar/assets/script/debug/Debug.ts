// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Debug extends cc.Component {
    @property(cc.Label)
    frameSize: cc.Label = null;

    update (dt) {
        var frameSize = cc.view.getFrameSize();
        this.frameSize.string = "w: " + frameSize.width + ", h: " + frameSize.height;
    }
}