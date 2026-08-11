// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import { gGameData } from "../GameData";
import { Effect } from "../effect/FlyDiamond";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ChipMoveNodeUI extends cc.Component {

    @property(cc.Node)
    mineNode: cc.Node = null;
    @property(cc.Node)
    otherNode: cc.Node = null;
    @property(cc.Node)
    hostNode: cc.Node = null;

    @property(cc.Node)
    items: Array<cc.Node> = [];
    // LIFE-CYCLE CALLBACKS:

    static get Instance() {
        return cc.find("Canvas/Game/ChipMoveNode").getComponent(ChipMoveNodeUI);
    }
    // onLoad () {}

    start () {

    }


    async final(){
        let result:number = gGameData.roundStep.result;
        let resultPos = gGameData.indexArr[result];//拿到压中的车标的编号
        let hasAction:number = 0;
        //先收走筹码
        for(let child of this.node.children){
            if(child.name == "FlyDiamond"){
                if(child["tragetIndex"]!=resultPos){
                    child.opacity = 255;
                    Effect.FlyDiamond3(child,this.hostNode);
                    hasAction = 1;
                }
            }
        }
        if(hasAction){
            Audio.Instance.playfly();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        hasAction = 0;
        let count = gGameData.wheelMulti[result];
        if(count  >  0){
            let needFlyChild = [];
            for(let child of this.node.children){
                if(child.name == "FlyDiamond"){
                    if(child["tragetIndex"]==resultPos){
                        needFlyChild.push(child);
                        hasAction = 1;
                    }
                }
            }
            for (let index = 0; index < needFlyChild.length; index++) {
                const child = needFlyChild[index];
                if(child){
                    for (let index = 0; index < count; index++) {
                        let chip = Effect.FlyDiamond2(ChipMoveNodeUI.Instance.hostNode, ChipMoveNodeUI.Instance.items[child["tragetIndex"]], child["spriteFrameId"],child["tragetIndex"],false);
                        chip["fromNode"] = child["fromNode"];
                        //await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            }
            if(hasAction){
                Audio.Instance.playfly();
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        hasAction = 0;
        for(let child of this.node.children){
            if(child.name == "FlyDiamond"){
                child.opacity = 255;
                Effect.FlyDiamond3(child,child["fromNode"]);
                hasAction = 1;
                //await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        if(hasAction){
            Audio.Instance.playfly();
        }
    }

    getAtt(node:any):any{
        return node.fromNode
    }
    // update (dt) {}
}
