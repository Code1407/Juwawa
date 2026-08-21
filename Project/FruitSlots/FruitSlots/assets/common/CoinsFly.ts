import { Eventer } from "./Eventer";
import { EventMessage } from "./EventMessage";


const {ccclass, property} = cc._decorator;

@ccclass
export default class CoinsFly extends cc.Component {
    @property(cc.Sprite)
    private coinIocn: cc.Sprite = null;

    private coinPool: cc.Node[] = [];
    private refreshTime:number = 5;
    private timer:number = 0;

    onLoad():void{
        Eventer.getInstance().on(EventMessage.GAME_COINS_FLY, this.play_coins_fly_anim, this);
    }

    start(): void {
        this.refresh_eff_root_pos();
    }

    async play_coins_fly_anim(args: any){
        let startNode = args && args.startNode;
        if(!startNode){
            return;
        }

        const startWorldPos = startNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const startLocalPos = this.node.convertToNodeSpaceAR(startWorldPos);
        const endPos = cc.v3(0, 0, 0);

        for (let i = 0; i < 20; i++) {
            await this.delay(20);
            let coinFx = this.get_coin();
            if(coinFx){
                coinFx.position = cc.v3(startLocalPos.x - 100 + Math.random() * 200, startLocalPos.y - 200 + Math.random() * 200, 0);
                coinFx.opacity = 0;
                coinFx.active = true;
                cc.tween(coinFx).to(0.1, { opacity: 255 }).start();
                cc.tween(coinFx).to(0.4, { position: endPos }, { easing: "cubicIn" }).call(() => {
                    coinFx.active = false;
                    this.coinPool.push(coinFx);
                }).start();
            }
        }
    }

    private get_coin(): cc.Node{
        if(this.coinPool.length > 0){
            return this.coinPool.pop();
        }

        const flyNode = new cc.Node("flyCoin");
        const flySprite = flyNode.addComponent(cc.Sprite);
        flySprite.spriteFrame = this.coinIocn.spriteFrame;
        flyNode.setParent(this.node);
        flyNode.setContentSize(this.coinIocn.node.getContentSize());
        return flyNode;
    }

    private refresh_eff_root_pos(){
        if(this.coinIocn.node && this.node.active){
            const worldPos = this.coinIocn.node.convertToWorldSpaceAR(cc.v3(0, 0, 0));
            const localPos = this.node.parent.convertToNodeSpaceAR(worldPos);
            this.node.setPosition(localPos);
        }
    }

    update(dt: number): void {
        if(this.coinIocn.node && this.node.active){
            if(this.timer < this.refreshTime){
                this.timer += dt;
            }
            if(this.timer >= this.refreshTime){
                this.refresh_eff_root_pos();
                this.timer = 0;
            }
        }    
    }

    private async delay(ms: number) {
        await new Promise((res) => {
            setTimeout(() => {
                res(0)
            }, ms);
        })
}   

    protected onDestroy(): void {
        Eventer.getInstance().offName(EventMessage.GAME_COINS_FLY,this);
    }
}
