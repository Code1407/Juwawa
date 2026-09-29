// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class SlotltemAnim extends cc.Component {

    //9个动画
    @property({type: [cc.Node], displayName: "12个动画的节点"}) 
    animNodes: cc.Node[] = [];


    m_AnimNames = ["land", "win"];

    start () {
       
    }

    
    /**
     * 播放动画
     * @param animIndex 动画索引
     * @param animName 动画名称
     * @param isLoop 是否循环播放
     */
    playAnim(animIndex: number,animName: string, isLoop: boolean = false) {
        if (animIndex < 0 || animIndex >= this.animNodes.length) {
            console.error("SlotItemAnim index out of range", animIndex);
            return;
        }

        this.stopAllAnim();
        let animNode = this.animNodes[animIndex];
        animNode.active = true;
        //播放动画
        let skeleton = animNode.getComponent(sp.Skeleton);
        if (!skeleton) {
            console.error("SlotItemAnim child is missing Skeleton", animNode.name);
            animNode.active = false;
            return;
        }
        skeleton.setAnimation(0, animName, isLoop);
    }

    /**
     * 停止动画
     * @param animIndex 动画索引
     */
    stopAnim(animIndex: number) {
        let animNode = this.animNodes[animIndex];
        animNode.active = false;
    }

    /**
     * 停止所有动画
     */
    stopAllAnim() {
        for (let i = 0; i < this.animNodes.length; i++) {
            this.animNodes[i].active = false;
        }
    }


}
