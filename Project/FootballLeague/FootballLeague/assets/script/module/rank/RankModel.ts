import GameProxyMgr from "../mvc/GameProxyMgr";
import GameSystemMgr from "../mvc/GameSystemMgr";
import IMvc from "../mvc/IMvc";


export default class RankModel extends IMvc {
//#region NetMsg
    cs_get_today_realtime_rank_info_req(){
        return GameSystemMgr.rankSystem.cs_get_today_realtime_rank_info_req();
    }

    cs_get_rank_list_by_date_req(dateStr:string){
        return GameSystemMgr.rankSystem.cs_get_rank_list_by_date_req(dateStr);
    }

    cs_receive_day_reward_req(){
        console.log("***cs_receive_day_reward_req***");
        return GameSystemMgr.rankSystem.cs_receive_day_reward_req();
    }

    cs_receive_week_reward_req(){
        console.log("***cs_receive_week_reward_req***");
        return GameSystemMgr.rankSystem.cs_receive_week_reward_req();
    }

//#endregion

    get_rank_timestamp():number{
        return GameProxyMgr.rankProxy.get_rank_timestamp();
    }

    get_rank_timezone():number{
        return GameProxyMgr.rankProxy.get_rank_timezone();
    }

    get_self_rank():number{
        return GameProxyMgr.rankProxy.get_self_rank();
    }

    get_self_rank_label():string{
        let rank = this.get_self_rank();
        return rank < 100 ? rank.toString() : `99+`;
    }

    check_can_receive_day_reward():boolean{
        let dayData = GameProxyMgr.rankProxy.get_day_rank_award_data();
        return dayData && dayData.bonus > 0 || false;
    }

    check_can_receive_week_reward():boolean{
        let weekData = GameProxyMgr.rankProxy.get_week_rank_award_data();
        return weekData && weekData.bonus > 0 || false;
    }

    check_can_reward():boolean{
        let canReward = this.check_can_receive_day_reward() || this.check_can_receive_week_reward();
        return canReward;
    }

    get_day_rank_award_data():ScDayRankAwardPush{
        return GameProxyMgr.rankProxy.get_day_rank_award_data();
    }

    get_week_rank_award_data():ScWeekRankAwardPush{
        return GameProxyMgr.rankProxy.get_week_rank_award_data();
    }

    get_users_by_date(date:string):Array<RankUserInfo>{
        return GameProxyMgr.rankProxy.get_users_by_date(date);
    }

    get_rank_now_timestamp(){
        return GameProxyMgr.rankProxy.get_rank_now_timestamp();
    }

    get_server_date_by_timestamp(timestamp){
        const deviceTimezoneOffset = -new Date().getTimezoneOffset() * 60 * 1000;
        let date = new Date(timestamp - deviceTimezoneOffset);
        return date;
    }

    get_this_day_index() {
        const serLocalT = this.get_rank_now_timestamp();
        const deviceTimezoneOffset = -new Date().getTimezoneOffset() * 60 * 1000;
        let date = new Date(serLocalT - deviceTimezoneOffset);
        return date.getDay();
    }

    get_next_day_s(){
        const daySec = 24 * 60 * 60;
        let timestamp = Math.ceil(GameProxyMgr.rankProxy.get_rank_timestamp()/1000);
        const passSec = Math.ceil(timestamp % daySec);
        return daySec - passSec;
    }

    clear_day_rank_award_data(){
        return GameProxyMgr.rankProxy.clear_day_rank_award_data();
    }

    clear_week_rank_award_data(){
        return GameProxyMgr.rankProxy.clear_week_rank_award_data();
    }
}
