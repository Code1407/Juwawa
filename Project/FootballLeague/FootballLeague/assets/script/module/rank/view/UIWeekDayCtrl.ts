import { _decorator, Component, Button } from 'cc';
import { UIRankCheckMarkItem } from './UIRankCheckMarkItem';
import GameModelMgr from '../../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0~11 → 1~12
    const day = date.getDate();
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${year}-${pad(month)}-${pad(day)}`;
}

@ccclass('UIWeekDayCtrl')
export class UIWeekDayCtrl extends Component {
    @property(UIRankCheckMarkItem)
    private weekDayItems: UIRankCheckMarkItem[] = [];

    private dateStr = [``]
    private curDayIndex:number = -1;
    private refreshRankViewFunc:Function = null;

    onLoad(): void{
        this.init_weekday_items();
    }

    start() {
        this.init_date_str();
        this.req_rank_data_to_server();
        this.show_today();
    }

    set_switch_rank_view_func(func:Function){
        this.refreshRankViewFunc = func;
    }

    //dayIndex 周日:0 周1 - 周6(1-6)
    init_date_str(){
        let dayIndex = GameModelMgr.rankModel.get_this_day_index();
        this.dateStr = [];
        let nowTime = GameModelMgr.rankModel.get_rank_now_timestamp();
        for (let i = 0; i < 7; i++) {
            if (i == 6) {
                this.dateStr.push(`thisWeek`);
            }
            else if (i == dayIndex) {    
                this.dateStr.push(`today`);
            }
            else {
                let targetDate = GameModelMgr.rankModel.get_server_date_by_timestamp(nowTime + (i - dayIndex) * 24*60*60*1000);
                this.dateStr.push(formatDate(targetDate));
            }

            const clickable = i <= dayIndex || i == 6;
            this.weekDayItems[i].getComponent(Button).enabled = clickable;
        }
    }

    req_rank_data_to_server(){
        for (let i = 0; i < this.dateStr.length; i++) {
            let rankQuery = this.dateStr[i];
            GameModelMgr.rankModel.cs_get_rank_list_by_date_req(rankQuery);
        }
    }

    show_today(){
      let dayIndex = GameModelMgr.rankModel.get_this_day_index();  
      this.refresh_day_item(dayIndex);
    }

    get_date_index_by_datestr(datestr:string){
        for (let i = 0; i < this.dateStr.length; i++) {
            let str = this.dateStr[i];
            if(str === datestr){
                return i;
            }
        }
        return -1;
    }

    private init_weekday_items(){
        if(this.weekDayItems.length <= 0){
            return;
        }
        for (let i = 0; i < this.weekDayItems.length; i++){
            let index = i;
            this.weekDayItems[i].init(index, this.on_click_item.bind(this));
        }
    }

    private refresh_day_item(clickIndex: number){
        let dayIndex = GameModelMgr.rankModel.get_this_day_index();
        if(this.curDayIndex == clickIndex){
            return false;
        }

        if(clickIndex > dayIndex && clickIndex != 6){
            return false;
        }

        this.curDayIndex = clickIndex;
        for (let i = 0; i < this.weekDayItems.length; i++){
            let item = this.weekDayItems[i];
            if(i == clickIndex){
                item.set_state(1);
            }
            else if (i == dayIndex) {
                this.weekDayItems[i].set_state(3);
            }
            else if (i < dayIndex) {
                this.weekDayItems[i].set_state(2);
            }
            else if (i > dayIndex) {
                this.weekDayItems[i].set_state(0);
            }
        }
        return true;
    }

    private on_click_item(clickIndex: number){
        let needRefresh = this.refresh_day_item(clickIndex); 
        if(needRefresh && this.refreshRankViewFunc){
            const dateStr = this.dateStr[clickIndex];
            this.refreshRankViewFunc(dateStr);
        }    
    }

}


