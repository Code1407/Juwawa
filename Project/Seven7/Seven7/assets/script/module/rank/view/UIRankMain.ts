import { _decorator, Node, find, SpriteFrame, UITransform } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
import List from 'db://assets/script/framework/list/List';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { UIWeekDayCtrl } from './UIWeekDayCtrl';
import GameModelMgr from '../../mvc/GameModelMgr';
import { UIRankPlayerItem } from './UIRankPlayerItem';
const { ccclass, property } = _decorator;

@ccclass('UIRankMain')
export class UIRankMain extends GameComponent {
    @property(UIWeekDayCtrl)
    private weekDayCtrl:UIWeekDayCtrl
    @property(List)
    private list: List = null;  
    @property(SpriteFrame)
    spTop3Bg: SpriteFrame[] = [];
    @property(SpriteFrame)
    spTop3AwardBg: SpriteFrame[] = [];
    @property(SpriteFrame)
    spTop3RankNum: SpriteFrame[] = [];
    @property(SpriteFrame)
    spTop3Line: SpriteFrame[] = [];

    private coinSp:SpriteFrame = null;
    private listData: any;

    onAdded(args: any) {
        if(args && args.coinSp){
            this.coinSp = args.coinSp;
        }
        return true;
    }

    onLoad(): void {
        var close1 = find("btnClose", this.node);
        close1.on(Node.EventType.TOUCH_END, this.on_click_close)

        var close2 = find("view/btnClose2", this.node);
        close2.on(Node.EventType.TOUCH_END, this.on_click_close)

        var help = find("view/bjk_3/bjk_4/btnQuestion", this.node);
        help.on(Node.EventType.TOUCH_START, this.on_click_help)

        this.weekDayCtrl.set_switch_rank_view_func(this.on_switch_rank_view.bind(this));

        this.on(EventMessage.GAME_RANK_PULL_RANK_DATA, this.on_pull_rank_data_form_server, this);
    }

    start(): void {

    }

    on_pull_rank_data_form_server(event: string, args: any){
        if(!args){
            return;
        }
        let toDayIndex = GameModelMgr.rankModel.get_this_day_index();
        let index = this.weekDayCtrl.get_date_index_by_datestr(args.dateStr);
        if(toDayIndex == index){
            this.refresh_list_by_date_str(args.dateStr);
        }
    }

    on_switch_rank_view(dateStr: string){
        this.refresh_list_by_date_str(dateStr);
    }

    refresh_list_by_date_str(dateStr:string){
        if(dateStr){
            let users = GameModelMgr.rankModel.get_users_by_date(dateStr);
            if(users && users.length > 0){
                this.listData = users;
                this.list.numItems = users.length;
                return;
            }  
        }
        this.listData = [];
        this.list.numItems = 0;
    }

    on_list_render(item: any, idx: number) {
        let itemTrans: UITransform = item.getComponent(UITransform);
        let data = this.listData[idx];
        let rank = data.rank;

        let itemScript: UIRankPlayerItem = item.getComponent(UIRankPlayerItem);
        itemScript.refresh(data, this.coinSp, this.get_top3_bg.bind(this));

        if(rank <= 3){
            itemTrans.height = 64;
        }else{
            itemTrans.height = 50;
        }
    }

    get_top3_bg(rank:number){
        if(rank > 3 || rank <= 0){
            return
        }
        let index = rank - 1;
        let bgAry: SpriteFrame[] = [];
        bgAry.push(this.spTop3Bg[index]);
        bgAry.push(this.spTop3AwardBg[index]);
        bgAry.push(this.spTop3RankNum[index]);
        bgAry.push(this.spTop3Line[index]);
        return bgAry;
    }

    private on_click_help(){
        oops.gui.openAsync(UIID.UI_Rank_Help);
    }
   
    private on_click_close(){
        oops.gui.remove(UIID.UI_Rank_Main);
    }
    
}

