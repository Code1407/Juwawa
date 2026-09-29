import { _decorator, Asset, find, isValid, Label, Sprite, sp, Node, SpriteFrame } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { UIID } from '../../common/GameUIConfig';
import { RichText } from 'cc';
import GameModelMgr from '../../mvc/GameModelMgr';
import { Utils } from '../../../framework/utils/Utils';
import { GameGlobal } from '../../common/GameGlobal';
import { BundleName } from '../../../framework/commom/FrameDefine';
const { ccclass, property } = _decorator;

@ccclass('UIRankAward')
export class UIRankAward extends GameComponent {
    @property(Label)
    private userNames: Label[] = [];
    @property(Sprite)
    private userIcon: Sprite[] = [];
    @property(RichText)
    private labContent: RichText = null;
    @property(sp.Skeleton)
    private skFirework: sp.Skeleton = null;

    private isDayRank:boolean = false;
    private remoteRefs: { frame: SpriteFrame, texture: Asset, source: Asset }[] = [];

    onAdded(args: any) {
        this.isDayRank = args.isDayRank;
        return true;
    }

    onLoad(): void{
        var close = find("btn_close", this.node);
        close.on(Node.EventType.TOUCH_START, this.on_click_close)
    }

    start() {
        let msg = this.isDayRank && GameModelMgr.rankModel.get_day_rank_award_data() || GameModelMgr.rankModel.get_week_rank_award_data();
        this.labContent.string = oops.language.getLanguage("common_rank_congratulations", msg.rank, this.get_rank_str(msg.rank), Math.floor(msg.bonus));
        const rankUsers = Array.isArray(msg.rankUsers) ? msg.rankUsers : [];
        for (let i = 0; i < Math.min(rankUsers.length, this.userNames.length, this.userIcon.length); i++) {
            let user = rankUsers[i];
            user.name = decodeURI(user.name);
            let avatarUrl = user.avatar ?? user.avatar;
            let spIcon = this.userIcon[i];
            this.userNames[i].string = Utils.getName(user.name, 8);
            if(avatarUrl){
                oops.res.loadRemote(avatarUrl, { ext: '.png' }, (error, texture) => {
                    if (error || !texture) {
                        return;
                    }
                    if (!spIcon || !isValid(spIcon)) {
                        return;
                    }
                    const spriteFrame = SpriteFrame.createWithImage(texture);
                    spIcon.spriteFrame = spriteFrame;
                    this.retainRemoteFrame(spriteFrame, texture as Asset);
                });
            }
        }

        if(this.isDayRank){
            GameModelMgr.rankModel.clear_day_rank_award_data();
        }else{
            GameModelMgr.rankModel.clear_week_rank_award_data();
        }
        GameGlobal.playAudioByComp(this, "audios/firework", BundleName.Rank,1,true);
        GameModelMgr.rankModel.cs_get_today_realtime_rank_info_req();
    }

    private get_rank_str(rank:number){
        if(rank == 1){
            return "st";
        }else if(rank == 2){
            return "nd";
        }else if(rank == 3){
            return "rd";
        }else{
            return "th";
        }
    }

    private on_click_close(){
        oops.gui.remove(UIID.UI_Rank_Award);
    }

    protected onEnable(): void {
        //this.auFirework.play();
        this.skFirework.setAnimation(0, "animation2", true);
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


