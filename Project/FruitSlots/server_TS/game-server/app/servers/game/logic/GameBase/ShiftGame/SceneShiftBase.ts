import { FrontendSession, Logger } from "pinus";

import { IPlayerstatus } from "../../GamePlayer";
import { GameSceneBase } from "../GameSceneBase";
import IGameScene, { ISceneStatus } from "../../GameScene";
import { EGameStatus } from "../../../interface/IGame";
import GameServer from "../../../GameServer";
import { ShiftEntity, PlayerShiftBase } from "./PlayerShiftBase";

type ShiftPlayer = PlayerShiftBase<ShiftEntity<any>, any>;

export class ShiftPlayerList<playerType> { [uid: string]: playerType }

interface IGameRates<GameRateType> {
    [rateType: string]: GameRateType;
}

interface INewUserResult {
    [multiple: string] : number[][];
}


export abstract class SceneShiftBase<playerType extends ShiftPlayer, GameRateType> extends GameSceneBase {
    abstract getDefaultGameRate(): GameRateType;
    abstract onSceneInit();
    abstract onDestroy(); 
    abstract onHeartbeat();

    gameStatus: EGameStatus = EGameStatus.stop;

    protected playerList = new ShiftPlayerList<playerType>();
    todayNewUserUid: {[buttonAmount: number]: string[]} = {};
    private todayRoundId: number = 0;
    gameRateDefault: GameRateType = this.getDefaultGameRate();
    gameRates: IGameRates<GameRateType> = {};
    newUserResult: INewUserResult = {};

    constructor(gameServer: GameServer, gameName: string, logger: Logger) {
        super(gameServer, gameName, logger);
    }

    todayRound(): number {
        return this.todayRoundId;
    }

    async incrTodayRoundID(): Promise<number> {
        this.todayRoundId = await this.redis.incrTodayRound(this.today);
        return this.todayRoundId
    }

    onKeepConnection() {
        this.broadcast("onKeepConnection", {});
    }

    async onScenebeat() {
        this.onHeartbeat();
    }

    getNewUserUid(buttonAmount: number): string[] {
        if (!this.todayNewUserUid[buttonAmount]) this.todayNewUserUid[buttonAmount] = [];
        return this.todayNewUserUid[buttonAmount];
    }
    addNewUserUid(buttonAmount: number, uid: string) {
        if (!this.todayNewUserUid[buttonAmount]) this.todayNewUserUid[buttonAmount] = [];
        if (!this.todayNewUserUid[buttonAmount].includes(uid)) this.todayNewUserUid[buttonAmount].push(uid);
    }

    newDay() {
        this.today = new Date();
        this.todayNewUserUid = {};
        this.dingdingWarn.onNewDay();
    }

    addPlayer(uid: string, player: playerType) {
        this.playerList[uid] = player;
    }

    async initScene() {
        this.initSceneBase();
        this.todayRoundId = await this.redis.getTodayRound(this.today);
        await this.onSceneInit();
        this.gameStart();
    }

    async createPlayer(msg: any, session: FrontendSession,
        playerCtor: new(scene: IGameScene)=>playerType): Promise<playerType>
    {
        let uid = msg.uid;
        let token = msg.token;
        let extra = msg.extra
        let ua = msg.ua;
        let sdk = this.gameServer.sdk[this.gameName()];

        let account = await this.queryUserAccount(uid, token, extra);
        if (!account) return null;

        if (account.token) token = account.token;
        if (account.uid) uid = account.uid;

        await this.bindSession(uid, session);
    
        let player = this.playerList[uid];
        if (!player) {
            player = new playerCtor(this);
        }
        player.setAccont(account, uid, token, extra, ua, sdk);
        player.loginInfo(ua);
        player.settletime = 3;
        this.playerList[uid] = player;

        return player;
    }

    getPlayer(uid: string): playerType {
        return this.playerList[uid];
    }

    async removePlayer(uid: string) {
        if (this.isStop()) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.onMaintenance2Player(uid);
        } else {
            let oldSessions = this.sessionService.getByUid(uid)
            if (oldSessions && oldSessions.length) {
                oldSessions.forEach(session => {
                    session.closed("removePlayer: " + uid);
                });
            }   
        }

        let player = this.playerList[uid];
        if (player) {
            player.settletime = 0;
            player.stopRunningRound();
            player.quit("quit");
            delete this.playerList[uid];
        }
    }

    status(): ISceneStatus {
        let sdkName = this.gameServer.app.getServerId();
        let playerStatus: IPlayerstatus[] = [];
        for (let uid in this.playerList) {
            playerStatus.push(this.playerList[uid].status());
        }
        return {
            sdkName: sdkName,
            scene: this.gameName(), 
            status: EGameStatus.bet,
            playerStatus: playerStatus,
        };
    }

    protected gameStart() {
        this.gameStatus = EGameStatus.bet;
    }

    protected gameStop() {
        this.gameStatus = EGameStatus.stop;
    }

    isStop(): boolean {
        return this.gameStatus == EGameStatus.stop;
    }

    async destroy(): Promise<ISceneStatus> {
        for (let uid in this.playerList) {
            this.removePlayer(uid);
        }

        this.gameStop();
        this.onMaintenance();

        return this.status();
    }

    async restart(): Promise<ISceneStatus> {
        this.gameStart();
        await this.dingdingWarn.initValue(this.today);
        return this.status();
    }

    async forceRemovePlayer(uid: string): Promise<void> {
        return this.removePlayer(uid);
    }

    forceDestroy() {
        this.gameStop();
        this.onMaintenance();
        this.logger.error("forceDestroy");
    }

    protected sendToPlayer(routerName: string, uid: string, msg: any) {
        let serverID = this.gameServer.app.getServerId();
        let channel = this.channel;
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
}