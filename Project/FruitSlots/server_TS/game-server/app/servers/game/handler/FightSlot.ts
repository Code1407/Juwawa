import { Application, FrontendSession } from 'pinus';
import { IBetResp, IEnterGameResp, gConst } from '../interface/IFightSlot';
import GameServer from '../GameServer';
import FightSlotScene from '../logic/FightSlot/FightSlotScene';
import FightSlotPlayer from '../logic/FightSlot/FightSlotPlayer';

export default function (app: Application) {
    return new FightSlot(app);
}

export class FightSlot {
    constructor(private app: Application) { }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, FightSlotPlayer) as FightSlotPlayer;
        if (!player) return null;
        return player.enterGame();
    }

    async DebugResult(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.DebugResult(msg.resultDev);
        else return null;
    }

    async test(msg: any, session: FrontendSession): Promise<void> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.test(msg.betAmount, msg.testCount);
        else return null;
    }

    async betNormal(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.betNormal(msg.betAmount);
        else return null;
    }

    async betFree(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.betFree();
        else return null;
    }

    async betSuper(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.betSuper();
        else return null;
    }

    async stopRound(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }

    async setBetAmountButton(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.setBetAmountButton(msg.betAmountButtonIndex);
    }

    async updateSettings(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.updateSettings(msg.config);
    }

    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FightSlotScene;
        let player = scene.getPlayer(session.uid) as FightSlotPlayer;
        if (player) return player.synchronize();
        else return null;
    }
}