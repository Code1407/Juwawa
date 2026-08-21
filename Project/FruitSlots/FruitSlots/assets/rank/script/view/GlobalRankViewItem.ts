const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalRankViewItem extends cc.Component {
    @property(cc.Sprite)
    bg: cc.Sprite = null;
    @property(cc.Node)
    isMyself: cc.Node = null;
    @property(cc.Label)
    txRank: cc.Label = null;
    @property(cc.Sprite)
    spRank: cc.Sprite = null;
    @property(cc.Sprite)
    avatar: cc.Sprite = null;
    @property(cc.Label)
    txName: cc.Label = null;
    @property(cc.Label)
    txPoint: cc.Label = null;
    @property(cc.Label)
    txAward: cc.Label = null;
    @property(cc.Sprite)
    awardBg: cc.Sprite = null;
    @property(cc.Sprite)
    awardImgLine: cc.Sprite = null;
    @property(cc.Sprite)
    coin: cc.Sprite = null;
    @property(cc.Node)
    isGet: cc.Node = null;

    private myselfTween: cc.Tween = null;
    private defaultAvatarFrame: cc.SpriteFrame = null;

    onLoad() {
        if (this.avatar && this.defaultAvatarFrame == null)
            this.defaultAvatarFrame = this.avatar.spriteFrame;
        let repeat = cc.tween(<GlobalRankViewItem>this).repeatForever(cc.tween(<GlobalRankViewItem>this).delay(0).call(() => {
            let gameCoin = (<any>window).config?.gameCoin;
            if (gameCoin) {
                this.coin.spriteFrame = gameCoin;
                repeat.stop();
            }
        })).start();
    }

    resetAvatar() {
        if (this.avatar && this.defaultAvatarFrame)
            this.avatar.spriteFrame = this.defaultAvatarFrame;
    }

    setMyselfHighlight(on: boolean) {
        if (this.myselfTween) {
            this.myselfTween.stop();
            this.myselfTween = null;
        }
        if (!this.isMyself) return;
        this.isMyself.active = on;
        if (!on) return;
        this.isMyself.opacity = 255;
        this.myselfTween = cc.tween(this.isMyself).repeatForever(
            cc.tween(this.isMyself)
                .to(1, { opacity: 0 })
                .to(0.25, { opacity: 255 })
        ).start();
    }

    onRecycle() {
        this.setMyselfHighlight(false);
        this.resetAvatar();
    }

}
