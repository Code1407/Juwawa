import { Eventer } from '../../common/Eventer';
import { EventMessage } from '../../common/EventMessage';
import { GameUtil } from '../../common/GameUtil';
import { Singleton } from '../../common/Singleton';
import { EMailRewardState, MailDataClient } from "./MailDataClient";

export default class MailProxy extends Singleton<MailProxy>() {
    private mails: Map<number, MailDataClient> = new Map();
    private cfgMail: any = null;
    private mailOpen:boolean = false;

    async init(){
        if(this.cfgMail){
            return true;
        }
        this.cfgMail = await GameUtil.loadJson("gameConfig/Mail");
        if(!this.cfgMail){
            console.error("MailProxy init failed, cfgMail is nil");
            return false;
        } 
        return true; 
    }

    clear(): void {
       this.mails.clear();
    }

    set_mail_list_data(mailList: Array<MailData>) {
        this.mails.clear();
        for (let mailData of mailList) {
            let mailDataClient = new MailDataClient(mailData, this.cfgMail);
            this.mails.set(mailData.mailId, mailDataClient);
        }
    }

    set_new_mail(mailData){
        let mailDataClient = new MailDataClient(mailData, this.cfgMail);
        this.mails.set(mailData.mailId, mailDataClient);
    }

    set_mail_read(mailList: Array<number>) {
        for (let mailId of mailList) {
            if (this.mails.has(mailId)) {
                let mailDataClient = this.mails.get(mailId);
                mailDataClient.update_read_sate(true);
            }else {
                console.error("set_mail_read: mail is nil, mailId: " + mailId);
            }
        }
    }

    mail_delete(mailList: Array<number>) {
        for (let mailId of mailList) {
            if (this.mails.has(mailId)) {
                this.mails.delete(mailId);
            }else {
                console.error("mail_delete: mail is nil, mailId: " + mailId);
            }
        }
    }

    set_mail_reward_received(mailId: number) {
        if (this.mails.has(mailId)) {
            let mailDataClient = this.mails.get(mailId);
            mailDataClient.update_reward_sate(EMailRewardState.Received);
            mailDataClient.update_read_sate(true);
        }else {
            console.error("set_mail_reward_state: mail is nil, mailId: " + mailId);
        }
    }

    set_mail_open_state(state:boolean){
        this.mailOpen = state;
        Eventer.getInstance().emit(EventMessage.GAME_MAIL_ENTER_STATE_UPDATE);
    }

    get_mail_open_state(){
        return this.mailOpen;
    }

    get_mails(): Map<number, MailDataClient> {
        return this.mails;
    }

    get_mail_data(mailId:number): MailDataClient {
        if (this.mails.has(mailId)) {
            return this.mails.get(mailId);
        }
        return null;
    }
}


