// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { sdk, toThousands } from "../shared/Common";
import Game from "./Game";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Account extends cc.Component {
    // @property(cc.Label)
    // myName: cc.Label = null;

    @property(cc.Label)
    myDiamon: cc.Label = null;

    @property(cc.Sprite)
    myProfile: cc.Sprite = null;

    @property(cc.Sprite)
    rechargeBtn: cc.Sprite = null;
    @property(cc.Sprite)
    myDiamondCoinIcon: cc.Sprite = null;


    start () {
        this.rechargeBtn.node.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.recharge(); 
        });
        this.setCoinIcon();
    }
    // setMyName(value: string) {
    //     this.myName.string = value;   
    // }

    setMyDiamon(value: number) {
        this.myDiamon.string = (value/1000).toFixed(1).toString()+"k";   
        (<any>window).playerAccountDiamond = value;
    }

    setMyProfile(url: string) {
        console.log("setMyProfile:"+url);
        if (url == null) return;
        cc.loader.load( {url:decodeURI(decodeURI(url)),type: 'image'},(error, texture) => {
            var frame = new cc.SpriteFrame(texture);
            this.myProfile.spriteFrame.destroy();
            this.myProfile.spriteFrame = frame;
        });
    }
    setCoinIcon() {
        let config = (<any>window).config;
        if (config && config.setGameCoin) {
            config.setGameCoin(this.myDiamondCoinIcon);
        }
    }
}
