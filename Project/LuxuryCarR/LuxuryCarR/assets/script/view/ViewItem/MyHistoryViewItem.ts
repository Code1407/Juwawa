// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ImageCache from "../../image/ImageCache";
import MyHistoryViewBetDetailsItem from "./MyHistoryViewBetDetailsItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MyHistoryViewItem extends cc.Component {

    @property(cc.Label)
    timeStr: cc.Label = null;

    @property(cc.Label)
    roundNumber: cc.Label = null;

    @property(cc.Node)
    betDetailsNode: cc.Node = null;

    @property(cc.Sprite)
    rewardDetailsGoods: cc.Sprite = null;

    @property(cc.Label)
    rewardDetailNumber: cc.Label = null;

    @property(cc.Label)
    timestamp: cc.Label = null;

    addDetailsItem(betDetails: number[]): number {
        let k = 0;
        for (let i = 0; i < betDetails.length; ++i) {
            if (betDetails[i] == 0)
                continue;

            ++k;
            let betDetailsItemNode = cc.instantiate(this.betDetailsNode.children[0]);
            betDetailsItemNode.active = true;
            betDetailsItemNode.name = "Clone(BetDetailsItem)";
            this.betDetailsNode.insertChild(betDetailsItemNode, 0);

            let betDetailsItem = betDetailsItemNode.getComponent(MyHistoryViewBetDetailsItem);
            betDetailsItem.goods.spriteFrame = ImageCache.Instance.goodsIn[i];
            // console.log(ImageCache.Instance.goodsIn[i]);

            let amountNum = betDetails[i];
            betDetailsItem.diamondNumber.string = amountNum < 1000 ? amountNum.toString() : amountNum / 1000 + "k";
        }
        for (let j = this.betDetailsNode.childrenCount - 1; j >= k; --j) {
            let tmpChild = this.betDetailsNode.children[j];
            this.betDetailsNode.removeChild(tmpChild, true);
        }
        return Math.max(k * 60, 100);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // start () {}

    // update (dt) {}
}
