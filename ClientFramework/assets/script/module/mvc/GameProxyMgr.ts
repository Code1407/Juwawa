
import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";
import PlayerProxy from "../player/PlayerProxy";

class GameProxyMgr {
    public static instance = null;
    private _tProxy: Array<IMvc> = [];

    playerProxy: PlayerProxy = null;

    constructor() {
        if (GameProxyMgr.instance) {
            return GameProxyMgr.instance;
        }
        GameProxyMgr.instance = this;
    }

    private newProxy<T extends IMvc>(c: { new(): T }): T {
        let obj = SingletonFactory.getInstance(c);
        this._tProxy.push(obj);
        return obj;
    }

    initProxy() {
        this.playerProxy = this.newProxy(PlayerProxy);

        this._tProxy.forEach(m => {
            m.init();
        });
    }

    clearProxy() {
        this._tProxy.forEach(m => {
            m.clear();
        });
    }
}

export default new GameProxyMgr();