// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html



const { ccclass, property } = cc._decorator;

@ccclass
export default class UIIcon extends cc.Component {
    @property(cc.Sprite)
    content: cc.Sprite = null;
    @property(cc.SpriteFrame)
    icons: cc.SpriteFrame[] = [];

    SwitchIcon(index: number) {
        if (index < 0) {
            index %= this.icons.length;
            index += this.icons.length;
        }
        this.content.spriteFrame = this.icons[index % this.icons.length];
    }
}
