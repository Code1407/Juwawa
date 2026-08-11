// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { IHistoryItem, getDayString, getTimeString2 } from "../../interface/IFruitSlots";
import ResultDetailItem from "./ResultDetailItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HistoryViewItem extends cc.Component {

    @property(cc.SpriteFrame)
    lines:cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    goods:cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    multiples:cc.SpriteFrame[] = [];

    @property(cc.Sprite)
    multipleIcon:cc.Sprite = null;

    @property(cc.Label)
    date:cc.Label = null;

    @property(cc.Label)
    time:cc.Label = null;

    @property(cc.Label)
    cost:cc.Label = null;

    @property(cc.Label)
    win:cc.Label = null;

    @property(cc.Label)
    round: cc.Label = null;

    @property(cc.Label)
    roundNum:cc.Label = null;

    @property(cc.Layout)
    roundLayout:cc.Layout = null;

    @property(cc.Node)
    isExtra:cc.Node = null;

    @property(cc.Node)
    resultDetail:cc.Node = null;

    @property(cc.Prefab)
    detailItem:cc.Prefab = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    setValue(historyItem:IHistoryItem, changeAlign:boolean = false){
        if(!historyItem) return;
        //date
        this.date.string = getDayString(historyItem.date);
        this.time.string = getTimeString2(historyItem.date);
        this.roundNum.string = historyItem.round.toString();
        if((<any>window).langContent.game.round) this.round.string = (<any>window).langContent.game.round;
        if(changeAlign) {
            this.roundLayout.horizontalDirection = cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
            this.roundNum.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
        }

        //cost
        let costStr = historyItem.betAmount >= 1000? historyItem.betAmount / 1000 + "K" : historyItem.betAmount.toString();
        this.cost.string = costStr;
        this.isExtra.active = historyItem.isExtra;
        
        //win
        let winStr = historyItem.win >= 1000 ? historyItem.win / 1000 + "K" : historyItem.win.toString();
        this.win.string = winStr;

        //result
        this.resultDetail.removeAllChildren();
        if(historyItem.lines.length <= 0) this.resultDetail.active = false;
        for(let i = 0; i < historyItem.lines.length; i++){
            let detailItem = cc.instantiate(this.detailItem);
            let itemCpn = detailItem.getComponent(ResultDetailItem)
            itemCpn.line.spriteFrame = this.lines[historyItem.lines[i]];
            itemCpn.good.spriteFrame = this.goods[historyItem.goods[i]];
            detailItem.parent = this.resultDetail;
        }
        this.multipleIcon.spriteFrame = this.multiples[historyItem.wheelMultiple];
        if(historyItem.isExtra && historyItem.wheelMultiple == 6)
            this.multipleIcon.spriteFrame = this.multiples[7];
        if(historyItem.win <= 0) this.multipleIcon.node.active = false;
    }

    // update (dt) {}
}
