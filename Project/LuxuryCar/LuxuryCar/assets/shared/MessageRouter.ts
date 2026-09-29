import { afterLoad } from "../lang/afterLoad";
import { GameClientConfig, GameCommonConfig, NetConfig } from "../PureClient/PureClient.min";
import { getQuery, serverConfig } from "../shared/Common"
import { setDisconnectRollView, setDisconnectView, setDisconnectView2 } from "../shared2/GlobalViewsLoader";
const PureClientModule = require("../PureClient/PureClient.min.js");

type MsgCallback = (data: any) => void;
type JsNetConstructor = new (gameId: number, platId: number, platKey: string, uId: string, reqTimeout: number) => any;

interface IJsSdkLike {
    init(arg: any): boolean;
    addEvent?(name: string, func: MsgCallback): boolean;
    getUid?(): string | undefined;
    getToken?(): string | undefined;
    getPlatId?(): number | undefined;
    getPlatKey?(): string | undefined;
    getGameId?(): number | undefined;
    getArea?(): string | undefined;
    getLang?(): string | undefined;
    getExt?(): string | undefined;
}

interface IRuntimeConnectConfig {
    uId: string;
    uid: string;
    token: string;
    gameId: number;
    platId: number;
    platKey: string;
    gameIndex: any;
    area: string;
    lang: string;
    ext: string;
    serverAdress: any;
    reqTimeout: number;
    netConfig?: NetConfig;
}

interface IPinusCompat {
    init(options: any, cb?: () => void): void;
    request(routeName: string, msg: any, cb?: (data: any) => void): void;
    on(routeName: string, cb: MsgCallback): void;
    disconnect(): void;
}

let _gameName: string = "";
let disconnectUiStageToken = 0;
let disconnectViewTimer = -1;
let disconnectUiStage: "idle" | "roll" | "view" = "idle";
let isLoginOtherKickOut = false;

function normalizeRoute(routeName: string): string {
    if (!routeName) {
        return routeName;
    }
    let routeList = routeName.split(".");
    return routeList[routeList.length - 1];
}

function pickFirst(...values: any[]): any {
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return undefined;
}

function toNumber(value: any, defaultValue?: number): number {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }
    let result = Number(value);
    if (Number.isNaN(result)) {
        return defaultValue;
    }
    return result;
}

function toStringValue(value: any, defaultValue: string = ""): string {
    if (value === undefined || value === null) {
        return defaultValue;
    }
    return String(value);
}

function getQueryValue(...keys: string[]): string {
    for (let i = 0; i < keys.length; i++) {
        let value = getQuery(keys[i]);
        if (value !== "") {
            return value;
        }
    }
    return "";
}

function getConfigGame(gameName: string): any {
    let config = (<any>window).config || {};
    if (config.games && gameName && config.games[gameName]) {
        return config.games[gameName];
    }
    if (config.gameName && config.games && config.games[config.gameName]) {
        return config.games[config.gameName];
    }
    return config;
}

function appendPortToUrl(url: string, port: any): string {
    let portText = toStringValue(port);
    if (!portText || portText === "80" || portText === "443") {
        return url;
    }
    let protocolIndex = url.indexOf("://");
    if (protocolIndex < 0) {
        return url;
    }
    let prefix = url.substring(0, protocolIndex + 3);
    let rest = url.substring(protocolIndex + 3);
    let slashIndex = rest.indexOf("/");
    let host = slashIndex >= 0 ? rest.substring(0, slashIndex) : rest;
    let path = slashIndex >= 0 ? rest.substring(slashIndex) : "";
    if (host.indexOf(":") >= 0) {
        return url;
    }
    return `${prefix}${host}:${portText}${path}`;
}

function buildServerAddress(host: any, port: any): string {
    let hostText = toStringValue(host).trim();
    if (!hostText) {
        return "";
    }
    if (/^https?:\/\//i.test(hostText)) {
        return appendPortToUrl(hostText, port);
    }

    let protocol = toStringValue(port) === "443" ? "https://" : "http://";
    let slashIndex = hostText.indexOf("/");
    let baseHost = slashIndex >= 0 ? hostText.substring(0, slashIndex) : hostText;
    let path = slashIndex >= 0 ? hostText.substring(slashIndex) : "";
    let portText = toStringValue(port);

    if (portText && portText !== "80" && portText !== "443" && baseHost.indexOf(":") < 0) {
        baseHost = `${baseHost}:${portText}`;
    }

    return `${protocol}${baseHost}${path}`;
}

function buildNetConfig(initOptions: any): NetConfig {
    let options = initOptions || {};
    let cfg = <any>{};
    let names = ["pingInterval", "pingOut", "retryInterval", "retryMaxCount", "compress"];
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        let value = pickFirst(options[name], (<any>serverConfig)[name]);
        if (value !== undefined) {
            cfg[name] = value;
        }
    }
    return Object.keys(cfg).length > 0 ? cfg : undefined;
}

function buildJsSdkInitConfig(gameName: string, initOptions?: any): any {
    let options = initOptions || {};
    let user = (<any>window).user || {};
    let extra = user.extra || {};
    let config = (<any>window).config || {};
    let gameConfig = getConfigGame(gameName) || {};
    let cfg = <any>serverConfig;

    

    return cfg;
}

function syncResolvedRuntimeConfig(gameName: string, cfg: IRuntimeConnectConfig) {
    let runtimeConfig = (<any>window).config || {};
    let user = (<any>window).user || {};
    let extra = user.extra || {};

    runtimeConfig.games = runtimeConfig.games || {};
    runtimeConfig.games[gameName] = runtimeConfig.games[gameName] || {};
    runtimeConfig.gameName = runtimeConfig.gameName || gameName;
    user.extra = extra;
    let gameConfig = runtimeConfig.games[gameName];

    runtimeConfig.uid = cfg.uId;
    runtimeConfig.uId = cfg.uId;
    runtimeConfig.token = cfg.token;
    runtimeConfig.gameId = cfg.gameId;
    runtimeConfig.platId = cfg.platId;
    runtimeConfig.platKey = cfg.platKey;
    runtimeConfig.gameIndex = cfg.gameIndex;
    runtimeConfig.serverIndex = cfg.gameIndex;
    runtimeConfig.area = cfg.area;
    runtimeConfig.lang = cfg.lang;
    runtimeConfig.serverAdress = cfg.serverAdress;
    runtimeConfig.serverAddress = cfg.serverAdress;

    gameConfig.gameName = gameConfig.gameName || gameName;
    gameConfig.uid = cfg.uId;
    gameConfig.uId = cfg.uId;
    gameConfig.token = cfg.token;
    gameConfig.gameId = cfg.gameId;
    gameConfig.platId = cfg.platId;
    gameConfig.platKey = cfg.platKey;
    gameConfig.gameIndex = cfg.gameIndex;
    gameConfig.serverIndex = cfg.gameIndex;
    gameConfig.area = cfg.area;
    gameConfig.lang = cfg.lang;
    gameConfig.serverAdress = cfg.serverAdress;
    gameConfig.serverAddress = cfg.serverAdress;
    runtimeConfig.games[gameName] = gameConfig;

    user.uid = cfg.uId;
    user.uId = cfg.uId;
    user.token = cfg.token;
    user.gameId = cfg.gameId;
    user.platId = cfg.platId;
    user.platKey = cfg.platKey;
    user.gameIndex = cfg.gameIndex;
    user.serverIndex = cfg.gameIndex;
    user.area = cfg.area;
    user.lang = cfg.lang;
    user.serverAdress = cfg.serverAdress;
    user.serverAddress = cfg.serverAdress;

    extra.uid = cfg.uId;
    extra.uId = cfg.uId;
    extra.token = cfg.token;
    extra.gameId = cfg.gameId;
    extra.platId = cfg.platId;
    extra.platKey = cfg.platKey;
    extra.gameIndex = cfg.gameIndex;
    extra.serverIndex = cfg.gameIndex;
    extra.area = cfg.area;
    extra.lang = cfg.lang;
    extra.serverAdress = cfg.serverAdress;
    extra.serverAddress = cfg.serverAdress;
    extra.ext = cfg.ext;

    (<any>window).config = runtimeConfig;
    (<any>window).user = user;
}

function resolveRuntimeConnectConfig(gameName: string, initOptions?: any, jsSdk?: IJsSdkLike): IRuntimeConnectConfig {
    let options = initOptions || {};
    let user = (<any>window).user || {};
    let extra = user.extra || {};
    let config = (<any>window).config || {};
    let gameConfig = getConfigGame(gameName) || {};
    let cfg = <any>serverConfig;

    let uId = toStringValue(pickFirst(
        jsSdk && jsSdk.getUid ? jsSdk.getUid() : undefined,
        getQueryValue("uId", "uid"),
        user.uId,
        user.uid,
        extra.uId,
        extra.uid,
        gameConfig.uId,
        gameConfig.uid,
        config.uId,
        config.uid,
        cfg.uId,
        cfg.uid
    ));

    let token = toStringValue(pickFirst(
        jsSdk && jsSdk.getToken ? jsSdk.getToken() : undefined,
        getQueryValue("token"),
        user.token,
        extra.token,
        config.token,
        gameConfig.token,
        cfg.token
    ));

    let gameId = toNumber(pickFirst(
        jsSdk && jsSdk.getGameId ? jsSdk.getGameId() : undefined,
        getQueryValue("gameId"),
        extra.gameId,
        user.gameId,
        (<any>window).gameId,
        gameConfig.gameId,
        config.gameId,
        cfg.gameId
    ));

    let platId = toNumber(pickFirst(
        jsSdk && jsSdk.getPlatId ? jsSdk.getPlatId() : undefined,
        getQueryValue("platId"),
        extra.platId,
        user.platId,
        gameConfig.platId,
        config.platId,
        cfg.platId
    ));

    let platKey = toStringValue(pickFirst(
        jsSdk && jsSdk.getPlatKey ? jsSdk.getPlatKey() : undefined,
        getQueryValue("platkey", "platKey"),
        extra.platkey,
        extra.platKey,
        user.platkey,
        user.platKey,
        gameConfig.platkey,
        gameConfig.platKey,
        config.platkey,
        config.platKey,
        cfg.platkey,
        cfg.platKey
    ));

    let gameIndex = pickFirst(
        getQueryValue("gameIndex", "serverIndex"),
        extra.gameIndex,
        extra.serverIndex,
        user.gameIndex,
        user.serverIndex,
        gameConfig.gameIndex,
        gameConfig.serverIndex,
        config.gameIndex,
        config.serverIndex,
        cfg.gameIndex,
        cfg.serverIndex
    );

    let area = toStringValue(pickFirst(
        jsSdk && jsSdk.getArea ? jsSdk.getArea() : undefined,
        getQueryValue("area"),
        extra.area,
        user.area,
        gameConfig.area,
        config.area,
        cfg.area
    ));

    let lang = toStringValue(pickFirst(
        jsSdk && jsSdk.getLang ? jsSdk.getLang() : undefined,
        getQueryValue("lang"),
        user.lang,
        extra.lang,
        gameConfig.lang,
        config.lang,
        cfg.lang,
        "en"
    ), "en");

    let ext = toStringValue(pickFirst(
        jsSdk && jsSdk.getExt ? jsSdk.getExt() : undefined,
        extra.ext,
        user.ext,
        gameConfig.ext,
        config.ext,
        cfg.ext
    ));

    let serverAdress = pickFirst(
        options.serverAdress,
        options.serverAddress,
        getQueryValue("serverAdress", "serverAddress"),
        extra.serverAdress,
        extra.serverAddress,
        user.serverAdress,
        user.serverAddress,
        gameConfig.serverAdress,
        gameConfig.serverAddress,
        config.serverAdress,
        config.serverAddress,
        cfg.serverAdress,
        cfg.serverAddress,
        buildServerAddress(pickFirst(options.host, cfg.host), pickFirst(options.port, cfg.port))
    );

    let reqTimeout = toNumber(pickFirst(options.reqTimeout, cfg.reqTimeout), 5000);

    let missing: string[] = [];
    if (!uId) {
        missing.push("uId");
    }
    if (!token) {
        missing.push("token");
    }
    if (!(gameId > 0)) {
        missing.push("gameId");
    }
    if (!(platId > 0)) {
        missing.push("platId");
    }
    if (!platKey) {
        missing.push("platKey");
    }
    if (!serverAdress) {
        missing.push("serverAdress");
    }

    if (missing.length > 0) {
        throw new Error(`Missing JsNet connect params: ${missing.join(", ")}. Please provide them via window.user, window.user.extra, query string, window.config, or serverConfig.`);
    }

    return {
        uId,
        uid: uId,
        token,
        gameId,
        platId,
        platKey,
        gameIndex,
        area,
        lang,
        ext,
        serverAdress,
        reqTimeout,
        netConfig: buildNetConfig(options)
    };
}

function maskValue(value: any, prefix: number = 3, suffix: number = 2): string {
    let text = toStringValue(value);
    if (!text) {
        return "";
    }
    if (text.length <= prefix + suffix) {
        return text;
    }
    return `${text.substring(0, prefix)}***${text.substring(text.length - suffix)}`;
}

function toErrorMessage(error: any): string {
    if (error == null) {
        return "";
    }
    if (typeof error === "string") {
        return error;
    }
    if (error.message) {
        return error.message;
    }
    if (error.stack) {
        return error.stack;
    }
    try {
        return JSON.stringify(error);
    }
    catch (_error) {
        return String(error);
    }
}

function clearDisconnectUiTimer() {
    clearTimeout(disconnectViewTimer);
    disconnectViewTimer = -1;
}

function getDisconnectRollSeconds(): number {
    let value = Number((<any>window).config?.appExtra?.TimeoutRoll);
    if (Number.isNaN(value) || value <= 0) {
        return 1.5;
    }
    return value;
}

function showDisconnectUi(reason: string, detail?: any) {
    if ((<any>window).isGameQuit) {
        return;
    }
    if (isLoginOtherKickOut) {
        return;
    }
    (<any>window).__lastJsNetDisconnectReason = { reason, detail };
    (<any>window).isNetworkError = () => true;
    console.warn("[JsNet] show disconnect view", {
        reason,
        gameName: _gameName || (<any>window).gameName,
        error: detail
    });
    if (disconnectUiStage === "view") {
        return;
    }
    if (disconnectUiStage === "roll" && disconnectViewTimer !== -1) {
        return;
    }
    disconnectUiStage = "roll";
    disconnectUiStageToken++;
    let stageToken = disconnectUiStageToken;
    clearDisconnectUiTimer();
    setDisconnectView(false);
    setDisconnectView2(false);
    setDisconnectRollView(true);
    disconnectViewTimer = setTimeout(() => {
        if (stageToken !== disconnectUiStageToken) {
            return;
        }
        disconnectUiStage = "view";
        setDisconnectRollView(false);
        if (typeof (<any>window).showDisconnectView === "function") {
            try {
                (<any>window).showDisconnectView();
                return;
            }
            catch (error) {
                console.error("[JsNet] showDisconnectView failed", error);
            }
        }
        setDisconnectView2(true);
    }, getDisconnectRollSeconds() * 1000) as any;
}

function hideDisconnectUi() {
    isLoginOtherKickOut = false;
    disconnectUiStageToken++;
    disconnectUiStage = "idle";
    clearDisconnectUiTimer();
    (<any>window).isNetworkError = () => false;
    setDisconnectRollView(false);
    setDisconnectView(false);
    setDisconnectView2(false);
}

function showLoginOtherKickOutUi(msg: any) {
    isLoginOtherKickOut = true;
    (<any>window).__lastJsNetStage = "kick_out";
    disconnectUiStageToken++;
    disconnectUiStage = "view";
    clearDisconnectUiTimer();
    (<any>window).__lastJsNetDisconnectReason = {
        reason: "login_other",
        detail: msg
    };
    (<any>window).isNetworkError = () => true;
    setDisconnectRollView(false);
    setDisconnectView2(false);
    setDisconnectView(true);
}

function buildDebugConnectInfo(cfg: IRuntimeConnectConfig, gameName: string): any {
    return {
        gameName,
        uId: maskValue(cfg.uId),
        token: maskValue(cfg.token),
        gameId: cfg.gameId,
        platId: cfg.platId,
        platKey: maskValue(cfg.platKey, 2, 1),
        gameIndex: cfg.gameIndex,
        area: cfg.area,
        lang: cfg.lang,
        ext: cfg.ext,
        serverAdress: cfg.serverAdress,
        reqTimeout: cfg.reqTimeout,
        netConfig: cfg.netConfig || null,
        pageProtocol: window.location?.protocol || "",
        pageHost: window.location?.host || ""
    };
}

function logJsNet(stage: string, detail?: any) {
    if (detail === undefined) {
        console.log(`[JsNet] ${stage}`);
        return;
    }
    console.log(`[JsNet] ${stage}`, detail);
}

function getPureClientLib(): any {
    let moduleRef = PureClientModule;
    let lib = (moduleRef && moduleRef.default) || moduleRef;
    if (!lib && typeof (<any>window).PureClient === "function") {
        lib = {
            PureClient: (<any>window).PureClient
        };
    }
    return lib || {};
}

function resolveJsNetConstructor(): JsNetConstructor {
    let pureClient = getPureClientLib();
    let ctor = pureClient.PureClient;
    if (typeof ctor === "function") {
        return ctor;
    }

    let detail = {
        moduleType: typeof PureClientModule,
        moduleKeys: Object.keys((<any>PureClientModule) || {}),
        hasDefaultExport: !!((<any>PureClientModule)?.default),
        hasNamedJsNet: !!pureClient.JsNet,
        windowJsNetType: typeof (<any>window).JsNet
    };
    console.error("[JsNet] invalid constructor export", detail);
    throw new Error("JsNet constructor is unavailable");
}

function resolveJsSdkConstructor(): new () => any {
    let pureClient = getPureClientLib();
    let ctor = pureClient.PureClient;
    if (typeof ctor === "function") {
        return ctor;
    }

    let detail = {
        moduleType: typeof PureClientModule,
        moduleKeys: Object.keys((<any>PureClientModule) || {}),
        hasDefaultExport: !!((<any>PureClientModule)?.default),
        hasNamedJsSdk: !!pureClient.JsSdk,
        windowJsSdkType: typeof (<any>window).JsSdk
    };
    console.error("[JsNet] invalid sdk export", detail);
    throw new Error("JsSdk constructor is unavailable");
}

class JsNetMessageRouter {
    gameName: string;
    jsSdk: IJsSdkLike;
    jsNet: any;
    isAuthed: boolean = false;
    needRunReconnectHandler: boolean = false;
    initPromise: Promise<void>;
    reconnectPromise: Promise<boolean>;
    private reconnectResolve: (success: boolean) => void;
    private manualReconnectPending: boolean = false;
    private manualReconnectFallbackTimer: any = null;
    private authAttemptId: number = 0;
    connectConfig: IRuntimeConnectConfig;
    listenerMap: { [routeName: string]: MsgCallback[] } = {};
    listenerBound: { [routeName: string]: boolean } = {};

    async init(gameName: string, initOptions?: any): Promise<void> {
        let targetGameName = gameName || _gameName || (<any>window).gameName;
        if (!targetGameName) {
            throw new Error("gameName is empty");
        }

        this.gameName = targetGameName;
        _gameName = targetGameName;
        await this.ensureJsSdk(targetGameName, initOptions);

        if (this.isAuthed && this.jsNet) {
            return;
        }
        if (this.initPromise) {
            return this.initPromise;
        }

        this.connectConfig = resolveRuntimeConnectConfig(targetGameName, initOptions, this.jsSdk);
        syncResolvedRuntimeConfig(targetGameName, this.connectConfig);
        (<any>window).__lastJsNetConnectInfo = buildDebugConnectInfo(this.connectConfig, targetGameName);
        logJsNet("resolved connect config", (<any>window).__lastJsNetConnectInfo);

        this.initPromise = new Promise<void>((resolve, reject) => {
            let settled = false;
            let safeResolve = () => {
                if (settled) {
                    return;
                }
                settled = true;
                this.initPromise = null;
                resolve();
            };
            let safeReject = (error: any) => {
                if (settled) {
                    return;
                }
                settled = true;
                this.initPromise = null;
                reject(error);
            };

            this.createClient(safeResolve, safeReject);
        });

        return this.initPromise;
    }

    async request(routeName: string, msg: any): Promise<any> {
        if (this.initPromise) {
            await this.initPromise;
        }
        if (!this.jsNet || !this.isAuthed) {
            throw new Error("JsNet is not ready");
        }
        return this.jsNet.reqMsg(normalizeRoute(routeName), msg || {});
    }

    on(routeName: string, cb: MsgCallback) {
        let msgName = normalizeRoute(routeName);
        if (!this.listenerMap[msgName]) {
            this.listenerMap[msgName] = [];
        }
        this.listenerMap[msgName].push(cb);
        this.bindListener(msgName);
    }

    disconnect() {
        this.isAuthed = false;
        this.needRunReconnectHandler = false;
        this.initPromise = null;
        this.connectConfig = null;

        if (!this.jsNet) {
            return;
        }

        let client = this.jsNet;
        this.jsNet = null;
        this.listenerBound = {};

        client.disconnect();
    }

    async reconnect(): Promise<boolean> {
        if (this.isAuthed && this.jsNet) {
            hideDisconnectUi();
            return true;
        }
        if (this.reconnectPromise) {
            return this.reconnectPromise;
        }
        if (!this.jsNet || !this.connectConfig) {
            try {
                await this.init(this.gameName || _gameName || (<any>window).gameName);
                return this.isAuthed;
            }
            catch (error) {
                showDisconnectUi("manual_reconnect_failed", toErrorMessage(error));
                return false;
            }
        }

        this.needRunReconnectHandler = true;
        showDisconnectUi("manual_reconnect", this.connectConfig.serverAdress);
        this.reconnectPromise = new Promise<boolean>(resolve => {
            this.reconnectResolve = resolve;
        });

        // 先使旧鉴权失效，再等待旧连接真正关闭后发起新连接。
        // PureClient 的 disconnect/onDisconnect 是异步的，不能在 disconnect 后立即 connect。
        this.authAttemptId++;
        this.manualReconnectPending = true;
        try {
            this.jsNet.enableRetry?.(false);
            this.jsNet.disconnect?.();
        }
        catch (error) {
            console.warn("[JsNet] stop old connection before manual reconnect failed", error);
            this.startManualConnect();
        }
        // 已关闭状态下 PureClient 可能不再回调 onDisconnect，留一个兜底。
        this.manualReconnectFallbackTimer = setTimeout(() => this.startManualConnect(), 1000);
        return this.reconnectPromise;
    }

    private startManualConnect() {
        if (!this.manualReconnectPending || !this.jsNet || !this.connectConfig) {
            return;
        }
        this.manualReconnectPending = false;
        if (this.manualReconnectFallbackTimer) {
            clearTimeout(this.manualReconnectFallbackTimer);
            this.manualReconnectFallbackTimer = null;
        }
        this.jsNet.enableRetry?.(true);
        this.jsNet.connect(this.connectConfig.serverAdress, {
            pingInterval: 3,
            pingOut: 8,
            retryInterval: 2,
            retryMaxCount: 10,
            compress: true
        });
    }

    private finishReconnect(success: boolean) {
        this.manualReconnectPending = false;
        if (this.manualReconnectFallbackTimer) {
            clearTimeout(this.manualReconnectFallbackTimer);
            this.manualReconnectFallbackTimer = null;
        }
        if (this.reconnectResolve) {
            this.reconnectResolve(success);
        }
        this.reconnectResolve = null;
        this.reconnectPromise = null;
    }

    private async ensureJsSdk(gameName: string, initOptions?: any) {
        if (this.jsSdk) {
            return;
        }

        let JsSdk = resolveJsSdkConstructor();
        let client=new JsSdk();
        let initCfg = buildJsSdkInitConfig(gameName, initOptions);
        const r   =await client.init(5000,initCfg)
        if (!r) {
            throw new Error("JsSdk init failed");
        }
        let sdk = client.getSdk()
        this.jsSdk = sdk;
        this.jsNet = client.getNet();
        (<any>window).net = this.jsNet; // net
        if (sdk.addEvent) {
            sdk.addEvent("onQueryUser", (...args: any[]) => {
                logJsNet("onQueryUser", args && args.length > 0 ? args : undefined);
                let handler = (<any>window).onQueryUser;
                if (typeof handler === "function") {
                    try {
                        let result = handler(...args);
                        if (result && typeof result.catch === "function") {
                            result.catch((error: any) => {
                                console.error("[JsNet] onQueryUser handler failed", error);
                            });
                        }
                    }
                    catch (error) {
                        console.error("[JsNet] onQueryUser handler failed", error);
                    }
                    return;
                }
                if (typeof (<any>window).updateBalance === "function") {
                    (<any>window).updateBalance();
                }
            });
            sdk.addEvent("onGameView",(...args: any[])=>{
                
            let canvas = () => cc.Canvas.instance;
                (<any>window).sdkSetGameSize = (node: cc.Node, setScale: boolean) => {

                if (args[1] == null)
                    return;         

                let realDR = cc.view.getVisibleSizeInPixel();
                let gameDR = canvas().designResolution;
                let rect = args[1];
                canvas().fitWidth = rect.height / rect.width > gameDR.height / gameDR.width;//实际尺寸更瘦
                canvas().fitHeight = !canvas().fitWidth;//实际尺寸更扁
                console.log("sdkSetGameSize", { realDR, gameDR, rect, CustomSafeArea: args[1], fit: { width: canvas().fitWidth, height: canvas().fitHeight } });
                let DRRate = gameDR.width / realDR.width;
                if (canvas().fitHeight) {
                    DRRate = gameDR.height / realDR.height;
                }
                if (setScale) {
                    let scale_width = rect.width / realDR.width;
                    let scale_height = rect.height / realDR.height;
                    if (canvas().fitWidth) {
                        node.scale = scale_width;
                        node.width = gameDR.width;
                        node.height = rect.height * DRRate / scale_width;
                    }
                    else {
                        node.scale = scale_height;
                        node.height = gameDR.height;
                        node.width = rect.width * DRRate / scale_height;
                    }
                }
                else {
                    node.width = rect.width * DRRate;
                    node.height = rect.height * DRRate;
                }
                //先计算当前位置
                node.y=(args[0].height/2-args[2].top-args[1].height/2)/args[0].height*1530
            }
            ((window as any).onGameScreenChanged || []).forEach(fn => fn?.());
            });
            sdk.addEvent("onGameBgHide",(...args:any[])=>{
                (<any>window).showonGameBgHide=!args[0];
                (<any>window).showBgHide?.();
            });
            (<any>window).user.lang=sdk.getLang();
            afterLoad();
            (<any>window).ongetUserLang?.();
        }

        (<any>window).__pureClientJsSdk = sdk;
        (<any>window).jsnet = this.jsNet;
    }

    private createClient(resolve: () => void, reject: (error: any) => void) {
        this.disconnectClientOnly();
        this.listenerBound = {};
        this.isAuthed = false;
        this.needRunReconnectHandler = false;

        let cfg = this.connectConfig;
        let debugInfo = buildDebugConnectInfo(cfg, this.gameName);
        (<any>window).__lastJsNetConnectInfo = debugInfo;
        (<any>window).__lastJsNetStage = "connect_start";
        logJsNet("connect start", debugInfo);
        let JsNet = resolveJsNetConstructor();

        this.jsNet.addEvent("onConnect", () => {
            (<any>window).__lastJsNetStage = "websocket_connected";
            
            logJsNet("websocket connected", {
                gameName: this.gameName,
                serverAdress: cfg.serverAdress
            });
            this.handleConnected(resolve, reject);
            (<any>window).enoughMoney=(coins:number)=>{
                const a=this.jsNet.coinsEnough(coins)
                return a
            }
        });

        this.jsNet.addEvent("onRetry", () => {
            (<any>window).__lastJsNetStage = "retry_connect";
            console.warn("[JsNet] retry connect", {
                gameName: this.gameName,
                serverAdress: cfg.serverAdress,
                leftRetry: this.jsNet && this.jsNet.leftRetry ? this.jsNet.leftRetry() : undefined
            });
            showDisconnectUi("retry_connect", cfg.serverAdress);
        });

        this.jsNet.addEvent("onDisconnect", () => {
            let wasAuthed = this.isAuthed;
            (<any>window).__lastJsNetStage = "disconnected";
            console.warn("[JsNet] disconnected", {
                gameName: this.gameName,
                serverAdress: cfg.serverAdress,
                isAuthed: this.isAuthed
            });
            this.isAuthed = false;
            if (this.manualReconnectPending) {
                this.startManualConnect();
                return;
            }
            if (wasAuthed) {
                this.needRunReconnectHandler = true;
            }
         
            if (this.jsNet && this.jsNet.enableRetry) {
                this.jsNet.enableRetry(true);
            }
            showDisconnectUi("disconnected", cfg.serverAdress);
        });

        this.jsNet.addEvent("onError", (code: any, error: any) => {
            (<any>window).__lastJsNetStage = "network_error";
            (<any>window).__lastJsNetError = {
                code,
                error: toErrorMessage(error),
                serverAdress: cfg.serverAdress
            };
            console.error("[JsNet] network error", {
                code,
                error: toErrorMessage(error),
                gameName: this.gameName,
                serverAdress: cfg.serverAdress
            });
            if (!this.isAuthed) {
                showDisconnectUi("network_error", toErrorMessage(error));
                reject(new Error(`${code || -1}:${error || "network error"}`));
            }
        });

        this.jsNet.addEvent("onPing", () => {
            if (this.jsNet) {
                (<any>window).netDelay = this.jsNet.getNetDelay();
            }
        });

        this.jsNet.addEvent("onGetUser", () => {
        });
        
        this.jsNet.listenMsg("KickOut", (msg: any) => {
            console.warn("[JsNet] KickOut", msg);
            if (Number(msg && msg.reason) === 1) {
                this.isAuthed = false;
                showLoginOtherKickOutUi(msg);
                this.disconnectClientOnly();
            }
        });

        this.bindAllListeners();
        this.jsNet.connect(cfg.serverAdress, {
            pingInterval: 3,
            pingOut: 8,
            retryInterval: 2,
            retryMaxCount: 10,
            compress: true
        });
    }

    private disconnectClientOnly() {
        if (!this.jsNet) {
            return;
        }

        let client = this.jsNet;
        //this.jsNet = null;

        //client.disconnect();
    }

    private async handleConnected(resolve: () => void, reject: (error: any) => void) {
        if (!this.jsNet || !this.connectConfig) {
            reject(new Error("JsNet connect config is empty"));
            return;
        }

        const authAttemptId = ++this.authAttemptId;
        try {
            let cfg = this.connectConfig;
            let authReq = {
                platId: this.jsSdk.getPlatId && this.jsSdk.getPlatId(),
                token: this.jsSdk.getToken && this.jsSdk.getToken(),
                uId: this.jsSdk.getUid && this.jsSdk.getUid(),
                ext: this.jsSdk.getExt && this.jsSdk.getExt(),
                lang: this.jsSdk.getLang && this.jsSdk.getLang(),
                area: this.jsSdk.getArea && this.jsSdk.getArea(),
                gameIndex:cfg.gameIndex,
            };
            (<any>window).__lastJsNetStage = "auth_game_request";
            (<any>window).__lastJsNetAuthRequest = {
                uId: maskValue(authReq.uId),
                platId: authReq.platId,
                token: maskValue(authReq.token),
                gameIndex: authReq.gameIndex,
                area: authReq.area,
                lang: authReq.lang,
                ext: authReq.ext
            };
            logJsNet("AuthGame request", (<any>window).__lastJsNetAuthRequest);

            let resp = await this.jsNet.reqMsg("AuthGame", authReq);
            if (authAttemptId !== this.authAttemptId) {
                console.warn("[JsNet] ignore stale AuthGame response", { authAttemptId });
                return;
            }
            (<any>window).__lastJsNetStage = "auth_game_response";
            (<any>window).__lastJsNetAuthResponse = resp;
            logJsNet("AuthGame response", resp);

            if (!resp) {
                throw new Error("AuthGame response is empty");
            }
            if (resp.err > 0) {
                throw new Error(`AuthGame failed: ${resp.err}`);
            }

            this.isAuthed = true;
            hideDisconnectUi();
            if (resp.uId) {
                this.connectConfig.uId = toStringValue(resp.uId, cfg.uId);
                this.connectConfig.uid = this.connectConfig.uId;
                syncResolvedRuntimeConfig(this.gameName, this.connectConfig);
            }
            if (this.needRunReconnectHandler && typeof (<any>window).onReconnect === "function") {
                this.needRunReconnectHandler = false;
                if (!(<any>window).isAutoQuitLocked) {
                    await (<any>window).onReconnect();
                }
            }
            (<any>window).__lastJsNetStage = "auth_game_success";
            logJsNet("AuthGame success", {
                gameName: this.gameName,
                uId: maskValue(resp.uId || cfg.uId),
                err: resp.err
            });
            let gameConfig = (<any>window).betGrade || {};
            const element:GameCommonConfig = this.jsNet.getCommonConfig()
            if(element.costs && element.costs.length > 0){
                gameConfig.gradeAmounts=[]
                for (let index = 0; index < element.costs.length; index++) {
                    const element1 = element.costs[index];
                    gameConfig.gradeAmounts[index]=element1.coins
                }
            }
            // 服务端未配置下注档位时保留本地默认值，并通知已显示的界面刷新。
            (<any>window).changedw?.()
            if(element.custom){
                const ele:any=element.custom
                if(ele["quitTime"]!=undefined){
                    if((<any>window).config.gameExtra.autoQuit==undefined){
                        (<any>window).config.gameExtra.autoQuit={}
                    }
                    (<any>window).config.gameExtra.autoQuit.quitTime=ele["quitTime"]
                }
                if(ele["idleTime"]!=undefined){
                    if((<any>window).config.gameExtra.autoQuit==undefined){
                        (<any>window).config.gameExtra.autoQuit={}
                    }
                    (<any>window).config.gameExtra.autoQuit.idleTime=ele["idleTime"]
                }
                (<any>window).enableRank = ele["enableRank"]
                if ((<any>window).enableRank && (<any>window).GlobalRankUI) {
                    (<any>window).GlobalRankUI.initRankUI(this.jsNet);
                }

                (<any>window).updateAutoQuit?.()
            }
            const elementgame:GameClientConfig = this.jsNet.getClientConfig()
            if(elementgame.coinUrl){
                cc.loader.load(elementgame.coinUrl, (err, texture) => {
                    if (err) {
                        console.error("图片加载失败：", err);
                        return;
                    }
                    // texture 是 cc.Texture2D
                    let spriteFrame = new cc.SpriteFrame(texture);
                    (<any>window).config.gameCoin=spriteFrame
                });
            }
            this.finishReconnect(true);
            resolve();
        }
        catch (error) {
            if (authAttemptId !== this.authAttemptId) {
                console.warn("[JsNet] ignore stale AuthGame failure", {
                    authAttemptId,
                    error: toErrorMessage(error)
                });
                return;
            }
            this.isAuthed = false;
            (<any>window).__lastJsNetStage = "auth_game_failed";
            (<any>window).__lastJsNetError = {
                stage: "AuthGame",
                error: toErrorMessage(error)
            };
            console.error("[JsNet] AuthGame failed", {
                gameName: this.gameName,
                error: toErrorMessage(error),
                request: (<any>window).__lastJsNetAuthRequest
            });
            showDisconnectUi("auth_failed", toErrorMessage(error));
            this.finishReconnect(false);

            reject(error);
            if (this.jsNet) {
                this.jsNet.disconnect();
            }
        }
    }

    private bindAllListeners() {
        for (let routeName in this.listenerMap) {
            this.bindListener(routeName);
        }
    }

    private bindListener(routeName: string) {
        if (!this.jsNet || this.listenerBound[routeName]) {
            return;
        }
        this.listenerBound[routeName] = true;
        this.jsNet.listenMsg(routeName, (data: any) => {
            this.dispatch(routeName, data);
        });
    }

    private dispatch(routeName: string, data: any) {
        let handlers = this.listenerMap[routeName];
        if (!handlers || handlers.length === 0) {
            return;
        }

        let handlerList = handlers.slice();
        for (let i = 0; i < handlerList.length; i++) {
            try {
                handlerList[i](data);
            }
            catch (error) {
                console.error(`[JsNet] listener error: ${routeName}`, error);
            }
        }
    }
}

const compatRouter = new JsNetMessageRouter();

(<any>window).HotGameReconnect = () => compatRouter.reconnect();

function buildGameRoute(gameName: string, routeName: string): string {
    return `${serverConfig.routerPath}.${gameName}.${routeName}`;
}

function createPinusCompat(): IPinusCompat {
    return {
        init(options: any, cb?: () => void) {
            let gameName = _gameName || (<any>window).gameName;
            compatRouter.init(gameName, options).then(() => {
                cb && cb();
            }).catch((error) => {
                console.error(error);
            });
        },
        request(routeName: string, msg: any, cb?: (data: any) => void) {
            compatRouter.request(routeName, msg).then((data) => {
                cb && cb(data);
            }).catch((error) => {
                console.error(error);
                cb && cb({
                    err: error && error.message ? error.message : error
                });
            });
        },
        on(routeName: string, cb: MsgCallback) {
            compatRouter.on(routeName, cb);
        },
        disconnect() {
            compatRouter.disconnect();
        }
    };
}

export default class MessageRouter {
    server: any;
    gameName: string;

    async init(gameName: string): Promise<void> {
        this.gameName = gameName;
        this.server = pinus;
        return pinusInit(gameName);
    }

    async request(routerName: string, msg: any): Promise<any> {
        let router = buildGameRoute(this.gameName, routerName);
        return new Promise(resolve => {
            this.server.request(router, msg, (data) => {
                resolve(data);
            });
        });
    }

    on(routerName: string, cb: any) {
        this.server.on(routerName, cb);
    }

    async requestBranch(gameBranch: string, routerName: string, msg: any): Promise<any> {
        let router = `${serverConfig.routerPath}.${gameBranch}.${routerName}`;
        return new Promise(resolve => {
            this.server.request(router, msg, (data) => {
                resolve(data);
            });
        });
    }
}

export let pinus: IPinusCompat = createPinusCompat();

(<any>window).pinus = pinus;

export async function pinusInit(gameName: string): Promise<void> {
    _gameName = gameName;
    return await compatRouter.init(gameName);
}

export async function pinusRequest(routerName: string, msg: any): Promise<any> {
    let router = buildGameRoute(_gameName || (<any>window).gameName, routerName);
    return new Promise(resolve => {
        pinus.request(router, msg, (data) => {
            resolve(data);
        });
    });
}

export function pinusResp(routerName: string, cb: any) {
    pinus.on(routerName, cb);
}

export async function pinusRequestBranch(gameBranch: string, routerName: string, msg: any): Promise<any> {
    let router = `${serverConfig.routerPath}.${gameBranch}.${routerName}`;
    return new Promise(resolve => {
        pinus.request(router, msg, (data) => {
            resolve(data);
        });
    });
}
