// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Account extends cc.Component {

    @property(cc.Label)
    accountDiamond: cc.Label = null;

    @property(cc.Sprite)
    diamondIcon: cc.Sprite = null;

    @property(cc.Sprite)
    myProfile: cc.Sprite = null;

    setGameCoin() {
        let config = (<any>window).config;
        config && config.setGameCoin && config.setGameCoin(this.diamondIcon);
    }

    setAccountDiamond(value: number) {
        this.accountDiamond.string = toThousands(value);
    }

    setMyProfile(url: string) {
        if (url == null) return;
        cc.loader.load(decodeURI(decodeURI(url)), (error, texture) => {
            if (!error) {
                var frame = new cc.SpriteFrame(texture);
            this.myProfile.spriteFrame.destroy();
            this.myProfile.spriteFrame = frame;
            }
        });
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
