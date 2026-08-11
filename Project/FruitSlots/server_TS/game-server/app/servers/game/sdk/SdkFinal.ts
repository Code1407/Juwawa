import { Application } from "pinus";
import Mysql from "../database/db/mysql";
import { ETradeType, SDK_ApiDelay } from "../database/entity/SDKEntity";
import { IAccount } from "../interface/IGame";
import { IOrderWithTime, ISdk } from "./ISdk";
import {IHintMsg, IHintPlayer} from "../hint/IHintPlayer";

export class SdkFinal implements ISdk {
    mysql: Mysql;
    delays: SDK_ApiDelay[] = [];
    constructor(private sdk: ISdk, private gameName: string, app: Application, sdkName: string) {
        this.mysql = new Mysql(app, sdkName);
        let tick = 5000;
        setInterval(this.heartbeat.bind(this), tick);
    }

    async heartbeat() {
        if (this.delays.length > 0) {
            this.mysql.insertMuti<SDK_ApiDelay>(this.delays);
        }
        this.delays = [];
    }

    private delayRecord(queryTime: number, uid: string, action: string,
        round?: number, orderId?: string, amount?: number, response_id?: string) {

        let responseTime = new Date().getTime();
        if (responseTime - queryTime > 1000 * 1) { // 超过1.5秒的为延迟
            if (this.delays.length < 10) { // 每次心跳只记10条记录
                let delay = new SDK_ApiDelay;
                delay.day = new Date(queryTime);
                delay.uid = uid;
                delay.game_name = this.gameName;
                delay.round = round;
                delay.action = action;
                delay.order_id = orderId;
                delay.response_id = response_id
                delay.amount = amount;
                delay.time_query = queryTime;
                delay.time_response = responseTime;
                delay.save_time = new Date(responseTime);
                this.delays.push(delay);
            }
        }
    }

    async queryAccount(uid: string, token: string, extra: any): Promise<IAccount> {
        let timeQuery = new Date().getTime();
        let resp = await this.sdk.queryAccount(uid, token, extra);
        this.delayRecord(timeQuery, uid, "login");
        return resp;
    }
    async tradeIn(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        let timeQuery = new Date().getTime();
        let resp = await this.sdk.tradeIn(roundId, uid, token, orderId, amount, extra);
        this.delayRecord(timeQuery, uid, ETradeType.tradeIn, roundId, orderId, amount, resp.orderId);
        return resp;
    }
    async tradeOff(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        let timeQuery = new Date().getTime();
        let resp = await this.sdk.tradeOff(roundId, uid, token, orderId, amount, extra);
        this.delayRecord(timeQuery, uid, ETradeType.tradeOff, roundId, orderId, amount, resp.orderId);
        return resp;
    }
    async tradeNothing(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        return this.sdk.tradeNothing(roundId, uid, token, orderId, amount, extra);
    }

    async hint?(players: IHintMsg[]): Promise<void> {
        if (this.sdk && this.sdk.hint) await this.sdk.hint(players);
    }
}
