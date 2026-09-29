import { EResourceType } from "../../framework/commom/FrameDefine";
import { Utils } from "../../framework/utils/Utils";
import { TableMail } from "../../table/TableMail";

export enum EMailRewardState {
    NoReward = 0, //没有奖励
    NoReceive,    //有奖未领取
    Received,     //已领取
}

export class MailDataClient {
    private _mailData:MailData = null;
    private _cfgMail:TableMail = new TableMail();

    constructor(mailData: MailData){
        if(!mailData){
           console.error("mailData is nil");
           return;
        }
        this._mailData = mailData;
        this._cfgMail.init(this._mailData.mailCfgId);
   }

    get_mail_id(): number {
        return this._mailData.mailId;
    }

    get_mail_cfg_id(): number {
        return this._mailData.mailCfgId;
    }

    get_game_id(): number{
        return this._mailData.gameId;
    }

    get_send_time(): number {
        return this._mailData.sendTime;
    }

    get_reward_state(): number {
        return this._mailData.rewardState;
    }

    get_extra_json(){
        return this._mailData.extraJson;
    }

    get_type(){
        return this._cfgMail.Type;
    }

    get_reward_items(): Array<ResourceData>{
        return this._mailData.rewards;
    }

    get_round(){
        let rewards = this.get_reward_items();
        if(rewards && rewards.length > 0){
           for(let i = 0; i < rewards.length; i++){
                if(rewards[i].resType == EResourceType.Coins && rewards[i].roundId && rewards[i].roundId > 0){
                    let round = Utils.getRound(rewards[i].roundId);
                    return round
                }
           }
        }
    }

    // 2026/08/20 12:22
    get_send_time_format(){
        let sendTime = this.get_send_time();
        let date = new Date(sendTime * 1000);
        let labTime1 = Utils.getFormateDate(date, "yyyy-M-d");
        let labTime2 = Utils.getFormateDate(date, "hh:mm");
        return labTime1 + " " + labTime2;
    }

    get_view_type(){
        return this._cfgMail.ViewType;
    }

    get_tab_lang_key(){
        return this._cfgMail.TabLangKey;
    }

    get_content_lang_key(){
        return this._cfgMail.ContentLangKey;
    }

    get_game_name_lang_key(){
        let gameid = this.get_game_id();
        if(gameid && gameid > 0){
            return "common_game_name_" + gameid;
        }
    }

    get_icon_path(){
        return this._cfgMail.IconPath;
    }

    is_read(): boolean {
        return this._mailData.read;
    }

    is_show_rp(){
        return (!this.is_read()) || (this.can_receive());
    }

    can_receive():boolean{
        return this.get_reward_state() == EMailRewardState.NoReceive;
    }

    update_reward_sate(state: number) {
       this._mailData.rewardState = state;
    }

    update_read_sate(state: boolean) {
       this._mailData.read = state;
    }
}


