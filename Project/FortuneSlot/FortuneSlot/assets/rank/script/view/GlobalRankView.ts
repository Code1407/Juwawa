import { myUID } from "../RankRouter";
import { IRankListByDateStrMsg, IRankUserInfo, gNewRank } from "../interface/IBranch_Rank";
import GlobalRankUI, { DateNow, dayTicks, timezoneFromServer, timestampFromServer } from "../ui/GlobalRankUI";
import { CoolDown } from "../utl/CCAsync_Rank";
import CheckMark from "../utl/CheckMark_Rank";
import { NodePool } from "../utl/PrefabPool_Rank";
import GlobalRankViewItem from "./GlobalRankViewItem";

const { ccclass, property } = cc._decorator;

const MAX_AVATAR_LOADS = 6;
const VIRTUAL_LIST_BUFFER = 160;
const SCROLLING_EVENT = "scrolling";
const SCROLL_ENDED_EVENT = "scroll-ended";

function StringPadStart(length: number, char: string, input: string) {
    let output = '';
    let offset = length - input.length;
    for (let i = 0; i < offset; i += char.length)
        output += char;
    output += input;
    return output;
}

/** UTC calendar day as YYYY-MM-DD (e.g. 2026-05-12)，与上行 `rankQuery` 一致。 */
function formatUtcYmd(timeMs: number): string {
    let d = new Date(timeMs);
    let y = d.getUTCFullYear().toString();
    let m = StringPadStart(2, '0', (d.getUTCMonth() + 1).toString());
    let day = StringPadStart(2, '0', d.getUTCDate().toString());
    return `${y}-${m}-${day}`;
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0~11 → 1~12
    const day = date.getDate();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${year}-${pad(month)}-${pad(day)}`;
}

@ccclass
export default class GlobalRankView extends cc.Component {
    @property(cc.Node)
    holder: cc.Node = null;
    @property(GlobalRankViewItem)
    topItemPrefab: GlobalRankViewItem = null;
    @property(GlobalRankViewItem)
    selfItem: GlobalRankViewItem = null;
    @property(GlobalRankViewItem)
    itemPrefab: GlobalRankViewItem = null;
    @property(cc.Label)
    txLoading: cc.Label = null;
    /**0未来式 1选中 2过去式 3高亮*/
    @property(CheckMark)
    btnWeekDay: CheckMark[] = [];
    @property(cc.SpriteFrame)
    spTopItemBg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spTopRank: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spTopAwardBg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spTopAwardImgLine: cc.SpriteFrame[] = [];

    dateStr = [``]

    rankInfos: { [str: string]: IRankUserInfo[] } = {};

    /** 是否已发过至少一批全服榜上行（用于 onEnable 与首屏 loading 逻辑）。 */
    listReqIssued = false;

    weekDaySelect = -1;

    uidToHead: { [uid: string]: cc.SpriteFrame } = {};

    cdUpdateHead: CoolDown

    lastOpenTime: number;

    cdForRequest: number = 1 * 1000;

    private activeItems: GlobalRankViewItem[] = [];
    private loadGeneration = 0;
    private buildToken = 0;
    private listLayout: cc.Layout = null;
    private scrollView: cc.ScrollView = null;
    private contentNode: cc.Node = null;
    private viewNode: cc.Node = null;
    private contentMinHeight = 0;
    private itemOffsets: number[] = [];
    private itemHeights: number[] = [];
    private currentRankInfo: IRankUserInfo[] = [];
    private currentIsLast = false;
    private currentUpdateHead = false;
    private currentGen = 0;
    private avatarLoadsInFlight = 0;
    private avatarLoadQueue: (() => void)[] = [];

    initGlobalRankView() {
        this.cdUpdateHead = new CoolDown(3, this.node);
        this.contentNode = this.itemPrefab.node.parent;
        this.listLayout = this.contentNode.getComponent(cc.Layout);
        if (this.listLayout)
            this.listLayout.enabled = false;
        this.viewNode = this.contentNode.parent;
        this.scrollView = this.viewNode && this.viewNode.parent ? this.viewNode.parent.getComponent(cc.ScrollView) : null;
        this.contentMinHeight = this.getViewHeight();
        if (this.scrollView) {
            this.scrollView.node.on(SCROLLING_EVENT, this.onListScroll, this);
            this.scrollView.node.on(SCROLL_ENDED_EVENT, this.onListScroll, this);
        }
        this.topItemPrefab.node.active = false;
        this.selfItem.node.active = false;
        this.itemPrefab.node.active = false;
        for (let i = 0; i < this.btnWeekDay.length; i++) {
            let index = i;
            this.btnWeekDay[i].node.on(cc.Node.EventType.TOUCH_END, () => {
                if (index <= this.GetThisDay() || index == 6) {
                    for (let j = 0; j < this.btnWeekDay.length; j++) {
                        if (j == index) {
                            this.btnWeekDay[j].SetStaus(1);
                        }
                        else if (j == this.GetThisDay()) {
                            this.btnWeekDay[j].SetStaus(3);
                        }
                        else if (j < this.GetThisDay()) {
                            this.btnWeekDay[j].SetStaus(2);
                        }
                        else if (j > this.GetThisDay()) {
                            this.btnWeekDay[j].SetStaus(0);
                        }
                    }
                    let reload = false;
                    if (this.weekDaySelect != index)
                        reload = true;
                    this.weekDaySelect = index;
                    if (reload) {
                        this.TryLoad();
                    }
                }
            });
        }
        this.UpdateWeekDay();
        let dayCheck = this.GetThisDay();
        setInterval(() => {
            if (dayCheck != this.GetThisDay()) {
                dayCheck = this.GetThisDay();
                this.UpdateWeekDay();
            }
        }, 1000)
        this.lastOpenTime = Date.now();
        this.bindRankListByDateStrAndInit();
        (<any>window).rankInfos = this.rankInfos;
        cc.tween(this.txLoading.node).repeatForever(
            cc.tween(this.txLoading.node)
                .to(0.5, { opacity: 128 })
                .to(0.5, { opacity: 255 })
        ).start();
    }

    bindRankListByDateStrAndInit() {
        if (!GlobalRankUI.Instance) {
            this.scheduleOnce(() => this.bindRankListByDateStrAndInit(), 0.05);
            return;
        }
        this.InitData();
    }

    /** `CsGetRankListByDateStrResp` 经 RankRouter → `GlobalRankUI.rankView` 转发入口。 */
    onRankListByDateStrMsg(msg: IRankListByDateStrMsg) {
        if (!this.node || !this.node.isValid) return;
        let key = msg.dateStr;
        let raw = msg.rankUsers != null ? msg.rankUsers : (msg as any).list;
        let list: IRankUserInfo[] = Array.isArray(raw) ? raw : [];
        this.csGetRankListByDateStrResp(key, list);
    }

    InitData() {
        GlobalRankUI.Instance.initUserRank();
        if (!gNewRank) return;
        let award = GlobalRankUI.Instance.rankAward;
        if (!award) {
            this.scheduleOnce(() => this.InitData(), 0.05);
            return;
        }
        this.listReqIssued = true;
        for (let i = 0; i < this.dateStr.length; i++) {
            let rankQuery = this.dateStr[i];
            award.csGetRankListByDateStrReq(rankQuery);
        }
    }

    /** 下行数据落地（由 `CsGetRankListByDateStrResp` → RankRouter → `GlobalRankUI.rankView` 触发）。 */
    csGetRankListByDateStrResp(routeKey: string, data: IRankUserInfo[]) {
        this.rankInfos[routeKey] = data != null ? data : [];
        if (this.rankInfos[this.dateStr[this.weekDaySelect]] != null) {
            this.holder.opacity = 255;
            this.txLoading.node.active = false;
            this.TryLoad();
        }
    }

    GetThisDay() {
        // let targetDate = new Date(DateNow());
        // let year = targetDate.getUTCFullYear();
        // let month = targetDate.getUTCMonth() + 1;
        // let day = targetDate.getUTCDate();
        // if ((<any>window).config?.appName == "binmo")
        //     console.log(`GetThisDay`, `${year}/${month}/${day}`, new Date(`${year}/${month}/${day}`).getDay(), `timezone`, timezoneFromServer);
        // return new Date(`${year}/${month}/${day}`).getDay();

        const deviceTimezoneOffset = -new Date().getTimezoneOffset() * 60 * 1000;
        let date = new Date(timestampFromServer - deviceTimezoneOffset);
        return date.getDay();
    }

    get_server_date_by_timestamp(timestamp: number){
        const deviceTimezoneOffset = -new Date().getTimezoneOffset() * 60 * 1000;
        let date = new Date(timestamp - deviceTimezoneOffset);
        return date;
    }

    UpdateWeekDay() {
        const thisDay = this.GetThisDay();
        this.weekDaySelect = thisDay;
        for (let i = 0; i < this.btnWeekDay.length; i++) {
            const clickable = i <= thisDay || i == 6;
            this.btnWeekDay[i].getComponent(cc.Button).enabled = clickable;
            if (i == thisDay) {
                this.btnWeekDay[i].SetStaus(3);
            }
            else if (i < thisDay) {
                this.btnWeekDay[i].SetStaus(2);
            }
            else if (i > thisDay) {
                this.btnWeekDay[i].SetStaus(0);
            }
        }
        this.dateStr = [];
        let nowTime = DateNow();
        for (let i = 0; i < 7; i++) {
            //let targetDate = new Date(nowTime + (i - thisDay) * dayTicks);
            if (i == 6) {
                this.dateStr.push(`thisWeek`);
            }
            else if (i == thisDay) {
                this.dateStr.push(`today`);
            }
            else {
                let targetDate = this.get_server_date_by_timestamp(nowTime + (i - thisDay) * dayTicks);
                this.dateStr.push(formatDate(targetDate));
            }
        }
    }

    protected onDestroy(): void {
        this.Clear();
        if (this.scrollView && this.scrollView.node && this.scrollView.node.isValid) {
            this.scrollView.node.off(SCROLLING_EVENT, this.onListScroll, this);
            this.scrollView.node.off(SCROLL_ENDED_EVENT, this.onListScroll, this);
        }
        if (GlobalRankUI.Instance && GlobalRankUI.Instance.rankView === this)
            GlobalRankUI.Instance.rankView = null;
    }

    protected onEnable(): void {
        if (this.listReqIssued) {
            let thisOpenTime = Date.now();
            if (thisOpenTime - this.lastOpenTime > this.cdForRequest) {
                this.lastOpenTime = thisOpenTime;
                this.InitData();
                console.log("reload");
            }
            else {
                console.log(`cooling ${thisOpenTime} - ${this.lastOpenTime} = ${thisOpenTime - this.lastOpenTime}`);
            }
            this.holder.opacity = 255;
            this.txLoading.node.active = false;
        }
        else {
            this.holder.opacity = 64;
            this.txLoading.node.active = true;
            setTimeout(() => {
                this.txLoading.node.active = false;//此处强处理，在某些平台的某些用户手机上出现了匪夷所思的现象
            }, 5000);
        }
        this.UpdateWeekDay();
        this.TryLoad();
    }

    TryLoad() {
        let rankInfo = this.rankInfos[this.dateStr[this.weekDaySelect]];
        if (rankInfo == null) return;

        let jsNet = (<any>window).jsnet;
        const cfg = jsNet && jsNet.getCommonConfig();
        let showRankNum = cfg && cfg.custom && cfg.custom["Showrankplayer"] || 0;
        rankInfo = showRankNum > 0 ? rankInfo.slice(0, showRankNum) : rankInfo;

        const thisDay = this.GetThisDay();
        this.currentUpdateHead = this.cdUpdateHead == null || !this.cdUpdateHead.IsCoolDown();
        this.currentIsLast = this.weekDaySelect < thisDay;
        this.currentGen = ++this.loadGeneration;
        this.buildToken++;
        this.avatarLoadQueue = [];
        this.currentRankInfo = rankInfo;
        this.rebuildVirtualMetrics(rankInfo);
        this.updateVisibleItems(true);
    }

    protected onDisable(): void {
        this.Clear();
    }

    Clear() {
        this.loadGeneration++;
        this.buildToken++;
        this.avatarLoadQueue = [];
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            if (item && item.node.isValid)
                this.recycleItem(item);
        }
        this.activeItems = [];
    }

    /** 排名从 1 起；数组不足时取最后一档样式（前三名资源等）。 */
    private getSpriteByRank(frames: cc.SpriteFrame[], rank: number): cc.SpriteFrame {
        if (!frames || frames.length === 0) return null;
        const idx = Math.min(Math.max(rank, 1), frames.length) - 1;
        return frames[idx];
    }

    private formatRankLabel(rank: number): string {
        return rank < 100 ? rank.toString() : "99+";
    }

    private formatUserName(name: string): string {
        const chars = Array.from(name || "");
        return chars.length > 9 ? chars.slice(0, 9).join("") + "..." : name;
    }

    private getPrefabNode(rankInfo: IRankUserInfo): cc.Node {
        if (rankInfo.rank < 4)
            return this.topItemPrefab.node;
        if (rankInfo.uid == myUID())
            return this.selfItem.node;
        return this.itemPrefab.node;
    }

    private recycleItem(item: GlobalRankViewItem) {
        (<any>item).__rankUid = null;
        item.onRecycle();
        NodePool.Recycle(item.node);
    }

    private onListScroll() {
        this.updateVisibleItems(false);
    }

    private getViewHeight(): number {
        if (this.viewNode)
            return this.viewNode.height;
        if (this.scrollView)
            return this.scrollView.node.height;
        return 0;
    }

    private getViewTopY(): number {
        if (!this.viewNode) return 0;
        return this.viewNode.height * (1 - this.viewNode.anchorY);
    }

    private getScrollTop(): number {
        if (!this.contentNode) return 0;
        return Math.max(0, this.contentNode.y - this.getViewTopY());
    }

    private getItemHeight(rankInfo: IRankUserInfo): number {
        const prefab = this.getPrefabNode(rankInfo);
        return Math.max(1, prefab.height);
    }

    private rebuildVirtualMetrics(rankInfo: IRankUserInfo[]) {
        this.itemOffsets = [];
        this.itemHeights = [];

        let totalHeight = 0;
        for (let i = 0; i < rankInfo.length; i++) {
            const height = this.getItemHeight(rankInfo[i]);
            this.itemOffsets[i] = totalHeight;
            this.itemHeights[i] = height;
            totalHeight += height;
        }

        if (this.contentNode) {
            this.contentNode.height = Math.max(this.contentMinHeight, totalHeight);
            this.clampContentPosition();
        }
    }

    private clampContentPosition() {
        if (!this.contentNode || !this.viewNode) return;
        const viewHeight = this.getViewHeight();
        const minY = this.getViewTopY();
        const maxY = minY + Math.max(0, this.contentNode.height - viewHeight);
        if (this.contentNode.y < minY)
            this.contentNode.y = minY;
        else if (this.contentNode.y > maxY)
            this.contentNode.y = maxY;
    }

    private findFirstVisibleIndex(y: number): number {
        let low = 0;
        let high = this.currentRankInfo.length - 1;
        let result = this.currentRankInfo.length;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (this.itemOffsets[mid] + this.itemHeights[mid] >= y) {
                result = mid;
                high = mid - 1;
            }
            else {
                low = mid + 1;
            }
        }
        return result;
    }

    private findLastVisibleIndex(y: number): number {
        let low = 0;
        let high = this.currentRankInfo.length - 1;
        let result = -1;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (this.itemOffsets[mid] <= y) {
                result = mid;
                low = mid + 1;
            }
            else {
                high = mid - 1;
            }
        }
        return result;
    }

    private updateVisibleItems(forceBind: boolean) {
        if (!this.node || !this.node.isValid || !this.currentRankInfo) return;

        const listLen = this.currentRankInfo.length;
        if (listLen === 0) {
            this.recycleAllVisibleItems();
            return;
        }

        const scrollTop = this.getScrollTop();
        const viewHeight = this.getViewHeight();
        const visibleTop = Math.max(0, scrollTop - VIRTUAL_LIST_BUFFER);
        const visibleBottom = scrollTop + viewHeight + VIRTUAL_LIST_BUFFER;
        const from = this.findFirstVisibleIndex(visibleTop);
        const to = this.findLastVisibleIndex(visibleBottom);

        if (from > to) {
            this.recycleAllVisibleItems();
            return;
        }

        for (let i = 0; i < this.activeItems.length; i++) {
            const item = this.activeItems[i];
            if (item && item.node.isValid && (i < from || i > to)) {
                this.recycleItem(item);
                this.activeItems[i] = null;
            }
        }

        for (let i = from; i <= to; i++) {
            const rankInfo = this.currentRankInfo[i];
            const prefab = this.getPrefabNode(rankInfo);
            let item = this.activeItems[i];
            const curPrefab = item && item.node.isValid ? NodePool.InstanceToPrefab.get(item.node) : null;
            let needBind = forceBind;

            if (!item || !item.node.isValid || curPrefab !== prefab) {
                if (item && item.node.isValid)
                    this.recycleItem(item);
                item = NodePool.Spawn(prefab).getComponent(GlobalRankViewItem);
                this.activeItems[i] = item;
                needBind = true;
            }

            const height = this.itemHeights[i];
            item.node.y = -this.itemOffsets[i] - height * (1 - item.node.anchorY);
            if (needBind)
                this.bindItem(item, rankInfo, this.currentIsLast, this.currentUpdateHead, this.currentGen);
        }
    }

    private recycleAllVisibleItems() {
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            if (item && item.node.isValid)
                this.recycleItem(item);
        }
        this.activeItems = [];
    }

    private enqueueAvatarLoad(task: () => void) {
        if (this.avatarLoadsInFlight < MAX_AVATAR_LOADS) {
            this.avatarLoadsInFlight++;
            task();
        } else {
            this.avatarLoadQueue.push(task);
        }
    }

    private finishAvatarLoad() {
        this.avatarLoadsInFlight = Math.max(0, this.avatarLoadsInFlight - 1);
        while (this.avatarLoadQueue.length > 0 && this.avatarLoadsInFlight < MAX_AVATAR_LOADS) {
            this.avatarLoadsInFlight++;
            const next = this.avatarLoadQueue.shift();
            next();
        }
    }

    private bindItem(item: GlobalRankViewItem, rankInfo: IRankUserInfo, isLast: boolean, updateHead: boolean, gen: number) {
        const isMe = rankInfo.uid == myUID();
        (<any>item).__rankUid = rankInfo.uid;
        item.setMyselfHighlight(isMe);

        if (rankInfo.get != null)
            item.isGet.active = rankInfo.get;
        else
            item.isGet.active = isLast && rankInfo.rank < 11;

        item.node.active = true;

        if (item.spRank != null) {
            const sp = this.getSpriteByRank(this.spTopRank, rankInfo.rank);
            if (sp) item.spRank.spriteFrame = sp;
        }
        if (item.txRank != null)
            item.txRank.string = this.formatRankLabel(rankInfo.rank);

        this.bindAvatar(item, rankInfo, updateHead, gen);

        item.txName.string = this.formatUserName(rankInfo.name);
        item.txPoint.string = Math.floor(rankInfo.score).toString();

        if (item.txAward != null)
            item.txAward.string = Math.floor(rankInfo.bonus).toString();

        if (item.bg != null) {
            const sp = this.getSpriteByRank(this.spTopItemBg, rankInfo.rank);
            if (sp) item.bg.spriteFrame = sp;
        }
        if (item.awardBg != null) {
            const sp = this.getSpriteByRank(this.spTopAwardBg, rankInfo.rank);
            if (sp) item.awardBg.spriteFrame = sp;
        }
        if (item.awardImgLine != null) {
            const sp = this.getSpriteByRank(this.spTopAwardImgLine, rankInfo.rank);
            if (sp) item.awardImgLine.spriteFrame = sp;
        }
    }

    private bindAvatar(item: GlobalRankViewItem, rankInfo: IRankUserInfo, updateHead: boolean, gen: number) {
        if (!item.avatar) return;

        let avatarUrl = rankInfo.avatar ?? rankInfo.avator;
        if (!avatarUrl) {
            item.resetAvatar();
            return;
        }

        const cached = this.uidToHead[rankInfo.uid];
        if (cached != null) {
            item.avatar.spriteFrame = cached;
            if (!updateHead)
                return;
        }
        else {
            item.resetAvatar();
        }

        avatarUrl = decodeURI(avatarUrl);
        if (updateHead)
            avatarUrl += `${avatarUrl.includes('?') ? '&' : '?'}timestamp=${Date.now()}`;

        this.enqueueAvatarLoad(() => {
            cc.assetManager.loadRemote<cc.Texture2D>(avatarUrl, { ext: '.png' }, (err, texture) => {
                this.finishAvatarLoad();
                if (gen !== this.loadGeneration || !item.node.isValid || (<any>item).__rankUid !== rankInfo.uid) return;
                if (err || texture == null) {
                    if (cached == null)
                        item.resetAvatar();
                    return;
                }
                const frame = new cc.SpriteFrame(texture);
                this.uidToHead[rankInfo.uid] = frame;
                item.avatar.spriteFrame = frame;
            });
        });
    }
}
