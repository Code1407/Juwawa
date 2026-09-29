import List from "../../../common/list/List";
import MailModel from "../MailModel";
import UIMailItem from "./UIMailItem";
import { MailDataClient } from "../MailDataClient";
import UIMailContent from "./UIMailContent";
import { Eventer } from "../../../common/Eventer";
import { EventMessage } from "../../../common/EventMessage";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIMailMain extends cc.Component {
    @property(UIMailContent)
    private mailContent: UIMailContent = null;
    @property(List)
    private list: List = null;
    @property(cc.Node)
    private tabItemRoot: cc.Node = null;
    @property(cc.Node)
    private bgRoot: cc.Node = null;
    @property(sp.Skeleton)
    private btnDelete: sp.Skeleton = null;

    private listData: any;

    onLoad(): void{
        var close = cc.find("root/bg_main/btn_close", this.node);
        close.on(cc.Node.EventType.TOUCH_START, this.on_click_close.bind(this));

        this.btnDelete.node.on(cc.Node.EventType.TOUCH_START, this.on_click_delete.bind(this))
    }

    start(): void {
        this.mailContent.set_close_func(this.on_content_close.bind(this));
        this.mailContent.node.active = false;
    }

    open_mail_main_view(){
        this.node.active = true;
        this.refresh();
        this.list.scrollTo(0, .05);
    }

    refresh(){
        let mailsAry = MailModel.getInstance().get_mail_list_and_sort();
        this.listData = mailsAry;
        this.list.numItems = mailsAry.length;
        if(this.mailContent.node.active){
            this.mailContent.refresh();
        }
    }

    on_reward_received(args:any){
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
                    if(cc.isValid(child) && child.active){
                        let itemUt: UIMailItem = child.getComponent(UIMailItem);
                        if(itemUt.get_mail_id() == mailId){
                            let startNod = itemUt.get_coins_fly_start_nod();
                            if(startNod){
                                Eventer.getInstance().emit(EventMessage.GAME_COINS_FLY, {startNode:startNod});
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
            MailModel.getInstance().cs_mail_read_req(mials);
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
        if(!MailModel.getInstance().check_have_can_delete_mail()){
            return;
        }
        MailModel.getInstance().cs_mail_delete_all_read_req();
    }


    private on_click_close(){
        this.node.active = false;
    }
}
