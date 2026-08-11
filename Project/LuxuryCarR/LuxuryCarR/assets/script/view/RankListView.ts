// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


const {ccclass, property} = cc._decorator;
import { IRankListItem } from "../interface/ILuxuryCarR";
import RankListViewItem from "./ViewItem/RankListViewItem";

@ccclass
export default class RankListView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    rankItemPrefab: cc.Prefab = null;
    
    setRankListValues(itemValues: IRankListItem[]) {
        let rankItemNodes: cc.Node[] = [];
        for (let i = 0; i < itemValues.length; ++i) {
            let item = cc.instantiate(this.rankItemPrefab)
            rankItemNodes.push(item);
        }
        this.content.removeAllChildren(true);
        for (let i = 0; i < itemValues.length; ++i) {
            let itemValue = itemValues[i];
            let itemNode = rankItemNodes[i];
            let itemScript = itemNode.getComponent(RankListViewItem);
            itemScript.setRankListItemValue(i + 1, itemValue.name, itemValue.revenue, itemValue.profile);
            itemNode.name = "Clone(RankListViewItem)";
            this.content.addChild(itemNode);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
    }

    // update (dt) {}
}
