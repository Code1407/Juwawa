import { getRandomNumInt } from "../interface/IFruitSlots";
import { gGameData } from "../GameData";
import AudioCtrl from "../../shared3/AudioCtrl_shared3";
import { AudioClip } from "../AudioClip_FruitSlots";

export namespace Effect {
    let inShowHint: boolean = false;

    export async function flyDiamond(fromNode: cc.Node, toNode: cc.Node, frequency: number = 1) {
        AudioCtrl.PlayAsync(AudioClip.fly_diamond);

        let rootNode = cc.find("Canvas");
    
        for (let i = 0; i < frequency; i++) {
            let flyNode = cc.instantiate(cc.find("Template/FlyDiamond"));
            flyNode.name = "Clone(FlyDiamond)";
            flyNode.parent = rootNode;
            let coin = cc.find("Diamond", flyNode).getComponent(cc.Sprite);
            let config = (<any>window).config;
            coin && config && config.setGameCoin && config.setGameCoin(coin);
            flyNode.active = true;
            flyNode.setSiblingIndex(100);
        
            // from
            let fromWorld = fromNode.parent.convertToWorldSpaceAR<cc.Vec2>(fromNode.getPosition());
            let fromLocal = rootNode.convertToNodeSpaceAR<cc.Vec2>(fromWorld);

            flyNode.setPosition(fromLocal);

            // to
            let toWorld = toNode.parent.convertToWorldSpaceAR<cc.Vec2>(toNode.getPosition());
            let toLocal = rootNode.convertToNodeSpaceAR<cc.Vec2>(toWorld);

            let toPosNear = toLocal;
            toPosNear.x += getRandomNumInt(0, 30);

            // way
            let wayPos = new cc.Vec2;
            wayPos.x = toPosNear.x + (fromLocal.x - toPosNear.x) / 3;
            wayPos.y = fromLocal.y;
            let wayPosNear = wayPos.clone();
            wayPosNear.x += getRandomNumInt(-20, 20);
            wayPosNear.y += getRandomNumInt(80, 150);

            // from2way
            let from2wayPos = new cc.Vec2;
            from2wayPos.x = wayPosNear.x + (fromLocal.x - wayPosNear.x) / 2;
            from2wayPos.y = wayPosNear.y + 30;

            // way2to
            let way2toPos = new cc.Vec2;
            way2toPos.x = toPosNear.x + (wayPosNear.x - toPosNear.x) / 2 - 30;
            way2toPos.y = toPosNear.y + (wayPosNear.y - toPosNear.y) / 2;
            
            let speedAdd = Math.random()
            let speed1 = 0.4 + speedAdd / 5;
            let speed2 = 0.3 + speedAdd / 6;
            cc.tween(flyNode)
            .bezierTo(speed1, fromLocal, from2wayPos, wayPosNear)
            .bezierTo(speed2, wayPosNear, way2toPos, toPosNear)
            .call(()=>{
                    flyNode.destroy();
            }).start();
            
            cc.tween(flyNode).to(speed1, {scale: 1.0}).to(speed2, {scale: 0.5}).start();
            cc.tween(flyNode).to(speed1, {angle: getRandomNumInt(0, 360)}).start();

            if (i % 3 == 2) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    export function flyIncrAmount(rootNode: cc.Node, incrNode: cc.Node, incrAmount: number) {
        incrAmount = Math.round(incrAmount);
        if (incrAmount == 0) return;

        let node = cc.instantiate(incrNode);
        rootNode.addChild(node);
        node.active = true;
        let posOriginal = node.position;
        let posOriginalHigh = posOriginal.clone();
        posOriginalHigh.y += 50;
        node.getComponent(cc.Label).string = (incrAmount > 0 ? "+" : "") + incrAmount;
        cc.tween(node)
        .to(0.2, {scale: 1.2})
        .to(0.2, {scale: 1})
        .to(1.5, {position: posOriginalHigh, opacity: 100}).call(()=>{
            rootNode.removeChild(node, true);
        }).start();
    }

    export function showHint() {
        if (gGameData.hints.length == 0) return;

        if (inShowHint) return;
        inShowHint = true;

        let rootNode = cc.find("Canvas");
        let hintNode = cc.find("Canvas/Hint");
        let labelNode = cc.find("Canvas/Hint/label");

        let node = cc.instantiate(labelNode);
        node.active = true;

        let label = node.getComponent(cc.RichText);
        label.string = gGameData.hints.shift();

        hintNode.addChild(node);

        let posStart = node.position.clone();
        posStart.x = rootNode.width / 2;
        node.setPosition(posStart);
        let posEnd = node.position.clone();
        posEnd.x = -rootNode.width / 2 - node.width;
        cc.tween(node).to(8, {position: posEnd}).call(()=>{
            inShowHint = false;
            hintNode.removeChild(node, true);
            if (gGameData.hints.length > 0) setTimeout(showHint, 1000);
        }).start();
    }
}