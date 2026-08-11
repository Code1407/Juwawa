import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

@ccclass('CoinsIcon')
export class CoinsIcon extends GameComponent {
    @property(Sprite)
    private coinsIocn: Sprite = null;

    start(): void {
        if (!this.coinsIocn) {
            this.coinsIocn = this.node.getComponent(Sprite);
        }

        this.on(EventMessage.GAME_NET_CONNECT, this.on_net_connect, this);
        this.refreshCoinsIcon();
    }

    private on_net_connect() {
        this.refreshCoinsIcon();
    }

    refreshCoinsIcon() {
        let cfg = oops.network.getgetClientConfig();
        if (cfg && cfg.coinUrl && cfg.coinUrl != "") {
            oops.res.loadRemote(cfg.coinUrl, { ext: '.png' }, (error, texture) => {
                if (texture) {
                    this.coinsIocn.spriteFrame = SpriteFrame.createWithImage(texture);
                }
            });
        }
    }
}


