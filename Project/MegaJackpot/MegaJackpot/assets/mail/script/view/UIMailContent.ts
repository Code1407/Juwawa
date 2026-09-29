import { EResourceType } from "../../../common/CommonDefine";
import { Eventer } from "../../../common/Eventer";
import { EventMessage } from "../../../common/EventMessage";
import { GameUtil } from "../../../common/GameUtil";
import { MailDataClient, EMailRewardState } from "../MailDataClient";
import MailModel from "../MailModel";
import UIResourceItem from "./UIResourcesItem";

const {ccclass, property} = cc._decorator;

export enum MAIL_CONTENT_VIEW {
    COMMON                = 1, //通用邮件
}

export enum MAIL_CFG_ID {
    AWARD_REISSUE_HAND               = 1, //手动补发奖励邮件
    AWARD_REISSUE_AUTO               = 2, //自动补发奖励邮件
}

@ccclass
export default class UIMailContent extends cc.Component {
    @property(sp.Skeleton)
    private receiveSp: sp.Skeleton = null;
    @property(cc.Node)
    private received: cc.Node = null;

    @property(cc.RichText)
    private labContent: cc.RichText = null;
    @property(cc.Label)
    private labTime: cc.Label = null;

    @property(cc.Node)
    private rewardsLayout: cc.Node = null;
    @property(cc.Node)
    private rewardsRoot: cc.Node = null;

    @property(UIResourceItem)
    private resItem: UIResourceItem = null;

    private rewardsPool: Array<UIResourceItem> = []; 
    private closeFunc:Function = null;
    private mailData:MailDataClient = null;

    onLoad(): void {
        var close = cc.find("common/btn_close", this.node);
        close.on(cc.Node.EventType.TOUCH_END, this.on_click_close.bind(this))

        this.receiveSp.node.on(cc.Node.EventType.TOUCH_START, this.on_click_receive.bind(this))
    }

     set_close_func(closeFunc:Function){
        this.closeFunc = closeFunc;
    }

    init_data(mailData: MailDataClient){
        if(!mailData){
            return;
        }
        this.mailData = mailData;

        if(this.mailData.get_view_type() == MAIL_CONTENT_VIEW.COMMON){
            this.show_content();
            this.show_time();
            this.show_rewards();
            this.show_reward_btn();
        }

        this.node.active = true;
    }

    refresh(){
        if(!this.mailData || this.node.active == false){
            return;
        }
        this.show_reward_btn();
    }

    play_coins_fly_eff(){
        let nod = this.get_coins_item_nod();
        if(nod){
            Eventer.getInstance().emit(EventMessage.GAME_COINS_FLY, {startNode:nod});
        }
    }

    private show_content(){
        let gameId = this.mailData.get_game_id();
        let gameNameKey = "common_game_name_" + gameId;
        let gameName = MailModel.getInstance().get_mail_lang(gameNameKey);
        let lang = MailModel.getInstance().get_mail_lang(this.mailData.get_content_lang_key());

         if(this.mailData.get_mail_cfg_id() == MAIL_CFG_ID.AWARD_REISSUE_HAND){
            this.labContent.string = GameUtil.getLanguage(lang, gameName) || "";
        }else if(this.mailData.get_mail_cfg_id() == MAIL_CFG_ID.AWARD_REISSUE_AUTO){        
            let round = this.mailData.get_round() || "";
            let time = this.mailData.get_send_time_format() || "";
            this.labContent.string = GameUtil.getLanguage(lang, gameName, time, round) || "";
        }else{
            this.labContent.string = lang;
        }     
    }

    private show_time(){
        let time = this.mailData.get_send_time();
        const date = new Date(time * 1000);
        let labTime = GameUtil.getFormateDate(date, "yyyy-MM-d");
        this.labTime.string = labTime;
    }

    private show_rewards(){
        let rewards = this.mailData.get_reward_items();
        let labTimePosx = this.labTime.node.position.x;
        if(!rewards || Object.keys(rewards).length === 0){
            this.rewardsRoot.active = false;
            this.labTime.node.position = cc.v3(labTimePosx, -240)
            return;
        }

        this.rewardsRoot.active = true;
        this.labTime.node.position = cc.v3(labTimePosx, -97);

        this.rewardsPool.forEach((item)=>{
            item.node.active = false;
        })
        if(rewards.length > 0){
            for (let i = 0; i < rewards.length; i++)
            {
                let item: UIResourceItem = null;
                if(i < this.rewardsPool.length){
                    item = this.rewardsPool[i];
                }else{
                    let go = cc.instantiate(this.resItem.node)
                    if(go){
                        go.parent = this.rewardsLayout;
                        item = go.getComponent(UIResourceItem);
                        this.rewardsPool.push(item);
                    }
                }
                if(item){                  
                    item.init(rewards[i]);
                    item.node.active = true;
                }
            }
        }
    }

    private show_reward_btn(){
        let rewardState = this.mailData.get_reward_state();
        this.receiveSp.node.active = rewardState == EMailRewardState.NoReceive;
        this.received.active = rewardState == EMailRewardState.Received;
    }

    private get_coins_item_nod():cc.Node{
        for (let i = 0; i < this.rewardsPool.length; i++)
        {
            let item = this.rewardsPool[i];
            if(item.node.active){
                let data = item.get_res_data();
                if(data && data.resType == EResourceType.Coins){
                    return item.node;
                }
            }
        }
        return null;
    }

    private on_click_receive(){
        if(!this.mailData){
            return;
        }
        if(this.mailData.can_receive()){
            this.receiveSp.setAnimation(0, "1", false);
            let mials: Array<number> = [];
            mials.push(this.mailData.get_mail_id())
            MailModel.getInstance().cs_mail_reward_req(mials);
        }
    }

    private on_click_close(){
        this.node.active = false;
        if(this.closeFunc){
            this.closeFunc();
        }
    }

}
