
import IMvc from "../mvc/IMvc";
import {director, ISchedulable, Scheduler  } from "cc";

export default class RankProxy extends IMvc implements ISchedulable {
    private timestamp:number = 0;
    private timezone:number = 0;
    private selfRank:number = 0;

    private rankMap: Map<string, Array<RankUserInfo>> = new Map();

    private dayRankAwardMsg:ScDayRankAwardPush = null;
    private weekRankAwardMsg:ScWeekRankAwardPush = null;

    private scheduler: Scheduler = null;

    init(): void {
        Scheduler.enableForTarget(this);
        this.scheduler = director.getScheduler();      
    }

    clear(): void {
       this.timestamp = 0;
       this.timezone = 0;
       this.selfRank = 0;
       this.rankMap.clear();
       this.scheduler.unschedule(this.update, this);
    }

    refresh_self_rank_info(msg:CsGetTodayRealTimeRankResp | ScTodayRealTimeRankPush){
        this.timestamp = msg.timestamp;
        this.timezone = msg.timezone;
        this.selfRank = msg.rank;
        this.scheduler.unschedule(this.update, this);
        this.scheduler.schedule(this.update, this, 0);
        //console.error("服务器时间戳:%s  时区:%s",this.timestamp, this.timezone)
    }

    refresh_rank_data(date:string, users:Array<RankUserInfo>){
        if(users){
            this.rankMap.set(date, users);
        }
    }

    refresh_day_rank_award_data(msg:ScDayRankAwardPush){
        this.dayRankAwardMsg = msg;
    }

    refresh_week_rank_award_data(msg:ScWeekRankAwardPush){
        this.weekRankAwardMsg = msg;
    }


    get_rank_timestamp():number{
        return this.timestamp;
    }

    get_rank_timezone():number{
        return this.timezone;
    }

    get_self_rank():number{
        return this.selfRank;
    }

    get_rank_now_timestamp(): number {
        return this.timestamp;
    }

    get_users_by_date(date:string):Array<RankUserInfo>{
        if(this.rankMap.has(date)){
            return this.rankMap.get(date);
        }
        return [];
    } 
    
    get_day_rank_award_data():ScDayRankAwardPush{
        return this.dayRankAwardMsg;
    }

    get_week_rank_award_data():ScWeekRankAwardPush{
        return this.weekRankAwardMsg;
    }

    clear_day_rank_award_data(){
        this.dayRankAwardMsg = null;
    }

    clear_week_rank_award_data(){
        this.weekRankAwardMsg = null;
    }

    update(dt: number): void {
        if(this.timestamp <= 0){
            return;
        }
        this.timestamp += dt * 1000;
    }
}


