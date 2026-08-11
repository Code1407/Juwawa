import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";
import PlayerSystem from "db://assets/script/module/player/PlayerSystem";
import RankSystem from "../rank/RankSystem";
import MailSystem from "../mail/MailSystem";
import Seven7System from "../seven7/Seven7System";

class GameSystemMgr {
    public static instance = null;
    private _tSystem: Array<IMvc> = [];

    playerSystem: PlayerSystem = null;
    rankSystem:RankSystem = null;
    mailSystem: MailSystem = null;
    seven7System: Seven7System = null;

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
        this.seven7System = this.newSystem(Seven7System);     

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