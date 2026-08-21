import { Singleton } from '../../common/Singleton';
import MailSystem from './MailSystem';
import MailProxy from './MailProxy';
import { MailDataClient, EMailRewardState } from './MailDataClient';
import { ELang } from '../../common/CommonDefine';
import { mailLangMap } from './lang/Path_Mail';

export default class MailModel extends Singleton<MailModel>() {
//#region NetMsg
    cs_mail_list_req() {
        MailSystem.getInstance().cs_mail_list_req();
    }

    cs_mail_read_req(mails: Array<number>) {
        MailSystem.getInstance().cs_mail_read_req(mails);
    }

    cs_mail_delete_all_read_req() {
        MailSystem.getInstance().cs_mail_delete_all_read_req();
    }

    cs_mail_reward_req(mails: Array<number>) {
        MailSystem.getInstance().cs_mail_reward_req(mails);
    }
// #endregion

    async mail_system_init(jsNet: any) {
        if(jsNet === null){
            console.error("mail_system_init jsNet is nil");
            return;
        }
        MailSystem.getInstance().init(jsNet);

        let cfg = this.get_client_config();
        let openMail = cfg && cfg.custom && cfg.custom.enableMail || false;
        MailProxy.getInstance().set_mail_open_state(openMail);
        if(!openMail){
            return;
        }
        let initSuc = await MailProxy.getInstance().init();
        if(initSuc){
            this.cs_mail_list_req();
        }
    }

    get_mails(): Map<number, MailDataClient> {
        return MailProxy.getInstance().get_mails();
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
        return MailProxy.getInstance().get_mail_data(mailId);
    }

    get_client_config(){
        return MailSystem.getInstance().get_client_config();
    }

    get_mail_lang(langKey: string){
        let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
        if (lang && lang.length > 2){
            lang = lang.substring(0, 2);
        }
        lang = Number(ELang[lang]);
            
        if (mailLangMap[lang] == null){
            lang = Number(ELang.en);
        }
        
        let mailLang = mailLangMap[lang];
        if(mailLang){
            return mailLang.lang[langKey];
        }
        return "";
    }

    check_have_can_delete_mail():boolean{
        let mails = this.get_mails();
        if(mails.size <= 0){
            return false;
        }
        let mailList = Array.from(mails.values());
        for (const mail of mailList) {
            if(!mail.is_show_rp()){
                return true
            }
        }
        return false;
    }

    get_mail_open_state():boolean{
        return MailProxy.getInstance().get_mail_open_state();
    }

}
