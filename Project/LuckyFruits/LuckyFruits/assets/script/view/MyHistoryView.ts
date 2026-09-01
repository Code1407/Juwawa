// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { IMyHistoryItem } from "../interface/ILuckyFruits";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MyHistoryView extends cc.Component {

    @property(cc.Node)
    closeBtn: cc.Node = null;

    @property(cc.Node)
    blackBg: cc.Node = null;

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    MyHistoryItemPrefab: cc.Prefab = null;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;

    historyList: IMyHistoryItem[] = [];


    // LIFE-CYCLE CALLBACKS:

    onLoad () {}

    static get Instance() {
        return cc.find("Canvas/Views/MyHistoryView").getComponent(MyHistoryView);
    }

    start () {
        this.closeBtn.on(cc.Node.EventType.TOUCH_START, () => {
            // Game.Instance.audio.playClick();
        });

        // this.blackBg.on(cc.Node.EventType.TOUCH_START, () => {
        //     Game.Instance.audio.playClick();
        //     this.node.active = false;
        // });
    }

    /**
     * 为历史记录设置数据
     * @param myHistory 个人历史记录
     */
    setHistoryValue(myHistory: IMyHistoryItem[] | { [key: string]: IMyHistoryItem }){
        this.content.removeAllChildren();
        let historyList = this.normalizeHistory(myHistory).slice(0, 20);
        // console.log(historyList)
        for(let i = 0; i < historyList.length; i++){
            let myHistoryItem = cc.instantiate(this.MyHistoryItemPrefab)
            myHistoryItem.parent = this.content;
            myHistoryItem.getComponent("MyHistoryItem").setItemValue(historyList[i]);
        }
        // console.log(this.content.childrenCount)
        this.historyList = historyList.concat();
    }

    /**
     * Lua 空数组可能被序列化为 {}，非空数组可能是数字键对象。
     * 在 UI 入口统一转换为按键排序的数组。
     */
    private normalizeHistory(myHistory: IMyHistoryItem[] | { [key: string]: IMyHistoryItem }): IMyHistoryItem[] {
        if (Array.isArray(myHistory)) {
            return myHistory.concat();
        }
        if (!myHistory || typeof myHistory !== "object") {
            return [];
        }

        const historyMap = <{ [key: string]: IMyHistoryItem }>myHistory;
        return Object.keys(historyMap)
            .filter(key => /^\d+$/.test(key))
            .sort((left, right) => Number(left) - Number(right))
            .map(key => historyMap[key])
            .filter(item => !!item);
    }

    /**
     * 添加历史记录
     * @param item 添加历史记录项
     */
    addHistoryItem(item: IMyHistoryItem){
        // console.log("revenue: ", item.revenue + " hand: ", this.cardLabels[item.hands])
        if(!item) return;
        this.historyList.push(item);
        if(this.historyList.length > 20){
            this.historyList.shift();
        }
        return;
        let myHistoryItem = cc.instantiate(this.MyHistoryItemPrefab);
        this.content.addChild(myHistoryItem);
        myHistoryItem.getComponent("MyHistoryItem").setItemValue(item);
        if(this.content.childrenCount > 20){
            this.content.children[0].destroy();
        }
    }

    protected onEnable(): void {
        this.setHistoryValue(this.historyList)
        this.scrollView.scrollToTop();
    }
    close(){
        this.node.active = false;
    }
    // update (dt) {}
}
