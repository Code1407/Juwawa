// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { EGameStatus } from "../shared3/interface/IGame";
import { linePaths } from "./interface/IMageJackpot";
import Slot from "./Slot";
import AnimControl from "./effect/AnimControl";
import SpineControl from "./SpineControl";

const {ccclass, property} = cc._decorator;

const JACKPOT_SYMBOL_INDEX = 11;
const JACKPOT_SUSPENSE_COUNT = 2;
const JACKPOT_SUSPENSE_SECONDS = 1;   //延长时间

@ccclass
export default class Slots extends cc.Component {

    @property(Slot)
    slots: Slot[] = [];

    private stoppedSlotCount = 0;
    /** 服务端最终盘面中每列的 Jackpot 数量。 */
    private jackpotCountBySlot: number[] = [];
    /** 第 i 列开始停轮时，前面已停列累计 Jackpot 是否大于 1。 */
    private shouldExtendSlot: boolean[] = [];
    private spineControl: SpineControl = null;
    /** 急速模式关闭 suspense 延长，但不影响最终 Jackpot 结果与结算。 */
    private jackpotSuspenseEnabled = true;
    /** 急速模式允许各列并行进入最终停轮。 */
    private quickStopEnabled = false;

    /** Game 通过 Inspector 绑定的 spineControlNode 注入该组件。 */
    setSpineControl(spineControl: SpineControl | null) {
        this.spineControl = spineControl;
    }

    setJackpotSuspenseEnabled(enabled: boolean) {
        this.jackpotSuspenseEnabled = enabled;
        // 在 suspense 已经出现后开启急速时，立即移除等待画面；各列的
        // 剩余步数由 Game.finishRound 统一压缩。
        if (!enabled) this.getSpineControl()?.stopSecondJackpotSpin();
    }

    /** 将急速的停轮、suspense 策略一次性同步到所有转轴。 */
    setQuickStopEnabled(enabled: boolean) {
        this.quickStopEnabled = enabled;
        this.setJackpotSuspenseEnabled(!enabled);
        for (const slot of this.slots) {
            slot.setQuickStop(enabled);
        }
    }

    newRound() {
        // 中奖 item 特效由 SlotsAnim 覆盖层播放；开始新局时恢复底层转轴亮度。
        this.node.opacity = 255;
        this.stoppedSlotCount = 0;
        this.jackpotCountBySlot = [];
        this.shouldExtendSlot = [];
        this.jackpotSuspenseEnabled = true;
        this.quickStopEnabled = false;
        for (const slot of this.slots) {
            slot.setQuickStop(false);
        }
        this.getSpineControl()?.stopSecondJackpotSpin();
        // 显示机率
        let probabilitys = [
            [0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0, 0, 0],
            [0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4, 0.4, 0.05, 0.05, 0.05],
            [0.1, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.4, 0.4, 0.05, 0.05, 0.05],
            [0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05],
            [0.2, 0.2, 0.2, 0.1, 0.1, 0.05, 0.05, 0.1, 0.1, 0.05, 0.05, 0.05]
        ];

        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.reset(probabilitys[i]);
        }
    }

    run() {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.run();
        }
    }

    getSlotsStatus(): EGameStatus {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            if (slot.getRemainRunCount() != 0) return EGameStatus.run;
        }
        return EGameStatus.final;
    }

    setResults(results: number[]) {
        this.buildJackpotStopPlan(results);
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            let slotResult: number[] = [];
            slotResult.push(results[i]);
            slotResult.push(results[i + this.slots.length]);
            slotResult.push(results[i + this.slots.length*2]);
            slot.setResults(slotResult);
        }
    }

    setSlotRemain(remain: number) {
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            slot.setRemainRunCount(remain);
        }
    }

    /**
     * 在 SlotsAnim 覆盖层的对应位置播放连线中奖动画。
     */
    playConnectedWinAnimation(connectedIndex: number[], animControl: AnimControl) {
        if (!animControl) {
            console.warn("SlotsAnim AnimControl is not assigned");
            return;
        }

        animControl.clearAnim();
        this.playWinAnimation(connectedIndex, animControl);
    }

    /**
     * 中奖 item 特效播放时压暗底层转轴，使覆盖层中的中奖图标更突出。
     * Slots 节点即 Canvas/Game/Slots（UUID: 70ckZsQ0ZGMaEUzCm6Wd3w）。
     */
    setItemAnimationDimmed(dimmed: boolean) {
        this.node.opacity = dimmed ? 125 : 255;
    }

    /** 播放单条中奖线实际命中的格子动画。 */
    playLineWinAnimation(lineNum: number, count: number, animControl: AnimControl) {
        if (!animControl) {
            console.warn("SlotsAnim AnimControl is not assigned");
            return;
        }

        const linePath = linePaths[lineNum];
        if (!linePath) {
            console.warn(`Winning line path not found: ${lineNum}`);
            return;
        }

        const connectedIndex = linePath
            .slice(0, Math.min(count, linePath.length))
            .map(pathIndex => pathIndex - 1);
        animControl.clearAnim();
        this.playWinAnimation(connectedIndex, animControl);
    }

    private playWinAnimation(connectedIndex: number[], animControl: AnimControl) {
        for (let i = 0; i < connectedIndex.length; i++) {
            const index = connectedIndex[i];
            let slotIndex = index % 5;
            let childIndex = (index - slotIndex) / linePaths[0].length;
            let slot = this.slots[slotIndex];
            if (!slot) continue;
            let slotItem = slot.getResultChild(childIndex);
            // 动画类型必须以当前可见 SlotItem 的实际图标为准，不能从
            // results[row] 反推；滚轴停靠偏移会使两者不再是同一个节点。
            let goodsIndex = slotItem && slot.getDisplayedGoodsIndex(slotItem);
            if (slotItem && goodsIndex !== undefined) {
                animControl.playAnim(slotItem, goodsIndex, "win", true);
            }
        }
    }

    /** 已停列的 Jackpot 累计达到两个时，高亮下一条待停列。 */
    private onSlotStopped(slotIndex: number) {
        if (slotIndex !== this.stoppedSlotCount) return;

        this.stoppedSlotCount++;

        // 急速模式兼容 Jackpot：服务端结果与最终 Jackpot 表现照常保留，
        // 仅跳过客户端的延长转轴和 suspense 等待。
        if (!this.jackpotSuspenseEnabled) {
            this.getSpineControl()?.stopSecondJackpotSpin();
            return;
        }

        const nextSlot = this.slots[this.stoppedSlotCount];
        // 延长计划在收到服务端最终 results 时已固定；停轮时只读取下一列计划。
        if (this.shouldExtendSlot[this.stoppedSlotCount] && nextSlot) {
            // 只有安全延长成功后才显示，避免动画与拉条状态不同步。
            if (nextSlot.addRunSeconds(JACKPOT_SUSPENSE_SECONDS)) {
                // showSecondJackpotSpin 内部以 slotIndex - 1 映射到
                // SecondJackpotSpinNode[待停止列 - 1]。
                this.getSpineControl()?.showSecondJackpotSpin(true, this.stoppedSlotCount);
            }
        } else if (!nextSlot) {
            this.getSpineControl()?.stopSecondJackpotSpin();
        }
    }

    /**
     * 结果一到即按列预计算 suspense：第 i 列只看它左侧所有列的最终结果。
     * 盘面布局为 row-major，列 i 的三个图标为 i、i+5、i+10。
     */
    private buildJackpotStopPlan(results: number[]) {
        const slotCount = this.slots.length;
        this.jackpotCountBySlot = [];
        this.shouldExtendSlot = [];

        let stoppedJackpotTotal = 0;
        for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
            const jackpotCount = [
                results[slotIndex],
                results[slotIndex + slotCount],
                results[slotIndex + slotCount * 2],
            ].filter(symbol => symbol === JACKPOT_SYMBOL_INDEX).length;
            this.jackpotCountBySlot[slotIndex] = jackpotCount;
            // 第一列前方没有已停列，因此永不延长。
            this.shouldExtendSlot[slotIndex] = slotIndex > 0
                && stoppedJackpotTotal >= JACKPOT_SUSPENSE_COUNT;
            stoppedJackpotTotal += jackpotCount;
        }
    }

    /** SpineControl 挂在 Canvas/Game/SpineControl，必须从该场景节点获取。 */
    private getSpineControl(): SpineControl | null {
        return this.spineControl;
    }

    /** 任一列只能在其前一列完整停稳后才进入停轮。 */
    private canSlotStop(slotIndex: number): boolean {
        return this.quickStopEnabled || slotIndex === this.stoppedSlotCount;
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.newRound();
        const groupCount = 9;
        for (let i = 0; i < this.slots.length; i++) {
            let slot = this.slots[i];
            let slotGroupCount = 3 * groupCount + groupCount * i;
            slot.groupCount = slotGroupCount;
            slot.setStoppedCallback(() => this.onSlotStopped(i));
            slot.setCanStopCallback(() => this.canSlotStop(i));
        }
    }

    // start () {}

    // update (dt) {}
}
