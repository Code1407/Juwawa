import { Application, ChannelService } from "pinus";
import { getLastWeek, getYesterday } from "../../interface/IGame";
import Redis from "../../database/db/redis";
import { getLogger } from 'pinus-logger';
import { IRankAwardListen, IRankAwardMsg, IRankAwardResp, IRankUserInfo, IRankRealTimeMsg } from "../../interface/IBranch";
import GameServer from "../../GameServer";
import { IOrderWithTime, uuid } from "../../sdk/ISdk";
import Mysql from "../../database/db/mysql";
import { awardCount, awardCountShow, getBonusTotal, getRankUserInfo } from "./RankCommon";
let logger = getLogger("RankAward", __filename);

export default class RankAward implements IRankAwardListen {
    today = new Date();
    dayRankUsers: IRankUserInfo[] = [];
    weekRankUsers: IRankUserInfo[] = [];
    todayRealTimeUser: IRankUserInfo[] = [];
    redis: Redis;
    mysql: Mysql;
    dayGetAwardUser: string[] = [];
    weekGetAwardUser: string[] = [];

    private channelService: ChannelService;

    constructor(private app: Application, private gameServer: GameServer, private sdkName: string) {
        this.redis = new Redis(app, sdkName, "branch:RankAward");
        this.mysql = new Mysql(app, sdkName);
        this.channelService = this.app.get('channelService');
        this.initRankAward();
    }

    async initRankAward() {
        let tick = 6000; // 60000;
        setInterval(this.heartbeat.bind(this), tick);

        await this.initTodayAward();
        await this.updatetTomorrowAward();
    }

    async heartbeat() {
        let today = new Date();
        if (today.toLocaleDateString() != this.today.toLocaleDateString()) {
            this.onNewDay();
        }

        await this.updatetTomorrowAward();

        if (this.dayRankUsers && this.dayRankUsers.length) {
            for (let i = 0; i < this.dayRankUsers.length; i++) {
                let rankUser = this.dayRankUsers[i];
                let msg: IRankAwardMsg = {
                    uid: rankUser.uid,
                    rank: rankUser.rank,
                    bonus: rankUser.bonus,
                    score: rankUser.score,
                    rankUsers: this.dayRankUsers.slice(0, awardCountShow)
                }
                if (rankUser.bonus > 0) await this.onDayRankAward(msg);
            }
        }

        if (this.weekRankUsers && this.weekRankUsers.length) {
            for (let i = 0; i < this.weekRankUsers.length; i++) {
                let rankUser = this.weekRankUsers[i];
                let msg: IRankAwardMsg = {
                    uid: rankUser.uid,
                    rank: rankUser.rank,
                    bonus: rankUser.bonus,
                    score: rankUser.score,
                    rankUsers: this.weekRankUsers.slice(0, awardCountShow)
                }
                if (rankUser.bonus > 0) await this.onWeekRankAward(msg);
            }
        }

        if (this.todayRealTimeUser && this.todayRealTimeUser.length) {
            for (let i = 0; i < this.todayRealTimeUser.length; i++) {
                let rankUser = this.todayRealTimeUser[i];
                let msg: IRankRealTimeMsg = {
                    uid: rankUser.uid,
                    rank: rankUser.rank
                }
                await this.onTodayRealTimeRank(msg);
            }
        }
    }

    async initRankAwardDay(yesterday: Date) {
        try {
            let expiresAward = await this.redis.getDayRankAward(yesterday);
            for (let uid in expiresAward) {
                let bonusStr = expiresAward[uid];
                let bonus = Number(bonusStr);
                if (bonus > 0) {
                    let score = 0;
                    let user = this.dayRankUsers.find((user)=> { user.uid == uid });
                    if (user) score = user.score;
                    await this.redis.delDayRankAward(yesterday, uid);
                }
            }
        } catch(e) {
            logger.error(e.message);
        }

        this.dayRankUsers = [];

        try {
            let rankList = await this.redis.getSDKRankListDayCount(yesterday, 5000);
            let scoreTotal = getBonusTotal(rankList, this.sdkName, false);
            this.dayRankUsers = await getRankUserInfo(this.redis, rankList, scoreTotal);
            if (this.dayRankUsers && this.dayRankUsers.length) {
                for (let i = 0; i < Math.min(this.dayRankUsers.length, awardCount); i++) {
                    let rankUser = this.dayRankUsers[i];
                    if (rankUser.bonus > 0) {
                        rankUser.bonus = await this.redis.addDayRankAward(this.today, rankUser.uid, rankUser.bonus);
                    }
                }
            }
        } catch(e) {
            logger.error(e.message);
        }
    }

    async initRankAwardWeek(lastWeek: Date) {
        try {
            let expiresAward = await this.redis.getWeekRankAward(lastWeek);
            for (let uid in expiresAward) {
                let bonusStr = expiresAward[uid];
                let bonus = Number(bonusStr);
                if (bonus > 0) {
                    let score = 0;
                    let user = this.weekRankUsers.find(user => user.uid == uid);
                    if (user) score = user.score;
                    await this.redis.delWeekRankAward(lastWeek, uid);
                }
            }
        } catch(e) {
            logger.error(e.message);
        }

        this.weekRankUsers = [];

        try {
            let rankList = await this.redis.getSDKRankListWeekCount(lastWeek, 10000);
            let scoreTotal = getBonusTotal(rankList, this.sdkName, true);
            this.weekRankUsers = await getRankUserInfo(this.redis, rankList, scoreTotal);
            if (this.weekRankUsers && this.weekRankUsers.length) {
                for (let i = 0; i < Math.min(this.weekRankUsers.length, awardCount); i++) {
                    let rankUser = this.weekRankUsers[i];
                    if (rankUser.bonus > 0) {
                        rankUser.bonus = await this.redis.addWeekRankAward(this.today, rankUser.uid, rankUser.bonus);
                    }
                }
            }
        } catch(e) {
            logger.error(e.message);
        }
    }

    async initTodayAward() {
        let today = new Date();
        let yesterday = getYesterday();
        let lastWeek = getLastWeek();

        if (today.getDay() != 1) { // 周一开周榜
            await this.initRankAwardDay(yesterday);
        } else {
            await this.initRankAwardWeek(lastWeek);
        }
    }

    async updatetTomorrowAward() {
        let rankList = this.today.getDay() == 7
            ? await this.redis.getSDKRankListWeekCount(this.today, 10000)
            : await this.redis.getSDKRankListDayCount(this.today, 5000);

        let scoreTotal = getBonusTotal(rankList, this.sdkName, this.today.getDay() == 7);
        this.todayRealTimeUser = await getRankUserInfo(this.redis, rankList, scoreTotal);
    }

    async onNewDay() {
        this.dayGetAwardUser = [];
        this.weekGetAwardUser = [];

        this.initTodayAward();
    }

    async receiveDayAward(uid: string, gameName: string): Promise<IRankAwardResp> {
        this.dayGetAwardUser.push(uid);
        let bonus = await this.getDayAward(uid);
        await this.redis.delDayRankAward(this.today, uid);
        let index = this.dayRankUsers.findIndex(rankUser => { return rankUser.uid == uid; });
        if (index >= 0) this.dayRankUsers[index].bonus = 0;
        let resp = await this.awardOrder(gameName, uid, bonus);
        return {
            code: resp.code,
            accountDiamond: resp.diamond
        }
    }

    async receiveWeekAward(uid: string, gameName: string): Promise<IRankAwardResp> {
        this.weekGetAwardUser.push(uid);
        let bonus = await this.getWeekAward(uid);
        await this.redis.delWeekRankAward(this.today, uid);
        let index = this.weekRankUsers.findIndex(rankUser => { return rankUser.uid == uid; });
        if (index >= 0) this.weekRankUsers[index].bonus = 0;
        let resp = await this.awardOrder(gameName, uid, bonus);
        return {
            code: resp.code,
            accountDiamond: resp.diamond
        }
    }

    async getTodayRealTimeRank(uid: string): Promise<IRankRealTimeMsg> {
        let user = (this.todayRealTimeUser && this.todayRealTimeUser.find(user => user.uid == uid)) || null;
        let rank = user ? user.rank : 0;
        return {uid: uid, rank: rank};
    }

    async getDayAward(uid: string): Promise<number> {
        let bonusStr = await this.redis.getDayRankAwardByUid(this.today, uid);
        let bonus = Math.floor(Number(bonusStr));
        return bonus;
    }

    async getWeekAward(uid: string): Promise<number> {
        let bonusStr = await this.redis.getWeekRankAwardByUid(this.today, uid);
        let bonus = Math.floor(Number(bonusStr));
        return bonus;
    }

    async onDayRankAward(msg: IRankAwardMsg) {
        await this.send2Player("onDayRankAward", msg.uid, msg);
    }

    async onWeekRankAward(msg: IRankAwardMsg) {
        await this.send2Player("onWeekRankAward", msg.uid, msg);
    }

    async onTodayRealTimeRank(msg: IRankRealTimeMsg) {
        await this.send2Player("onTodayRealTimeRank", msg.uid, msg);
    }

    async send2Player(routerName: string, uid:string, msg: any) {
        let serverID = this.app.getServerId();
        for (let key in this.channelService.channels) {
            let channel = this.channelService.channels[key];
            let uids = channel.groups[serverID];
            if (uids && uids.length && uids.includes(uid)) {
                let sid = channel.getMember(uid)['sid'];
                this.channelService.pushMessageByUids(routerName, msg, [{
                    uid: uid,
                    sid: sid
                }]);
            }
        }
    }

    async awardOrder(gameName: string, uid: string, amount: number): Promise<IOrderWithTime> {
        amount = Math.floor(amount);
        let scene = this.gameServer.getScene(gameName);
        let player = scene.getPlayer(uid);
        let orderId = uuid.v1();
        let resp = await player.rankAward(amount, orderId);
        return resp;
    }
}
