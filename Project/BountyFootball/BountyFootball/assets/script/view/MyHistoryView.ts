// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ImageCache from "../image/ImageCache";
import { arraySum, calculateRevenue, getDayString, IMyHistoryItem,getTimeString2 } from "../interface/IBountyFootball";
import MyHistoryViewItem from "./ViewItem/MyHistoryViewItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MyHistoryView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;

    historyList:IMyHistoryItem[] = [];

    cleanItem() {
        for (let i = this.content.childrenCount - 1; i >= 2; i--) {
            let lastChild = this.content.children[i];
            this.content.removeChild(lastChild, true);
        }
    }

    setMyHistoryValues(myHistory: IMyHistoryItem[]) {
        this.cleanItem();
        this.historyList = [];
        myHistory.forEach(element => {
            this.addItem(element); 
        });
        this.historyList = myHistory;
    }

    addItem(historyItem: IMyHistoryItem) {
        if (arraySum(historyItem.betDatails) == 0)
            return;
        if(this.historyList.length > 0){
            for (let index = 0; index < this.historyList.length; index++) {
                const element = this.historyList[index];
                if(element.round == historyItem.round){
                    return;
                }
            }
        }
            
        let myHistoryItemNode = cc.instantiate(this.content.children[0]);
        //let lineNode = cc.instantiate(this.content.children[1]);
        myHistoryItemNode.name = "Clone(MyHistoryItemContainer)";
        //lineNode.name = "Clone(Line)";
        myHistoryItemNode.active = true;

        let myHistoryItem = myHistoryItemNode.getComponent(MyHistoryViewItem);
        
        // myHistoryItem.timeStr.string = getDayString(new Date(historyItem.date).getTime().toString());
        myHistoryItem.timeStr.string =getDayString(JSON.stringify(historyItem.timestamp));
        myHistoryItem.timestamp.string =getTimeString2(JSON.stringify(historyItem.timestamp));
        myHistoryItem.roundNumber.string = historyItem.round.toString();

        let height = myHistoryItem.addDetailsItem(historyItem.betDatails);
        myHistoryItemNode.height = height;
        cc.find("MyHistoryItem/bgSprite",myHistoryItemNode).height = height;

        myHistoryItem.rewardDetailsGoods.spriteFrame = ImageCache.Instance.goods[historyItem.roundResult];
        let amountNum = calculateRevenue(historyItem.betDatails, historyItem.roundResult);
        myHistoryItem.rewardDetailNumber.string = amountNum < 1000 ? amountNum.toString(): amountNum / 1000 + "k";

        this.content.insertChild(myHistoryItemNode, 2); // 第0与1个子节点是模版。所以从2开始插入。
        if (this.content.childrenCount > 22) {
            let lastChild = this.content.children[this.content.childrenCount - 1];
            this.content.removeChild(lastChild, true);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
    }

    onEnable() {
        this.scrollView.scrollToTop();
    }

    // update (dt) {}
}
