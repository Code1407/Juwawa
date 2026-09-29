import { _decorator, Asset, Label, SpriteFrame, isValid } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { Sprite } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { Utils } from '../../../framework/utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueRankItem')
export class UIFootballLeagueRankItem extends GameComponent {

    @property(Label)
    private rankLB: Label;

    @property(Label)
    private nameLb: Label;

    @property(Label)
    private revenueLB: Label;

    @property(Sprite)
    private profile: Sprite;

    @property(Sprite)
    private coinsIcon: Sprite;

    initUI: boolean = false;
    private remoteRefs: { frame: SpriteFrame, texture: Asset, source: Asset }[] = [];

    init(data: RankData) {
        if (!data) {
            return;
        }

        if (this.initUI) {
            return;
        }
        this.initUI = true;

        this.rankLB.string = data.rankNum.toString();
        this.revenueLB.string = data.score.toLocaleString();

        this.nameLb.string = Utils.getName(data.name, 7);

        if (data.avatarUrl && this.profile) {
            oops.res.loadRemote(data.avatarUrl, { ext: '.png' }, (error, texture) => {
                if (error || !texture) {
                    return;
                }
                if (!isValid(this.node) || !isValid(this.profile)) {
                    return;
                }
                const spriteFrame = SpriteFrame.createWithImage(texture);
                this.profile.spriteFrame = spriteFrame;
                this.retainRemoteFrame(spriteFrame, texture as Asset);
            });
        }

    }

    update_icon_coins(coinsSp: SpriteFrame) {
        if (coinsSp) {
            this.coinsIcon.spriteFrame = coinsSp;
        }
    }

    private retainRemoteFrame(frame: SpriteFrame, source: Asset) {
        const texture = this.getSpriteFrameTexture(frame);
        if (frame && isValid(frame)) {
            frame.addRef();
        }
        if (texture && isValid(texture)) {
            texture.addRef();
        }
        if (source && isValid(source)) {
            source.addRef();
        }
        this.remoteRefs.push({ frame, texture, source });
    }

    private releaseRemoteFrames() {
        for (let i = 0; i < this.remoteRefs.length; i++) {
            const ref = this.remoteRefs[i];
            if (ref.frame && isValid(ref.frame)) {
                ref.frame.decRef();
            }
            if (ref.texture && isValid(ref.texture)) {
                ref.texture.decRef();
            }
            if (ref.source && isValid(ref.source)) {
                ref.source.decRef();
            }
        }
        this.remoteRefs.length = 0;
    }

    private getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }

    protected onDestroy(): void {
        this.releaseRemoteFrames();
        super.onDestroy();
    }
}


