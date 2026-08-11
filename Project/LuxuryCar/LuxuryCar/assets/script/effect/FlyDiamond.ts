import Game from "../Game";
import ChangeChip from "../image/ChangeChip";
import ChipMoveNodeUI from "../ui/ChipMoveNodeUI";


export namespace Effect {
    function getChip(spriteFrameId: number): cc.SpriteFrame {
        let chips = Game.Instance && Game.Instance.chips;
        if (!chips || typeof chips.getChip !== "function") {
            return null;
        }
        return chips.getChip(spriteFrameId);
    }

    export function FlyDiamond(fromNode: cc.Node, toNode: cc.Node,spriteFrameId:number, frequency: number = 1) {
        let rootNode = cc.find("Canvas");
    
        // let flyNode = cc.instantiate(cc.find("Template/FlyDiamond"));
    
        let flyNode = cc.instantiate(cc.find("Template/FlyDiamond/Diamond"));
        flyNode.name = "Clone(FlyDiamond)";
        flyNode.parent = rootNode;
        flyNode.active = true;
        flyNode.scale = 0.5
        let chip = getChip(spriteFrameId);
        if (chip) {
            flyNode.getComponent(cc.Sprite).spriteFrame = chip;
        }
        flyNode.setSiblingIndex(100);
    
        // from
        let fromWorld = fromNode.parent.convertToWorldSpaceAR(fromNode.position);
        let fromLocal = rootNode.convertToNodeSpaceAR(fromWorld);
        // to
        let toWorld = toNode.parent.convertToWorldSpaceAR(toNode.position);
        let toLocal = rootNode.convertToNodeSpaceAR(toWorld);
    
        // 匀速运动，需要计算距离
        let distance = Math.sqrt(Math.pow(toLocal.x - fromLocal.x, 2) + Math.pow(toLocal.y - fromLocal.y, 2));
        let flyTime = distance / 1500;
    
        // fly
        flyNode.setPosition(fromLocal);
        cc.tween(flyNode).to(flyTime, {position: toLocal}).to(1,{opacity:0}).call(()=> {
            flyNode.destroy();
        }).start();
        cc.tween(flyNode).to(flyTime/2, {scale: 0.8}).to(flyTime/2, {scale: 0.5}).start();

        // if (--frequency == 0) return;
        // setTimeout(()=> {
        //     FlyDiamond(fromNode, toNode, frequency);
        // }, 100);
    }
    export function FlyDiamond2(fromNode: cc.Node, toNode: cc.Node,spriteFrameId:number,tragetIndex:number,needHide:boolean = true,speed:number = 1500):cc.Node {
        
        let flyNode = cc.instantiate(cc.find("Template/FlyDiamond/Diamond"));
        flyNode.name = "FlyDiamond";
        flyNode.parent = ChipMoveNodeUI.Instance.node;
        flyNode["fromNode"] = fromNode;
        flyNode["tragetIndex"] = tragetIndex;
        flyNode["spriteFrameId"] = spriteFrameId;
        flyNode.active = true;
        flyNode.scale = 0.5
        let chip = getChip(spriteFrameId);
        if (chip) {
            flyNode.getComponent(cc.Sprite).spriteFrame = chip;
        }
        flyNode.setSiblingIndex(100);

         // 匀速运动，需要计算距离
         let distance = Math.sqrt(Math.pow(toNode.x - fromNode.x, 2) + Math.pow(toNode.y - fromNode.y, 2));
         let flyTime = distance / speed;

        let x=toNode.position.x + Math.random()*60-40;
        let y=toNode.position.y + Math.random()*40-30;
     
         // fly
         flyNode.setPosition(fromNode.position);
         cc.tween(flyNode).to(flyTime, {position: cc.v3(x,y)}).call(()=> {
             //flyNode.destroy();
             if(needHide){
                cc.tween(flyNode).to(1,{opacity:0}).start();
             }
         }).start();
         return flyNode;
    }
    export function FlyDiamond3(flyNode: cc.Node, toNode: cc.Node) {
         // 匀速运动，需要计算距离
         let distance = Math.sqrt(Math.pow(toNode.x - flyNode.x, 2) + Math.pow(toNode.y - flyNode.y, 2));
         let flyTime = distance / 1500;
     
         // fly
         //flyNode.setPosition(fromNode.position);
         cc.tween(flyNode).to(flyTime, {position: toNode.position}).to(1,{opacity:0}).call(()=> {
             flyNode.destroy();
         }).start();
    }
}
