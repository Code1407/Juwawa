import { _decorator, find, Node } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import GameModelMgr from '../../mvc/GameModelMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UIMailEnter')
export class UIMailEnter extends GameComponent {
    @property(Node)
    private redPoint: Node;

    private root:Node;

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.on_click_btn);
        this.root = find("Root", this.node);
        this.root.active = false;
    }

    start() {
        this.on(EventMessage.GAME_MAIL_DATA_UPDATE, this.on_mail_data_update, this);

        let cfg = oops.network.getgetClientConfig();
        let openMail = cfg && cfg.custom && cfg.custom.enableMail || false;
        //this.node.active = openMail;
        if(openMail){
            GameModelMgr.mailModel.cs_mail_list_req();
        }
    }


    private on_mail_data_update() {
        this.on_redpoint_update();
    }

    private on_redpoint_update() {
        let mails = GameModelMgr.mailModel.get_mails();
        this.root.active = mails.size > 0;
        if(mails.size <= 0){
            return;
        }
        let haveRp = false;
        for (const mail of mails.values()) {
            if(mail.is_show_rp()) {
                haveRp = true;
                break;
            }
        }
        this.redPoint.active = haveRp;
    }

    private on_click_btn() {
       oops.gui.openAsync(UIID.UI_Mail_Main);
    }
}


