import { _decorator, Node, Button, find, SpriteFrame, Toggle, Component, Layout, isValid, UITransform } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import List from 'db://assets/script/framework/list/List';
import { UIFootballLeagueMyBetsHistroyItem } from './UIFootballLeagueMyBetsHistroyItem';
import { UIID } from '../../common/GameUIConfig';
import { ConstantCfgMgr, ConstantKey } from '../../common/ConstantCfgMgr';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueMyBetsHistroy')
export class UIFootballLeagueMyBetsHistroy extends GameComponent {

    @property(List)
    list: List = null;

    @property([Toggle])
    public toggles: Toggle[] = [];

    listData: HistoryData[] = [];

    private icon_coins: SpriteFrame = null;
    private allHistoryData: HistoryData[] = [];
    private curToggleIndex: number = 0;
    private _isInternalChange: boolean = false;
    onAdded(args: any) {
        if (args && args.coinIcon) {
            this.icon_coins = args.coinIcon;
        }
        if (args && args.betData) {
            this.allHistoryData = this.normalizeHistoryList(args.betData.list);
        }
        return true;
    }

    onLoad(): void {

    }
    start() {
        var backBtn = find("Root/btn_Close", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_START, this.btn_close)

        this.initToggles();
        this.curToggleIndex = this.getSelectedToggleIndex();
        this.selectToggle(this.curToggleIndex);

        this.refreshByToggleIndex(this.curToggleIndex);
    }

    onListRender(item: any, idx: number) {
        let data = this.listData[idx];
        let itemUt: UIFootballLeagueMyBetsHistroyItem = item.getComponent(UIFootballLeagueMyBetsHistroyItem);
        itemUt.init(data, this.icon_coins);
    }

    private btn_close() {
        oops.gui.remove(UIID.FootballLeagueUI_MyBetsHistory);
    }


    /**
     * 初始化所有 Toggle 的监听事件
     */
    initToggles() {
        this.ensureToggles();
        for (let i = 0; i < this.toggles.length; i++) {
            const toggle = this.toggles[i];
            if (!toggle) {
                continue;
            }

            toggle.checkEvents = [];
            let componentEventHandler = new Component.EventHandler();
            componentEventHandler.target = this.node;
            componentEventHandler.component = 'UIFootballLeagueMyBetsHistroy';
            componentEventHandler.handler = 'onToggleCheckChanged';
            componentEventHandler.customEventData = i.toString();
            toggle.checkEvents.push(componentEventHandler);
        }
    }

    private ensureToggles() {
        if (this.toggles && this.toggles.length > 0) {
            return;
        }

        const toggleGroup = find("Root/ToggleGroup", this.node);
        if (!toggleGroup) {
            this.toggles = [];
            return;
        }

        this.toggles = [];
        for (let i = 0; i < toggleGroup.children.length; i++) {
            const toggle = toggleGroup.children[i].getComponent(Toggle);
            if (toggle) {
                this.toggles.push(toggle);
            }
        }
    }

    /**
     * 处理 Toggle 点击事件
     * @param toggleInstance 触发该事件的 Toggle 组件实例
     * @param eventData Toggle 的索引
     */
    onToggleCheckChanged(toggleInstance: Toggle, eventData: string) {
        if (this._isInternalChange || !toggleInstance.isChecked) {
            return;
        }

        let index = Number(eventData);
        if (isNaN(index)) {
            index = 0;
        }
        this.curToggleIndex = index;
        this.refreshByToggleIndex(index);
    }

    private refreshByToggleIndex(index: number) {
        const teamId = index + 1;
        const showCount = ConstantCfgMgr.getNumber(ConstantKey.ShowRankCount) || 20;
        const sceneHistory = this.allHistoryData.filter((data: HistoryData) => Number(data.team_id) === teamId);
        this.refreshList(sceneHistory.slice(0, showCount));
    }

    private refreshList(data: HistoryData[]) {
        // 场景切换时不复用外层历史记录项。先将旧项从 content 脱离并销毁，
        // 再创建当前场次的完整新列表，避免首项保留上一场次的尺寸、位置或子节点状态。
        this.unschedule(this.resetScrollPosition);
        this.listData = [];
        this.list.numItems = 0;

        this.listData = data ? data.slice() : [];
        this.list.numItems = this.listData.length;

        // 非虚拟 List 会在设置 numItems 时重新启用 content 的 Layout。历史记录
        // 的高度由动态下注项决定，改为由下面的手动布局处理，避免 Layout 在节点
        // 销毁过程中参与 sibling 排序。
        const content = this.list && this.list.content;
        const layout = content && content.getComponent(Layout);
        if (layout) {
            layout.enabled = false;
        }

        this.layoutHistoryItems();
        // ScrollView 会在本帧根据 content 新高度重算边界；若现在复位，位置会
        // 被该重算覆盖，导致首条仍然留出一段裁切空白。等到下一帧边界稳定后再复位。
        this.unschedule(this.resetScrollPosition);
        this.scheduleOnce(this.resetScrollPosition, 0);
    }

    private resetScrollPosition() {
        const scrollView = this.list && this.list.scrollView;
        if (!scrollView) {
            return;
        }
        scrollView.stopAutoScroll();
        scrollView.scrollToTop(0);
    }

    private layoutHistoryItems() {
        const content = this.list && this.list.content;
        if (!content || !isValid(content)) {
            return;
        }

        const padding = 5;
        let y = -padding;
        const children = content.children;
        for (let i = 0; i < children.length; i++) {
            const item = children[i];
            const itemUi = item.getComponent(UITransform);
            const itemView = item.getComponent(UIFootballLeagueMyBetsHistroyItem);
            const height = itemView ? itemView.getItemHeight() : itemUi.height;
            item.setPosition(item.position.x, y, item.position.z);
            y -= height + padding;
        }

        const contentUi = content.getComponent(UITransform);
        if (contentUi) {
            contentUi.height = Math.max(-y, padding * 2);
        }
    }

    private normalizeHistoryList(list: any): HistoryData[] {
        if (!list) {
            return [];
        }

        if (Array.isArray(list)) {
            return this.normalizeArrayHistoryList(list);
        }

        return this.normalizeObjectHistoryList(list);
    }

    private normalizeArrayHistoryList(list: any[]): HistoryData[] {
        const result: HistoryData[] = [];
        for (let i = 0; i < list.length; i++) {
            const value = list[i];
            if (Array.isArray(value)) {
                this.pushHistoryList(result, value, i + 1);
            } else if (value && typeof value === "object") {
                this.pushHistoryData(result, value as HistoryData, 0);
            }
        }
        return result;
    }

    private normalizeObjectHistoryList(list: any): HistoryData[] {
        const result: HistoryData[] = [];
        Object.entries(list).forEach(([key, value]: [string, any]) => {
            const teamId = Number(key) || 0;
            if (Array.isArray(value)) {
                this.pushHistoryList(result, value, teamId);
            } else if (value && typeof value === "object") {
                this.pushHistoryData(result, value as HistoryData, teamId);
            }
        });
        return result;
    }

    private pushHistoryList(result: HistoryData[], list: HistoryData[], teamId: number) {
        for (let i = 0; i < list.length; i++) {
            this.pushHistoryData(result, list[i], teamId);
        }
    }

    private pushHistoryData(result: HistoryData[], data: HistoryData, teamId: number) {
        if (!data) {
            return;
        }
        data.team_id = data.team_id || teamId;
        result.push(data);
    }

    private getSelectedToggleIndex(): number {
        if (!this.toggles || this.toggles.length <= 0) {
            return 0;
        }

        for (let i = 0; i < this.toggles.length; i++) {
            if (this.toggles[i] && this.toggles[i].isChecked) {
                return i;
            }
        }
        return 0;
    }

    private clampToggleIndex(index: number): number {
        if (!this.toggles || this.toggles.length <= 0 || isNaN(index)) {
            return 0;
        }
        return Math.max(0, Math.min(this.toggles.length - 1, index));
    }

    private selectToggle(index: number) {
        if (!this.toggles || !this.toggles[index]) {
            return;
        }
        this._isInternalChange = true;
        this.toggles[index].isChecked = true;
        this._isInternalChange = false;
    }
}
