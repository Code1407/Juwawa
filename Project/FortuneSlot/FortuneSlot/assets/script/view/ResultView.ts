// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ResultItem from "../ResultItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ResultView extends cc.Component {

    @property(cc.Prefab)
    goods: cc.Prefab[] = [];

    @property(cc.Prefab)
    mulitpleAnims: cc.Prefab[] = [];

    @property(cc.Prefab)
    wheelAnims: cc.Prefab[] = [];

    @property(cc.Node)
    columns: cc.Node[] = [];

    @property(cc.Node)
    mulitpleNode: cc.Node = null;

    @property(cc.Integer)
    saveCount: number = 5;

    enemyPools: cc.NodePool[] = [];
    rewardCount: number = 0;
    static instance: ResultView = null;

    static get Instance() {
        if(!this.instance) this.instance = cc.find("Canvas/Game/Slot_FortuneSlot/mask/Result").getComponent(ResultView);
        return this.instance;
    }

    init(){
        for(let i = 0; i < this.goods.length; i++){
            let node = cc.instantiate(this.goods[i]);
            let enemyPool = new cc.NodePool();
            for(let j = 0; j < this.saveCount; j++){
                enemyPool.put(node);
            }
            this.enemyPools.push(enemyPool);
        }
        this.mulitpleAnims.push(this.wheelAnims[0]);
    }

    switchMode(isExtra: boolean){
        if(isExtra){
            this.mulitpleAnims.pop();
            this.mulitpleAnims.push(this.wheelAnims[1]);
        }else{
            this.mulitpleAnims.pop();
            this.mulitpleAnims.push(this.wheelAnims[0]);
        }
    }
    
    setColumn(columnIndex: number, columnResult: number[]){
        let column = this.columns[columnIndex];
        for(let i = 0; i < column.childrenCount; i++){
            let good = column.children[i];
            if(this.enemyPools[columnResult[i]] && this.enemyPools[columnResult[i]].size() > 0){
                let enemy = this.enemyPools[columnResult[i]].get();
                enemy.children[1].getComponent(dragonBones.ArmatureDisplay).playAnimation("newAnimation", -1)
                enemy.parent = good;
            }else{
                let enemy = cc.instantiate(this.goods[columnResult[i]]);
                enemy.children[1].getComponent(dragonBones.ArmatureDisplay).playAnimation("newAnimation", -1)
                enemy.parent = good;
            }
            good.getComponent(ResultItem).resultIndex = columnResult[i];
        }
    }

    setMultiple(multipleIndex: number){
        this.mulitpleNode.removeAllChildren();
        let multiple = cc.instantiate(this.mulitpleAnims[multipleIndex]);
        multiple.parent = this.mulitpleNode;
        this.mulitpleNode.active = true;
        multiple.getComponent(dragonBones.ArmatureDisplay).playAnimation("newAnimation", -1)
    }

    removeAll(){
        for(let i = 0; i < this.columns.length; i++){
            let column = this.columns[i];
            for(let j = 0; j < column.childrenCount; j++){
                let good = column.children[j];
                if(good.childrenCount > 0){
                    let resultIndex = good.getComponent(ResultItem).resultIndex;
                    this.enemyPools[resultIndex].put(good.children[0]);
                    good.removeAllChildren();
                }
            }
        }
    }

    closeAll(){
        for(let i = 0; i < this.columns.length; i++){
            let column = this.columns[i];
            for(let j = 0; j < column.childrenCount; j++){
                let good = column.children[j];
                good.active = false;
            }
        }
    }

    showRewardLine(columnIndex: number, rewardIndex: number){
        let column = this.columns[columnIndex];
        for(let i = 0; i < column.childrenCount; i++){
            let good = column.children[i];
            if(i == rewardIndex) {
                good.active = true;
                good.children[0].children[1].getComponent(dragonBones.ArmatureDisplay).playAnimation("newAnimation", -1)
            }
        }
    }
}
