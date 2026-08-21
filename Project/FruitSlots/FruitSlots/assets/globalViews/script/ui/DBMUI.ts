// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html



const { ccclass, property } = cc._decorator;

@ccclass
export default class DBMUI extends cc.Component {
    @property(cc.Sprite)
    content: cc.Sprite = null;
    @property(cc.Label)
    time: cc.Label = null;

    @property(cc.SpriteFrame)
    wifiSp: cc.SpriteFrame[] = [];

    updateOffset(value: number) {
        this.time.string = value + "ms";
        if (value > 2000) {
            this.time.string = "";
            this.content.spriteFrame = this.wifiSp[3];
        }
        else if (value > 500) {
            this.time.node.color = cc.Color.RED;
            this.content.spriteFrame = this.wifiSp[2];
        }
        else if (value > 100) {
            this.time.node.color = cc.Color.YELLOW;
            this.content.spriteFrame = this.wifiSp[1];
        }
        else {
            this.time.node.color = cc.Color.GREEN;
            this.content.spriteFrame = this.wifiSp[0];
        }
    }
    // update (dt) {}
}
