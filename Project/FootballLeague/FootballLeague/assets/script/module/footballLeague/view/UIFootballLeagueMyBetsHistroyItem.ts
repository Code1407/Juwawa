import { _decorator, Node, Label, instantiate, Layout, SpriteFrame, UITransform } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { UIBetItem } from './UIBetItem';
import { Utils } from "db://assets/script/framework/utils/Utils";
import { oops } from 'db://oops-framework/core/Oops';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueMyBetsHistroyItem')
export class UIFootballLeagueMyBetsHistroyItem extends GameComponent {

    @property(Node)
    timeNode: Node;

    @property(Label)
    timeLB: Label;

    @property(Node)
    resulNode: Node;

    @property(UIBetItem)
    resultItem: UIBetItem;

    @property(Node)
    betListRoot: Node;

    @property(Node)
    betInfoPrefab: Node;

    @property(Layout)
    layout: Layout;

    initUI: boolean = false;
    private static readonly MinItemHeight = 110;
    private itemHeight: number = UIFootballLeagueMyBetsHistroyItem.MinItemHeight;
    private betItems: Node[] = [];

    clearForReuse() {
        if (this.resultItem) {
            this.resultItem.clearForReuse();
        }
        this.clearBetItems();
        this.initUI = false;
    }

    init(data: HistoryData, coinsSp: SpriteFrame) {
        if (!data) {
            return;
        }

        this.clearForReuse();
        this.initUI = true;

        const date = new Date(data.prepareTime * 1000);
        let round = Utils.getRound(data.round);
        let labTime1 = Utils.getFormateDate(date, "yyyy/M/d");
        let labTime2 = Utils.getFormateDate(date, "h:m:s");
        let labRound = oops.language.getLanguage("common_Round_text", round);
        let timeStr = labTime1 + "\n" + labTime2 + "\n" + labRound;
        this.timeLB.string = timeStr;

        let winNum = data.addCoins || 0;
        this.resultItem.init(data.zhuanPanId, winNum, data.team_id);
        this.resultItem.update_icon_coins(coinsSp);

        const betEntries = data.betMap ? Object.entries(data.betMap) : [];
        for (let index = 0; index < betEntries.length; index++) {
            const [key, value] = betEntries[index];
            const item = this.getBetItem(index);
            const betItem: UIBetItem = item.getComponent(UIBetItem);
            const reward = Number(key);
            const betValue = Number(value);
            betItem.init(reward, betValue, data.team_id);
            betItem.update_icon_coins(coinsSp);
            item.active = true;
            this.positionBetItem(item, index);
        }

        this.updateItemHeight(betEntries.length);
    }

    getItemHeight(): number {
        return this.itemHeight;
    }

    private positionBetItem(item: Node, index: number) {
        const templateUi = this.betInfoPrefab.getComponent(UITransform);
        const rowHeight = templateUi ? templateUi.height : 45;
        const templatePos = this.betInfoPrefab.position;
        item.setPosition(templatePos.x, templatePos.y - index * rowHeight, templatePos.z);
    }

    private getBetItem(index: number): Node {
        let item = this.betItems[index];
        if (item) {
            return item;
        }

        item = instantiate(this.betInfoPrefab);
        item.parent = this.betListRoot;
        item.active = false;
        this.betItems.push(item);
        return item;
    }

    private updateItemHeight(betCount: number) {
        const templateUi = this.betInfoPrefab.getComponent(UITransform);
        const rowHeight = templateUi ? templateUi.height : 45;
        this.itemHeight = Math.max(UIFootballLeagueMyBetsHistroyItem.MinItemHeight, betCount * rowHeight);

        // 明细和外层记录均由明确的高度和坐标排列，不让自动 Layout 在动态
        // destroy 的节点上排序。
        if (this.layout) {
            this.layout.enabled = false;
        }
        const betListLayout = this.betListRoot && this.betListRoot.getComponent(Layout);
        if (betListLayout) {
            betListLayout.enabled = false;
        }

        const itemUi = this.node.getComponent(UITransform);
        if (itemUi) {
            itemUi.height = this.itemHeight;
        }
        const betListUi = this.betListRoot && this.betListRoot.getComponent(UITransform);
        if (betListUi) {
            betListUi.height = this.itemHeight;
        }

        const bg = this.betListRoot && this.betListRoot.parent;
        const bgUi = bg && bg.getComponent(UITransform);
        if (bgUi) {
            bgUi.height = this.itemHeight;
            bg.setPosition(bg.position.x, -this.itemHeight / 2, bg.position.z);
        }

        const timeUi = this.timeNode && this.timeNode.getComponent(UITransform);
        if (timeUi) {
            this.timeNode.setPosition(this.timeNode.position.x, -this.itemHeight / 2, this.timeNode.position.z);
        }
        if (this.resulNode) {
            this.resulNode.setPosition(this.resulNode.position.x, -this.itemHeight / 2, this.resulNode.position.z);
        }
    }

    private clearBetItems() {
        for (let i = 0; i < this.betItems.length; i++) {
            const item = this.betItems[i];
            const betItem = item.getComponent(UIBetItem);
            if (betItem) {
                betItem.clearForReuse();
            }
            item.active = false;
        }
    }
}


