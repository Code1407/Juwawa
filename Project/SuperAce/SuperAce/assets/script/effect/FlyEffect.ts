// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Poker from "../Poker";
import SlotSuperAce from "../Slot_SuperAce";
import FreeView from "../view/FreeView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class FlyEffect extends cc.Component {

    @property(cc.Prefab)
    flyPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    wildPrefab: cc.Prefab = null;

    delayTime: number = 0.2;
    static instance: FlyEffect = null;

    static get Instance() {
        if(!this.instance) this.instance = cc.find("Canvas/Game/StarCard").getComponent(FlyEffect);
        return this.instance;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    Fly(toNode: cc.Node, delayTime: number = 0, fromNode: cc.Node = this.node): number {
        if(!fromNode) fromNode = this.node;
        if(!toNode) return;
        let rootNode = cc.find("Canvas");

        let flyNode = cc.instantiate(this.flyPrefab);
        flyNode.name = "Clone(FlyDiamond)";
        flyNode.setParent(rootNode);
        flyNode.active = true;
        flyNode.setSiblingIndex(100);

        // from
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = rootNode.convertToNodeSpaceAR(fromWorld);
        // to
        let toWorld = toNode.parent.convertToWorldSpaceAR(toNode.position);
        let toLocal = rootNode.convertToNodeSpaceAR(toWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 1800;

        let ctrlPoint1 = cc.v2((toLocal.x - fromLocal.x) * 1/3 + fromLocal.x + 30, (toLocal.y - fromLocal.y) * 1/3 + fromLocal.y + 150);
        let ctrlPoint2 = cc.v2((toLocal.x - fromLocal.x) * 2/3 + fromLocal.x + 150, (toLocal.y - fromLocal.y) * 2/3 + fromLocal.y + 250);
        let toPoint = cc.v2(toLocal.x, toLocal.y);

        

        // fly
        setTimeout(()=>{
            Audio.Instance.playFly();
        },delayTime)
        flyNode.setPosition(fromLocal);
        cc.tween(flyNode)
            .delay(delayTime)
            .bezierTo(flyTime, ctrlPoint1, ctrlPoint2, toPoint)
            .call(() => {
                flyNode.getComponent(cc.ParticleSystem).stopSystem();
                Audio.Instance.playChangeGolden();
            }).start();
        flyNode.opacity = 0;
        cc.tween(flyNode)
            .delay(delayTime)
            .call(()=>{
                this.node.getComponent(cc.Animation).playAdditive("deliver");
            })
            .to(0.2, { opacity: 255 })
            .to(flyTime, { opacity: 0 })
            .call(() => {
                flyNode.destroy();
            })
            .start();
        return flyTime + delayTime;
    }

    FlyScatter(toNode: cc.Node = this.node, fromNode: cc.Node, delayTime: number = 0){
        if(!fromNode) fromNode = this.node;
        if(!toNode) return;
        let rootNode = cc.find("Canvas");

        let flyNode = cc.instantiate(this.flyPrefab);
        flyNode.name = "Clone(FlyDiamond)";
        flyNode.setParent(rootNode);
        flyNode.active = true;
        flyNode.setSiblingIndex(100);

        // from
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = rootNode.convertToNodeSpaceAR(fromWorld);
        // to
        let toWorld = toNode.parent.convertToWorldSpaceAR(toNode.position);
        let toLocal = rootNode.convertToNodeSpaceAR(toWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 2000;

        let ctrlPoint1 = cc.v2((toLocal.x - fromLocal.x) * 1/3 + fromLocal.x + 30, (toLocal.y - fromLocal.y) * 1/3 + fromLocal.y + 150);
        let ctrlPoint2 = cc.v2((toLocal.x - fromLocal.x) * 2/3 + fromLocal.x + 150, (toLocal.y - fromLocal.y) * 2/3 + fromLocal.y + 250);
        let toPoint = cc.v2(toLocal.x, toLocal.y);
        

        // fly
        setTimeout(() => {
            Audio.Instance.playFly();
        }, delayTime);
        Audio.Instance.playFly();
        flyNode.setPosition(fromLocal);
        cc.tween(flyNode)
            .delay(delayTime)
            .bezierTo(flyTime, ctrlPoint1, ctrlPoint2, toPoint)
            .call(() => {
                flyNode.getComponent(cc.ParticleSystem).stopSystem();
            }).start();
        flyNode.opacity = 0;
        cc.tween(flyNode)
            .delay(delayTime)
            .to(0.2, { opacity: 255 })
            .to(flyTime - 0.2, { opacity: 0 })
            .call(() => {
                flyNode.destroy();
                this.node.getComponent(cc.Animation).playAdditive("receive");
            })
            .start();
    }


    FlyWild(toNode: cc.Node, delayTime: number = 0, fromNodeIndex: number): number {
        if(!fromNodeIndex) return;
        if(!toNode) return;
        let rootNode = cc.find("Canvas");
        let fromNode = SlotSuperAce.Instance.columns[Math.floor(fromNodeIndex % 5)].pokerEffects.children[Math.floor(fromNodeIndex / 5)];
        let item = SlotSuperAce.Instance.columns[Math.floor(fromNodeIndex % 5)].item[Math.floor(fromNodeIndex / 5)];

        let flyNode = cc.instantiate(this.wildPrefab);
        delayTime = delayTime + this.delayTime;
        flyNode.getComponent(Poker).setPoker(10);
        flyNode.name = "Clone(FlyDiamond)";
        flyNode.setParent(rootNode);
        flyNode.active = true;
        flyNode.setSiblingIndex(100);
        flyNode.scale = 1.39;
        this.delayTime += 0.2;
        
        // from
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = rootNode.convertToNodeSpaceAR(fromWorld);
        // to
        let toWorld = toNode.parent.convertToWorldSpaceAR(toNode.position);
        let toLocal = rootNode.convertToNodeSpaceAR(toWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 2500;
        

        // fly
        flyNode.setPosition(fromLocal);
        cc.tween(flyNode)
            .delay(delayTime)
            .call(()=>{
                Audio.Instance.playCopyWild();
                item.active = false;
                fromNode.active = true;
                fromNode.getComponent(cc.Animation).play('copyWild');
                fromNode.getComponent(cc.Animation).once('finished',()=>{
                    item.active = true;
                    fromNode.active = false;
                })
            })
            .to(flyTime, { position: toLocal })
            .call(() => {
                flyNode.destroy();
            })
            .start();
        flyNode.opacity = 0;
        cc.tween(flyNode)
            .delay(delayTime)
            .call(()=>{})
            .to(0.1, { opacity: 255 })
            .call(() => {})
            .start();
        return flyTime + delayTime;
    }

    // update (dt) {}
}
