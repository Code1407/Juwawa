// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Sprite)
    tipSprite: cc.Sprite = null;

    @property(cc.SpriteFrame)
    tips: cc.SpriteFrame[] = [];

    @property(cc.Node)
    title: cc.Node = null;

    @property(cc.Integer)
    originalX: number = 0;

    repeatCount: number = 0;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        let tipNode = this.tipSprite.node;
        this.schedule(() => {
            if(this.repeatCount <= 0 || this.repeatCount > 4){
                cc.tween(this.title)
                   .to(0.5, {opacity: 255})
                   .delay(8)
                   .to(0.5, {opacity: 0})
                   .start();
                this.repeatCount = 1;
            }else{
                this.tipSprite.spriteFrame = this.tips[this.repeatCount - 1];
                let width = tipNode.width;
                tipNode.x = this.originalX;
                cc.tween(tipNode)
                    .delay(1)
                    .to(8, { x: this.originalX - width })
                    .call(() => { })
                    .start();
                this.repeatCount++;
            }
        }, 10, cc.macro.REPEAT_FOREVER, 0)
    }

    // update (dt) {}
}
