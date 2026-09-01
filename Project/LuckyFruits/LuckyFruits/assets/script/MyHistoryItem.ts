// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import { IMyHistoryItem, arraySum, calculateRevenue } from "./interface/ILuckyFruits";


const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    date: cc.Label = null;

    @property(cc.Label)
    round: cc.Label = null;

    @property(cc.Node)
    betDetail: cc.Node = null;

    @property(cc.Sprite)
    winPos: cc.Sprite = null;

    @property(cc.Label)
    revenue: cc.Label = null;

    @property(cc.SpriteFrame)
    icons: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    betIcon:Array<cc.SpriteFrame> = []

    @property(cc.Node)
    betDetails:Array<cc.Node> = []

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }
    setItemValue(historyItem: IMyHistoryItem) {
        if (arraySum(historyItem.betDatails) == 0) return;
        //date
        this.date.string = historyItem.date;
        const roundTitle = cc.find("time/round", this.node).getComponent(cc.Label);
        roundTitle.overflow = cc.Label.Overflow.SHRINK;
        const langInCode = (<any>window).langInCode;
        roundTitle.string = langInCode && langInCode.globalContent.round || "Round: ";
        this.round.string = historyItem.round.toString();

        //bet detail
        for (let i = 0; i < historyItem.betDatails.length; i++) {
            if (historyItem.betDatails[i] >= 0) {
                let betDetailItem = this.betDetails[i]
                cc.find("Goods", betDetailItem).getComponent(cc.Sprite).spriteFrame = this.betIcon[i];
                cc.find("Diamond/Number/New Label", betDetailItem).getComponent(cc.Label).string = historyItem.betDatails[i].toString();
            }
        }
        
        if (this.betDetail.childrenCount == 1) this.betDetail.children[0].position = cc.v3(0, -61, 0);
        else if (this.betDetail.childrenCount >= 2) {
            this.betDetail.children[0].position = cc.v3(0, 0, 0);
            this.betDetail.children[1].position = cc.v3(0, -31, 0);
            this.betDetail.children[2].position = cc.v3(0, -61, 0);
            this.betDetail.children[3].position = cc.v3(0, -93, 0);
            this.betDetail.children[4].position = cc.v3(0, -126, 0);
        }
        // win pos
        this.winPos.spriteFrame = this.icons[historyItem.roundResult];
        //revenue
        this.revenue.string = calculateRevenue(historyItem.betDatails, historyItem.resultDetail).toString();
    }
   
    // update (dt) {}
}
