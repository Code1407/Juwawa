import { FrontendSession, Logger } from "pinus";

import IGamePlayer, { IPlayerstatus } from "../../GamePlayer";
import { PlayerCountDownBase, CoundDownEntity } from "./PlayerCountDownBase";
import { GameSceneBase } from "../GameSceneBase";
import IGameScene, { ISceneStatus } from "../../GameScene";
import { IRoundStepCountDown, MachineCountDownBase } from "./MachineCountDownBase";
import { EGameStatus, ICountDownPlayerUpdate, strServiceMaintenance } from "../../../interface/IGame";
import GameServer from "../../../GameServer";

type CountDownPlayer = PlayerCountDownBase<CoundDownEntity>;
type CountDownMachine = MachineCountDownBase<IRoundStepCountDown>;

export class CountDownPlayerList<PlayerType extends CountDownPlayer> { [uid: string]: PlayerType }

export abstract class SceneCountDownBase<PlayerType extends CountDownPlayer, MachineType extends CountDownMachine> 
    extends GameSceneBase 
{
    abstract onSceneInit();
    abstract onNewRound();
    abstract getEmptyItemAmount(): number[];
    abstract onNewDay();

    machine: MachineType;
    protected playerList = new CountDownPlayerList<PlayerType>();
    protected removeList = new CountDownPlayerList<PlayerType>();

    onScenebeat() {}

    todayRound(): number {
        return this.machine.todayRound();
    }

    async newRound() {
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            player.newRound();
        }
        for (let uid in this.removeList) {
            let player = this.removeList[uid];
            player.save();
            delete this.removeList[uid];
        }

        this.onNewRound();
    }

    async save() {
        try {
            for (let uid in this.playerList) {
                await this.playerList[uid].save();
            }
            for (let uid in this.removeList) {
                await this.removeList[uid].save();
            }
        } catch(e) {
            this.logger.error(e.message);
        }
    }

    getRoundAmountTotal(): number[] {
        let itemAmountTotal = this.getEmptyItemAmount();
        for (let uid in this.playerList) {
            let itemAmount = this.playerList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        for (let uid in this.removeList) {
            let itemAmount = this.removeList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        return itemAmountTotal;
    }

    constructor(protected machineCtor: new(scene: SceneCountDownBase<PlayerType, MachineType>)=>MachineType,
        gameServer: GameServer, gameName: string, logger: Logger) 
    {
        super(gameServer, gameName, logger);
    }

    addPlayer(uid: string, player: PlayerType) {
        this.playerList[uid] = player;
    }

    async initScene() {
        this.initSceneBase();
        await this.onSceneInit();

        let machine = new this.machineCtor(this);
        this.machine = machine;
        await machine.initMachine();
    }

    async createPlayer(msg: any, session: FrontendSession,
        playerCtor: new(scene: IGameScene)=>PlayerType): Promise<PlayerType>
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
            player = this.removeList[uid];
            if (player) delete this.removeList[uid];
        }
        if (!player) {
            player = new playerCtor(this);
        }
        player.setAccont(account, uid, token, extra, ua, sdk);
        player.loginInfo(ua);
        this.playerList[uid] = player;

        return player;
    }

    getPlayer(uid: string): IGamePlayer {
        let player = this.playerList[uid];
        if (!player) player = this.removeList[uid];
        return player;
    }

    async removePlayer(uid: string) {
        if (this.isStop()) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.send2Player("onMaintenance", uid, strServiceMaintenance);
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
            await player.quit("quit");
            delete this.playerList[uid];
            this.removeList[uid] = player;
        }
    }

    onRoundStep(roundStep: IRoundStepCountDown) {
        this.broadcast("onRoundStep", roundStep);
        this.onPlayerUpdate(null);
    }

    onPlayerUpdate(playerResult: ICountDownPlayerUpdate) {
        let roundStep = this.machine.getRoundStep();
        let status = roundStep.status;
        let remainSecond = Math.max(0, roundStep.remainSecond);
        if (status == EGameStatus.run && remainSecond <= 2) {
            for (let uid in this.playerList) {
                let player = this.playerList[uid];
                let diamond = player.accountDiamond();
                let itemAmount = player.getItemAmount();
                let data: ICountDownPlayerUpdate = {diamond, itemAmount};
                this.send2Player("onPlayerUpdate", uid, data);
            }
            for (let uid in this.removeList) {
                let player = this.removeList[uid];
                let diamond = player.accountDiamond();
                let itemAmount = player.getItemAmount();
                let data: ICountDownPlayerUpdate = {diamond, itemAmount};
                this.send2Player("onPlayerUpdate", uid, data);
            }
        }
    }

    newDay() {
        this.today = new Date();
        this.machine.onNewDay();
        this.dingdingWarn.onNewDay();

        for (let uid in this.playerList) {
            this.playerList[uid].onNewDay();
        }
        for (let uid in this.removeList) {
            this.removeList[uid].onNewDay();
        }
        this.broadcast("onNewDay", null);

        this.onNewDay();
    }

    getItemAmountTotal(): number[] {
        let itemAmountTotal = this.getEmptyItemAmount();
        for (let uid in this.playerList) {
            let itemAmount = this.playerList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        for (let uid in this.removeList) {
            let itemAmount = this.removeList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        return itemAmountTotal;
    }

    status(): ISceneStatus {
        let sdkName = this.gameServer.app.getServerId();
        let playerStatus: IPlayerstatus[] = [];
        for (let uid in this.playerList) {
            playerStatus.push(this.playerList[uid].status());
        }
        for (let uid in this.removeList) {
            playerStatus.push(this.removeList[uid].status());
        }
        return {
            sdkName: sdkName,
            scene: this.gameName(), 
            status: this.machine.status(),
            playerStatus: playerStatus,
        };
    }

    isStop(): boolean {
        return this.machine.status() == EGameStatus.stop;
    }

    async destroy(): Promise<ISceneStatus> {
        await this.machine.destroy();
        this.onMaintenance();

        let rets: Promise<any>[] = [];
        for (let uid in this.playerList) {
            rets.push(this.playerList[uid].quit("force2quit"));
            delete this.playerList[uid];
        }
        for (let uid in this.removeList) {
            rets.push(this.removeList[uid].quit("force2quit"));
            delete this.removeList[uid];
        }
        await Promise.all(rets);
        return this.status();
    }

    async restart(): Promise<ISceneStatus> {
        await this.machine.restart();
        await this.dingdingWarn.initValue(this.today);
        return this.status();
    }

    async forceRemovePlayer(uid: string): Promise<void> {
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

        delete this.playerList[uid];
    }

    async forceDestroy(): Promise<void> {
        this.machine.forceDestroy();
        this.logger.error("forceDestroy");
    }
}