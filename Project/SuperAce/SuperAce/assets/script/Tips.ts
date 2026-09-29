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

    tipIndex: number = 0;
    repeatCount: number = 0;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        cc.tween(this.tipSprite.node)
                .to(0.5, { y: 0 })
                .delay(0.5)
                .by(3, { x: - this.tipSprite.node.width })
                .delay(0.5)
                .call(() => {
                    this.tipSprite.node.x = this.node.width / 2;
                    cc.tween(this.tipSprite.node)
                        .to(6, { x: -this.node.width / 2 - this.tipSprite.node.width })
                        .call(() => {
                            this.tipSprite.node.y = 70;
                            this.tipSprite.node.x = -this.node.width / 2
                        })
                        .start();
                })
                .start();
        this.schedule(() => {
            this.tipSprite.spriteFrame = this.tips[this.repeatCount % this.tips.length];
            this.repeatCount++;
            if (this.repeatCount % this.tips.length == 0) this.repeatCount = 0;
            cc.tween(this.tipSprite.node)
                .to(0.5, { y: 0 })
                .delay(0.5)
                .by(3, { x: - this.tipSprite.node.width })
                .delay(0.5)
                .call(() => {
                    this.tipSprite.node.x = this.node.width / 2;
                    cc.tween(this.tipSprite.node)
                        .to(6, { x: -this.node.width / 2 - this.tipSprite.node.width })
                        .call(() => {
                            this.tipSprite.node.y = 70;
                            this.tipSprite.node.x = -this.node.width / 2
                        })
                        .start();
                })
                .start();
        }, 13, cc.macro.REPEAT_FOREVER, 0)
    }

    // update (dt) {}
}
