import { _decorator, Component, Label } from 'cc';
import { MailDataClient } from "../MailDataClient";
import { oops } from 'db://oops-framework/core/Oops';
import { Utils } from "db://assets/script/framework/utils/Utils"

const { ccclass, property } = _decorator;

@ccclass('UIMailCommon')
export class UIMailCommon extends Component {
    @property(Label)
    private labContent: Label;
    @property(Label)
    private labTime: Label;

    private mailData: MailDataClient = null; 

    show_content(mailData: MailDataClient){
        if(!mailData) {
            return;
        }

        this.labContent.string = oops.language.getLangByID(this.mailData.get_content_lang_key());
        
        let time = this.mailData.get_send_time();
        const date = new Date(time * 1000);
        let labTime = Utils.getFormateDate(date, "yyyy-MM-d");
        this.labTime.string = labTime;
    }
}


