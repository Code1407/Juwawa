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
    goods: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    goodsIn: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    rankIcon: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    soundSprite: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    defaultAvatar: cc.SpriteFrame = null;

    static get Instance() {
        return cc.find("Template/ImageCache").getComponent(ImageCache);
    }

    private static isRemoteUrl(url: string): boolean {
        if (!url) return false;
        return url.startsWith("http://") || url.startsWith("https://");
    }

    static loadAvatar(url: string, sprite: cc.Sprite, onError?: () => void) {
        let _this = ImageCache.Instance;
        if (!_this || !sprite) return;

        if (!url || !ImageCache.isRemoteUrl(url)) {
            sprite.spriteFrame = _this.defaultAvatar;
            if (onError) onError();
            return;
        }

        let decodedUrl = decodeURI(decodeURI(url));
        cc.loader.load({ url: decodedUrl, type: 'image' }, (error, texture) => {
            if (error) {
                console.warn("头像加载失败，使用默认头像：", decodedUrl, error);
                sprite.spriteFrame = _this.defaultAvatar;
                if (onError) onError();
                return;
            }
            let frame = new cc.SpriteFrame(texture);
            sprite.spriteFrame = frame;
        });
    }

    // LIFE-CYCLE CALLBACKS:

    // update (dt) {}
}
