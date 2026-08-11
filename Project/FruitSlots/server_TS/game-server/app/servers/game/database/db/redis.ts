import { getLogger } from 'pinus-logger';
let logger = getLogger('redis', __filename);

import { Application } from 'pinus';
import { Tedis, TedisPool } from "redis-typescript";
import { TodayProfitThreshold } from '../entity/SDKEntity';
import { IMyHistoryItem } from '../../interface/IRoulette';
import '../../extensions/date-extension';

export default class Redis {
    private pool: TedisPool;

    constructor(private app: Application, private sdkName: string, private gameName: string) {
        const configJson = require("../../../../../config/database/redis.json");
        const env: string = this.app.get("env");
        const config = configJson[env];
        this.pool = new TedisPool({ host: config.host, port: config.port, password: config.password });
    }

    async ready(): Promise<boolean> {
        try {
            await this.pool.getTedis();
            return true;
        } catch (e) {
            console.log(e.toString());
            return false;
        }
    }

    async doTask(task: any) {
        let ret = null;
        try {
            let redis = await this.pool.getTedis();
            this.pool.putTedis(redis);
            ret = await task(redis);
            return ret;
        } catch (e) {
            console.log(e.toString());
            throw e;
        }
    }

    getHintMaxPlayerCount(): Promise<any> {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            const key = __this.hintMaxPlayerCount();

            return redis.get(key);
        });
    }

    hintMaxPlayerCount(): string {
        return `${this.sdkName}:${this.gameName}:hintMaxPlayerCount`;
    }

    getHintPriorityList(): Promise<string> {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            const key = __this.hintPriorityKey();

            return redis.get(key);
        });
    }

    hintPriorityKey(): string {
        return `${this.sdkName}:${this.gameName}:hintPriorityKey`;
    }
    public async getGMP() {
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get("gm:password");
            return ret ? ret : "empty";
        });
    }

    /**
     * 添加玩家历史记录
     *
     * @param uid 玩家id
     * @param historyItem 玩家历史记录项
     * @returns 无
     */
    public async addPlayerHistory(uid: string, historyItem: string) {
        if (!historyItem || historyItem.length == 0) {
            return;
        }

        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            const key = __this.userHistoryKey(uid);
            // 直接存入数组
            redis.rpush(key, historyItem)
        })
    }

    /**
     * 获取玩家最近n+1天历史记录
     *
     * @param uid 玩家id
     * @param n 最近n天，默认7天
     * @returns
     */
    public async getPlayerHistory(uid: string, n: number = 7) {
        const __this = this;
        let today = new Date;

        return this.doTask(async function (redis: Tedis) {
            const key = __this.userHistoryKey(uid);
            const historiesString = await redis.lrange(key, 0, -1);
            var histories: string[] = [];

            let st = JSON.stringify(historiesString)
            if (historiesString == null || historiesString.length == 0 || st == "[]") {
                return histories;
            }

            // n天过期，考虑到时区问题，往前多算一天
            const nDaysAgo = today.addDays(-n - 1);
            let expired = 0;
            historiesString.forEach((historyString) => {
                const history: IMyHistoryItem = JSON.parse(historyString)
                // 是否过期，非过期则返回，过期的进行记录，后面进行删除
                if (history != null && Number(history.date) >= nDaysAgo.getTime()) {
                    histories.push(historyString)
                } else {
                    expired++;
                }
            });

            // 把过期部分删除
            for (let i = 0; i < expired; i++) {
                redis.lpop(key);
            }

            return histories;
        })
    }


    public async setUser(uid: string, userInfo: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.userKey(uid), userInfo);
            return ret;
        });
    }

    public async getUsers(uids: string[]) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let gameUserKeys: string[] = [];
            uids.forEach(uid => {
                gameUserKeys.push(__this.userKey(uid));
            });
            let ret = await redis.mget(gameUserKeys[0], ...gameUserKeys.slice(1));
            return ret;
        });
    }

    public async setSDKUser(uid: string, userInfo: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.userSDKKey(uid), userInfo);
            return ret;
        });
    }

    public async getSDKUsers(uids: string[]) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let gameUserKeys: string[] = [];
            uids.forEach(uid => {
                gameUserKeys.push(__this.userSDKKey(uid));
            });
            let ret = await redis.mget(gameUserKeys[0], ...gameUserKeys.slice(1));
            return ret;
        });
    }

    public async setRankList(date: Date, uid: string, revenue: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zadd(__this.todayRankListKey(date), { [uid]: revenue });
            return ret;
        });
    }
    public async setGameRound(round: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.gameRound(), round.toString());
            return ret;
        });
    }
    public async getGameRound(): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.gameRound());
            return ret;
        });
    }

    public async incrRankList(date: Date, uid: string, revenue: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zincrby(__this.todayRankListKey(date), revenue, uid);
            return ret;
        });
    }

    public async getRankList(date: Date) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zrevrange(__this.todayRankListKey(date), 0, 9, "WITHSCORES");
            return ret;
        });
    }

    public async incrSDKRankListDay(date: Date, uid: string, revenue: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zincrby(__this.daySDKRankListKey(date), revenue, uid);
            return ret;
        });
    }

    public async getSDKRankListDay(date: Date): Promise<{ [propName: string]: string }> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<{ [propName: string]: string }> {
            let ret = await redis.zrevrange(__this.daySDKRankListKey(date), 0, 9, "WITHSCORES");
            return ret;
        });
    }

    public async getSDKRankListDayCount(date: Date, count: number): Promise<{ [propName: string]: string }> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<{ [propName: string]: string }> {
            let ret = await redis.zrevrange(__this.daySDKRankListKey(date), 0, count, "WITHSCORES");
            return ret;
        });
    }

    public async getSDKRankListWeekCount(date: Date, count: number): Promise<{ [propName: string]: string }> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<{ [propName: string]: string }> {
            let ret = await redis.zrevrange(__this.weekSDKRankListKey(date), 0, count, "WITHSCORES");
            return ret;
        });
    }

    public async incrSDKRankListWeek(date: Date, uid: string, revenue: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zincrby(__this.weekSDKRankListKey(date), revenue, uid);
            return ret;
        });
    }

    public async getSDKRankListWeek(date: Date) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zrevrange(__this.weekSDKRankListKey(date), 0, 9, "WITHSCORES");
            return ret;
        });
    }

    public async setTodayRankList(listSt: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.todayRankListKey2(), listSt);
            return ret;
        });
    }

    public async getTodayRankList() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.todayRankListKey2());
            return ret;
        });
    }

    public async getRaceRewardRate() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.gameRootKey() + ":RewardRate");
            return ret;
        });
    }

    public async getTodayWinList(date: Date): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<String> {
            let ret = await redis.get(__this.todayWinCarListKey(date));
            return String(ret);
        });
    }

    public async setTodayWinList(date: Date, list: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.todayWinCarListKey(date), list);
            return ret;
        });
    }

    public async setRoundHistory(timeId: number, historyResult: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zadd(__this.roundHistoryResultKey(), { [historyResult]: timeId });
            return ret;
        });
    }

    public async getRoundHistory(start: number, end: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.zrevrange(__this.roundHistoryResultKey(), start, end);
            return ret;
        });
    }

    public async getHistoryRankResult(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.roundHistoryResultRankKey());
            return ret;
        });
    }

    public async setHistoryRankResult(st: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.roundHistoryResultRankKey(), st);
            return ret;
        });
    }

    public async getSingelRevenueRankList(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.SingelRevenueRankListKey());
            return ret;
        });
    }

    public async setSingelRevenueRankList(st: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.SingelRevenueRankListKey(), st);
            return ret;
        });
    }
    public async getJackpotHistory(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.JackpotHistoryKey());
            return ret;
        });
    }

    public async setJackpotHistory(st: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.JackpotHistoryKey(), st.toString());
            return ret;
        });
    }
    public async getSlotShowResult(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.SlotShowResultKey());
            return ret;
        });
    }

    public async setSlotShowResult(st: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.SlotShowResultKey(), st.toString());
            return ret;
        });
    }
    public async getTotalRevenueRankList(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.TotalRevenueRankListKey());
            return ret;
        });
    }

    public async setTotalRevenueRankList(st: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.TotalRevenueRankListKey(), st);
            return ret;
        });
    }

    public async getTodayRound(date: Date): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number> {
            let ret = await redis.get(__this.todayRoundKey(date));
            return Number(ret);
        });
    }

    public async setTodayRound(date: Date, todayRound: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.todayRoundKey(date), todayRound.toString());
            return ret;
        });
    }

    public async incrTodayRound(date: Date): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number> {
            let ret = await redis.incr(__this.todayRoundKey(date));
            return Number(ret);
        });
    }

    public async getGameParameter() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.gameParameterKey());
            return ret;
        });
    }

    public async getRate() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.rateKey());
            return ret;
        });
    }

    // public async get(key: string) {
    //     return this.doTask(async (redis: Tedis) => {
    //         let ret = await redis.get(`${this.gameRootKey()}:${key}`);
    //         return ret;
    //     });
    // }

    // public async set(key: string, str: string) {
    //     const __this = this;
    //     return this.doTask(async (redis: Tedis) => {
    //         let ret = await redis.set(`${this.gameRootKey()}:${key}`, str);
    //         return ret;
    //     });
    // }

    public async getRateSub(sub: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.rateSubKey(sub));
            return ret;
        });
    }


    public async setResultCountMap(resultCountMap: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.resultCountMapKey(), resultCountMap);
            return ret;
        });
    }
    public async getResultCountMap(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.resultCountMapKey());
            return ret;
        });
    }
    public async setHistoryResult(historyResult: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.historyResultKey(), historyResult);
            return ret;
        });
    }

    public async getHistoryResult(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.historyResultKey());
            return ret;
        });
    }
    public async setWinHistoryResult(historyResult: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.historyWinResultKey(), historyResult);
            return ret;
        });
    }

    public async getWinHistoryResult(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.historyWinResultKey());
            return ret;
        });
    }

    public async setHistoryList(listSt: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.historyKey(), listSt);
            return ret;
        });
    }

    public async getHistoryList() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.historyKey());
            return ret;
        });
    }

    public async getWarnThreshold(): Promise<TodayProfitThreshold> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<TodayProfitThreshold> {
            let ret = await redis.get(__this.warnThresholdKey());
            if (ret) {
                let threshold = ret;
                if (threshold) return JSON.parse(threshold.toString());
            }
            return { warn: -1000 * 1000 * 1000, stop: -1000 * 1000 * 10 * 1000 };
        });
    }

    public async incrTodayRevenue(date: Date, increment: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.incrby(__this.todayRevenueKey(date), increment);
            return ret;
        });
    }

    public async getTodayRevenue(date: Date): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number> {
            let ret = await redis.get(__this.todayRevenueKey(date));
            return Number(ret);
        });
    }

    public async incrTodayBet(date: Date, increment: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.incrby(__this.todayBetKey(date), increment);
            return ret;
        });
    }

    public async getTodayBet(date: Date): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number> {
            let ret = await redis.get(__this.todayBetKey(date));
            return Number(ret);
        });
    }

    public async getRedeemBetLevel(gameName: string): Promise<number[]> {
        let key = `${this.sdkName}:${gameName}:betLevel`;
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number[]> {
            let ret = await redis.get(key);
            return JSON.parse(ret as string);
        });
    }

    public async setJackpotPool(jackpotPool: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.jackpotPoolKey(), jackpotPool);
            return ret;
        });
    }

    public async getJackpotPool() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.jackpotPoolKey());
            return ret;
        });
    }

    public async getJackpot() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.jackpotKey());
            return ret;
        });
    }

    public async getUserNewRound() {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.userNewRoundKey());
            return Number(ret);
        });
    }

    public async getTodayNewUserUid(date: Date) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.todayNewUserUidKey(date));
            return ret;
        });
    }

    public async setTodayNewUserUid(date: Date, newUserUid: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.set(__this.todayNewUserUidKey(date), newUserUid);
            return ret;
        });
    }

    public async getNewUserRate(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.newUserRateKey());
            return ret;
        });
    }

    public async getRobotPolic(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.robotPolicKey());
            return ret;
        });
    }
    public async getRobotPlayer(): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.get(__this.robotPlayerKey());
            return ret;
        });
    }

    public async addDayRankAward(date: Date, uid: string, bonus: number) {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<number> {
            let valueStr = await redis.hget(__this.dayRankAwardKey(date), uid);
            let value = parseInt(valueStr);
            if (!value && value != 0) {
                await redis.hset(__this.dayRankAwardKey(date), uid, bonus);
            }
            return value == 0 ? 0 : bonus;
        });
    }

    public async delDayRankAward(date: Date, uid: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.hset(__this.dayRankAwardKey(date), uid, "0");
            return ret;
        });
    }

    public async getDayRankAward(date: Date): Promise<{ [propName: string]: string }> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<{ [propName: string]: string }> {
            let ret = await redis.hgetall(__this.dayRankAwardKey(date));
            return ret;
        });
    }

    public async getDayRankAwardByUid(date: Date, uid: string): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<string> {
            let ret = await redis.hget(__this.dayRankAwardKey(date), uid);
            return ret;
        });
    }

    public async addWeekRankAward(date: Date, uid: string, bonus: number): Promise<number> {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let valueStr = await redis.hget(__this.weekRankAwardKey(date), uid);
            let value = parseInt(valueStr);
            if (!value && value != 0) {
                await redis.hset(__this.weekRankAwardKey(date), uid, bonus);
            }
            return value == 0 ? 0 : bonus;
        });
    }

    public async delWeekRankAward(date: Date, uid: string) {
        const __this = this;
        return this.doTask(async function (redis: Tedis) {
            let ret = await redis.hset(__this.weekRankAwardKey(date), uid, "0");
            return ret;
        });
    }

    public async getWeekRankAward(date: Date): Promise<{ [propName: string]: string }> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<{ [propName: string]: string }> {
            let ret = await redis.hgetall(__this.weekRankAwardKey(date));
            return ret;
        });
    }

    public async getWeekRankAwardByUid(date: Date, uid: string): Promise<string> {
        const __this = this;
        return this.doTask(async function (redis: Tedis): Promise<string> {
            let ret = await redis.hget(__this.weekRankAwardKey(date), uid);
            return ret;
        });
    }

    private dayRankAwardKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.sdkName}:day:${dateObj.getFullYear()}:${dateObj.getMonth() + 1}:${dateObj.getDate()}:RankAward`;
    }

    private weekRankAwardKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.sdkName}:week:${this.sdkWeekKey(dateObj)}:RankAward`;
    }

    private todayWinCarListKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:TodayWinCarList`;
    }

    private roundHistoryResultRankKey(): string {
        return `${this.sdkName}:${this.gameName}:roundHistoryResultRank`;
    }
    private SingelRevenueRankListKey(): string {
        return `${this.sdkName}:${this.gameName}:SingelRevenueRankList`;
    }
    private TotalRevenueRankListKey(): string {
        return `${this.sdkName}:${this.gameName}:TotallRevenueRankList`;
    }

    private todayRankListKey2(): string {
        return `${this.gameRootKey()}:todayRankListKey`;
    }

    private roundHistoryResultKey(): string {
        return `${this.sdkName}:${this.gameName}:roundHistoryResult`;
    }
    private JackpotHistoryKey(): string {
        return `${this.sdkName}:${this.gameName}:JackpotHistoryKey`;
    }
    private SlotShowResultKey(): string {
        return `${this.sdkName}:${this.gameName}:SlotShowResultKey`;
    }

    private gameRootKey(): string {
        return `${this.sdkName}:${this.gameName}`;
    }

    // 经常需要改，不使用sdk名作为key
    private newUserRateKey(): string {
        return `${this.gameName}:NewUser:rate`;
    }

    private userNewRoundKey(): string {
        return `${this.gameRootKey()}:NewUser:NewRound`;
    }

    private todayNewUserUidKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:NewUser:uid`;
    }

    private resultCountMapKey(): string {
        return `${this.sdkName}:${this.gameName}:resultCountMap`;
    }
    private historyResultKey(): string {
        return `${this.sdkName}:${this.gameName}:historyResult`;
    }
    private historyWinResultKey(): string {
        return `${this.sdkName}:${this.gameName}:winHistoryResult`;
    }

    private historyKey(): string {
        return `${this.sdkName}:${this.gameName}:historyList`;
    }

    private gameRound(): string {
        return `${this.sdkName}:${this.gameName}:gameRound`;
    }

    private todayRankListKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:RankList`;
    }

    private daySDKRankListKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.sdkName}:day:${dateObj.getFullYear()}:${dateObj.getMonth() + 1}:${dateObj.getDate()}:RankList`;
    }

    private weekSDKRankListKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.sdkName}:week:${this.sdkWeekKey(dateObj)}:RankList`;
    }

    private todayRoundKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:TodayRound`;
    }

    private todayRevenueKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:revenue`;
    }

    private todayBetKey(date: Date): string {
        let dateObj = new Date(date);
        return `${this.day(dateObj)}:bet`;
    }

    private warnThresholdKey() {
        return `${this.gameRootKey()}:WarnThreshold`;
    }

    private historyInOutKey() {
        return `${this.gameRootKey()}:HistoryInOut`;
    }

    private userHistoryKey(uid: string): string {
        return `${this.sdkName}:history:${this.gameName}:User:${uid}`
    }

    private userKey(uid: string): string {
        return `${this.gameRootKey()}:User:${uid}`;
    }

    private userSDKKey(uid: string): string {
        return `${this.sdkName}:User:${uid}`;
    }

    private balanceKey(): string {
        return `${this.gameRootKey()}:balance`;
    }

    private gameParameterKey(): string {
        return `${this.gameRootKey()}:gameParameter`;
    }

    private rateKey(): string {
        return `${this.gameRootKey()}:rate`;
    }

    private rateSubKey(sub: string): string {
        return `${this.rateKey()}:${sub}`;
    }

    private jackpotPoolKey(): string {
        return `${this.gameRootKey()}:JackpotPool`;
    }

    private jackpotKey(): string {
        return `${this.gameRootKey()}:jackpot`;
    }

    private robotPolicKey(): string {
        return `${this.sdkName}:${this.gameName}:robotPolicy`;
    }
    private robotPlayerKey(): string {
        return `${this.sdkName}:robotPlayer`;
    }

    private day(date: Date): string {
        let dateObj = new Date(date);
        return `${this.month(dateObj)}:${dateObj.getDate()}`;
    }

    private month(date: Date): string {
        let dateObj = new Date(date);
        return `${this.year(dateObj)}:${dateObj.getMonth() + 1}`;
    }

    private year(date: Date): string {
        let dateObj = new Date(date);
        return `${this.gameRootKey()}:${dateObj.getFullYear()}`;
    }

    private sdkWeekKey(date: Date): string {
        const millisecondOneDay = 24 * 60 * 60 * 1000;

        let year = date.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const millisecondFromFirst = date.valueOf() - firstDayOfYear.valueOf();
        const d = Math.ceil(millisecondFromFirst / millisecondOneDay);
        return `${year}:${Math.ceil(d / 7) + 1}`;
    }

    async getHintEnable() {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            return await redis.get(__this.hintEnableKey());
        })
    }

    hintEnableKey(): string {
        return `${this.gameRootKey()}:hintEnable`;
    }

    async getHintMinMultiple() {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            return await redis.get(__this.hintMinMultipleKey());
        });
    }

    private hintMinMultipleKey() {
        return `${this.gameRootKey()}:hintMinMultiple`;
    }

    async getHintMultipleMinAmount() {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            return await redis.get(__this.hintMultipleMinAmountKey());
        });
    }

    private hintMultipleMinAmountKey() {
        return `${this.gameRootKey()}:hintMultipleMinAmount`;
    }

    async getHintJackpotMinAmount() {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            return await redis.get(__this.hintJackpotMinAmountKey());
        });
    }

    private hintJackpotMinAmountKey() {
        return `${this.gameRootKey()}:hintJackpotMinAmount`;
    }

    async getHintIntervalSeconds() {
        const __this = this;

        return this.doTask(async function (redis: Tedis) {
            return await redis.get(__this.hintIntervalSecondsKey());
        });
    }

    private hintIntervalSecondsKey() {
        return `${this.gameRootKey()}:hintIntervalSeconds`;
    }

    async lockUser(uid: string, sec: number, gameName: string) {
        await this.doTask(async (redis: Tedis) => {
            let key = `${this.sdkName}:${gameName}:${uid}:lock`;
            await redis.set(key, true.toString());
            redis.expire(key, sec);
        });
    }

    async getUserLockTime(uid: string, gameName: string): Promise<number> {
        let key = `${this.sdkName}:${gameName}:${uid}:lock`;
        let sec = await this.doTask(async (redis: Tedis) => await redis.ttl(key));
        return sec;
    }

    async setTracking(uid: string, eventId: string, dateStr: string) {
        await this.doTask(async (redis: Tedis) => {
            let key = `${this.sdkName}:branch:EventTracking:${eventId}:${dateStr}:${uid}`;
            redis.incr(key);
        });
    }
}
