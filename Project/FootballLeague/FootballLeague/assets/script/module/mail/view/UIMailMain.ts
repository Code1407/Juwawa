import { _decorator, Node, find, sp, isValid } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
import List from 'db://assets/script/framework/list/List';
import { UIMailItem } from './UIMailItem';
import GameModelMgr from '../../mvc/GameModelMgr';
import { MailDataClient } from "../MailDataClient";
import { UIMailContent } from './UIMailContent';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

@ccclass('UIMailMain')
export class UIMailMain extends GameComponent {
    @property(UIMailContent)
    private mailContent: UIMailContent = null;
    @property(List)
    private list: List = null;
    @property(Node)
    private bgRoot: Node = null;
    @property(Node)
    private tabItemRoot: Node = null;
    @property(sp.Skeleton)
    private btnDelete: sp.Skeleton;

    private listData: any;

    onLoad(): void {
        var close = find("Root/bg_main/btn_close", this.node);
        close.on(Node.EventType.TOUCH_END, this.on_click_close)
        this.btnDelete.node.on(Node.EventType.TOUCH_START, this.on_click_delete.bind(this))

        this.on(EventMessage.GAME_MAIL_DATA_UPDATE, this.on_refresh, this);
        this.on(EventMessage.GAME_REWARD_RECEIVE, this.on_mail_reward_received, this);
    }

    start(): void {
        this.on_refresh();
        this.mailContent.set_close_func(this.on_content_close.bind(this));
        this.mailContent.node.active = false;
    }

    on_refresh(){
        let mailsAry = GameModelMgr.mailModel.get_mail_list_and_sort();
        this.listData = mailsAry;
        this.list.numItems = mailsAry.length;

        this.mailContent.refresh();
    }

    on_mail_reward_received(event: string, args: any){
        if(this.mailContent.node.active){
            this.mailContent.play_coins_fly_eff();
            return;
        }
        this.play_coins_fly_eff(args);
    }

    on_list_render(item: any, idx: number) {
        let data = this.listData[idx];
        let itemUt: UIMailItem = item.getComponent(UIMailItem);
        itemUt.refresh(data, this.on_item_click.bind(this));
    }

    private play_coins_fly_eff(args:any){
        if(this.tabItemRoot && this.tabItemRoot.active){
            let mailId = args && args.mailId;
            if(mailId){
                for (let i = 0; i < this.tabItemRoot.children.length; i++) {
                    const child = this.tabItemRoot.children[i];
                    if(isValid(child) && child.active){
                        let itemUt: UIMailItem = child.getComponent(UIMailItem);
                        if(itemUt.get_mail_id() == mailId){
                            let startNod = itemUt.get_coins_fly_start_nod();
                            if(startNod){
                                oops.message.dispatchEvent(EventMessage.GAME_COINS_FLY,{startNode: startNod});
                            }
                        }
                    }
                }
            }
        }
    }

    private on_item_click(mailData: MailDataClient){
        this.mailContent.init_data(mailData);
        this.bgRoot.active = false;
        if(!mailData.is_read()){
            let mials: Array<number> = [];
            mials.push(mailData.get_mail_id())
            GameModelMgr.mailModel.cs_mail_read_req(mials);
        }
    }

    private on_content_close(){
        this.bgRoot.active = true;
    }

    private on_click_delete(){
        this.btnDelete.setAnimation(0, "1", false);
        if(this.list.numItems <= 0){
            return;
        }
        if(!GameModelMgr.mailModel.check_have_can_delete_mail()){
            return;
        }
        GameModelMgr.mailModel.cs_mail_delete_all_read_req();
    }

    private on_click_close(){
        oops.gui.remove(UIID.UI_Mail_Main)
    }
}

