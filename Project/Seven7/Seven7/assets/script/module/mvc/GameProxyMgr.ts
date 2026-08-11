
import { SingletonFactory } from "db://assets/script/framework/commom/SingletonFactory";
import IMvc from "./IMvc";
import PlayerProxy from "../player/PlayerProxy";
import RankProxy from "../rank/RankProxy";
import MailProxy from "../mail/MailProxy";
import Seven7Proxy from "../seven7/Seven7Proxy";

class GameProxyMgr {
    public static instance = null;
    private _tProxy: Array<IMvc> = [];

    playerProxy: PlayerProxy = null;
    rankProxy:RankProxy = null;
    mailProxy: MailProxy = null;
    seven7Proxy: Seven7Proxy = null;

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
        this.rankProxy = this.newProxy(RankProxy);
        this.mailProxy = this.newProxy(MailProxy);
        this.seven7Proxy = this.newProxy(Seven7Proxy);

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