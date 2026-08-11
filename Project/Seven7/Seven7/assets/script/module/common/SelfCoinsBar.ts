import { _decorator, Node, Sprite, SpriteFrame, v3, Vec2,Vec3, tween, UITransform } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { RollLabel } from '../../framework/extendComp/RollLabel';
import GameModelMgr from '../mvc/GameModelMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
const { ccclass, property } = _decorator;

@ccclass('SelfCoinsBar')
export class SelfCoinsBar extends GameComponent {
    @property(Node)
    private btn_add: Node;
    @property(Sprite)
    private icon_coin: Sprite;
    @property(RollLabel)
    private lab_valus: RollLabel;
    @property(Node)
    private nod_fly: Node;

    private coinPool: Node[] = [];

    private curValue:number = 0;

    onLoad():void{
        if(this.btn_add){
            this.btn_add.on(Node.EventType.TOUCH_START, this.recharge.bind(this))
        }
        this.on(EventMessage.GAME_COINS_FLY, this.play_coins_fly_anim, this);
    }

    refresh_coins_value(coins:number = null){
        if(coins){
            this.lab_valus.setValue(coins);
            this.curValue = coins;
        }else{
            let myCoins = GameModelMgr.playerModel.get_player_coins();
            this.lab_valus.setValue(myCoins);
            this.curValue = coins;
        }
    }

    refresh_coins_value_by_roll(endValue:number, time:number = 1000, startVaue:number = null){
        let start = startVaue ||  this.curValue;
        this.lab_valus.startRoll(start, endValue, time);
        this.curValue = endValue;
    }

    refresh_coins_icon_by_sp(spriteFrame: SpriteFrame){
        if (spriteFrame) {
            this.icon_coin.spriteFrame = spriteFrame;
        }
    }

    refresh_coins_icon_by_url(){
        let cfg = oops.network.getgetClientConfig();
        if (cfg && cfg.coinUrl && cfg.coinUrl != "") {
            oops.res.loadRemote(cfg.coinUrl, { ext: '.png' }, (error, texture) => {
                if (texture) {
                    this.icon_coin.spriteFrame = SpriteFrame.createWithImage(texture);
                }
            });
        }
    }

    async play_coins_fly_anim(event: string, args: any){
        let startNode = args.startNode;
        if(!startNode){
            return;
        }

        // const container = this.nod_fly || this.node;
        // const containerTrans = container.getComponent(UITransform);
        // const startWorldPos = startNode.getWorldPosition();
        // const startLocalPos = containerTrans.convertToNodeSpaceAR(startWorldPos);
        // const endPos = v3(0, 0, 0);

        // for (let i = 0; i < 20; i++) {
        //     await this.delay(20);
        //     let coinFx = this.get_coin();
        //     if(coinFx){
        //         coinFx.position = v3(startLocalPos.x - 100 + Math.random() * 200, startLocalPos.y - 200 + Math.random() * 200, 0);
        //         coinFx.opacity = 0;
        //         coinFx.active = true;
        //         tween(coinFx).to(0.1, { opacity: 255 }).start();
        //         tween(coinFx).to(0.4, { position: endPos }, { easing: "cubicIn" }).call(() => {
        //             coinFx.active = false;
        //             this.coinPool.push(coinFx);
        //         }).start();
        //     }
        // }

        const container = this.nod_fly || this.node;
        const coinIconNode = this.icon_coin?.node;
        const coinSpriteFrame = this.icon_coin?.spriteFrame;

        if (!container?.isValid || !coinIconNode?.isValid || !coinSpriteFrame || !startNode?.isValid) {
            return;
        }

        const containerTrans = container.getComponent(UITransform);
        const iconParentTrans = coinIconNode.parent?.getComponent(UITransform);
        const iconTrans = coinIconNode.getComponent(UITransform);
        if (!containerTrans || !iconParentTrans || !iconTrans) {
            return;
        }

        const startWorldPos = startNode.getWorldPosition();
        const startLocalPos = containerTrans.convertToNodeSpaceAR(startWorldPos);
        const targetWorldPos = iconParentTrans.convertToWorldSpaceAR(coinIconNode.position);
        const targetLocalPos = containerTrans.convertToNodeSpaceAR(targetWorldPos);
        const iconSize = iconTrans.contentSize;
        const flyCount = 8;
        const flySpeed = 1600;
        const minFlyTime = 0.35;
        const delayStep = 0.045;

        for (let i = 0; i < flyCount; i++) {
            const flyNode = new Node(`fly_coin_${i}`);
            flyNode.layer = container.layer;
            const flyTrans = flyNode.addComponent(UITransform);
            flyTrans.setContentSize(iconSize);

            const flySprite = flyNode.addComponent(Sprite);
            flySprite.spriteFrame = coinSpriteFrame;

            container.addChild(flyNode);
            flyNode.setPosition(startLocalPos);
            flyNode.setScale(0.85, 0.85, 1);

            const angle = Math.PI * 2 * (i / flyCount);
            const spreadRadius = 34 + Math.random() * 18;
            const spreadPos = new Vec3(
                startLocalPos.x + Math.cos(angle) * spreadRadius,
                startLocalPos.y + Math.sin(angle) * spreadRadius,
                startLocalPos.z
            );
            const dx = targetLocalPos.x - spreadPos.x;
            const dy = targetLocalPos.y - spreadPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const flyTime = Math.max(minFlyTime, distance / flySpeed);

            tween(flyNode)
                .delay(i * delayStep)
                .to(0.16, { position: spreadPos, scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .to(flyTime, { position: targetLocalPos, scale: new Vec3(0.55, 0.55, 1) }, { easing: 'quadIn' })
                .call(() => {
                    if (flyNode.isValid) {
                        flyNode.destroy();
                    }
                })
                .start();
        }
    }

    private get_coin(): Node{
        if(this.coinPool.length > 0){
            return this.coinPool.pop();
        }

        const flyNode = new Node("flyCoin");
        const flySprite = flyNode.addComponent(Sprite);
        flySprite.spriteFrame = this.icon_coin.spriteFrame;
        flyNode.setParent(this.nod_fly);
        
        return flyNode;
    }

    private async delay(ms: number) {
        await new Promise((res) => {
            setTimeout(() => {
                res(0)
            }, ms);
        })
    }   

    private recharge() {
        oops.network.recharge();
    }
}


