import GameProxyMgr from "../mvc/GameProxyMgr";
import GameSystemMgr from "../mvc/GameSystemMgr";
import IMvc from "../mvc/IMvc";
import { EMailRewardState, MailDataClient } from "./MailDataClient";


export default class MailModel extends IMvc {

    cs_mail_list_req() {
        GameSystemMgr.mailSystem.cs_mail_list_req();
    }

    cs_mail_read_req(mails: Array<number>) {
        GameSystemMgr.mailSystem.cs_mail_read_req(mails);
    }

    cs_mail_delete_all_read_req() {
        GameSystemMgr.mailSystem.cs_mail_delete_all_read_req();
    }

    cs_mail_reward_req(mails: Array<number>) {
        GameSystemMgr.mailSystem.cs_mail_reward_req(mails);
    }

    get_mails(): Map<number, MailDataClient> {
        return GameProxyMgr.mailProxy.get_mails();
    }

    get_mail_list_and_sort(): Array<MailDataClient> {
        let mails_map = this.get_mails();
        if(mails_map.size > 0){
            let mailsAry = Array.from(mails_map.values());
            mailsAry.sort((a: MailDataClient, b: MailDataClient) => {
                let priorityA = 3;
                if(a.get_reward_state() == EMailRewardState.NoReceive){
                    priorityA = 0;
                }
                else if(!a.is_read()){
                    priorityA = 1;
                }
                else if(a.get_reward_state() == EMailRewardState.Received){
                    priorityA = 2;
                }

                let priorityB = 3;
                if(b.get_reward_state() == EMailRewardState.NoReceive){
                    priorityB = 0;
                }
                else if(!b.is_read()){
                    priorityB = 1;
                }
                else if(b.get_reward_state() == EMailRewardState.Received){
                    priorityB = 2;
                }

                if(priorityA != priorityB){
                    return priorityA - priorityB;
                }

                return b.get_send_time() - a.get_send_time();
            });

            return mailsAry;
        }

        return [];
    }

    get_mail_data(mailId: number): MailDataClient {
        return GameProxyMgr.mailProxy.get_mail_data(mailId);
    }

    check_have_can_delete_mail():boolean{
        let mails = this.get_mails();
        if(mails.size <= 0){
            return false;
        }

        for (const mail of mails.values()) {
            if(!mail.is_show_rp()){
                return true
            }
        }
        return false;
    }
}
