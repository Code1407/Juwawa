// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ImageCache from "./image/ImageCache";
import { getRandomNumInt, rateRandomResult } from "./interface/IMageJackpot";

const {ccclass, property} = cc._decorator;
export const SLOT_RUN_STEP_SECONDS = 0.05;

@ccclass
export default class Slot extends cc.Component {

    @property(cc.Prefab)
    slotItemPrefab: cc.Prefab = null;

    groupCount = 0;
    private results: number[] = [];
    private remainRunCount = 0;
    private runCount = 0;
    private toSetRemain = 0;
    private stoppedCallback: (() => void) | null = null;
    private canStopCallback: (() => boolean) | null = null;
    private hasNotifiedStopped = false;
    /** 本列初始化时的节点数；新局必须恢复到这个长度。 */
    private baseGroupCount = 0;
    /** 每条滚轴只允许存在一条递归 tween 链，防止重复 run 造成等效加速。 */
    private isRunning = false;
    private runVersion = 0;
    /** 本局该列的随机权重；续转临时节点也必须使用同一套权重。 */
    private probability: number[] = [];
    /** 急速模式缩短最终停轮回弹；滚动步数由外部 Slots 控制。 */
    private quickStop = false;

    reset(probability: number[]) {
        // 新局或重复触发 run 前，作废旧回调并停止本拉条遗留的 tween。
        this.runVersion++;
        this.isRunning = false;
        cc.Tween.stopAllByTarget(this.node);
        this.resetPos();

        this.toSetRemain = 0;
        this.runCount = 0;
        this.hasNotifiedStopped = false;
        this.restoreBaseBuffer();
        this.remainRunCount = this.groupCount - 3;
        // 不带上局最终盘面进入新局；服务端结果到达后会通过 setResults 写入。
        this.results = [];
        this.probability = probability;
        for (let i = 0; i < this.groupCount; i++) {
            let childNode = this.node.children[i];
            let result = rateRandomResult(probability);
           // this.assignGoods(childNode, result);

            // 模糊化
            this.blurGoods(childNode, result);

        }
    }

    setResults(results: number[]) {
        this.results = results;
        // 恢复
       // this.restoreGoods();
        // 这里的顶部三个格只用于滚动过程的预填充，并不是最终停稳后的
        // 可见结果。不能给它们标记结果行：急速模式的实际停轮位置不在
        // 索引 0，getResultChild 会优先取到这些旧标记，导致中奖特效被
        // 放到屏幕外。
        this.fixedValue(results, 0, false);
    }

    setRemainRunCount(remain: number) {
        this.toSetRemain = remain;
    }

    /**
     * 延长当前待停列。返回 false 表示该列已无法安全延长，调用方不应播放 suspense。
     */
    addRunSeconds(seconds: number): boolean {
        if (seconds <= 0 || this.remainRunCount <= 0) return false;

        const extraRunCount = Math.ceil(seconds / SLOT_RUN_STEP_SECONDS);
        // 只给这一条已确认需要 suspense 的滚轴追加缓冲。额外节点数与
        // extraRunCount 相等，因此原有最终三格的计算位置保持不变：
        // (groupCount + extra) - (runCount + extra) = 原 groupCount - 原 runCount。
        this.appendRunBuffer(extraRunCount);
        this.remainRunCount += extraRunCount;
        return true;
    }

    setStoppedCallback(callback: (() => void) | null) {
        this.stoppedCallback = callback;
    }

    setCanStopCallback(callback: (() => boolean) | null) {
        this.canStopCallback = callback;
    }

    setQuickStop(enabled: boolean) {
        this.quickStop = enabled;
    }

    toSetRemainRunCount() {
        if (this.remainRunCount > this.toSetRemain) {
            this.remainRunCount = this.toSetRemain;
        }
    }
    
    getRemainRunCount() {
        return this.remainRunCount;
    }

    /** 外部只从这里启动；已在转动的拉条不能再次启动第二条递归链。 */
    run() {
        if (this.isRunning || this.remainRunCount <= 0) return;
        this.isRunning = true;
        this.runStep(this.runVersion);
    }

    private runStep(version: number) {
        if (!this.isRunning || version !== this.runVersion) return;
        if (this.toSetRemain > 0) {
            this.toSetRemainRunCount();
            this.toSetRemain = 0;
        }
        const distance = 140;   // 随大小改变
        if (this.remainRunCount > 0) {
            // 未轮到本列停轮时继续按原速滚动，不允许提前进入停轮动画。
            if (this.remainRunCount === 1 && this.canStopCallback && !this.canStopCallback()) {
                this.runWaitingStep(distance, version);
                return;
            }

            this.runCount++;
            this.remainRunCount--;
            let toPos = this.node.position.clone();
            let targetY = -distance * this.runCount;
            toPos.y = targetY;
            if (this.remainRunCount == 0) {
                // 最终结果只在真正进入停轮动画的这一刻写入。续转/等待阶段
                // 不再反复把同一组三个服务端 Item 预写进可见滚轴。
                this.clearResultRowMarkers();
                this.fixedValue(this.results, this.groupCount - this.runCount - 3, true);
                let toPosLow = toPos.clone();
                toPosLow.y -= 50;
                const settleTween = cc.tween(this.node);
                if (this.quickStop) {
                    // 急速仍保留极短的落点反馈，但不让回弹主导整盘停轮时间。
                    settleTween
                    .to(0.06, {position: toPos})
                    .to(0.04, {position: toPosLow})
                    .to(0.04, {position: toPos});
                } else {
                    settleTween
                    .to(0.15, {position: toPos})
                    .to(0.1, {position: toPosLow})
                    .to(0.1, {position: toPos});
                }
                settleTween
                .call(() => {
                    if (version !== this.runVersion) return;
                    this.isRunning = false;
                    this.notifyStopped();
                })
                .start();
            } else {
                /* 逐渐减速
                let speed = 0.05;
                if (this.remainRunCount == 2) speed = 0.08;
                if (this.remainRunCount == 1) speed = 0.1;
                */
                const __this = this;
                cc.tween(this.node).to(SLOT_RUN_STEP_SECONDS, {position: toPos}).call(()=>{
                    __this.runStep(version);
                }).start();
            }
        } else {
            this.isRunning = false;
        }
    }

    getResultChild(index: number): cc.Node {
        // 最终盘面的三个结果由 fixedValue 写入节点时标记了 0~2 的行号。
        // 不要用 runCount 反推节点下标：不同停轮速度下该偏移不稳定，会把
        // 正确的动画挂到错误的可见格子上。
        let childNode: cc.Node = null;
        for (const child of this.node.children) {
            if ((<any>child).__mageJackpotResultRow === index) {
                childNode = child;
                break;
            }
        }
        if (!childNode) {
            console.warn("Slot result item not found", this.node.name, index);
            return null;
        }
        return childNode;
    }

    /**
     * 返回指定可见格子实际渲染的图标 ID。
     *
     * 不能再根据结果数组的行号反推：转轴停靠时 childIndex 会随 runCount
     * 改变，反推得到的 ID 可能属于另一个格子，导致动画类型与画面不一致。
     */
    getDisplayedGoodsIndex(slotItem: cc.Node): number | undefined {
        const goodsIndex = (<any>slotItem).__mageJackpotGoodsIndex;
        return typeof goodsIndex === "number" ? goodsIndex : undefined;
    }

    assignGoods(node: cc.Node, goodsIndex: number) {
        /*
        node.removeAllChildren(true);
        let goods = cc.instantiate(ImageCache.Instance.goods[goodsIndex].node);
        goods.scale = 0.8;
        node.addChild(goods);
        */
       let goods = ImageCache.Instance.goods[goodsIndex];
       let child = node.getChildByName("goods");
       child.getComponent(cc.Sprite).spriteFrame = goods.spriteFrame;
       child.getComponent(cc.Sprite).trim = false;
       child.width = child.height = 120;
       // 将 ID 与实际显示节点一起保存，供中奖动画从该节点读取。
       (<any>node).__mageJackpotGoodsIndex = goodsIndex;
    }

    /**滚动时模糊化 */
    blurGoods(node: cc.Node, goodsIndex: number) {
    let goods = ImageCache.Instance.goods_Mh[goodsIndex];
       let child = node.getChildByName("goods");
       child.getComponent(cc.Sprite).spriteFrame = goods.spriteFrame;
       child.getComponent(cc.Sprite).trim = false;
       child.width = child.height = 120;
       // 模糊态同样保留其图标 ID，避免节点复用期间数据与显示脱节。
       (<any>node).__mageJackpotGoodsIndex = goodsIndex;
    }

    /**停止时恢复 */
    restoreGoods() {
        for (let i = 0; i < this.groupCount; i++) {
            let childNode = this.node.children[i];
            let goods = ImageCache.Instance.goods[i];
            let child = childNode.getChildByName("goods");
            child.getComponent(cc.Sprite).spriteFrame = goods.spriteFrame;
            child.getComponent(cc.Sprite).trim = false;
            child.width = child.height = 120;
        }
    }


    private init() {
        this.resetPos();
        this.node.removeAllChildren(true);
        this.runCount = 0;
        this.baseGroupCount = this.groupCount;
        this.remainRunCount = this.groupCount - 3;
        for (let i = 0; i < this.groupCount; i++) {
            let result = getRandomNumInt(0, 7);
            let itemNode = cc.instantiate(this.slotItemPrefab);
            itemNode.name = i.toString();
            this.assignGoods(itemNode, result);
            this.node.addChild(itemNode);
            if (i >= this.groupCount - 3) {
                this.results.push(result);
            }
        }
    }

    private resetPos() {
        let toPos = this.node.position.clone();
        toPos.y = 0;
        this.node.setPosition(toPos);
    }

    /**模糊化 */
    private steblurGoods(valuses: number[], beginIndex: number) {
       for (let i = beginIndex; i < beginIndex + valuses.length; i++) {
            let result = this.results[i - beginIndex];
            this.blurGoods(this.node.children[i], result);
        }
    }
    
    /** 删除前次预填充/停轮留下的行标记，只保留最终可见格的标记。 */
    private clearResultRowMarkers() {
        for (const child of this.node.children) {
            delete (<any>child).__mageJackpotResultRow;
        }
    }

    private fixedValue(valuses: number[], beginIndex: number, markResultRows: boolean = false) {
        if (beginIndex < 0 || beginIndex + valuses.length > this.node.children.length) {
            console.error("Slot result position is outside the reel buffer", {
                slot: this.node.name,
                beginIndex,
                resultCount: valuses.length,
                childCount: this.node.children.length,
            });
            return;
        }
        for (let i = beginIndex; i < beginIndex + valuses.length; i++) {
            let result = this.results[i - beginIndex];
            const resultItem = this.node.children[i];
            this.assignGoods(resultItem, result);
            if (markResultRows) {
                // 仅在真正停稳时记录服务端 results 数组中的行（0=上、1=中、2=下），
                // 使中奖动画直接取得屏幕上实际承载该结果的节点。
                (<any>resultItem).__mageJackpotResultRow = i - beginIndex;
            }
        }
    }

    /**
     * 等待前列停稳期间，后列仍以正常速度转动。
     * 到缓冲尾部才按需追加节点，绝不把拉条 y 轴瞬移回起点。
     */
    private runWaitingStep(distance: number, version: number) {
        this.ensureRunBuffer(this.runCount + 1);
        this.runCount++;
        const toPos = this.node.position.clone();
        toPos.y = -distance * this.runCount;
        cc.tween(this.node).to(SLOT_RUN_STEP_SECONDS, {position: toPos}).call(() => {
            this.runStep(version);
        }).start();
    }

    /** 确保下一步滚动仍在节点池内；每次仅在接近尾部时追加一小段。 */
    private ensureRunBuffer(nextRunCount: number) {
        // 等待时 remainRunCount 仍为 1。除下一步要走的节点外，缓冲中还必须
        // 留出最终三格和这一次真实停轮，才能保证 fixedValue 的 beginIndex >= 0。
        // 原先只判断 nextRunCount <= groupCount - 3，会在最后一格写出 -1。
        const requiredGroupCount = nextRunCount + this.remainRunCount + 3;
        if (requiredGroupCount <= this.groupCount) return;
        this.appendRunBuffer(Math.max(60, requiredGroupCount - this.groupCount));
    }

    /** 追加模糊节点只用于连续滚动，不会改变本局正常落点的基准节点数。 */
    private appendRunBuffer(count: number) {
        for (let i = 0; i < count; i++) {
            const itemNode = cc.instantiate(this.slotItemPrefab);
            itemNode.name = this.node.children.length.toString();
            const result = this.probability.length > 0
                ? rateRandomResult(this.probability)
                : getRandomNumInt(0, 7);
            this.blurGoods(itemNode, result);
            this.node.addChild(itemNode);
        }
        this.groupCount += count;
    }

    /** 新局移除本局 suspense/等待期间扩充的节点，恢复原始 baseRunCount。 */
    private restoreBaseBuffer() {
        if (this.baseGroupCount <= 0 || this.node.children.length <= this.baseGroupCount) return;
        while (this.node.children.length > this.baseGroupCount) {
            const child = this.node.children[this.node.children.length - 1];
            this.node.removeChild(child);
            child.destroy();
        }
        this.groupCount = this.baseGroupCount;
    }

    private notifyStopped() {
        if (this.hasNotifiedStopped) return;
        this.hasNotifiedStopped = true;
        if (this.stoppedCallback) this.stoppedCallback();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.init();
    }

    // update (dt) {}
}
