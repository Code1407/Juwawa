import { Channel, ChannelService, FrontendSession, Logger, SessionService } from "pinus";
import Mysql from "../../database/db/mysql";
import Redis from "../../database/db/redis";
import IGameScene, { ISceneStatus } from "../GameScene";
import IGamePlayer from "../GamePlayer";
import { DingdingWarn } from "../../dingding/DingdingWarn";
import GameServer from "../../GameServer";
import { IAccount, strServiceMaintenance } from "../../interface/IGame";
import { randomInt } from "crypto";
import { ISdkConfig } from "../../sdk/ISdk";
import { delay } from "bluebird";

export abstract class GameSceneBase implements IGameScene {
    today: Date = new Date();
    redis: Redis;
    mysql: Mysql;
    dingdingWarn: DingdingWarn;
    sdkConfig: ISdkConfig = null;
    protected channelService: ChannelService;
    protected channel: Channel;
    protected sessionService: SessionService;

    abstract initScene();
    abstract createPlayer(msg: any, session: FrontendSession, playerCtor: new(scene: IGameScene)=>IGamePlayer): Promise<IGamePlayer>;
    abstract forceRemovePlayer(uid: string);
    abstract removePlayer(uid: string);
    abstract getPlayer(uid: string): IGamePlayer;
    abstract status(): ISceneStatus;
    abstract destroy(): Promise<ISceneStatus>;
    abstract forceDestroy();
    abstract restart(): Promise<ISceneStatus>;
    abstract todayRound(): number;
    abstract newDay();
    abstract isStop(): boolean;
    abstract onScenebeat(); 

    protected heartbeatCount = 0;

    constructor(public gameServer: GameServer, protected _gameName: string, protected logger: Logger) {   
        let tick = 1000;
        setInterval(this.heartbeat.bind(this), tick);
    }

    heartbeat() {
        let today = new Date();
        if (today.toLocaleDateString() != this.today.toLocaleDateString()) {
            this.newDay();
        }
        this.dingdingWarn.onHeartbeat();
        this.onScenebeat();
    }

    getTimezone(): string {
        let timezone: string = this.gameServer.sdkConfig?.timezone ? this.gameServer.sdkConfig.timezone : "+08:00";
        return timezone;
    }

    async incrTodayBet(incr: number) {
        await this.dingdingWarn.incrTodayBet(this.today, incr);
    }

    async incrTodayRevenue(incr: number): Promise<boolean> {
        return this.dingdingWarn.incrTodayRevenue(this.today, incr, this.forceDestroy.bind(this));
    }

    encodeAccount(account: IAccount): IAccount {
        account.nickname = encodeURI(account.nickname);
        try {
            let lastSlashIndex = account.avatar.lastIndexOf('/') + 1;
            let url1 = account.avatar.substring(0, lastSlashIndex);
            let url2 = account.avatar.substring(lastSlashIndex);
            url2 = encodeURI(url2);
            account.avatar = url1 + url2;
        } catch(e) {
            this.logger.error(e);
        }
        return account;
    }

    async queryUserAccount(uid: string, token: string, extra: any): Promise<IAccount> {
        let sdk = this.gameServer.sdk[this.gameName()];
        try {
            let account = await sdk.queryAccount(uid, token, extra);
            return this.encodeAccount(account);
        } catch (e) {
            this.logger.error(e);
        }
        return null;
    }

    async initSceneBase() {
        this.today = new Date();
        this.mysql = this.gameServer.db.mysql[this.gameName()];
        this.redis = this.gameServer.db.redis[this.gameName()];

        let sdkName = this.gameServer.app.getServerId();

        this.dingdingWarn = new DingdingWarn(this.redis, this.logger, sdkName, this.gameName());
        await this.dingdingWarn.initValue(this.today);

        this.sessionService = this.gameServer.app.get('sessionService');
        this.channelService = this.gameServer.app.get('channelService');
        this.channel = this.channelService.createChannel(`${sdkName}.${this.gameName()}`);
    }

    getEnv() {
        return this.gameServer.app.get("env");
    }

    gameName(): string {
        return this._gameName;
    }

    async getSdkAccountById(ids: string[]): Promise<IAccount[]> {
        let users: IAccount[] = [];
        let rankListUsers = await this.redis.getSDKUsers(ids);
        for (let i in rankListUsers) {
            let userStr = rankListUsers[i];
            let user = JSON.parse(userStr);
            users.push(user.account);
        }
        return users;
    }

    async bindSession(uid: string, session: FrontendSession): Promise<boolean> {
        let awaitClose = false;

        // 用户进入游戏,即开始一个新的session，需要把之前用户的用户session关掉
        let oldSessions = this.sessionService.getByUid(uid)
        if (oldSessions && oldSessions.length) {
            this.send2Player("onLoginOther", uid, "onLoginOther");
            oldSessions.forEach(session => {
                session.closed("reconnect: " + uid);
                awaitClose = true;
            });
        }

        if (awaitClose) await delay(1*1000);

        // 离开之前的channel
        let serverID = this.gameServer.app.getServerId();
        for (let key in this.channelService.channels) {
            this.channelService.channels[key].leave(uid, serverID);
        }

        // 绑定新session与channel
        session.bind(uid, null);
        this.channel.add(uid, serverID);
        let channel = this.channel;
        session.on('closed', (session) => {
            let uid = session.uid;
            let serverID = this.gameServer.app.getServerId();
            channel.leave(uid, serverID);
            this.removePlayer(uid);
        });

        if (this.isStop()) {
            this.onMaintenance2Player(uid);
        }

        return true;
    }

    onAutoQuit(uid: string) {
        this.send2Player("onAutoQuit", uid, {});
    }

    onMaintenance() {
        this.broadcast("onMaintenance", strServiceMaintenance);
    }

    onMaintenance2Player(uid: string) {
        this.send2Player("onMaintenance", uid, strServiceMaintenance);
    }

    protected async broadcast(routerName: string, msg: any) {
        if (!this.channel) return;

        this.channel.pushMessage(routerName, msg, {}, err => {
            if (err) this.logger.error(err);
        });
    }

    protected async send2Player(routerName: string, uid:string, msg: any) {
        if (!this.channel) return;

        let channel = this.channel;
        let serverID = this.gameServer.app.getServerId();
        if (channel.groups[serverID]) {
            let index = channel.groups[serverID].findIndex(nUid => { return nUid == uid });
            if (index != -1) {
                let sid = this.channel.getMember(uid)['sid'];
                this.channelService.pushMessageByUids(routerName, msg, [{
                uid: uid,
                sid: sid
                }]);
            }
        }
    }

    async onChangeToken(uid: string, token: string) {
        this.send2Player("onChangeToken", uid, token);
    }
}