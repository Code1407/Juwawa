import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";
import PlayerSystem from "db://assets/script/module/player/PlayerSystem";
import RankSystem from "../rank/RankSystem";
import MailSystem from "../mail/MailSystem";
import FootballLeagueSystem from "../footballLeague/FootballLeagueSystem";

class GameSystemMgr {
    public static instance = null;
    private _tSystem: Array<IMvc> = [];

    playerSystem: PlayerSystem = null;
    rankSystem:RankSystem = null;
    mailSystem: MailSystem = null;
    footballLeagueSystem: FootballLeagueSystem = null;

    constructor() {
        if (GameSystemMgr.instance) {
            return GameSystemMgr.instance;
        }
        GameSystemMgr.instance = this;
    }

    private newSystem<T extends IMvc>(c: { new(): T }): T {
        let obj = SingletonFactory.getInstance(c);
        this._tSystem.push(obj);
        return obj;
    }

    initSystem() {
        this.playerSystem = this.newSystem(PlayerSystem);
        this.rankSystem = this.newSystem(RankSystem);
        this.mailSystem = this.newSystem(MailSystem);
        this.footballLeagueSystem = this.newSystem(FootballLeagueSystem);

        this._tSystem.forEach(m => {
            m.init();
        });
    }

    clearSystem() {
        this._tSystem.forEach(m => {
            m.clear();
        });
    }
}

export default new GameSystemMgr();