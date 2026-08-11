// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../../../shared/Common";
import ImageCache from "../../image/ImageCache";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RankListViewItem extends cc.Component {
    
    @property(cc.Label)
    noNode: cc.Label = null;

    @property(cc.Sprite)
    rankImage: cc.Sprite = null;

    @property(cc.Label)
    nameNode: cc.Label = null;

    @property(cc.Label)
    revenueNode: cc.Label = null;

    @property(cc.Sprite)
    profileNode: cc.Sprite = null;

    setRankListItemValue(no: number, name: string, revenue: number, url: string) {
        this.noNode.string = no.toString();
        this.rankImage.node.active = false;
        if(no <= 3){
            this.rankImage.node.active = true;
            this.noNode.node.active = false;
            this.rankImage.spriteFrame = ImageCache.Instance.rankIcon[no-1];
        }
        else{
            this.noNode.node.active = true;
        }
        this.nameNode.string = decodeURI(name);
        this.revenueNode.string = toThousands(revenue);
        if (url) {
            cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
                if (error) return;
                var frame = new cc.SpriteFrame(texture);
                //this.profileNode.spriteFrame.destroy();
                this.profileNode.spriteFrame = frame;
            });
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // start () {}

    // update (dt) {}
}
