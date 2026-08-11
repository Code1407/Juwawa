import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, IBetResp, gConst, } from "../interface/IYummySlot";
import YummySlotPlayer from '../logic/YummySlot/YummySlotPlayer';
import YummySlotScene from '../logic/YummySlot/YummySlotScene';
import { GamePlayerBase } from '../logic/GameBase/GamePlayerBase';


export default function (app: Application) {
    return new YummySlot(app);
}

export class YummySlot {
    constructor(private app: Application) {
    }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        if (!scene)
            return null;
        let player = await scene.createPlayer(msg, session, YummySlotPlayer) as YummySlotPlayer;
        if (!player)
            return null;
        return player.enterGame(msg.maxBetAmount);
    }

    async betNormal(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        let player = scene.getPlayer(session.uid) as YummySlotPlayer;
        if (player) return player.betNormal(msg.betAmount, msg.lineCount);
        else return null;
    }
    async betFree(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        let player = scene.getPlayer(session.uid) as YummySlotPlayer;
        if (player) return player.betFree();
        else return null;
    }

    async updateSettings(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        let player = scene.getPlayer(session.uid) as YummySlotPlayer;
        if (player) player.updateSettings(msg.config);
        else return null;
    }
    async dbmHeartbeat(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName);
        let player = scene.getPlayer(session.uid) as GamePlayerBase<any>;
        if (player) player.dbmHeartbeat();
        else return null;
    }

    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        let player = scene.getPlayer(session.uid) as YummySlotPlayer;
        if (player) return player.synchronize();
        else return null;
    }
    async stopRound(msg: any, session: FrontendSession): Promise<number> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as YummySlotScene;
        let player = scene.getPlayer(session.uid) as YummySlotPlayer;
        if (player) return await player.stopRound(msg.roundId);
        else return null;
    }

    // async gmSet(msg: any, session: FrontendSession): Promise<number> {
    //     let game: GameServer = this.app.get("GameServer");
    //     await game.ready();
    //     let scene = game.getScene(gConst.gameName) as YummySlotScene;
    //     scene.redis.set("rate", JSON.stringify(msg.rate));
    //     return 1;
    // }

    // async test(msg: any, session: FrontendSession) {
    //     let game: GameServer = this.app.get("GameServer");
    //     await game.ready();
    //     let scene = game.getScene(gConst.gameName) as YummySlotScene;
    //     let player = scene.getPlayer(session.uid) as YummySlotPlayer;
    //     if (player) return player.test(msg.betAmount, msg.lineCount, msg.testCount);
    //     else return null;
    // }

    // async nextResult(msg: any, session: FrontendSession) {
    //     let game: GameServer = this.app.get("GameServer");
    //     await game.ready();
    //     let scene = game.getScene(gConst.gameName) as YummySlotScene;
    //     let player = scene.getPlayer(session.uid) as YummySlotPlayer;
    //     if (player) return player.machine.resultsDev = msg.resultsDev;
    //     else return null;
    // }
}