import { Eventer } from "../../../common/Eventer";
import { EventMessage } from "../../../common/EventMessage";
import MailModel from "../MailModel";
import UIMailMain from "./UIMailMain";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIMailEnter extends cc.Component {
    @property(cc.Node)
    private nodEnter: cc.Node = null;
    @property(cc.Node)
    private redPoint: cc.Node = null;
    @property(UIMailMain)
    private uiMailMain : UIMailMain = null;

    onLoad () {
        this.nodEnter.on(cc.Node.EventType.TOUCH_START, this.on_click_btn.bind(this));

        Eventer.getInstance().on(EventMessage.GAME_MAIL_ENTER_STATE_UPDATE, this.on_mail_data_update, this);
        Eventer.getInstance().on(EventMessage.GAME_MAIL_DATA_UPDATE, this.on_mail_data_update, this);
        Eventer.getInstance().on(EventMessage.GAME_MAIL_REWARD_RECEIVED, this.on_mail_reward_received, this);

        this.nodEnter.active = false;
        this.uiMailMain.node.active = false;
    }

    start() {
        let openMail = MailModel.getInstance().get_mail_open_state();
        //this.nodEnter.active = openMail;
        if(openMail){
            this.on_mail_data_update();
        }
        this.setScale();
    }

    private on_mail_data_update() {
        let openMail = MailModel.getInstance().get_mail_open_state();
        if(!openMail){
            return;
        }
        // if(!this.nodEnter.active){
        //     this.nodEnter.active = true;
        // }
        this.on_redpoint_refresh();
        if(this.uiMailMain.node.active){
            this.uiMailMain.refresh();
        }
    }

    private on_mail_reward_received(args:any){
        if(!args){
            return;
        }
        this.uiMailMain.on_reward_received(args);
    }
     
    private on_redpoint_refresh() {
        let mails = MailModel.getInstance().get_mails();
        this.nodEnter.active = mails.size > 0;
        if(mails.size <= 0){
            return;
        }
        let haveRp = false;
        let mailList = Array.from(mails.values());
        for (const mail of mailList) {
            if(mail.is_show_rp()) {
                haveRp = true;
                break;
            }
        }
        this.redPoint.active = haveRp;
    }

    setScale() {
        let cvs = cc.director.getScene().getComponentInChildren(cc.Canvas);
        let ins: cc.Node = this.uiMailMain.node;
        let fitSize = Math.min(cvs.designResolution.width, cvs.designResolution.height);
        ins.setScale(cc.Vec3.ONE.multiplyScalar(fitSize / 720));
    }

    private on_click_btn() {
       this.uiMailMain.open_mail_main_view();
    }

    protected onDestroy(): void {
        Eventer.getInstance().offName(EventMessage.GAME_MAIL_ENTER_STATE_UPDATE,this);
        Eventer.getInstance().offName(EventMessage.GAME_MAIL_DATA_UPDATE,this);
        Eventer.getInstance().offName(EventMessage.GAME_MAIL_REWARD_RECEIVED,this);
    }
}
