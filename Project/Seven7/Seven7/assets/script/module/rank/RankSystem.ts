import { oops } from "db://oops-framework/core/Oops";
import IMvc from "../mvc/IMvc";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';

export default class RankSystem extends IMvc {

    init(): void {
        oops.network.listenMsg("CsGetTodayRealTimeRankResp", this.cs_get_today_realtime_rank_info_resp);
        oops.network.listenMsg("ScTodayRealTimeRankPush", this.sc_today_realtime_rank_info_push);
        oops.network.listenMsg("CsGetRankListByDateStrResp", this.cs_get_rank_list_by_date_resp);

        oops.network.listenMsg("ScDayRankAwardPush", this.sc_day_rank_award_push);
        oops.network.listenMsg("ScWeekRankAwardPush", this.sc_week_rank_award_push);

        oops.network.listenMsg("CsReceiveDayAwardResp", this.cs_receive_day_reward_resp);
        oops.network.listenMsg("CsReceiveWeekAwardResp", this.cs_receive_week_reward_resp);
    }

    //拉取自己实时排名
    cs_get_today_realtime_rank_info_req(){
        oops.network.pushMsg("CsGetTodayRealTimeRankReq", {});
    }
    private cs_get_today_realtime_rank_info_resp(msg:CsGetTodayRealTimeRankResp){
        if(!msg){
            return;
        }
        GameProxyMgr.rankProxy.refresh_self_rank_info(msg);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_SELF_INFO_UPDATE);
    }

    //自己排名信息变化推送
    private sc_today_realtime_rank_info_push(msg:ScTodayRealTimeRankPush){
        if(!msg){
            return;
        }
        GameProxyMgr.rankProxy.refresh_self_rank_info(msg);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_SELF_INFO_UPDATE);
    }

    //拉取榜单
    cs_get_rank_list_by_date_req(dateStr: string){
        oops.network.pushMsg("CsGetRankListByDateStrReq", {dateStr:dateStr});
        //console.error("******请求排行榜日期******:%s", dateStr);
    }
    private cs_get_rank_list_by_date_resp(msg:CsGetRankListByDateStrResp){
        if(!msg || !msg.dateStr || !msg.rankUsers){
            return;
        }
        GameProxyMgr.rankProxy.refresh_rank_data(msg.dateStr, msg.rankUsers);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_PULL_RANK_DATA, {dateStr : msg.dateStr});
    }

    // 服务端推送：昨日日榜可领奖
    sc_day_rank_award_push(msg: ScDayRankAwardPush){
        if(!msg){
            return;
        }
        GameProxyMgr.rankProxy.refresh_day_rank_award_data(msg);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_SELF_INFO_UPDATE);
    }

    // 服务端推送：上周周榜可领奖
    sc_week_rank_award_push(msg: ScWeekRankAwardPush){
        if(!msg){
            return;
        }
        GameProxyMgr.rankProxy.refresh_week_rank_award_data(msg);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_SELF_INFO_UPDATE);
    }


    //领取日榜奖励
    cs_receive_day_reward_req(){
        oops.network.pushMsg("CsReceiveDayAwardReq", {});
    }
    private cs_receive_day_reward_resp(msg: CsReceiveDayAwardResp){
        if(!msg){
            return;
        }
        if(msg.code != 0){
            return;
        }
        GameProxyMgr.playerProxy.update_player_coins(msg.accountDiamond);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_REWARD_RECEIVE, {bonus : msg.bonus, isDayRank : true});
        console.error("*****cs_receive_day_reward_resp******:%s", msg.accountDiamond);
    }

    //领取周榜奖励
    cs_receive_week_reward_req(){
        oops.network.pushMsg("CsReceiveWeekAwardReq", {});
    }
    private cs_receive_week_reward_resp(msg: CsReceiveWeekAwardResp){
        if(!msg){
            return;
        }
        if(msg.code != 0){
            return;
        }
        GameProxyMgr.playerProxy.update_player_coins(msg.accountDiamond);
        oops.message.dispatchEvent(EventMessage.GAME_RANK_REWARD_RECEIVE, {bonus : msg.bonus, isDayRank : false});
        console.error("*****cs_receive_week_reward_resp******:%s", msg.accountDiamond);
    }
}


