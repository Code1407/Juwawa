// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import { gGameData } from "../GameData";
import { Effect } from "../effect/FlyDiamond";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChipMoveNodeUI extends cc.Component {

    @property(cc.Node)
    mineNode: Array<cc.Node> = [];
    @property(cc.Node)
    otherNode: cc.Node = null;
    @property(cc.Node)
    hostNode: cc.Node = null;

    @property(cc.Node)
    items: Array<cc.Node> = [];


    @property(cc.Node)
    addGold: cc.Node = null;
    @property(cc.Node)
    addOthersGold: cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    static get Instance() {
        return cc.find("Canvas/Game/ChipMoveNode").getComponent(ChipMoveNodeUI);
    }
    // onLoad () {}

    start() {

    }


    async final() {
        let result: number = gGameData.roundStep.result;
        let resultPos = gGameData.indexArr[result];//拿到压中的车标的编号
        let hasAction: number = 0;
        //先收走筹码
        for (let child of this.node.children) {
            if (child.name == "FlyDiamond") {
                if (child["tragetIndex"] != resultPos) {
                    child.opacity = 255;
                    // Effect.FlyDiamond3(child,this.hostNode); 
                    hasAction = 1;
                }
            }
        }
        if (hasAction) {
            Audio.Instance.playfly();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        hasAction = 0;
        let count = gGameData.wheelMulti[result];
        if (count > 0) {
            let needFlyChild = [];
            for (let child of this.node.children) {
                if (child.name == "FlyDiamond") {
                    if (child["tragetIndex"] == resultPos) {
                        needFlyChild.push(child);
                        hasAction = 1;
                    }
                }
            }
            for (let index = 0; index < needFlyChild.length; index++) {
                const child = needFlyChild[index];
                if (child) {
                    for (let index = 0; index < count; index++) {
                        // let chip = Effect.FlyDiamond2(ChipMoveNodeUI.Instance.hostNode, ChipMoveNodeUI.Instance.items[child["tragetIndex"]], child["spriteFrameId"],child["tragetIndex"],false);//筹码结算掉落
                        // chip["fromNode"] = child["fromNode"];//筹码结算掉落


                        //await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            }
            if (hasAction) {
                Audio.Instance.playfly();
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        hasAction = 0;
        for (let child of this.node.children) {
            if (child.name == "FlyDiamond") {
                child.opacity = 255;
                // Effect.FlyDiamond3(child,child["fromNode"]);    ///赢到的筹码返回
                hasAction = 1;
                //await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        if (hasAction) {
            Audio.Instance.playfly();
        }
    }

    getAtt(node: any): any {
        return node.fromNode
    }

    // 调用方法来展示金币增加效果
    showAddGoldEffect(sumEarnings: number) {
        if (sumEarnings == 0) return;
        this.addGold.getComponent(cc.Label).string = "+" + this.setValue(sumEarnings);
        this.showGoldEffect(this.addGold);
    }

    // 调用方法来展示其他玩家金币增加效果
    showAddOthersGoldEffect(addOthersNum: number) {
        if (addOthersNum == 0) return;
        this.addOthersGold.getComponent(cc.Label).string = "+" + this.setValue(addOthersNum);
        this.showGoldEffect(this.addOthersGold);
    }

    showGoldEffect(node: any) {
        // 保存原始位置
        const originalPosition = node.position.clone();  // 保存初始位置（Vec2）

        // 设置初始透明度为0
        node.opacity = 0;
        cc.tween(node)
            // 透明度从0变255
            .to(0.2, { opacity: 255 })
            // 垂直下降80个像素
            .to(0.2, { position: cc.v2(originalPosition.x, originalPosition.y - 60) })
            // 展示3秒
            .delay(3)
            // 透明度立即变回0
            .to(0, { opacity: 0 })
            // 恢复到原始位置
            .to(0, { position: originalPosition })
            .start();
    }

    setValue(value: number) {
        if (value < 1000) {
            // 金额小于1000，直接显示完整数字
            return value.toString();
        } else if (value >= 1000) {
            // 金额大于等于1000，转换为多少多少K
            const kValue = (value / 1000).toFixed(2);
            return `${kValue}K`;
        }
    }
}
