import { Application, FrontendSession } from 'pinus';
import GameServer from '../GameServer';
import { IEnterGameResp, gConst } from "../interface/IPirateFishingMulti";
import PirateFishingMultiScene from '../logic/PirateFishingMulti/PirateFishingMultiScene';
import { PirateFishingMultiPlayer } from '../logic/PirateFishingMulti/PirateFishingMultiPlayer';
import { GamePlayerBase } from '../logic/GameBase/GamePlayerBase';


export default function (app: Application) {
    return new PirateFishingMulti(app);
}

export class PirateFishingMulti {
    constructor(private app: Application) {
    }

    async enterGame(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();

        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        if (!scene) return null;

        let player = await scene.createPlayer(msg, session, PirateFishingMultiPlayer) as PirateFishingMultiPlayer;
        if (!player) return null;
        return player.enterGame(msg.screen, msg.machineDuration);
    }
    async enterRoom_new(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.enterRoom_new(msg.screen, msg.machineDuration);
    }
    async autoQuit(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.autoQuit();
    }
    async autoShootToTarget(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.autoShootToTarget(msg.targetId);
        else return null;
    }
    async normalShoot(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.normalShoot(msg.amount, msg.targetId, msg.bulletId, msg.shootInfo);
        else return null;
    }
    async hookShoot(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.hookShoot(msg.amount, msg.targetId, msg.bulletId, msg.shootInfo);
        else return null;
    }
    async laserShoot(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.laserShoot(msg.amount, msg.targetId, msg.bulletId, msg.shootInfo);
        else return null;
    }
    async propUse(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.propUse(msg.amount, msg.fishIdArray, msg.propId, msg.shootInfo, msg.propType);
        else return null;
    }
    async mergeShoot(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.mergeShoot(msg.amount, msg.betAmountIndex, msg.weaponType, msg.mergeData);
        else return null;
    }
    async runSlot(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.runSlot(msg.time, msg.stackCount);
        else return null;
    }
    async shootTest(msg: any, session: FrontendSession): Promise<number> {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.shootTest(msg.testIndex);
        else return null;
    }
    async stopRound(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.stopRound(msg.roundId);
        else return null;
    }
    async setBetAmountIndex(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.setBetAmountIndex(msg.betAmountIndex);
    }
    async updateSettings(msg: any, session: FrontendSession) {
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
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
    async clickHook(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.clickHook(msg.use);
    }
    async clickLaser(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.clickLaser(msg.use);
    }
    async setGunPos(msg: any, session: FrontendSession) {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.setGunPos(msg.gunPoint, msg.touchPos);
    }
    async synchronize(msg: any, session: FrontendSession): Promise<IEnterGameResp> {
        //await delay(randomInt(800, 1200));
        let game: GameServer = this.app.get("GameServer");
        await game.ready();
        let scene = game.getScene(gConst.gameName) as PirateFishingMultiScene;
        let player = scene.getPlayer(session.uid) as PirateFishingMultiPlayer;
        if (player) return player.synchronize();
        else return null;
    }
}