import PlayerModel from "db://assets/script/module/player/PlayerModel";
import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";

class GameModelMgr {
    public static instance = null;
    private _tModel: Array<IMvc> = [];

    playerModel: PlayerModel = null;

    constructor() {
        if (GameModelMgr.instance) {
            return GameModelMgr.instance;
        }
        GameModelMgr.instance = this;
    }

    private newModel<T extends IMvc>(c: { new(): T }): T {
        let obj = SingletonFactory.getInstance(c);
        this._tModel.push(obj);
        return obj;
    }

    initModule() {
        this.playerModel = this.newModel(PlayerModel);

        this._tModel.forEach(m => {
            m.init();
        });
    }

    clearModule() {
        this._tModel.forEach(m => {
            m.clear();
        });
    }
}

export default new GameModelMgr();
(window as any).GameModelMgr = GameModelMgr;