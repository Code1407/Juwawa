import { oops } from "db://oops-framework/core/Oops";
import IMvc from "../mvc/IMvc";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { EResourceType } from "../../framework/commom/FrameDefine";

export default class MailSystem extends IMvc {

    init(): void {
        oops.network.listenMsg("CsMailListResp", this.cs_mail_list_resp);
        oops.network.listenMsg("ScNewMailPush", this.sc_new_mail_push);
        oops.network.listenMsg("CsMailReadResp", this.cs_mail_read_resp);
        oops.network.listenMsg("CsMailDeleteResp", this.cs_mail_delete_resp);
        oops.network.listenMsg("CsMailRewardReceiveResp", this.cs_mail_reward_receive_resp);
    }

    cs_mail_list_req() {
        oops.network.pushMsg("CsMailListReq", {});
    }
    //邮件全量推送
    private cs_mail_list_resp(msg: CsMailListResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailListResp is nil");
            return;
        }
        GameProxyMgr.mailProxy.set_mail_list_data(msg.mails);
        oops.message.dispatchEvent(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    private sc_new_mail_push(msg: ScNewMailPush) {
        if (!msg || !msg.mail) {
            console.error("ScNewMailPush is nil");
            return;
        }
        GameProxyMgr.mailProxy.set_new_mail(msg.mail);
        oops.message.dispatchEvent(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    cs_mail_read_req(mails: Array<number>) {
        let msg: CsMailReadReq = {
            mails: mails
        };
        oops.network.pushMsg("CsMailReadReq", msg);
    }
    private cs_mail_read_resp(msg: CsMailReadResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailReadResp is nil");
            return;
        }
        GameProxyMgr.mailProxy.set_mail_read(msg.mails);
        oops.message.dispatchEvent(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    cs_mail_delete_req(mails: Array<number>) {
        let msg: CsMailDeleteReq = {
            mails: mails
        };
        oops.network.pushMsg("CsMailDeleteReq", msg);
    }
    cs_mail_delete_all_read_req() {
        oops.network.pushMsg("CsMailDeleteAllReadReq", {});
    }
    private cs_mail_delete_resp(msg: CsMailDeleteResp) {
        if (!msg || !msg.mails) {
            console.error("CsMailDeleteResp is nil");
            return;
        }
        GameProxyMgr.mailProxy.mail_delete(msg.mails);
        oops.message.dispatchEvent(EventMessage.GAME_MAIL_DATA_UPDATE);
    }

    cs_mail_reward_req(mails: Array<number>) {
        let msg: CsMailRewardReceiveReq = {
            mails: mails
        };
        oops.network.pushMsg("CsMailRewardReceiveReq", msg);
    }
    private cs_mail_reward_receive_resp(msg: CsMailRewardReceiveResp) {
        if(msg.errorCode && msg.errorCode != 0){
            oops.gui.showErrorCode(msg.errorCode);
            return; 
        }

        if (!msg || !msg.mailId || !msg.reward) {
            console.error("CsMailRewardReceiveResp is nil");
            return;
        }
        GameProxyMgr.mailProxy.set_mail_reward_received(msg.mailId);
        if(msg.reward.resType == EResourceType.Coins && msg.reward.resId == 1 && msg.reward.resCount > 0){
            let args = {mailId : msg.mailId, res: msg.reward};
            oops.message.dispatchEvent(EventMessage.GAME_REWARD_RECEIVE, args);
        }
        oops.message.dispatchEvent(EventMessage.GAME_MAIL_DATA_UPDATE);
    }
}


