import { director, ISchedulable, Scheduler } from "cc";
import { oops } from "db://oops-framework/core/Oops";
import { Utils } from "db://assets/script/framework/utils/Utils"
import { Logger } from "db://oops-framework/core/common/log/Logger";
import { EDITOR, PREVIEW } from "cc/env";
import { CommomIconPath, FrameNetMsg } from "../commom/FrameDefine";
import { EventMessage } from "db://oops-framework/core/common/event/EventMessage";
import PureClient, { GameClientConfig, GameCommonConfig } from "../PureClient/PureClient.min.js"
import { UIID } from "../../module/common/GameUIConfig";


type EventCall = (...args: any) => void;
type MsgCall = (msg: {}) => void;

export default class Network implements ISchedulable {
    private jsSdk: PureClient.JsSdk = null;
    /**网络插件对象 */
    private jsNet: PureClient.JsNet = null;
    /**登录到服务器标识 */
    private isConnect: boolean = false;
    /**定时器 */
    private scheduler: Scheduler = null;
    /**同步时间戳间隔 */
    private readonly heatTime: number = 4;
    /**同步时间戳CD*/
    private heartbeatCD: number = this.heatTime;
    /**服务器当前时间(毫秒) */
    private serverTime: number = 0;
    /**重连次数 */
    private retryMaxCount: number = 5;
    private kickout: boolean = false;
    private timeId: number = -1;

    private client:any = null;

    public get IsConnect(): boolean {
        return this.isConnect;
    }

    public get ServerTime(): number {
        return this.serverTime;
    }

    constructor() {
        Scheduler.enableForTarget(this);
        this.scheduler = director.getScheduler();
        this.serverTime = Date.now();
    }

    async initSdk(){
        let cfg = null
        if (PREVIEW || EDITOR) {
            cfg = oops.config.sdk;
            console.log("current env is EDITOR");
        }
        this.client = new PureClient.PureClient()
        const r = await this.client.init(10000, cfg);
        if (!r) {
            this.client = null;
            return console.log("sdk init failed");
        }
        this.jsSdk = this.client.getSdk();
        this.jsSdk.addEvent("onQueryUser", this.onGetUser.bind(this));
    }

    async initNet() {
        if(!this.client){
            oops.gui.showCommonConfirmUI({ content: "sdk init failed" });
            return;
        }
        this.jsNet = this.client.getNet()
        let uId = this.jsSdk.getUid()
        if (!uId) {
            oops.gui.showCommonConfirmUI({ content: "uId is nil" });
            return console.log("uId is nil");
        }

        let serverAdress = oops.config.sdk.serverAdress;
        if (!serverAdress || serverAdress == "" || serverAdress == undefined) {
            oops.gui.showCommonConfirmUI({ content: "serverAdress is nil" });
            return console.log("serverAdress is nil");
        }

        let platId = this.jsSdk.getPlatId()
        if (!platId || platId <= 0) {
            oops.gui.showCommonConfirmUI({ content: `platId ${platId} invalid ` });
            return console.error(`platId ${platId} invalid `);
        }

        let platkey = this.jsSdk.getPlatKey()
        if (!platkey) {
            oops.gui.showCommonConfirmUI({ content: "platkey is nil" });
            return console.log("platkey is nil");
        }

        let token = this.jsSdk.getToken()
        if (!token) {
            oops.gui.showCommonConfirmUI({ content: "token is nil" });
            return console.log("token is nil");
        }

        let gameId = this.jsSdk.getGameId()
        if (!gameId || gameId <= 0) {
            oops.gui.showCommonConfirmUI({ content: `gameId ${gameId} invalid ` });
            return console.error(`gameId ${gameId} invalid `);
        }

        let gameIndex = Utils.getQuery("gameIndex") || oops.config.sdk.serverIndex;

        let area = this.jsSdk.getArea() || "";
        let lang = this.getLang();

        console.log("【连接参数】 uid:%s | serverAdress:%s | platId:%s | platkey:%s | token:%s | gameIndex:%s | gameId:%s",
            uId, serverAdress, platId, platkey, token, gameIndex, gameId);

        this.jsNet.addEvent("onConnect", () => {
            this.onConnect(uId, platId, token, gameIndex, area, lang);
        });
        this.jsNet.addEvent("onRetry", (count) => {
            this.onRetry(count);
        });
        this.jsNet.addEvent("onError", (msg) => {
            this.onError(msg);
        });
        this.jsNet.addEvent("onDisconnect", this.onDisconnect.bind(this));
        this.jsNet.addEvent("onPing", this.onPing.bind(this));

        this.jsNet.listenMsg(FrameNetMsg.SC_KICK_OUT_PUSH, (msg) => {
            this.onKickOut(msg);
        });
    }

    recharge() {
        if (!this.jsSdk) {
            console.error("jsSdk is nil");
            return;
        }
        this.jsSdk.recharge()
    }

    quit() {
        if (this.jsNet) {
            this.jsNet.disconnect()
        }
        if (!this.jsSdk) {
            console.error("jsSdk is nil");
            return;
        }
        this.jsSdk.quit()
        console.log("quit game");
    }

    connect() {
        if (!this.jsNet) {
            console.error("jsNet is nil");
            return;
        }
        this.endAutoReconnect();
        let serverAdress = oops.config.sdk.serverAdress;
        this.jsNet.connect(serverAdress, {
            pingInterval: 3,
            pingOut: 8,
            retryInterval: 1,
            retryMaxCount: this.retryMaxCount,
            compress: true
        });
    }

    private async onConnect(uid: string, platId: number, token: string, gameIndex: any, area: string, lang: string) {
        try {
            let msg = {
                uId: uid,
                platId: platId,
                token: token,
                gameIndex: gameIndex,
                area: area,
                lang: lang,
                ext: this.jsSdk.getExt()
            }
            let resp = await this.jsNet.reqMsg<IConnectResult>("AuthGame", msg);
            if (resp) {
                if (resp.err > 0) {
                    Logger.instance.logNet(`Connect Error【${resp.err}】`);
                    return;
                }
                //登录成功
                this.isConnect = true;
                this.kickout = false;
                this.scheduler.schedule(this.update, this, 0);
                this.onSyncTime();
                oops.gui.remove(UIID.Confirm);
                oops.gui.closeConnectAni();
                this.endAutoReconnect();
                oops.message.dispatchEvent(EventMessage.GAME_NET_CONNECT);
                Logger.instance.logNet("Connect Success");
            }
        }
        catch (error) {
            Logger.instance.logNet(`Connect Error【${error}】`);
        }
    }

    private async onRetry(count: number) {
        console.log(`onRetry:${count}`);
        if (count == 1) {//弹窗
            oops.gui.showDisconnectUI(CommomIconPath.Disconnect, oops.language.getLangByID("common_tip_disconnected"));
            this.startAutoReconnect();
            oops.gui.closeConnectAni();
        } else if (count == this.retryMaxCount) {//重连动画
            oops.gui.remove(UIID.Confirm);
            this.endAutoReconnect();
            oops.gui.showReconnectAni();
        }
    }

    private async onDisconnect() {
        this.isConnect = false;
        this.scheduler.unschedule(this.update, this);
        oops.gui.closeConnectAni();
        //自动断开
        //if (!this.kickout) {
        oops.message.dispatchEvent(EventMessage.GAME_NET_DISCONNECT);
        //}
        Logger.instance.logNet("Server Disconnect");
    }

    private async onError(msg) {
        console.error(`Net error:${msg}`);
    }

    //平台通知玩家数据变化事件
    private async onGetUser() {
        console.log(`onGetUser`);
        this.pushMsg(FrameNetMsg.CS_PLAYER_BASE_DATA_REQ, {});
    }

    private async onPing() {
        let pingNum = this.jsNet.getNetDelay();
        oops.message.dispatchEvent(EventMessage.GAME_PING, { ping: pingNum });
    }

    private onKickOut(msg) {
        let reason = msg.reason;
        if (reason == 1) { //顶号
            oops.gui.showDisconnectUI(CommomIconPath.Kickout, oops.language.getLangByID("common_tip_kickout"));
        } else if (reason == 2) {//长时间不玩游戏消费
            oops.gui.showDisconnectUI(CommomIconPath.LongTimeNoPlay, oops.language.getLangByID("common_tip_long_time_noplay"));
        }else if (reason == 3) {//服务器维护
            oops.gui.showMaintaintUI();
        }
        this.kickout = true;
        this.jsNet.disconnect();
        console.log(`kickout:${reason}`);
    }

    private async onSyncTime() {
        if (!this.IsConnect) {
            return;
        }
        try {
            let resp = await this.jsNet.reqMsg<CsSyncTimeResp>(FrameNetMsg.CS_SYNC_TIME_REQ, { cTime: Date.now() })
            if (resp) {
                let ctime = resp.cTime;
                let sTime = resp.sTime;
                let offsetTime = Date.now() - ctime;
                if (offsetTime < 0) {
                    offsetTime = 0;
                }
                let offset = Math.floor(offsetTime / 2);
                this.serverTime = sTime + offset;
                oops.message.dispatchEvent(EventMessage.GAME_SYNC_SERVER_TIME);
            }

        } catch (error) {
            Logger.instance.logNet(`SyncTime Fail【${error}】`);
        }
    }


    addEvent(name: string, func: EventCall): boolean {
        return this.jsNet.addEvent(name, func);
    }

    reqMsg(msgName: string, msg: {}): Promise<{}> {
        if (!this.IsConnect) {
            return;
        }
        return this.jsNet.reqMsg(msgName, msg);
    }

    pushMsg(msgName: string, msg: {}): boolean {
        if (!this.IsConnect) {
            return;
        }
        this.jsSdk.getLang
        return this.jsNet.pushMsg(msgName, msg);
    }

    listenMsg<T>(name: string, func: (msg: T) => void): boolean {
        if (!this.jsNet) {
            return;
        }
        return this.jsNet.listenMsg(name, func);
    }

    getCommonConfig(): GameCommonConfig {
        return this.jsNet.getCommonConfig();
    }

    getgetClientConfig(): GameClientConfig {
        return this.jsNet.getClientConfig();
    }

    getLang():string{
        if(!this.jsSdk){
            console.log("sdk init fail,use default language en");
            return "en";
        }
        return this.jsSdk.getLang() || "en";
    }


    update(dt: number): void {
        if (this.isConnect) {
            if (this.heartbeatCD >= 0) {
                this.heartbeatCD -= dt;
                if (this.heartbeatCD < 0) {
                    this.heartbeatCD = -1;
                    this.onSyncTime();
                }
            }
            else {
                this.heartbeatCD = this.heatTime;
            }
            this.serverTime += dt * 1000;
        }
    }

    private startAutoReconnect() {
        this.endAutoReconnect();
        if (this.isConnect) {
            return;
        }
        this.timeId = setTimeout(() => {
            if (this.isConnect) {
                this.endAutoReconnect();
                return;
            }
            this.connect();
        }, 15000) as unknown as number;
    }

    private endAutoReconnect() {
        if (this.timeId != -1) {
            clearTimeout(this.timeId);
            this.timeId = -1;
        }
    }
}

interface IConnectResult {
    uId: string;
    err: number;
}
