import { Application } from "pinus";
import { SDK_UserLogin, SDK_UserDelay } from "../../database/entity/SDKEntity";
import { IAction, IDalayMsg, ITrace } from "../../interface/ITrace";
import Mysql from "../../database/db/mysql";

export default class UserTrace implements ITrace {
    mysql: Mysql;
    logings: SDK_UserLogin[] = [];
    delays: SDK_UserDelay[] = [];

    constructor(app: Application, sdkName: string) {
        this.mysql = new Mysql(app, sdkName);
        let tick = 5000;
        setInterval(this.heartbeat.bind(this), tick);
    }

    async heartbeat() {
        if (this.logings.length > 0) {
            this.mysql.insertMuti<SDK_UserLogin>(this.logings);
        }
        this.logings = [];

        if (this.delays.length > 0) {
            this.mysql.insertMuti<SDK_UserDelay>(this.delays);
        }
        this.delays = [];
    }

    async userAction(msg: IAction) {
        let now = new Date;
        let login = new SDK_UserLogin;
        login.day = now;
        login.uid = msg.uid;
        login.game_name = msg.gameName;
        login.account_diamond = msg.accountDiamond;
        login.save_time = now;
        login.ua = msg.action;
        login.save_time = now;
        this.logings.push(login);
    }

    userDelay(msg: IDalayMsg) {
        let now = new Date;
        let delay = new SDK_UserDelay;
        delay.day = now;
        delay.uid = msg.uid;
        delay.game_name = msg.gameName;
        delay.round = msg.round;
        delay.time_query = msg.queryTime;
        delay.time_response = msg.responseTime;
        delay.extra = msg.extra;
        delay.save_time = now;
        this.delays.push(delay);
    }
}