import { gBonusWheelSegmentMultipliers } from "../GameData";

const { ccclass, property } = cc._decorator;

/**
 * 幸运转盘结算视图。
 *
 * 场景由美术绑定：wheel 指向可旋转的转盘节点，两个 Label 可选。
 * 扇区布局在登录时由服务端下发；
 * targetAngleOffset 与 clockwise 用于按实际美术朝向校准停靠位置。
 */
@ccclass
export default class BonusWheelView extends cc.Component {
    
    //spine结果动画
    @property(cc.Node)
    wheelResultNode: cc.Node = null;

 

    private pendingTweenResolve: (() => void) | null = null;
    private autoCloseTimer: number = null;

    //spine 12个动画皮肤
    
    wheelResultSkinNode = [ "wheel1", "wheel2", "wheel3", "wheel4", "wheel5", "wheel6", "wheel7", "wheel8", "wheel9", "wheel10", "wheel11","wheel12"];
    // 3  5 3 20 15  10  1  10  1  5  3  5



    hasWheelBinding(): boolean {
        return !!this.wheelResultNode
            && cc.isValid(this.wheelResultNode)
            && !!this.wheelResultNode.getComponent(sp.Skeleton);
    }

   onLoad() {
        if (!this.hasWheelBinding()) {
            console.warn("BonusWheelView wheelResultNode or its Spine component is not bound.");
            return;
        }
        let self = this;
        const skeleton = this.wheelResultNode.getComponent(sp.Skeleton);
        skeleton.setCompleteListener(() => {
            // Spine 的 animation 负责3秒转动；结果皮肤停留1秒后再关闭。
            if (self.autoCloseTimer != null) clearTimeout(self.autoCloseTimer);
            self.autoCloseTimer = window.setTimeout(() => {
                self.autoCloseTimer = null;
                if (self.pendingTweenResolve) {
                    self.pendingTweenResolve();
                    self.pendingTweenResolve = null;
                }
                self.node.active = false;
            }, 200);
        });
    }

    async play(index: number, multiplier: number): Promise<void> {
        if (!Number.isInteger(index) || index < 0 || index >= this.wheelResultSkinNode.length) {
            console.warn("BonusWheelView received an invalid segment index", index);
            return;
        }
        if (Number(gBonusWheelSegmentMultipliers[index]) !== Number(multiplier)) {
            console.warn("BonusWheelView segment index and multiplier do not match", index, multiplier);
            return;
        }
        if (!this.hasWheelBinding()) {
            console.warn("BonusWheelView wheelResultNode or its Spine component is not bound.");
            return;
        }
        this.node.active = true;

        //动画皮肤
        const skeleton = this.wheelResultNode.getComponent(sp.Skeleton);
        skeleton.setSkin(this.wheelResultSkinNode[index]);
        skeleton.setAnimation(0, "show2", false);
        return new Promise(resolve => {
            this.pendingTweenResolve = resolve;
        });
    }


    onDisable() {
        if (this.autoCloseTimer != null) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        if (this.pendingTweenResolve) {
            this.pendingTweenResolve();
            this.pendingTweenResolve = null;
        }
    }
}
