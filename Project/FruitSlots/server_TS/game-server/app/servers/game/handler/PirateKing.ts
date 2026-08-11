import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, IBetResp, gConst, IRoundResultResp } from "../interface/IPirateKing";
import PirateKingScene from '../logic/PirateKing/PirateKingScene';
import PirateKingPlayer from '../logic/PirateKing/PirateKingPlayer';
import { GamePlayerBase } from '../logic/GameBase/GamePlayerBase';

export default function (app: Application) {
    return new PirateKing(app);
}

export class PirateKing {
    constructor(private app: Application) { }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, PirateKingPlayer) as PirateKingPlayer;
        if (!player) return null;
        return player.enterGame();
    }
    
    async autoQuit(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName);
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.autoQuit();
    }

    async betNormal(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.betNormal(msg.betAmount);
        else return null;
    }

    async stopRound(msg: any, session: FrontendSession): Promise<IRoundResultResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }

    async setBetAmountButton(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.setBetAmountButton(msg.betAmountButtonIndex);
    }

    async updateSettings(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.updateSettings(msg.config);
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
        let scene = game.getScene(gConst.gameName) as PirateKingScene;
        let player = scene.getPlayer(session.uid) as PirateKingPlayer;
        if (player) return player.synchronize();
        else return null;
    }
}