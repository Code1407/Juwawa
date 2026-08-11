import { _decorator, find, Node, sp, Label, v3 } from 'cc';
import { MailDataClient, EMailRewardState } from "../MailDataClient";
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { oops } from 'db://oops-framework/core/Oops';
import { Utils } from "db://assets/script/framework/utils/Utils"
import { UIResourceItem } from './UIResourceItem';
import { BundleName, EResourceType } from '../../../framework/commom/FrameDefine';
import GameModelMgr from '../../mvc/GameModelMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { RichText } from 'cc';
const { ccclass, property } = _decorator;

export enum MAIL_CONTENT_VIEW {
    COMMON                = 1, //通用邮件
}

export enum MAIL_CFG_ID {
    AWARD_REISSUE_HAND               = 1, //手动补发奖励邮件
    AWARD_REISSUE_AUTO               = 2, //自动补发奖励邮件
}


@ccclass('UIMailContent')
export class UIMailContent extends GameComponent {
    @property(sp.Skeleton)
    private receiveSp: sp.Skeleton;
    @property(Node)
    private received: Node;
    @property(RichText)
    private labContent: RichText;
    @property(Label)
    private labTime: Label;
    @property(Node)
    private rewardsLayout: Node;
    @property(Node)
    private rewardsRoot: Node;
    
    private rewardsPool: Array<UIResourceItem> = []; 
    private closeFunc:Function = null;
    private mailData:MailDataClient = null;

     onLoad(): void {
        var close = find("common/btn_close", this.node);
        close.on(Node.EventType.TOUCH_END, this.on_click_close.bind(this))

        this.receiveSp.node.on(Node.EventType.TOUCH_START, this.on_click_receive.bind(this))
    }

    set_close_func(closeFunc:Function){
        this.closeFunc = closeFunc;
    }

    async init_data(mailData: MailDataClient){
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
            oops.message.dispatchEvent(EventMessage.GAME_COINS_FLY,{startNode:nod});
        }
    }

    private show_content(){
        let gameNameKey = this.mailData.get_game_name_lang_key();
        let gameName = gameNameKey && oops.language.getLangByID(gameNameKey) ||  "";
        if(this.mailData.get_mail_cfg_id() == MAIL_CFG_ID.AWARD_REISSUE_HAND){
            this.labContent.string = oops.language.getLanguage(this.mailData.get_content_lang_key(), gameName);
        }else if(this.mailData.get_mail_cfg_id() == MAIL_CFG_ID.AWARD_REISSUE_AUTO){        
            let round = this.mailData.get_round() || "";
            let time = this.mailData.get_send_time_format() || "";
            this.labContent.string = oops.language.getLanguage(this.mailData.get_content_lang_key(), gameName, time, round);
        }else{
            this.labContent.string = oops.language.getLangByID(this.mailData.get_content_lang_key());
        }
    }

    private show_time(){
        let time = this.mailData.get_send_time();
        const date = new Date(time * 1000);
        let labTime = Utils.getFormateDate(date, "yyyy-MM-d");
        this.labTime.string = labTime;
    }

    private async show_rewards(){
        let rewards = this.mailData.get_reward_items();
        let labTimePosx = this.labTime.node.position.x;
        if(!rewards || Object.keys(rewards).length === 0){
            this.rewardsRoot.active = false;
            this.labTime.node.position = v3(labTimePosx, -240)
            return;
        }

        this.rewardsRoot.active = true;
        this.labTime.node.position = v3(labTimePosx, -97);

        this.rewardsPool.forEach((item)=>{
            item.node.active = false;
        })
        if(rewards.length > 0){
            for (let i = 0; i < rewards.length; i++)
            {
                let resItem: UIResourceItem = null;
                if(i < this.rewardsPool.length){
                    resItem = this.rewardsPool[i];
                }else{
                    let go = await super.createPrefabNodeAsync("resources/prefabs/ResourceItem", BundleName.Mail);
                    if(go){
                        go.parent = this.rewardsLayout;
                        resItem = go.getComponent(UIResourceItem);
                        this.rewardsPool.push(resItem);
                    }
                }
                if(resItem){                  
                    resItem.init(rewards[i]);
                    resItem.node.active = true;
                }
            }
        }
    }

    private show_reward_btn(){
        let rewardState = this.mailData.get_reward_state();
        this.receiveSp.node.active = rewardState == EMailRewardState.NoReceive;
        this.received.active = rewardState == EMailRewardState.Received;
    }

    private get_coins_item_nod():Node{
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
            GameModelMgr.mailModel.cs_mail_reward_req(mials);
        }
    }

    private on_click_close(){
        this.node.active = false;
        if(this.closeFunc){
            this.closeFunc();
        }
    }
}


