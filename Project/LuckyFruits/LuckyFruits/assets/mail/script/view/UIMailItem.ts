import { ELang } from "../../../common/CommonDefine";
import { GameUtil } from "../../../common/GameUtil";
import { textsMap } from "../lang/Path_Mail";
import { EMailRewardState, MailDataClient } from "../MailDataClient";
import MailModel from "../MailModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIMailItem extends cc.Component {

    @property(cc.Sprite)
    private mailIcon: cc.Sprite = null;
    @property(cc.Label)
    private labTitle: cc.Label = null;
    @property(cc.Label)
    private labTime: cc.Label = null;
    @property(cc.Label)
    private labReceive: cc.Label = null;
    @property(cc.Label)
    private labReceived: cc.Label = null;
    @property(cc.Node)
    private redPoint: cc.Node = null;
    @property(sp.Skeleton)
    private receiveSp: sp.Skeleton = null;
    @property(cc.Node)
    private received: cc.Node;

    private mailData: MailDataClient = null;
    private clickFunc:Function = null;

    onLoad(){
        this.receiveSp.node.on(cc.Node.EventType.TOUCH_START, this.on_click_receive.bind(this))
        this.node.on(cc.Node.EventType.TOUCH_END, this.on_click_item.bind(this))
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

        this.labTitle.string = MailModel.getInstance().get_mail_lang(mailData.get_tab_lang_key());

        let time = this.mailData.get_send_time();
        const date = new Date(time * 1000);
        let labTime = GameUtil.getFormateDate(date, "yyyy-MM-d");
        this.labTime.string = labTime;

        let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
        if (lang && lang.length > 2) lang = lang.substring(0, 2);
        lang = Number(ELang[lang]);
        if (textsMap[lang] == null) lang = Number(ELang.en);
        this.labReceive.string = textsMap[lang.toString()].path2;
        this.labReceived.string = textsMap[lang.toString()].path1;
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
            MailModel.getInstance().cs_mail_reward_req(mials);
        }
    }
}
