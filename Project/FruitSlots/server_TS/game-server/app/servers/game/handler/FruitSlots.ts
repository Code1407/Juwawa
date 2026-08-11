import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, IBetResp, gConst, IRoundResultResp } from "../interface/IFruitSlots";
import FruitSlotsPlayer from '../logic/FruitSlots/FruitSlotsPlayer';
import FruitSlotsScene from '../logic/FruitSlots/FruitSlotsScene';

export default function (app: Application) {
    return new FruitSlots(app);
}

export class FruitSlots {
    constructor(private app: Application) {}
    
    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, FruitSlotsPlayer) as FruitSlotsPlayer;
        if (!player) return null;
        return player.enterGame();
    }

    async betNormal(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        let player = scene.getPlayer(session.uid) as FruitSlotsPlayer;
        if (player) return player.betNormal(msg.betAmount);
        else return null;
    }

    async betFree(msg: any, session: FrontendSession): Promise<IBetResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        let player = scene.getPlayer(session.uid) as FruitSlotsPlayer;
        if (player) return player.betFree();
        else return null;
    }

    async stopRound(msg: any, session: FrontendSession): Promise<IRoundResultResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        let player = scene.getPlayer(session.uid) as FruitSlotsPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }

    async setBetAmountButton(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        let player = scene.getPlayer(session.uid) as FruitSlotsPlayer;
        if(player) return player.setBetAmountButton(msg.betAmountButtonIndex);
    }

    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as FruitSlotsScene;
        let player = scene.getPlayer(session.uid) as FruitSlotsPlayer;
        if (player) return player.synchronize();
        else return null;
    }
}