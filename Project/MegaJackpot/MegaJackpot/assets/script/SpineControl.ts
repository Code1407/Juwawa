// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html

import Bottombar from "./Bottombar";

const {ccclass, property} = cc._decorator;

/** Controls the reel-overlay Spine effects declared under Canvas/SpineControl. */
@ccclass
export default class SpineControl extends cc.Component {

    @property({type: sp.Skeleton, tooltip: "免费模式显示动画"})
    FreeModeSpinNode: sp.Skeleton = null;

    // 索引 0~3 分别对应第 2~5 列的 Jackpot suspense 动画。
    @property({type: [sp.Skeleton], tooltip: "前面出现两个 Jackpot 时的待停列动画"})
    SecondJackpotSpinNode: sp.Skeleton[] = [];

    static get Instance(): SpineControl | null {
        const node = cc.find("Canvas/Game/SpineControl");
        return node ? node.getComponent(SpineControl) : null;
    }

    onLoad() {
        this.showFreeModeSpin(false);
        this.stopSecondJackpotSpin();
    }

    /** Shows or hides the Free Spins reel-frame overlay. */
    showFreeModeSpin(show: boolean) {
        if (!this.FreeModeSpinNode || !this.FreeModeSpinNode.node) return;

        this.FreeModeSpinNode.node.active = show;
        if (show) this.FreeModeSpinNode.setAnimation(0, "idle", true);
    }

    /**
     * Show the suspense frame on a pending reel.
     *
     * @param show Whether the effect should be visible.
     * @param slotIndex Zero-based reel index. Reel 0 never has this effect;
     *                  indexes 1~4 map to the four configured Spine nodes.
     */
    showSecondJackpotSpin(show: boolean, slotIndex: number) {
        this.stopSecondJackpotSpin();
        if (!show) return;

        const spineIndex = slotIndex - 1;
        const skeleton = this.SecondJackpotSpinNode[spineIndex];
        if (!skeleton || !skeleton.node) {
            console.warn("Second Jackpot Spine is not configured for reel", slotIndex + 1);
            return;
        }

        skeleton.node.active = true;
        // 急速模式使用静态/低干扰 idle，普通模式使用完整 suspense 动画。
        const isTurboMode = Bottombar.Instance && Bottombar.Instance.isTurboMode();
        skeleton.setAnimation(0, isTurboMode ? "idle" : "animation", true);
    }

    /** Hides every suspense frame before switching reels or ending the spin. */
    stopSecondJackpotSpin() {
        for (const skeleton of this.SecondJackpotSpinNode) {
            if (!skeleton || !skeleton.node) continue;
            skeleton.node.active = false;
        }
    }

    // Keep the old inspector/API names working for existing scene events.
    fucShowFreeModeSpin(show: boolean) {
        this.showFreeModeSpin(show);
    }

    fucShowSecondJackpotSpin(show: boolean, index: number) {
        this.showSecondJackpotSpin(show, index);
    }

    fucStopSecondJackpotSpin() {
        this.stopSecondJackpotSpin();
    }
}
