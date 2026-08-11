import PlayerSystem from "db://assets/script/module/player/PlayerSystem";
import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";

class GameSystemMgr {
    public static instance = null;
    private _tSystem: Array<IMvc> = [];

    playerSystem: PlayerSystem = null;

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