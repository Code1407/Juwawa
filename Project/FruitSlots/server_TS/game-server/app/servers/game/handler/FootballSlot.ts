import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, IBetResp, gConst, IRoundResultResp } from "../interface/IFootballSlot";
import { FootballSlotPlayer } from '../logic/FootballSlot/FootballSlotPlayer';
import { FootballSlotScene } from '../logic/FootballSlot/FootballSlotScene';

export default function (app: Application) {
    return new FootballSlot(app);
}
export class FootballSlot {
    constructor(private app: Application) { }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, FootballSlotPlayer) as FootballSlotPlayer;
        if (!player) return null;
        return player.enterGame();
    }

    async setBetAmountButton(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.setBetAmountButton(msg.betAmountButtonIndex);
        else return null;
    }

    async updateSettings(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.updateSettings(msg.config);
        else return null;
    }

    async betNormal(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.betNormal(msg.betAmount);
        else return null;
    }

    async betFree(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.betFree();
        else return null;
    }

    async shootBall(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.shootBall();
        else return null;
    }

    async stopRound(msg: any, session: FrontendSession): Promise<IRoundResultResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }

    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.synchronize();
        else return null;
    }

    async dbmHeartbeat(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) return player.dbmHeartbeat();
    }

    async test(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FootballSlotScene;
        let player = scene.getPlayer(session.uid) as FootballSlotPlayer;
        if (player) player.test(msg.betAmount, msg.testCount);
    }

}