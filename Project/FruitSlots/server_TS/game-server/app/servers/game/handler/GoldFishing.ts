import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, gConst } from "../interface/IGoldFishing";
import GoldFishingScene from '../logic/GoldFishing/GoldFishingScene';
import { GoldFishingPlayer } from '../logic/GoldFishing/GoldFishingPlayer';


export default function (app: Application) {
    return new GoldFishing(app);
}

export class GoldFishing {
    constructor(private app: Application) {
    }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, GoldFishingPlayer) as GoldFishingPlayer;
        if (!player) return null;
        return player.enterGame(msg.screen, msg.machineDuration);
    }
    async autoQuit(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.autoQuit();
    }
    async autoShootToTarget(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.autoShootToTarget(msg.targetId);
        else return null;
    }
    async normalShoot(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.normalShoot(msg.amount, msg.targetId, msg.bulletId, msg.shootInfo);
        else return null;
    }
    async laserShoot(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.laserShoot(msg.amount, msg.targetId, msg.bulletId, msg.shootInfo);
        else return null;
    }
    async mergeShoot(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.mergeShoot(msg.amount, msg.betAmountIndex, msg.weaponType, msg.mergeData);
        else return null;
    }
    async skillAttack(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.skillAttack(msg.fishIdArray, msg.propId, msg.shootInfo);
        else return null;
    }
    async shootTest(msg: any, session: FrontendSession): Promise<number> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.shootTest(msg.testIndex);
        else return null;
    }
    async stopRound(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }
    async setBetAmountIndex(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.setBetAmountIndex(msg.betAmountIndex);
    }
    async updateSettings(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.updateSettings(msg.config);
    }
    async clickLaser(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.clickLaser(msg.use);
    }
    async setGunPos(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.setGunPos(msg.gunPoint, msg.touchPos);
    }
    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as GoldFishingScene;
        let player = scene.getPlayer(session.uid) as GoldFishingPlayer;
        if (player) return player.synchronize();
        else return null;
    }
}