import { getRandomNumInt } from "../interface/IMageJackpot";
import { gGameData, IJackpotMarqueeItem } from "../GameData";
import AudioCtrl from "../../shared3/AudioCtrl_shared3";
import { AudioClip } from "../AudioClip_MageJackpot";

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

    function formatWinTime(timestamp: number): string {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "";
        const pad = (value: number) => value < 10 ? `0${value}` : `${value}`;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
            + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function escapeRichText(value: string): string {
        return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function createAvatar(parent: cc.Node, avatarUrl: string, itemWidth: number): void {
        const avatarSize = 32;
        const avatarNode = new cc.Node("avatar");
        avatarNode.setContentSize(avatarSize, avatarSize);
        avatarNode.setPosition(-itemWidth / 2 + avatarSize / 2, 0);
        const avatar = avatarNode.addComponent(cc.Sprite);
        // 防止赋值 SpriteFrame 后按原始图片尺寸覆盖 32×32。
        avatar.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        parent.addChild(avatarNode);
        if (!avatarUrl) return;

        try {
            avatarUrl = decodeURI(avatarUrl);
        } catch (_) {
            // 使用服务端原始地址继续加载，避免异常地址阻断跑马灯。
        }
        cc.assetManager.loadRemote<cc.Texture2D>(avatarUrl, { ext: ".png" }, (err, texture) => {
            if (err || !texture || !avatarNode.isValid) return;
            avatar.spriteFrame = new cc.SpriteFrame(texture);
            // loadRemote 是异步的：赋帧后再次设置，才能防止原图 RAW 尺寸覆盖目标尺寸。
            avatar.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            avatarNode.setContentSize(avatarSize, avatarSize);
            avatarNode.setScale(1, 1);
        });
    }

    function formatJackpotHint(item: IJackpotMarqueeItem): string {
        const name = escapeRichText(item.userName);
        const uid = escapeRichText(item.playerUid);
        const winTime = formatWinTime(item.winTime);
        const prizeType = item.isJackpot ? " jackpot" : "";
        return `🎉 ${name} (ID: ${uid}) ${winTime} won <color=#FEEC51>${item.amount}</color>${prizeType} !🎉`;
    }

    export function showHint() {
        let rootNode = cc.find("Canvas");
        let hintNode = cc.find("Canvas/Hint");
        console.log("跑马灯容器   showHint", gGameData.hints.length);
        
        if (gGameData.hints.length == 0)
        {
            //y轴缩放到0 然后隐藏
            cc.tween(hintNode).to(0.5, {scaleY: 0}).call(()=>{
                hintNode.active = false;
            }).start();
            return;
        }
        hintNode.active = true;
        hintNode.scaleY = 1;

        if (inShowHint) return;
        inShowHint = true;

     
        let labelNode = cc.find("Canvas/Hint/label");

        const hintMsg = gGameData.hints.shift();
        const marqueeItem = gGameData.jackpotMarqueeQueue.shift();
        let node = cc.instantiate(labelNode);
        node.active = true;

        let label = node.getComponent(cc.RichText);
        label.string = marqueeItem ? formatJackpotHint(marqueeItem) : hintMsg;

        // Jackpot 跑马灯需要显示头像，因此将文字和头像放到同一个滚动容器。
        // 非 Jackpot 提示继续走原有文本逻辑。
        let movingNode = node;
        if (marqueeItem) {
            const itemWidth = Math.max(node.width, 576) + 84;
            const marqueeNode = new cc.Node("JackpotMarquee");
            marqueeNode.setContentSize(itemWidth, Math.max(node.height, 64));
            node.parent = marqueeNode;
            node.setPosition(-itemWidth / 2 + 76, 0);
            createAvatar(marqueeNode, marqueeItem.avatarUrl, itemWidth);
            hintNode.addChild(marqueeNode);
            movingNode = marqueeNode;
        } else {
            hintNode.addChild(node);
        }

        let posStart = movingNode.position.clone();
        posStart.x = rootNode.width / 2 + movingNode.width / 2;
        movingNode.setPosition(posStart);
        let posEnd = movingNode.position.clone();
        posEnd.x = -rootNode.width / 2 - movingNode.width;
        cc.tween(movingNode).to(8, {position: posEnd}).call(()=>{
            inShowHint = false;
            hintNode.removeChild(movingNode, true);
            if (gGameData.hints.length > 0) setTimeout(showHint, 1000);
            else{
                 //y轴缩放到0 然后隐藏
                cc.tween(hintNode).to(0.2, {scaleY: 0}).call(()=>{
                    hintNode.active = false;
                }).start();
            }
           
        }).start();
    }
}
