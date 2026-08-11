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
    myName: cc.Label = null;

    @property(cc.Sprite)
    myProfile: cc.Sprite = null;


    setAccountDiamond(value: string) {
        if (this.myDiamond != null) {
            if (Number(value)) {
                this.myDiamond.string = toThousands(Number(value));
            }
            else
                this.myDiamond.string = value;
        }
    }

    setMyName(value: string) {
        if (this.myName != null)
            this.myName.string = value;
    }

    setMyProfile(url: string) {
        if (url == null || this.myProfile == null) return;
       
        cc.assetManager.loadRemote<cc.Texture2D>(decodeURI(decodeURI(url)), { ext: '.png' }, (err, res) => {
            if(err)return
            var frame = new cc.SpriteFrame(res);
            this.myProfile.spriteFrame.destroy();
            this.myProfile.spriteFrame = frame;
        })
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // update (dt) {}
}
