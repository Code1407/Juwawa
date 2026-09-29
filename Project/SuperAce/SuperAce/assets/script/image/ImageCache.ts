// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class ImageCache extends cc.Component {
    @property(cc.SpriteFrame)
    frames: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    pokerIcons: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    pokerBgs: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    words: cc.SpriteFrame[] = [];

    static instance: ImageCache = null;

    static get Instance() {
        if (!ImageCache.instance) this.instance = cc.find("Template/ImageCache").getComponent(ImageCache);
        return this.instance;
    }

    // LIFE-CYCLE CALLBACKS:

    // update (dt) {}
}