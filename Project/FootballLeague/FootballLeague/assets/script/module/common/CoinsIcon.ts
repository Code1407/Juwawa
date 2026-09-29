import { _decorator, Asset, isValid, Sprite, SpriteFrame } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

@ccclass('CoinsIcon')
export class CoinsIcon extends GameComponent {
    @property(Sprite)
    private coinsIocn: Sprite = null;
    private heldFrame: SpriteFrame = null;
    private heldTexture: Asset = null;
    private heldSource: Asset = null;

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
            oops.res.loadRemote(cfg.coinUrl, { ext: '.png' }, (error, imageAsset) => {
                if (imageAsset && this.coinsIocn && isValid(this.coinsIocn)) {
                    const spriteFrame = SpriteFrame.createWithImage(imageAsset);
                    this.coinsIocn.spriteFrame = spriteFrame;
                    this.retainFrame(spriteFrame, imageAsset as Asset);
                }
            });
        }
    }

    private retainFrame(frame: SpriteFrame, source: Asset) {
        this.releaseFrame();
        this.heldFrame = frame;
        this.heldTexture = this.getSpriteFrameTexture(frame);
        this.heldSource = source;

        if (this.heldFrame && isValid(this.heldFrame)) {
            this.heldFrame.addRef();
        }
        if (this.heldTexture && isValid(this.heldTexture)) {
            this.heldTexture.addRef();
        }
        if (this.heldSource && isValid(this.heldSource)) {
            this.heldSource.addRef();
        }
    }

    private releaseFrame() {
        const frame = this.heldFrame;
        const texture = this.heldTexture;
        const source = this.heldSource;
        this.heldFrame = null;
        this.heldTexture = null;
        this.heldSource = null;

        if (frame && isValid(frame)) {
            frame.decRef();
        }
        if (texture && isValid(texture)) {
            texture.decRef();
        }
        if (source && isValid(source)) {
            source.decRef();
        }
    }

    private getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }

    protected onDestroy(): void {
        if (this.coinsIocn && isValid(this.coinsIocn)) {
            this.coinsIocn.spriteFrame = null;
        }
        this.releaseFrame();
        super.onDestroy();
    }
}


