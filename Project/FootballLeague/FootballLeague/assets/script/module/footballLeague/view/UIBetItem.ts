import { _decorator, Asset, isValid, Label, Sprite, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { BundleName } from '../../../framework/commom/FrameDefine';
import GameModelMgr from '../../mvc/GameModelMgr';
import { oops } from 'db://oops-framework/core/Oops';

const { ccclass, property } = _decorator;

@ccclass('UIBetItem')
export class UIBetItem extends GameComponent {
    private static rewardFrameCache: Map<string, { frame: SpriteFrame, texture: Asset }> = new Map();
    private static rewardFrameLoading: Map<string, Promise<SpriteFrame>> = new Map();

    @property(Sprite)
    rewardIcon: Sprite;

    @property(Sprite)
    coinsIcon: Sprite;

    @property(Label)
    moneyLB: Label;

    private _rewardIconRequestId: number = 0;

    init(rewardID: number, num: number, teamId?: number) {
        const requestId = this.beginRewardIconUpdate();
        this.moneyLB.string = num.toLocaleString('en-US');

        if (!rewardID || rewardID == undefined || rewardID <= 0) {
            return;
        }
        const rewardPath = `PlistImage/TeamImage${teamId || GameModelMgr.footballLeagueModel.get_team_id() || 1}/qd_${rewardID}`;   //对应得场景
        this.loadRewardIcon(rewardPath, requestId);
    }

    update_icon_coins(coinsSp: SpriteFrame) {
        if (coinsSp && this.coinsIcon && isValid(this.coinsIcon)) {
            this.coinsIcon.spriteFrame = coinsSp;
        }
    }

    clearForReuse() {
        this._rewardIconRequestId++;
        this.clearIconSprites();
        if (this.moneyLB && isValid(this.moneyLB)) {
            this.moneyLB.string = "";
        }
    }

    private beginRewardIconUpdate(): number {
        this._rewardIconRequestId++;
        this.clearIconSprites();
        return this._rewardIconRequestId;
    }

    private async loadRewardIcon(path: string, requestId: number) {
        const spriteFrame = await UIBetItem.getRewardFrame(path);
        if (
            requestId !== this._rewardIconRequestId ||
            !spriteFrame ||
            !isValid(this.node) ||
            !this.rewardIcon ||
            !isValid(this.rewardIcon)
        ) {
            return;
        }

        this.rewardIcon.spriteFrame = spriteFrame;
    }

    private clearIconSprites() {
        if (this.rewardIcon && isValid(this.rewardIcon)) {
            this.rewardIcon.spriteFrame = null;
        }
        if (this.coinsIcon && isValid(this.coinsIcon)) {
            this.coinsIcon.spriteFrame = null;
        }
    }

    private static async getRewardFrame(path: string): Promise<SpriteFrame> {
        const cached = UIBetItem.rewardFrameCache.get(path);
        if (cached && cached.frame && isValid(cached.frame)) {
            return cached.frame;
        }

        let loading = UIBetItem.rewardFrameLoading.get(path);
        if (!loading) {
            loading = oops.res.loadAsync(BundleName.SkinDefault, path, SpriteFrame).then((spriteFrame: SpriteFrame) => {
                if (!spriteFrame) {
                    return null;
                }

                const texture = UIBetItem.getSpriteFrameTexture(spriteFrame);
                spriteFrame.addRef();
                if (texture && isValid(texture)) {
                    texture.addRef();
                }
                UIBetItem.rewardFrameCache.set(path, { frame: spriteFrame, texture });
                UIBetItem.rewardFrameLoading.delete(path);
                return spriteFrame;
            });
            UIBetItem.rewardFrameLoading.set(path, loading);
        }
        return loading;
    }

    private static getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }

    protected onDestroy(): void {
        this.clearForReuse();
        super.onDestroy();
    }
}
