import { Application, ChannelService } from "pinus";
import Redis from "../../database/db/redis";
import { IAntiAddiction } from "../../interface/IAntiAddiction";
import GameServer from "../../GameServer";
import { IAntiAddictionEntity } from "../../logic/GameBase/GamePlayerBase";
import { getTimezoneOptionDate } from "../../interface/IGame";

export class AntiAddiction implements IAntiAddiction {
    redis: Redis

    private channelService: ChannelService;

    constructor(private app: Application, private gameServer: GameServer, private sdkName: string) {
        this.channelService = this.app.get('channelService');
        this.redis = new Redis(app, sdkName, "noName");
        this.init();
    }
    init() {

    }
    async checkAddiction(uid: string, gameName: string) {
        let antiAddiction = (this.gameServer.getScene(gameName)?.getPlayer(uid) as any)?.userEntity?.antiAddiction as IAntiAddictionEntity;
        if (antiAddiction == null || antiAddiction.todayIgnore)
            return;
        if (antiAddiction.inLock) {
            let lockTime = await this.redis.getUserLockTime(uid, gameName)
            if (lockTime && lockTime > 0) {
                this.onFreezeTime(uid, gameName, lockTime);
            }
            else {
                antiAddiction.inLock = false;
            }
        }
        if (!antiAddiction.inLock) {
            this.onAddictionDataResp(uid, gameName, {
                todayBet: antiAddiction.todayBet,
                todayWin: antiAddiction.todayWin,
                todayRound: antiAddiction.todayRound,
            });
        }
    }
    lockUser(uid: string, gameName: string, sec: number) {
        this.redis.lockUser(uid, sec, gameName);
        let antiAddiction: IAntiAddictionEntity = (this.gameServer.getScene(gameName).getPlayer(uid) as any).userEntity.antiAddiction;
        antiAddiction.inLock = true;
        antiAddiction.todayBet = 0;
        antiAddiction.todayWin = 0;
        antiAddiction.todayRound = 0;
    }
    ignoreAddiction(uid: string, gameName: string) {
        let data = ((this.gameServer.getScene(gameName).getPlayer(uid) as any).userEntity.antiAddiction as IAntiAddictionEntity);
        data.todayIgnore = true;
    }
    eventTracking(uid: string, eventId: string) {
        const sdkConfig = this.gameServer.sdkConfig;
        const { local, options } = getTimezoneOptionDate(sdkConfig.timezone);
        let now = new Date();
        let todayDate = now.toLocaleDateString(local, options);
        this.redis.setTracking(uid, eventId, todayDate);
    }
    onFreezeTime(uid: string, gameName: string, sec: number) {
        this.send2Player(gameName, "onFreezeTime", uid, { sec });
    }
    onAddictionDataResp(uid: string, gameName: string, data: { todayWin: number; todayBet: number; todayRound: number; }) {
        this.send2Player(gameName, "onAddictionDataResp", uid, data);
    }

    async send2Player(gameName: string, routerName: string, uid: string, msg: any) {
        let serverID = this.app.getServerId();
        let channel = this.channelService.channels[`${this.sdkName}.${gameName}`];
        let uids = channel.groups[serverID];
        if (uids && uids.length && uids.includes(uid)) {
            let sid = channel.getMember(uid)['sid'];
            // console.log(`send`, routerName, `to`, uid);
            this.channelService.pushMessageByUids(routerName, msg, [{
                uid: uid,
                sid: sid
            }]);
        }
    }
}