import * as log4js from 'log4js';
import Redis from '../database/db/redis';
import { TodayProfitThreshold } from '../database/entity/SDKEntity';

export class DingdingWarn {
    private todayBet: number = 0;
    private todayRevenue: number = 0;
    private todayWarnCount: number = 0;
    private todayLastWarnProfit: number = 0;
    private todayProfitThreshold: TodayProfitThreshold = { warn: -1000 * 1000, stop: -1000*1000*10 };
    private dingdingToken = "709aa11a8b793c46911b51317c5036bf86fa5712037781de416c84a6248f3210";
    private hasInit: boolean = false;

    constructor(private redis: Redis, private logger: log4js.Logger, private sdkname: string, private gameName: string) {}

    async initValue(today: Date) {
        if (!this.hasInit) return;
        this.todayProfitThreshold = await this.redis.getWarnThreshold();
        this.todayBet = await this.redis.getTodayBet(today);
        this.todayRevenue = await this.redis.getTodayRevenue(today);
        this.todayLastWarnProfit = this.todayProfitThreshold.warn;
        this.todayWarnCount = 0;
        this.hasInit = true;
    }

    async onHeartbeat() {
        let todayProfitThreshold = await this.redis.getWarnThreshold();
        if (todayProfitThreshold.warn != this.todayProfitThreshold.warn) this.todayWarnCount = 0;
        if (todayProfitThreshold.stop != this.todayProfitThreshold.stop) this.todayLastWarnProfit = this.todayProfitThreshold.warn;
        this.todayProfitThreshold = todayProfitThreshold;
    }

    onNewDay() {
        this.todayBet = 0;
        this.todayRevenue = 0;
        this.todayWarnCount = 0;
        this.todayLastWarnProfit = 0;
    }

    async incrTodayBet(today: Date, incr: number) {
        this.todayBet += incr;
        await this.redis.incrTodayBet(today, incr);
    }
    
    async incrTodayRevenue(today: Date, incr: number, closeServer: any): Promise<boolean> {
        let ret = false;
        this.todayRevenue += incr;
        let profite = this.todayBet - this.todayRevenue;
        if (profite <= this.todayProfitThreshold.warn * (this.todayWarnCount + 1) && profite < this.todayLastWarnProfit) {
            this.warn("亏损:" + profite);
            this.todayLastWarnProfit = profite;
            this.todayWarnCount++;
        }
        if (profite <= this.todayProfitThreshold.stop) {
            await closeServer();
            await this.warn("已关服---亏损达到阀值：" + this.todayProfitThreshold.stop);
            ret = true;
        }
        await this.redis.incrTodayRevenue(today, incr);
        return ret;
    }

    async profitWarn(profit: number, closeServer: any): Promise<boolean> {
        if (profit <= this.todayProfitThreshold.warn * (this.todayWarnCount + 1) && profit < this.todayLastWarnProfit) {
            let profite = this.todayBet - this.todayRevenue;
            this.warn("亏损:" + profite);
            this.todayLastWarnProfit = profite;
            this.todayWarnCount++;
        }
        if (profit <= this.todayProfitThreshold.stop) {
            await closeServer();
            await this.warn("已关服---亏损达到阀值：" + this.todayProfitThreshold.stop);
            return true;
        }
        return false;
    }

    async warn(msg: string) {
        let url = `https://oapi.dingtalk.com/robot/send?access_token=${this.dingdingToken}`;
        url = `https://oapi.dingtalk.com/robot/send?access_token=709aa11a8b793c46911b51317c5036bf86fa5712037781de416c84a6248f3210`;
        let body = {msgtype: "text", text: {content: `${this.sdkname}.${this.gameName} 异常告警：${msg}`}};
        let headers = {"Content-Type": "application/json"};
        let response = await fetch(url, {method: 'POST', headers: headers, body: JSON.stringify(body)});
        if (!response.ok) this.logger.error(response.json());
    }
}