// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class ImageCache extends cc.Component {

    @property(cc.SpriteFrame)
    betAmount: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    badflase01:cc.SpriteFrame=null;
    
    @property(cc.SpriteFrame)
    badflase02:cc.SpriteFrame=null;
    
    static get Instance() {
        return cc.find("Template/ImageCache").getComponent(ImageCache);
    }
    // onLoad () {}

    start () {
    }

    // update (dt) {}
}
