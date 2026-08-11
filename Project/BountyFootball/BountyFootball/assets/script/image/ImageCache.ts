// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class ImageCache extends cc.Component {
    @property(cc.SpriteFrame)
    betAmount: Array<cc.SpriteFrame> = [];
    @property(cc.SpriteFrame)
    goods: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    goodsIn: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    rankIcon: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    soundSprite: Array<cc.SpriteFrame> = [];

    static get Instance() {
        return cc.find("Template/ImageCache").getComponent(ImageCache);
    }

    // LIFE-CYCLE CALLBACKS:

    // update (dt) {}
}
