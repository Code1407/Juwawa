// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { LocalizedSprite } from "../../lang/LocalizedSprite";
import { simplifyNumber } from "../../shared/Common";
import Game from "../Game";
import { gGameData } from "../GameData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HistoryListView extends cc.Component {

    //模板节点
    @property(cc.Node)
    historyItemTemplate: cc.Node = null;

    //滚动列表
    @property(cc.ScrollView)
    M_scrollView: cc.ScrollView = null;

    //今日赢奖统计
    @property(cc.Label)
    todayWinAmountLabel: cc.Label = null;
    //本月赢奖统计
    @property(cc.Label)
    monthWinAmountLabel: cc.Label = null;


    //顶部标签节点
    @property(cc.Node)
    topLabelNode: cc.Node = null;

    //关闭按钮
    @property(cc.Node)
    closeButtonBtn: cc.Node = null;

    //暂无数据节点
    @property(cc.Node)
    noDataNode: cc.Node = null;

    /** 每一项的有效高度；会在 onLoad 中用 prefab 与 Layout 的间距计算。 */
    private itemHeight: number = 0;
    /** 可视区域之外额外保留的复用项数量，避免滚动时出现空白。 */
    private readonly bufferItemCount: number = 2;
    private historyData: any[] = [];
    private itemPool: cc.Node[] = [];
    private firstVisibleIndex: number = -1;
    private visibleItemCount: number = 0;
    /** 避免较早的网络响应覆盖一次重新打开后的最新响应。 */
    private historyRequestId: number = 0;
    private readonly historyChangedEvent = "mage-jackpot-history-changed";

    onLoad(): void {
        this.itemHeight = this.getItemHeight();
        this.M_scrollView.node.on("scrolling", this.onScrolling, this);
        cc.director.on(this.historyChangedEvent, this.onHistoryChanged, this);
    }

    start () {
        this.closeButtonBtn.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });
        this.setTopLabel();
    }

    onEnable(): void {
        this.node.parent.zIndex = this.node.parent.children.length+100;

        //请求数据
        this.requestHistoryData();
    }

    onDestroy(): void {
        if (this.M_scrollView) this.M_scrollView.node.off("scrolling", this.onScrolling, this);
        cc.director.off(this.historyChangedEvent, this.onHistoryChanged, this);
    }

    //国际化图片  lage_22  lage_23  lage_17 lage_25 lage_26 顶部标签
    setTopLabel(): void {
        LocalizedSprite.refreshSprite(this.topLabelNode.getChildByName("lage_22").getComponent(cc.Sprite));
        LocalizedSprite.refreshSprite(this.topLabelNode.getChildByName("lage_23").getComponent(cc.Sprite));
        LocalizedSprite.refreshSprite(this.topLabelNode.getChildByName("lage_17").getComponent(cc.Sprite));
        LocalizedSprite.refreshSprite(this.topLabelNode.getChildByName("lage_25").getComponent(cc.Sprite));
        LocalizedSprite.refreshSprite(this.topLabelNode.getChildByName("lage_26").getComponent(cc.Sprite));


        LocalizedSprite.refreshSprite(this.node.getChildByName("tc_D_1").getChildByName("lage_27").getComponent(cc.Sprite));
        LocalizedSprite.refreshSprite(this.node.getChildByName("tc_D_2").getChildByName("lage_28").getComponent(cc.Sprite));
    }
    // update (dt) {}

    async requestHistoryData(): Promise<void> {
        // 先立即显示缓存，避免等待网络时空白；随后每次打开均向服务端拉取最新记录。
        this.refreshData(gGameData.history || []);
        // 暂无数据时显示提示
        this.noDataNode.active = this.historyData.length === 0;

        const requestId = ++this.historyRequestId;
        const gameNode = cc.find("Canvas/Game");
        const game = gameNode && gameNode.getComponent(Game);
        if (!game || !game.player) return;

        try {
            // 仅消费回包中的 history。不要调用 Game.synchronize()/状态恢复流程，
            // 以免打开历史面板影响正在运行的转轴或免费局。
            const resp = await game.player.synchronize();
            if (requestId !== this.historyRequestId || !this.node.activeInHierarchy
                || !resp || !Array.isArray(resp.history)) return;

            gGameData.history.splice(0, gGameData.history.length, ...resp.history);
            if (resp.historySummary) gGameData.historySummary = resp.historySummary;
            cc.director.emit(this.historyChangedEvent, gGameData.history);
        } catch (error) {
            // 缓存数据仍然可用；网络错误不应阻断历史面板。
            console.warn("refresh history data failed", error);
        }
    }

    /**
     * 供服务器回包或测试直接调用。列表只创建可视区所需的节点，并在滚动时复用。
     */
    refreshData(data: any[]): void {
        this.historyData = Array.isArray(data) ? data.slice() : [];
        this.updateSummary();

        const content = this.M_scrollView.content;
        const viewHeight = this.M_scrollView.node.height;
        const contentHeight = Math.max(viewHeight, this.historyData.length * this.itemHeight);
        content.setContentSize(content.width, contentHeight);
        content.y = viewHeight / 2;

        const neededCount = Math.min(
            this.historyData.length,
            Math.ceil(viewHeight / this.itemHeight) + this.bufferItemCount * 2
        );
        this.resizeItemPool(neededCount);
        this.M_scrollView.stopAutoScroll();
        this.M_scrollView.scrollToTop(0);
        this.firstVisibleIndex = -1;
        this.updateVisibleItems(true);
    }

    private onHistoryChanged(data: any[]): void {
        if (this.node.activeInHierarchy) this.refreshData(data);
    }

    private onScrolling(): void {
        this.updateVisibleItems(false);
    }

    private getItemHeight(): number {
        const layout = this.M_scrollView.content.getComponent(cc.Layout);
        const spacingY = layout ? layout.spacingY : 0;
        return Math.max(1, this.historyItemTemplate.height + spacingY);
    }

    private resizeItemPool(neededCount: number): void {
        const content = this.M_scrollView.content;
        const layout = content.getComponent(cc.Layout);
        // Layout 会改写我们按数据索引计算的位置，虚拟列表必须关闭它。
        if (layout) layout.enabled = false;

        while (this.itemPool.length < neededCount) {
            const item = cc.instantiate(this.historyItemTemplate);
            item.parent = content;
            item.active = true;
            this.itemPool.push(item);
        }
        while (this.itemPool.length > neededCount) {
            const item = this.itemPool.pop();
            item.destroy();
        }
        this.visibleItemCount = neededCount;
    }

    private updateVisibleItems(force: boolean): void {
        if (!this.historyData.length || !this.visibleItemCount) {
            this.itemPool.forEach(item => item.active = false);
            return;
        }

        const scrollY = Math.max(0, this.M_scrollView.getScrollOffset().y);
        const maxFirstIndex = Math.max(0, this.historyData.length - this.visibleItemCount);
        const firstIndex = Math.min(
            maxFirstIndex,
            Math.max(0, Math.floor(scrollY / this.itemHeight) - this.bufferItemCount)
        );
        if (!force && firstIndex === this.firstVisibleIndex) return;

        this.firstVisibleIndex = firstIndex;
        for (let poolIndex = 0; poolIndex < this.itemPool.length; poolIndex++) {
            const dataIndex = firstIndex + poolIndex;
            const item = this.itemPool[poolIndex];
            const hasData = dataIndex < this.historyData.length;
            item.active = hasData;
            if (!hasData) continue;

            item.setPosition(0, -dataIndex * this.itemHeight - this.itemHeight / 2);
            this.setData(dataIndex, this.historyData[dataIndex], item);
        }
    }

    // 设置数据，顺序：下注金额、赢奖金额、时间、订单号。
    private setData(index: number, data: any, item: cc.Node): void {
        this.setLabel(item, "No", (index + 1).toString());
        this.setLabel(item, "bet", this.formatAmount(data && (data.bet ?? data.betAmount ?? data.BetAmount)));
        this.setLabel(item, "raward", this.formatAmount(data && (data.win ?? data.winAmount ?? data.reward ?? data.raward ?? data.WinAmount)));
        this.setLabel(item, "time", this.formatDate(data && (data.date ?? data.time ?? data.createTime ?? data.Date)));
        this.setLabel(item, "sn", String(data && (data.orderNo ?? data.orderId ?? data.sn ?? data.round ?? data.id) || "-"));
    }

    private setLabel(item: cc.Node, nodeName: string, value: string): void {
        const node = item.getChildByName(nodeName);
        const label = node && node.getComponent(cc.Label);
        if (label) label.string = value;
    }

    private formatAmount(value: any): string {
        const amount = Number(value);
        return Number.isFinite(amount) ? simplifyNumber(amount) : "0";
    }

    private formatDate(value: any): string {
        if (value == null || value === "") return "-";
        if (typeof value === "string" && isNaN(Number(value))) {
            // 服务端已格式化的日期字符串同样拆成两行；无法识别时保留原样。
            const matched = value.trim().match(/^(\d{4}-\d{1,2}-\d{1,2})[ T]+(\d{1,2}:\d{2}(?::\d{2})?)$/);
            if (matched) return matched[1] + "\n" + matched[2];
            const parsedDate = new Date(value);
            return isNaN(parsedDate.getTime()) ? value : this.formatDateObject(parsedDate);
        }

        let timestamp = Number(value);
        if (!Number.isFinite(timestamp)) return String(value);
        if (timestamp > 0 && timestamp < 100000000000) timestamp *= 1000;
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return String(value);
        return this.formatDateObject(date);
    }

    private formatDateObject(date: Date): string {
        const pad = (num: number) => num < 10 ? "0" + num : String(num);
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
            + "\n" + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
    }

    // 更新汇总数据。 统计当日当月赢奖金额。
    private updateSummary(): void {
        const serverSummary = gGameData.historySummary;
        if (this.todayWinAmountLabel) this.todayWinAmountLabel.string = simplifyNumber(Number(serverSummary.todayWin));
        if (this.monthWinAmountLabel) this.monthWinAmountLabel.string = simplifyNumber(Number(serverSummary.monthWin));
    }

    private toDate(value: any): Date | null {
        if (value == null || value === "") return null;
        let timestamp = Number(value);
        if (Number.isFinite(timestamp)) {
            if (timestamp > 0 && timestamp < 100000000000) timestamp *= 1000;
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? null : date;
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    
}
