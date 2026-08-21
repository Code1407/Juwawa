// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Account extends cc.Component {

    @property(cc.Label)
    myDiamond: cc.Label = null;

    @property(cc.Label)
    todayRevenue: cc.Label = null;

    @property(cc.Label)
    myName: cc.Label = null;

    @property(cc.Sprite)
    myProfile: cc.Sprite = null;

    setAccountDiamond(value: number) {
        this.myDiamond.string = toThousands(value);

        console.log("11111-----------setAccountDiamond", value);
    }

    setTodayRevenue(value: number) {
        this.todayRevenue.string = toThousands(value);
    }

    setMyName(value: string) {
        //this.myName.string = value;
    }

    setMyProfile(url: string) {
        if (url == null) return;
        cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
            if (!error) {
                var frame = new cc.SpriteFrame(texture);
                //this.myProfile.spriteFrame.destroy();
                this.myProfile.spriteFrame = frame;
            }
        });
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
    }

    // update (dt) {}
}
