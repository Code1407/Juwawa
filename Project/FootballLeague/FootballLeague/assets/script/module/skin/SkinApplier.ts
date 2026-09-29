import { _decorator, SpriteFrame, Sprite } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import SkinMgr from './SkinMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
const { ccclass } = _decorator;

@ccclass('SkinApplier')
export class SkinApplier extends GameComponent {

    onLoad() {
        this.on(EventMessage.GAME_SKIN_UPDATE, this.updateSkin, this);
    }

    updateSkin(): void {
        let preBundleName = SkinMgr.getBundleNameBySkin(SkinMgr.preSkin);
        let preBundle = oops.res.getBundle(preBundleName);

        let newBundleName = SkinMgr.getBundleNameBySkin();
        if (preBundle && newBundleName) {
            this.updateSpriteSkin(preBundle, newBundleName);
        }
    }

    //图片更换
    async updateSpriteSkin(preBundle, newBundleName) {
        const sprites = this.node.getComponentsInChildren(Sprite);
        for (const sp of sprites) {
            const sf = sp.spriteFrame;
            if (!sf) continue;

            const uuid = (sf as any).uuid || (sf as any)._uuid;
            if (!uuid) continue;

            const info = preBundle.getAssetInfo(uuid);

            const path = info ? (info as any).path : '';
            if (!path) continue;

            const res = await super.loadAsync(newBundleName, path, SpriteFrame)
            if (res) {
                sp.spriteFrame = res;
            }
        }
    }
}


