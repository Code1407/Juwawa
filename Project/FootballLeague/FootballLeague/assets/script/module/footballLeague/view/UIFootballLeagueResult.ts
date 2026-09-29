import { _decorator, Asset, isValid, Node, v3, find, SpriteFrame, Label, Vec3, Sprite, tween, Tween, } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { BundleName } from '../../../framework/commom/FrameDefine';
import GameModelMgr from '../../mvc/GameModelMgr';
import { flyIcon } from './FlyIcon';
import { oops } from 'db://oops-framework/core/Oops';
import { Utils } from '../../../framework/utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueResult')
export class UIFootballLeagueResult extends GameComponent {

    @property(Sprite)
    private img_reward: Sprite;

    @property(Label)
    private lb_time: Label;

    @property(Label)
    private lb_round: Label;

    @property(Label)
    private lb_MyUserId: Label;

    @property(Label)
    private lb_win: Label;

    @property(Label)
    private lb_bet: Label;

    @property(Node)
    private nod_ranks: Node;

    @property(Node)
    private root: Node;

    @property(Node)
    private flyToNode: Node;
    @property(Node)
    private flyFromNode: Node;
    @property(SpriteFrame)
    private iconSprite: SpriteFrame;
    @property(Node)
    private tem: Node;
    @property(Node)
    private flyRoot: Node;

    private timerId = null;
    private hidePos = -1000;
    private showPos = 160;
    private remoteRefs: { frame: SpriteFrame, texture: Asset, source: Asset }[] = [];

    show() {
        this.root.active = true;
        this.root.setPosition(0, this.hidePos, 0);

        let roundId = GameModelMgr.footballLeagueModel.get_cur_round();
        let round = Utils.getRound(roundId);
        let zhuanpanId = GameModelMgr.footballLeagueModel.get_zhuanpan_id();

        this.setIcon(zhuanpanId);
        this.setRanks();
        this.showCountDown();

        this.lb_round.string = oops.language.getLanguage("common_result_text", round);
        this.lb_win.string = GameModelMgr.footballLeagueModel.getCurWinNum().toLocaleString();
        this.lb_bet.string = GameModelMgr.footballLeagueModel.getSelfBetTotalAllScene().toLocaleString();
        this.playAni(this.showPos, this.playeCoinFly.bind(this));


        //自己的ID
        this.lb_MyUserId.string = "ID:" + oops.network.getUid();
    }

    private showCountDown() {
        this.clearTimer();
        let timer = 4;
        this.lb_time.string = `(${timer})`;

        this.timerId = setInterval(() => {
            timer--;
            if (timer <= 0) {
                this.lb_time.string = `(0)`;
                this.close();
                return;
            }
            this.lb_time.string = `(${timer})`;
        }, 1000)
    }

    private playAni(toPosY: number, func: Function = null) {
        Tween.stopAllByTarget(this.root);
        setTimeout(() => {
            tween(this.root)
                .to(0.5, { position: v3(0, toPosY, 0) }, { easing: 'linear' })
                .call(
                    () => {
                        if (func) {
                            func();
                        }
                    }
                )
                .start();
        }, 500);
    }

    private playeCoinFly() {
        if (GameModelMgr.footballLeagueModel.getCurWinNum() > 0) {
            flyIcon(this.flyFromNode, this.flyToNode, this.iconSprite, this.tem, this.flyRoot, 8);
        }
    }

    private setIcon(zhuanpanId) {
        const rewardPath = `PlistImage/TeamImage${GameModelMgr.footballLeagueModel.get_team_id() || 1}/qd_${zhuanpanId}`;   //对应得场景
        super.setSprite(this.img_reward, rewardPath, BundleName.SkinDefault);
    }

    private setRanks() {
        for (let i = 0; i < this.nod_ranks.children.length; ++i) {
            this.nod_ranks.children[i].active = false;
        }

        let rank3 = GameModelMgr.footballLeagueModel.get_round_rank3_info();
        if (rank3 && rank3.length > 0) {
            for (let i = 0; i < rank3.length; i++) {
                let data = rank3[i];

                let lb_win = find("win/Label", this.nod_ranks.children[i]).getComponent(Label);
                lb_win.string = (data.score || 0).toLocaleString();

                let lb_name = find("name", this.nod_ranks.children[i]).getComponent(Label);
                lb_name.string = Utils.getName(data.name, 9);

                let icon = find("head/icon", this.nod_ranks.children[i]).getComponent(Sprite);
                if (data.avatarUrl && icon) {
                    oops.res.loadRemote(data.avatarUrl, { ext: '.png' }, (error, texture) => {
                        if (error || !texture || !isValid(icon)) {
                            return;
                        }
                        const spriteFrame = SpriteFrame.createWithImage(texture);
                        icon.spriteFrame = spriteFrame;
                        this.retainRemoteFrame(spriteFrame, texture as Asset);
                    });
                }
                this.nod_ranks.children[i].active = true;
            }
        }
    }

    private clearTimer(){
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private close() {
        this.clearTimer();
        this.playAni(this.hidePos, () => {
            this.root.active = false;
        });
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


