import { _decorator, Asset, isValid, Label, Sprite, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { oops } from 'db://oops-framework/core/Oops';
import GameModelMgr from '../../mvc/GameModelMgr';
import { Utils } from '../../../framework/utils/Utils';


const { ccclass, property } = _decorator;

@ccclass('AvatarItem')
export class AvatarItem extends GameComponent {
    @property(Sprite)
    avatarFrame: Sprite;
    @property(Sprite)
    private avatarIcon: Sprite;
    @property(Label)
    private nameLabel: Label;
    private remoteRefs: { frame: SpriteFrame, texture: Asset, source: Asset }[] = [];

    setSelf() {
        let name = GameModelMgr.playerModel.get_player_name();
        let url = GameModelMgr.playerModel.get_player_avatar_url();

        this.setInfo(name, url);
    }

    setInfo(name: string, avatarUrl: string) {
        this.nameLabel.string = Utils.getName(name, 9);
        if (avatarUrl) {
            oops.res.loadRemote(avatarUrl, { ext: '.png' }, (error, imageAsset) => {
                if (error || !imageAsset || !this.avatarIcon || !isValid(this.avatarIcon)) {
                    return;
                }
                const spriteFrame = SpriteFrame.createWithImage(imageAsset);
                this.avatarIcon.spriteFrame = spriteFrame;
                this.retainRemoteFrame(spriteFrame, imageAsset as Asset);
            });
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


