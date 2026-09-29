import Game from "../Game";
import { gGameData } from "../GameData";
import { EGameStatus } from "../../shared3/interface/IGame";
import RepeatBetUI from "../ui/RepeatBetUI";
import Audio from "../Audio";

export namespace Effect {

    export function FlyChip(fromNode: cc.Node, toNode: cc.Node, sprite: cc.SpriteFrame, frequency: number = 1, setFromNode: cc.Node = null) {

        if (gGameData.Gamefocus == false) {
            return;
        }
        // Audio.Instance.playSendBet();

        let flyNode = cc.instantiate(cc.find("Template/FlyChip"));
        flyNode.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame = sprite;
        if (toNode.children.length > 2000) return;
        toNode.addChild(flyNode);
        flyNode.active = true;
        flyNode["setFromPos"] = setFromNode == null ? fromNode : setFromNode;
        // flyNode.setSiblingIndex(100);//让其在同一父节点下最后渲染
        // 落点已在目标容器的局部坐标系中，无需添加无 sprite 的辅助节点。
        const toLocal = cc.v2(Math.random() * 75 - 25, 0.2 * 150 - 75);
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = toNode.convertToNodeSpaceAR(fromWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 1500;

        flyNode.setPosition(fromLocal);
        cc.tween(flyNode)
            .to(flyTime, { position: toLocal }, { easing: 'quadOut' })
            .call(() => {
                cc.tween(flyNode).to(0.3, { opacity: 0 }).start();
            })
            .start();

        if (--frequency == 0) return;
        if (frequency > 0 && gGameData.roundStep.status == EGameStatus.bet) {
            let flyCount = Math.floor(gGameData.roundStep.remainSecond * 1000 / 700);
            if (flyCount < frequency) {
                frequency = flyCount;
            }
            setTimeout(() => {
                FlyChip(fromNode, toNode, sprite, frequency);
            }, 200);
        }
    }
    export function FlyChipSingle(fromNode: cc.Node, toNode: cc.Node, sprite: cc.SpriteFrame, frequency: number = 0, setFromNode: cc.Node = null): cc.Node {
        if (gGameData.Gamefocus == false) {
            return;
        }
        Audio.Instance.playSendBet();
        let flyNode = cc.instantiate(cc.find("Template/FlyChip"));
        flyNode.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame = sprite;
        if (toNode.children.length > 2000) return;
        toNode.addChild(flyNode);
        flyNode.active = true;
        flyNode["setFromPos"] = setFromNode == null ? fromNode : setFromNode;
        // flyNode.setSiblingIndex(100);//让其在同一父节点下最后渲染
        const toLocal = cc.v2(0.5 * 150 - 75, 0.5 * 150 - 75);

        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = toNode.convertToNodeSpaceAR(fromWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 1500;

        flyNode.setPosition(fromLocal);
        cc.tween(flyNode)
            .to(flyTime, { position: toLocal }, { easing: 'quadOut' })
            .call(() => {
                cc.tween(flyNode).to(0.3, { opacity: 0 }).start();
            })
            .start();

        return flyNode;
    }

    export function FlyChip2(fromNode: cc.Node, toNode: cc.Node, parentNode: cc.Node): number {
        if (gGameData.Gamefocus == false) {
            return 0;
        }
        if (!cc.isValid(fromNode, true) || !cc.isValid(toNode, true) || !cc.isValid(parentNode, true)
            || !cc.isValid(fromNode.parent, true) || !cc.isValid(toNode.parent, true)) {
            return 0;
        }
        if (!Game.Instance.soundPlayed) { // 只在第一次调用时播放声音
            Audio.Instance.playSendBet();
            Game.Instance.soundPlayed = true;
        }
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = parentNode.convertToNodeSpaceAR(fromWorld);

        let toWorld = toNode.parent.convertToWorldSpaceAR(toNode.position);
        let toLocal = parentNode.convertToNodeSpaceAR(toWorld);

        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 1200;

        cc.tween(fromNode)
            .to(0.5, { opacity: 255 })
            .to(flyTime, { position: toLocal })
            .call(() => { fromNode.destroy() })
            .start();
        return 0.5 + flyTime;
    }
}
