// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { IHistoryItem } from "../interface/ILuckyFruits";
import Game from "../Game";
import { gGameData } from "../GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameRecordView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.SpriteFrame)
    winsp: Array<cc.SpriteFrame> = [];

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    historyItemPrefab: cc.Prefab = null;

    setRankListValues(itemValues: IHistoryItem[]) {
        let rankItemNodes: cc.Node[] = [];
        let historyList = itemValues.concat();
        historyList = historyList.reverse();

        for (let i = 0; i < historyList.length; ++i) {
            rankItemNodes.push(cc.instantiate(this.historyItemPrefab));
        }
        this.content.removeAllChildren(true);
        for (let i = 0; i < historyList.length; ++i) {
            let itemValue = historyList[i];
            // console.log("IMyHistoryItem="+itemValue.round+",IMyHistoryItem="+itemValue.roundResult);
            let itemNode = rankItemNodes[i];

            itemNode.getChildByName("sprite2").getComponent(cc.Sprite).spriteFrame = this.winsp[itemValue.roundResult];

            itemNode.getChildByName("daySt").getComponent(cc.Label).string = itemValue.date; //日期
            itemNode.getChildByName("roundSt").getComponent(cc.Label).string = (<any>window).langInCode.globalContent.round + itemValue.round;//回合
            this.content.addChild(itemNode);
        }
    }
    start() {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            // Game.Instance.audio.playClick();
        });

    }
    protected onEnable(): void {
        this.setRankListValues(Game.Instance.player.getHistory());
    }
    close() {
        this.node.active = false;
    }
    // update (dt) {}
}
