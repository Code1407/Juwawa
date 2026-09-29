import { _decorator, Asset, isValid, Node, Label, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import GameModelMgr from '../../mvc/GameModelMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
import { UtilTime } from '../../../framework/utils/UtilTime';

const { ccclass, property } = _decorator;

@ccclass('UIRankEnter')
export class UIRankEnter extends GameComponent {
    @property(Node)
    private nodRank: Node;
    @property(Node)
    private nodAward: Node;
    @property(Label)
    private labRank: Label;
    @property(Label)
    private labRankTime: Label;
    @property(Label)
    private labAwardTime: Label;

    private coinSp:SpriteFrame = null;
    private coinTexture: Asset = null;
    private coinSource: Asset = null;
    private rankOpen:boolean = false;
    private timerId = null;
    private time:number = 0;


    onLoad(): void {
        this.nodRank.on(Node.EventType.TOUCH_START, this.on_click_rank_btn.bind(this))
        this.nodAward.on(Node.EventType.TOUCH_START, this.on_click_award_btn.bind(this))
    }

    start() {
        this.on(EventMessage.GAME_NET_CONNECT, this.on_net_connect, this);
        this.on(EventMessage.GAME_RANK_SELF_INFO_UPDATE, this.refresh_self_rank_info, this);
        this.on(EventMessage.GAME_RANK_REWARD_RECEIVE, this.receive_reward, this);

        this.refresh_rank_open();
        if(this.rankOpen){
            GameModelMgr.rankModel.cs_get_today_realtime_rank_info_req();
        }
    }

    private refresh_rank_open(){
        let commomConfig = oops.network.getCommonConfig();
        let rankOpen = commomConfig?.custom["enableRank"] ?? false;
        this.rankOpen = rankOpen;
        if(!rankOpen){
            this.nodRank.active = false;
            this.nodAward.active = false;
            this.clear_timer();
            return;
        }
        this.refresh_coins_icon();
    }

    private refresh_self_rank_info(){
        if(!this.rankOpen){
            return;
        }
        this.refresh_ui_show();
    }

    private receive_reward(event: string, args: any){
        if(args && args.bonus > 0){
            this.nodRank.active = true;
            this.nodAward.active = false;
            oops.message.dispatchEvent(EventMessage.GAME_REWARD_RECEIVE);
            oops.message.dispatchEvent(EventMessage.GAME_COINS_FLY,{startNode:this.node});
            this.delay(1000);
            oops.gui.openAsync(UIID.UI_Rank_Award, args);
        }
    }

    private on_net_connect(){
        this.refresh_rank_open();
        if(this.rankOpen){
            GameModelMgr.rankModel.cs_get_today_realtime_rank_info_req();
            return;
        }
    }

    private refresh_ui_show(){
        GameModelMgr.rankModel.get_next_day_s();
        let rank = GameModelMgr.rankModel.get_self_rank();
        this.labRank.node.active = rank > 0;
        if(rank > 0){
            this.labRank.string = GameModelMgr.rankModel.get_self_rank_label();
        }        
        let canReward = GameModelMgr.rankModel.check_can_reward();
        this.nodRank.active = !canReward;
        this.nodAward.active = canReward;

        this.clear_timer();
        this.time = GameModelMgr.rankModel.get_next_day_s();
        this.labRankTime.string = this.labAwardTime.string = UtilTime.get_time_str(this.time);
        if(this.time > 0){
            this.timerId = setInterval(() => {
                if (!this.node.isValid) {
                    clearInterval(this.timerId);
                    return;
                }
                this.refresh_time();
            }, 1000);
        }
    }


    private refresh_time(){
        this.time = this.time - 1;
        this.labRankTime.string = this.labAwardTime.string = UtilTime.get_time_str(this.time);
        if(this.time <= 0){
            this.refresh_ui_show();
        }
    }

    private refresh_coins_icon(){
        let cfg = oops.network.getgetClientConfig();
        if (cfg && cfg.coinUrl && cfg.coinUrl != "") {
            oops.res.loadRemote(cfg.coinUrl, { ext: '.png' }, (error, imageAsset) => {
                if (imageAsset) {
                    this.releaseCoinIcon();
                    this.coinSp = SpriteFrame.createWithImage(imageAsset);
                    this.coinTexture = this.getSpriteFrameTexture(this.coinSp);
                    this.coinSource = imageAsset as Asset;
                    if (this.coinSp && isValid(this.coinSp)) {
                        this.coinSp.addRef();
                    }
                    if (this.coinTexture && isValid(this.coinTexture)) {
                        this.coinTexture.addRef();
                    }
                    if (this.coinSource && isValid(this.coinSource)) {
                        this.coinSource.addRef();
                    }
                }
            });
        }
    }


    private clear_timer(){
        if(this.timerId){
            clearInterval(this.timerId);
        }
    }

    private on_click_rank_btn() {
        if(!this.rankOpen){
            return;
        }
        oops.gui.openAsync(UIID.UI_Rank_Main, {coinSp: this.coinSp});
    }

    private on_click_award_btn() {
        if(!this.rankOpen){
            return;
        }
        if(GameModelMgr.rankModel.check_can_receive_day_reward()){
            GameModelMgr.rankModel.cs_receive_day_reward_req();
            return;
        }
        if(GameModelMgr.rankModel.check_can_receive_week_reward()){
            GameModelMgr.rankModel.cs_receive_week_reward_req();
        }
    }

    private async delay(ms: number) {
        await new Promise((res) => {
            setTimeout(() => {
                res(0)
            }, ms);
        })
    }

    private releaseCoinIcon() {
        if (this.coinSp && isValid(this.coinSp)) {
            this.coinSp.decRef();
        }
        if (this.coinTexture && isValid(this.coinTexture)) {
            this.coinTexture.decRef();
        }
        if (this.coinSource && isValid(this.coinSource)) {
            this.coinSource.decRef();
        }
        this.coinSp = null;
        this.coinTexture = null;
        this.coinSource = null;
    }

    private getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }

    protected onDestroy(): void {
        this.releaseCoinIcon();
        super.onDestroy();
    }
}


