import { _decorator, Node, Tween, Sprite, Label, UITransform, UIOpacity,tween, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import GameModelMgr from '../../mvc/GameModelMgr';
import { Color } from 'cc';
import { Utils } from '../../../framework/utils/Utils';
import { oops } from 'db://oops-framework/core/Oops';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
const { ccclass, property } = _decorator;

@ccclass('UIRankPlayerItem')
export class UIRankPlayerItem extends GameComponent {
    @property(Node)
    private nod_top3: Node;
    @property(Node)
    private nod_top3Outside: Node;
    @property(Node)
    private nod_get: Node;
    @property(Node)
    private nod_self: Node;
    @property(Node)
    private nod_self_out3bg: Node;

    @property(UITransform)
    private trans_self_eff: UITransform;
    @property(UIOpacity)
    private opacity_self_eff: UIOpacity;

    @property(Sprite)
    private bg_item_top3: Sprite;
    @property(Sprite)
    private bg_award_top3: Sprite;
    @property(Sprite)
    private bg_ranknum_top3: Sprite;
    @property(Sprite)
    private bg_line_top3: Sprite;
    @property(Sprite)
    private avatar_top3: Sprite;

    @property(Label)
    private lab_sore: Label;
    @property(Label)
    private lab_award: Label;
    @property(Sprite)
    private img_coin: Sprite;

    @property(Label)
    private lab_top3_name: Label;
    @property(Label)
    private lab_top3Outside_name: Label;
    @property(Label)
    private lab_top3Outside_rank: Label;
    @property(Sprite)
    private avatar_top3Outside: Sprite;

    private myselfTween: Tween<UIOpacity> = null;
    private getBgFunc:Function = null;
    private selfUid = "";
    private selfRank = 0;

    onLoad(): void{
        this.on(EventMessage.GAME_AVATAR_LOAD_SUC, this.refresh_avatar, this);
    }

    refresh(playerData: RankUserInfo, coinSp:SpriteFrame, getBgFunc:Function) {
        if(!playerData){
            return;
        }
        this.getBgFunc = getBgFunc;
        this.selfUid = playerData.uid;
        this.selfRank = playerData.rank;

        if(coinSp){
            this.img_coin.spriteFrame = coinSp;
        }

        this.lab_sore.string = playerData.score.toLocaleString();
        this.lab_award.string = playerData.bonus.toString();

        let isTop3 = this.selfRank <= 3;
        let isSelf = GameModelMgr.playerModel.check_is_self_by_uid(playerData.uid);

        this.nod_top3.active = isTop3;
        this.nod_top3Outside.active = !isTop3;
        this.nod_get.active = playerData.get;

        let avatar = oops.avatarMgr.getAvatarSp(playerData.uid, playerData.avatar);

        if(isTop3){
            this.lab_top3_name.string = Utils.getName(playerData.name, 9);
            this.lab_sore.color = Color.BLACK;

            if(this.getBgFunc){
                let bgAry = this.getBgFunc(this.selfRank);
                if(bgAry.length == 4){
                    this.bg_item_top3.spriteFrame = bgAry[0];
                    this.bg_award_top3.spriteFrame = bgAry[1];
                    this.bg_ranknum_top3.spriteFrame = bgAry[2];
                    this.bg_line_top3.spriteFrame = bgAry[3];
                }
            }
            if(avatar){
                this.avatar_top3.spriteFrame = avatar;
            }        
        }else{
            this.lab_top3Outside_rank.string = this.selfRank.toString();
            this.lab_top3Outside_name.string = Utils.getName(playerData.name, 9);
            this.lab_sore.color = Color.WHITE;
            if(avatar){
                this.avatar_top3Outside.spriteFrame = avatar;
            } 
        }
 
       this.show_self_highlight(isSelf, isTop3);
    }

    private refresh_avatar(event: string, args: any){
        if(this.node.isValid && this.selfUid == args.avatarId){
            let avatar = oops.avatarMgr.getAvatarSp(this.selfUid);
            if(!avatar){
                return;
            }
            if(this.selfRank <= 3){
                this.avatar_top3.spriteFrame = avatar;
            }else{
                this.avatar_top3Outside.spriteFrame = avatar;
            }
        }
    }

    private show_self_highlight(isSelf: boolean, isTop3: boolean){
        let effH = isTop3? 88 : 68;
        this.nod_self.active = isSelf;

        if (this.myselfTween) {
            this.myselfTween.stop();
            this.myselfTween = null;
        }

        if(isSelf){
            this.nod_self_out3bg.active = !isTop3;
            this.trans_self_eff.height = effH;
            this.opacity_self_eff.opacity = 255;
            this.myselfTween = tween(this.opacity_self_eff).repeatForever(
            tween(this.opacity_self_eff)
                .to(1, { opacity: 0 })
                .to(0.25, { opacity: 255 })
            ).start();
        }
    }
}


