import { Singleton } from '../../common/Singleton';
import MailProxy from "./MailProxy";
import PureClient from '../../PureClient/PureClient.min.js';
import { Eventer } from '../../common/Eventer';
import { EventMessage } from '../../common/EventMessage';
import { EResourceType } from '../../common/CommonDefine';

export default class MailSystem extends Singleton<MailSystem>() {
     /**网络插件对象 */
    private jsNet: PureClient.JsNet = null;

    init(jsNet: any): void{
        if(this.jsNet === jsNet){
            return;
        }
        this.jsNet = jsNet;

        this.listenMsg("CsMailListResp", this.cs_mail_list_resp);
        this.listenMsg("ScNewMailPush", this.sc_new_mail_push);
        this.listenMsg("CsMailReadResp", this.cs_mail_read_resp);
        this.listenMsg("CsMailDeleteResp", this.cs_mail_delete_resp);
        this.listenMsg("CsMailRewardReceiveResp", this.cs_mail_reward_receive_resp);
    }

    //邮件全量请求
    cs_mail_list_req() {
        this.pushMsg("CsMailListReq", {});
    }
    private async cs_mail_list_resp(msg: CsMailListResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailListResp is nil");
            return;
        }

        MailProxy.getInstance().clear();
        MailProxy.getInstance().set_mail_list_data(msg.mails);
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    //新邮件推送
    private sc_new_mail_push(msg: ScNewMailPush) {
        if (!msg || !msg.mail) {
            console.error("ScNewMailPush is nil");
            return;
        }
        MailProxy.getInstance().set_new_mail(msg.mail);
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    //邮件已读请求
    cs_mail_read_req(mails: Array<number>) {
        let msg: CsMailReadReq = {
            mails: mails
        };
        this.pushMsg("CsMailReadReq", msg);
    }
    private cs_mail_read_resp(msg: CsMailReadResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailReadResp is nil");
            return;
        }
        MailProxy.getInstance().set_mail_read(msg.mails);
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    //邮件删除请求
    cs_mail_delete_req(mails: Array<number>) {
        let msg: CsMailDeleteReq = {
            mails: mails
        };
        this.pushMsg("CsMailDeleteReq", msg);
    }
    cs_mail_delete_all_read_req() {
        this.pushMsg("CsMailDeleteAllReadReq", {});
    }
    private cs_mail_delete_resp(msg: CsMailDeleteResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailDeleteResp is nil");
            return;
        }
        MailProxy.getInstance().mail_delete(msg.mails);
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    //邮件请求领奖
    cs_mail_reward_req(mails: Array<number>) {
        let msg: CsMailRewardReceiveReq = {
            mails: mails
        };
        this.pushMsg("CsMailRewardReceiveReq", msg);
    }
    private cs_mail_reward_receive_resp(msg: CsMailRewardReceiveResp) {
        if (!msg || !msg.mailId || !msg.reward) {
            console.error("CsMailRewardReceiveResp is nil");
            return;
        }
        if(msg.errorCode && msg.errorCode !== 0){
            return;
        }
        MailProxy.getInstance().set_mail_reward_received(msg.mailId);
        if(msg.reward.resType == EResourceType.Coins && msg.reward.resId == 1 && msg.reward.resCount > 0){
            let args = {mailId : msg.mailId, res: msg.reward};
            Eventer.getInstance().emit(EventMessage.GAME_MAIL_REWARD_RECEIVED, args);
        }
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_DATA_UPDATE);
    }


    get_client_config(){
        if (!this.jsNet) {
            console.error("get_client_config jsNet is null");
            return;
        }
        return this.jsNet.getClientConfig();
    }

    private pushMsg(msgName: string, msg: {}) {
        if (!this.jsNet) {
            console.error("pushMsg MailSystem jsNet is null");
            return;
        }
        return this.jsNet.pushMsg(msgName, msg);
    }
   
    private listenMsg<T>(name: string, func: (msg: T) => void) {
        if (!this.jsNet) {
            console.error("listenMsg MailSystem jsNet is null");
            return;
        }
        return this.jsNet.listenMsg(name, func);
    }
}


