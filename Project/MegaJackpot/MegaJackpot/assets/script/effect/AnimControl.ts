// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import SlotltemAnim from "./SlotltemAnim";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AnimControl extends cc.Component {


    @property({type: cc.Node, displayName: "动画节点模板"})
    animNode: cc.Node = null;


    m_AnimNodes: cc.Node[] = [];

    //动画控制类 
    /**
     * 播放动画
     * @param node 动画节点
     * @param animName 动画名称
     * @param isLoop 是否循环播放
     */
    /**
     * 将 SlotItem 实际可见符号的中心转换到 SlotsAnim 局部坐标。
     *
     * SlotItem 根节点只是容器；真正显示的 goods Sprite 有自身的锚点、偏移和
     * 尺寸。直接使用根节点的 (0, 0) 在转轴/遮罩层级变化后会产生视觉偏差。
     * getBoundingBoxToWorld() 会包含完整父节点变换，再将其中心点转换到
     * SlotsAnim，动画根节点（anchor = 0.5, 0.5）即可和中奖符号视觉中心重合。
     */
    convertToCurrentNodeSpace(slotItem: cc.Node): cc.Vec2 {
        const visibleNode = slotItem.getChildByName("goods") || slotItem;
        const worldBounds = visibleNode.getBoundingBoxToWorld();
        const worldCenter = cc.v2(
            worldBounds.x + worldBounds.width * 0.5,
            worldBounds.y + worldBounds.height * 0.5,
        );
        return this.node.convertToNodeSpaceAR(worldCenter);
    }

    //拷贝动画模板，并定位到目标 SlotItem 的可见中心。
    copyNode(template: cc.Node, targetSlotItem: cc.Node) {
        let newNode = cc.instantiate(template);
        newNode.parent = this.node;
        newNode.setPosition(this.convertToCurrentNodeSpace(targetSlotItem));
        return newNode;
    }

    //播放动画
    playAnim(targetSlotItem: cc.Node, animIndex: number, animName: string, isLoop: boolean) {
        let animNode = this.copyNode(this.animNode, targetSlotItem);
        animNode.active = true;
        // SlotItemAnim 的根节点没有 sp.Skeleton；12 个 Skeleton 位于其子节点，
        // 由 SlotltemAnim 依据符号索引选择并播放。
        let slotItemAnim = animNode.getComponent(SlotltemAnim);
        if (!slotItemAnim) {
            console.error("SlotsAnim template is missing SlotltemAnim", animNode.name);
            animNode.destroy();
            return;
        }
        slotItemAnim.playAnim(animIndex, animName, isLoop);
        this.m_AnimNodes.push(animNode);
    }

    //清除所有动画
    clearAnim() {
        for (let i = 0; i < this.m_AnimNodes.length; i++) {
            this.m_AnimNodes[i].active = false;
            this.m_AnimNodes[i].removeFromParent();
        }
        this.m_AnimNodes = [];
    }

    start () {

    }

    // update (dt) {}
}
