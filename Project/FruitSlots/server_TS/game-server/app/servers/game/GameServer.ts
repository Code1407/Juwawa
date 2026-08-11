import { Application } from 'pinus';
import { getLogger } from 'pinus-logger';
let logger = getLogger("GameServer", __filename);

import Database from './database/database';
import IGameScene from './logic/GameScene';
import SDK from './sdk/SDK';
import RankAward from './branch/GlobalRank/RankAward';
import UserTrace from './branch/Trace/UserTrace';
import FileWatchUtil from './utils/FileWatchUtil';
import { ISdkConfig } from './sdk/ISdk';
import { AntiAddiction } from './branch/AntiAddiction/AntiAddiction';
import { Redeem } from './branch/Redeem/Redeem';
import { gConst as PirateFishingMulti } from "./interface/IPirateFishingMulti";
import PirateFishingMultiScene from './logic/PirateFishingMulti/PirateFishingMultiScene';
import { gConst as GoldFishing } from "./interface/IGoldFishing";
import GoldFishingScene from './logic/GoldFishing/GoldFishingScene';
import { gConst as FruitSlots } from "./interface/IFruitSlots";
import FruitSlotsScene from './logic/FruitSlots/FruitSlotsScene';
import { gConst as PirateKing } from "./interface/IPirateKing";
import PirateKingScene from './logic/PirateKing/PirateKingScene';
import { gConst as FootballSlot } from "./interface/IFootballSlot";
import { FootballSlotScene } from './logic/FootballSlot/FootballSlotScene';
import { gConst as FightSlot } from "./interface/IFightSlot";
import FightSlotScene from './logic/FightSlot/FightSlotScene'
import { gConst as YummySlot } from "./interface/IYummySlot";
import YummySlotScene from './logic/YummySlot/YummySlotScene'
import { gConst as BeeSlot } from "./interface/IBeeSlot";
import BeeSlotScene from './logic/BeeSlot/BeeSlotScene'


export class Scenes {
    [sceneName: string]: IGameScene;
}

export default class GameServer {
    private scenes: Scenes;
    sdk: SDK = null;
    db: Database = null;
    sdkName: string = null;
    configFilePath: string = null;
    sdkConfig: ISdkConfig = null;

    rankAward: RankAward = null;
    antiAddiction: AntiAddiction = null;
    redeem: Redeem = null;
    trace: UserTrace = null;

    constructor(public app: Application) {
        this.initScenes();
    }

    private buildSdk() {
        this.sdk = new SDK(this.app, this, this.sdkName);
        console.log("================ SDK done =======================================================================" + this.sdkName);

        if (this.configFilePath) {
            // 取消监听
            FileWatchUtil.unwatch(this.configFilePath);
            // 重新监听
            FileWatchUtil.watch(this.configFilePath, (event, filename) => {
                delete require.cache[require.resolve(this.configFilePath)];

                this.buildSdk();
            });
        }
    }

    async initScenes() {
        console.log("================ initScenes ===========");

        await new Promise(resolve => setTimeout(resolve, 5000));

        this.sdkName = this.app.getServerId();
        console.log("----- " + this.sdkName);

        this.buildSdk();

        this.db = new Database(this.app, this.sdkName, Object.keys(this.sdk));
        await this.db.ready();

        while (!this.app.get('sessionService') || !this.app.get('channelService')) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.rankAward = new RankAward(this.app, this, this.sdkName);
        console.log("================ initRankAward done ===========");

        this.trace = new UserTrace(this.app, this.sdkName);
        console.log("================ initTrace done ===========");

        this.scenes = new Scenes();
        await this.initSdkScenes(this.sdkName);
        console.log("================ Scenes done ===========");

        this.antiAddiction = new AntiAddiction(this.app, this, this.sdkName);
        this.redeem = new Redeem(this.app, this, this.sdkName);
        console.log("================ Redeem done ===========");

        console.log("================ AntiAddiction done ===========");
    }

    async buidScene<SceneType extends IGameScene>(sdkName: string, gameName: string,
        GameScene: new (app: Application, gameServer: GameServer, sdkName: string) => SceneType) {
        try {
            let gameScene = new GameScene(this.app, this, sdkName);
            this.scenes[gameName] = gameScene;
            await gameScene.initScene();
        } catch (e) {
            logger.error(e.message);
        }
    }

    async initSdkScenes(sdkName: string) {
        await this.buidScene(sdkName, PirateFishingMulti.gameName, PirateFishingMultiScene);
        await this.buidScene(sdkName, GoldFishing.gameName, GoldFishingScene);
        await this.buidScene(sdkName, FruitSlots.gameName, FruitSlotsScene);
        await this.buidScene(sdkName, PirateKing.gameName, PirateKingScene);
        await this.buidScene(sdkName, FootballSlot.gameName, FootballSlotScene);
        await this.buidScene(sdkName, FightSlot.gameName, FightSlotScene);
        await this.buidScene(sdkName, YummySlot.gameName, YummySlotScene);
        await this.buidScene(sdkName, BeeSlot.gameName, BeeSlotScene);
    }

    async ready() {
        while (!this.scenes) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    removePlayer(gameName: string, uid: string) {
        if (this.scenes && this.scenes[gameName]) this.scenes[gameName].removePlayer(uid);
    }

    getScenes(): Scenes {
        return this.scenes;
    }

    getScene(gameName: string): IGameScene {
        return this.scenes[gameName];
    }

    getRankAward(): RankAward {
        return this.rankAward;
    }

    getTrace(): UserTrace {
        return this.trace;
    }
}
