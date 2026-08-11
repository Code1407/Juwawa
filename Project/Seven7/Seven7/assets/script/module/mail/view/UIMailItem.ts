import { _decorator, Sprite, Node, Label, sp } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { EMailRewardState, MailDataClient } from "../MailDataClient";
import { oops } from 'db://oops-framework/core/Oops';
import { Utils } from "db://assets/script/framework/utils/Utils"
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import GameModelMgr from '../../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

@ccclass('UIMailItem')
export class UIMailItem extends GameComponent {
    @property(Sprite)
    private mailIcon: Sprite;
    @property(Label)
    private labTitle: Label;
    @property(Label)
    private labTime: Label;
    @property(Node)
    private redPoint: Node;
    @property(sp.Skeleton)
    private receiveSp: sp.Skeleton;
    @property(Node)
    private received: Node;

    private mailData: MailDataClient = null;
    private clickFunc:Function = null;

    onLoad(): void {
        this.receiveSp.node.on(Node.EventType.TOUCH_START, this.on_click_receive.bind(this))
        this.node.on(Node.EventType.TOUCH_END, this.on_click_item.bind(this))
    }

    refresh(mailData: MailDataClient, clickFunc:Function) {
        if(!mailData) {
            return;
        }
        this.mailData = mailData;
        this.clickFunc = clickFunc;
        this.redPoint.active = this.mailData.is_show_rp();

        let rewardState = this.mailData.get_reward_state();
        this.receiveSp.node.active = rewardState == EMailRewardState.NoReceive;
        this.received.active = rewardState == EMailRewardState.Received;

        this.labTitle.string = oops.language.getLangByID(this.mailData.get_tab_lang_key());

        let time = this.mailData.get_send_time();
        const date = new Date(time * 1000);
        let labTime = Utils.getFormateDate(date, "yyyy-MM-d");
        this.labTime.string = labTime;
    }

    get_mail_id(){
        return this.mailData.get_mail_id();
    }

    get_coins_fly_start_nod(){
        return this.mailIcon.node;
    }

    private on_click_item(){
        if(this.clickFunc){
            this.clickFunc(this.mailData);
        }
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
}


