const defaultServerConfig = {
    httpServer: "http://192.168.0.150/main/",
    host: "192.168.31.13/adress",
    port: "8090",
    serverAdress: "http://192.168.31.13:8090/adress",
    serverAddress: "http://192.168.31.13:8090/adress",
    gameId: 25,
    platId: 101,
    platKey: "abc",
    serverIndex: 1,
    uId: "129953",
    token: "qwertyuiop123",
    routerPath: "game"
};

function readServerConfig() {
    let cfg = require("../resources/configSdk.json");
    if (cfg) {
        return cfg;
    }
    return defaultServerConfig;
}

export let serverConfig = readServerConfig();
const localDefaultConfigRoot = require("../shared3/config/default.json");
const GLOBAL_VIEWS_BUNDLE_NAME = "globalViews";
const GLOBAL_VIEWS_PREFAB_PATH = "prefab/GlobalViews";
const GLOBAL_RANK_BUNDLE_NAME = "rank";
const GLOBAL_RANK_PREFAB_PATH = "prefab/GlobalRankUI";

export function toThousands(num: number): string {
    num = Math.round(num);
    return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}

export function simplifyNumber(num: number): string {
    if (num == null || isNaN(num)) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1000000) {
        // 超过6位数，使用M单位（百万）
        const value = absNum / 1000000;
        // 保留1位小数，如果小数部分为0则不显示
        const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
        return sign + formatted + 'M';
    } else if (absNum >= 1000) {
        // 超过3位数，使用K单位（千）
        const value = absNum / 1000;
        // 保留1位小数，如果小数部分为0则不显示
        const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
        return sign + formatted + 'K';
    } else {
        // 小于1000，直接返回原数字
        return sign + absNum.toString();
    }
}

export function getQuery(name: string): string {
    if (!window.location.search)
        return "";
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let result = window.location.search.slice(1).match(reg);
    if (result)
        return decodeURI(result[2]);
    return "";
}

export async function delay(ms: number) {
    await new Promise((res) => {
        setTimeout(() => {
            res(0)
        }, ms);
    })
}

async function waitForCondition(checker: () => boolean, timeoutMs: number = 5000, intervalMs: number = 30) {
    let start = Date.now();
    while (!checker()) {
        if (Date.now() - start >= timeoutMs) {
            throw new Error("waitForCondition timeout");
        }
        await delay(intervalMs);
    }
}

function cloneData<T>(value: T): T {
    if (value == null) {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}

function getLocalDefaultConfig() {
    return cloneData(localDefaultConfigRoot || {});
}

function getConfigEnvName(): string {
    return ""
}

function resolveRuntimeLang(): string {
    let runtime = <any>window;
    let lang = getQuery("lang")
        || runtime.user?.lang
        || runtime.user?.extra?.lang
        || runtime.config?.lang
        || "";
    return lang;
}

function ensureLocalRuntimeConfig() {
    let root = getLocalDefaultConfig();
    let apps = root.apps || {};
    let appCfg = cloneData(apps.default || {});
    let gameName = (<any>window).gameName;
    let games = appCfg.games || {};
    let gameCfg = cloneData(games[gameName] || {});
    let env = getConfigEnvName();
    let serverEnv = cloneData((appCfg.servers && appCfg.servers[env]) || {});
    let rankEnv = cloneData((appCfg.rank && appCfg.rank[env]) || {});
    let activityEnv = cloneData((appCfg.activity && appCfg.activity[env]) || {});
    let lang = resolveRuntimeLang();

    let runtimeConfig = (<any>window).config || {};
    runtimeConfig.sdkId = runtimeConfig.sdkId || root.sdkId;
    runtimeConfig.sdkName = runtimeConfig.sdkName || root.sdkName;
    runtimeConfig.httpServer = runtimeConfig.httpServer || appCfg.httpServer || gameCfg.httpServer;
    runtimeConfig.appId = runtimeConfig.appId || appCfg.appId;
    runtimeConfig.appName = runtimeConfig.appName || appCfg.appName;
    runtimeConfig.appExtra = cloneData(appCfg.extra || runtimeConfig.appExtra || {});
    runtimeConfig.gameExtra = cloneData(gameCfg.extra || runtimeConfig.gameExtra || {});
    runtimeConfig.rank = rankEnv || runtimeConfig.rank;
    runtimeConfig.activity = activityEnv || runtimeConfig.activity;
    runtimeConfig.enableRank = appCfg.enableRank;
    runtimeConfig.appCoinIcon = runtimeConfig.appCoinIcon || appCfg.appCoinIcon;
    if (lang) {
        runtimeConfig.lang = lang;
    }
    runtimeConfig.games = runtimeConfig.games || {};
    if (gameName) {
        runtimeConfig.games[gameName] = Object.assign({}, serverEnv, runtimeConfig.games[gameName] || {}, gameCfg);
        runtimeConfig.gameName = runtimeConfig.gameName || gameName;
        if (lang) {
            runtimeConfig.games[gameName].lang = lang;
        }
    }
    (<any>window).config = runtimeConfig;
}

function loadBundleAsync(bundleName: string): Promise<cc.AssetManager.Bundle> {
    return new Promise((resolve, reject) => {
        cc.assetManager.loadBundle(bundleName, (err: Error, bundle: cc.AssetManager.Bundle) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(bundle);
        });
    });
}

function loadBundleAssetAsync<T extends cc.Asset>(bundle: cc.AssetManager.Bundle, path: string, type: typeof cc.Asset): Promise<T> {
    return new Promise((resolve, reject) => {
        bundle.load(path, type, (err: Error, asset: T) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(asset);
        });
    });
}

function getSceneRootNode(): cc.Node {
    return cc.Canvas.instance?.node || cc.director.getScene();
}

function setNodeToParent(node: cc.Node, parent: cc.Node) {
    if (!node || !parent) {
        return;
    }
    node.setParent(parent);
    node.position = cc.Vec3.ZERO;
}

async function ensureGlobalViewsPrefab() {
    if ((<any>window).globalViews?.node?.isValid) {
        return;
    }
    await waitForCondition(() => !!(<any>window).GlobalViewsContainor, 3000);
    let bundle = await loadBundleAsync(GLOBAL_VIEWS_BUNDLE_NAME);
    let prefab = await loadBundleAssetAsync<cc.Prefab>(bundle, GLOBAL_VIEWS_PREFAB_PATH, cc.Prefab);
    let node = cc.instantiate(prefab);
    setNodeToParent(node, (<any>window).GlobalViewsContainor || getSceneRootNode());
    (<any>window).__localGlobalViewsNode = node;
    await waitForCondition(() => !!(<any>window).isGlobalViewsLoaded, 3000);
}

async function ensureRankPrefab() {
    if ((<any>window).globalRankUI?.node?.isValid) {
        return;
    }
    await waitForCondition(() => !!(<any>window).rankViewPos && !!(<any>window).rankButtonPos, 3000);
    let bundle = await loadBundleAsync(GLOBAL_RANK_BUNDLE_NAME);
    let prefab = await loadBundleAssetAsync<cc.Prefab>(bundle, GLOBAL_RANK_PREFAB_PATH, cc.Prefab);
    let node = cc.instantiate(prefab);
    setNodeToParent(node, (<any>window).rankViewPos || getSceneRootNode());
    (<any>window).__localGlobalRankNode = node;
    await waitForCondition(() => !!(<any>window).globalRankUI?.node?.isValid, 3000);
}

let localConfiguratorPromise: Promise<void> = null;
async function loadLocalConfigurator() {
    if (localConfiguratorPromise) {
        return localConfiguratorPromise;
    }
    localConfiguratorPromise = (async () => {
        await ensureGlobalViewsPrefab();
       // await ensureRankPrefab();
    })().catch((error) => {
        localConfiguratorPromise = null;
        throw error;
    });
    return localConfiguratorPromise;
}

let path_branch = "game/branch/";
export async function downloadConfigurator() {
    await loadLocalConfigurator();
    return;
    //开头这一大串用于决定下载地址
    const isLocal = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost$)/.test(window.location.hostname);
    let path = path_branch + (getQuery("configurator_path") || "configurator");
    let host = "https://cdn-web.hotgame.win";
    if (window.location.protocol != null && window.location.hostname != null) {
        host = `${window.location.protocol}//${window.location.hostname}`;
    }
    else {
        console.error(`window.location.protocol`, window.location.protocol);
        console.error(`window.location.hostname`, window.location.hostname);
    }
    let env = getQuery("configurator_env")
    if (isLocal || env == "dev") {
        host = "https://test.hotgame.win";
    }
    let url = `${host}/${path}`
    //开始远程下载
    await new Promise(async (res, rej) => {
        let opts = {};
        if (cc.loader.downloader.bundleVers.configurator != null) {//如果检测到已经存在，取消远程下载，改为本地加载
            url = "configurator"
            opts = { version: cc.loader.downloader.bundleVers.configurator };
        }
        else {//先下载md5版本信息，用于验证
            let content = (await download(Math.random.toString(), `${url}/version.json?timestamp=${Date.now()}`, "json", {}));
            opts = content == "js" ? {} : { version: content };
            console.log(url, content);
        }
        cc.assetManager.loadBundle(url, opts, (err: Error, bnd) => {
            if (err) {
                console.error(err);
                rej(err);
            }
            console.log(`configurator Loaded`);//加载完成
            setTimeout(() => {
                res(0);
            }, 100);
        });
    })
}

function destroy() {

    // 停止所有音效
    (<any>window).stopAllSounds && (<any>window).stopAllSounds();
    // 隐藏主界面
    (<any>window).invisibleNodes && (<any>window).invisibleNodes();

    cc.director.once(cc.Director.EVENT_AFTER_UPDATE, () => {
        console.log("destroy game")
        // 关闭切入事件处理
        cc.game.off(cc.game.EVENT_SHOW);
        // 暂停游戏
        cc.game.pause();
    });
    // 断网
    const pinus = (<any>window).pinus;
    if (pinus) {
        pinus.disconnect();
    }
}

let client: any;//平台sdk接口

function getRuntimeSdkClient() {
    let pureClientSdk = (<any>window).__pureClientJsSdk;
    if (pureClientSdk && (pureClientSdk.recharge || pureClientSdk.quit)) {
        return pureClientSdk;
    }
    return client;
}

function copyDefinedValue(target: any, source: any, names: string[], force: boolean = false) {
    if (target == null || source == null) {
        return;
    }
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        let value = source[name];
        if (value === undefined || value === null || value === "") {
            continue;
        }
        if (force || target[name] === undefined || target[name] === null || target[name] === "") {
            target[name] = value;
        }
    }
}

function copyUidValue(target: any, source: any, force: boolean = false) {
    if (target == null || source == null) {
        return;
    }

    let value = source.uId;
    if (value === undefined || value === null || value === "") {
        value = source.uid;
    }
    if (value === undefined || value === null || value === "") {
        return;
    }

    if (force || target.uid === undefined || target.uid === null || target.uid === "") {
        target.uid = value;
    }
    if (force || target.uId === undefined || target.uId === null || target.uId === "") {
        target.uId = value;
    }
}

function applyRuntimeNetworkFallback() {
    let cfg = (<any>window).serverConfig || serverConfig;
    let runtimeConfig = (<any>window).config || {};
    let gameName = (<any>window).gameName;
    let lang = resolveRuntimeLang();
    let names = ["httpServer", "gameId", "platId", "platKey", "serverIndex", "gameIndex", "serverAdress", "serverAddress", "uid", "token"];

    (<any>window).config = runtimeConfig;
    copyDefinedValue(runtimeConfig, cfg, names, true);
    copyUidValue(runtimeConfig, cfg, true);
    if (lang) {
        runtimeConfig.lang = lang;
    }

    if (gameName) {
        runtimeConfig.games = runtimeConfig.games || {};
        runtimeConfig.games[gameName] = runtimeConfig.games[gameName] || {};
        runtimeConfig.games[gameName].gameName = runtimeConfig.games[gameName].gameName || gameName;
        copyDefinedValue(runtimeConfig.games[gameName], cfg, names, true);
        copyUidValue(runtimeConfig.games[gameName], cfg, true);
        if (lang) {
            runtimeConfig.games[gameName].lang = lang;
        }
    }

    let user = (<any>window).user || {};
    user.extra = user.extra || {};
    copyDefinedValue(user, cfg, ["uid", "token"]);
    copyUidValue(user, cfg, true);
    copyDefinedValue(user.extra, cfg, ["httpServer", "gameId", "platId", "platKey", "serverIndex", "gameIndex", "serverAdress", "serverAddress"]);
    copyUidValue(user.extra, cfg, true);
    if (lang) {
        user.lang = lang;
        user.extra.lang = lang;
    }
    (<any>window).user = user;
}

function normalizeBetGradeAmounts(values: any): number[] {
    if (!Array.isArray(values)) {
        return [];
    }

    let result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        let amount = Number(values[i]);
        if (!Number.isNaN(amount)) {
            result.push(amount);
        }
    }
    return result;
}

function ensureLocalBetGrade() {
    let runtime = <any>window;
    let config = runtime.config || {};
    let gameName = runtime.gameName || config.gameName;
    if ((!gameName || !config.games || config.games[gameName] == null) && config.games) {
        for (let key in config.games) {
            gameName = key;
            break;
        }
    }

    let gameConfig = config;
    if (config.games && gameName && config.games[gameName]) {
        gameConfig = config.games[gameName];
    }

    let amounts = normalizeBetGradeAmounts(gameConfig.betGradeAmounts || config.betGradeAmounts);
    if (amounts.length <= 0) {
        amounts = [100, 1000, 10000, 100000];
    }

    let betGrade = runtime.betGrade;
    if (betGrade && typeof betGrade.getGradeAmounts === "function") {
        let currentAmounts = normalizeBetGradeAmounts(betGrade.getGradeAmounts());
        if (currentAmounts.length > 0) {
            return;
        }
        if (typeof betGrade.setGradeAmounts === "function") {
            betGrade.setGradeAmounts(amounts);
            return;
        }
    }

    runtime.betGrade = {
        gradeAmounts: amounts,
        getGradeAmounts() {
            return this.gradeAmounts;
        },
        setGradeAmounts(gradeAmounts: number[]) {
            this.gradeAmounts = normalizeBetGradeAmounts(gradeAmounts);
        },
        getGradeCount() {
            return this.gradeAmounts.length;
        },
        getGradeAmount(index: number) {
            if (this.gradeAmounts.length <= 0) {
                return 0;
            }
            let i = index;
            if (i == null || i < 0) {
                i = 0;
            }
            else if (i >= this.gradeAmounts.length) {
                i = this.gradeAmounts.length - 1;
            }
            return this.gradeAmounts[i] || 0;
        }
    };
}

function finishLocalConfigInit(): boolean {
    ensureLocalRuntimeConfig();
    applyRuntimeNetworkFallback();
    ensureLocalBetGrade();
    client = (<any>window).client && (<any>window).client.client;
    DecimalUnit = (<any>window).DecimalUnit;
    (<any>window).isGameQuit = false;
    return true;
}

export namespace sdk {
    //config的用义在于灵活地调整游戏部分内容，以适应不同平台的细微需求
    //比如每个平台的货币图标都不同，config中就有指定该用户的货币图标下载地址
    //比如有的平台需要删除“自动游戏”功能，config中就有指定当前环境是否支持“自动”
    let initCall = false;
    export async function init(): Promise<boolean> {
        //这是一个异步方法，重复调用可能会引发错误，所以在开头做规避
        //这个方法的意义在于获得config，如果已经完成，就直接跳出
        (<any>window).serverConfig = serverConfig;
        (<any>window).showbghide1?.()
        if ((<any>window).config != null) {
            try {
                await downloadConfigurator();
            }
            catch (error) {
                console.warn("load local configurator failed", error);
            }
            return finishLocalConfigInit();
        }
        if (initCall) {
            while (initCall) {
                await delay(100);
            }
            return (<any>window).config != null ? finishLocalConfigInit() : false;
        }
        initCall = true;

        (<any>window).remoteJsAllow = false;
        try {
            await downloadConfigurator();
        }
        catch (error) {
            console.warn("load local configurator failed", error);
        }
        let localSuccess = finishLocalConfigInit();
        initCall = false;
        return localSuccess;

        let success = false;
        (<any>window).remoteJsAllow = true; // 当前平台是否允许远程加载js，这里需要手动决定，在微信小游戏平台无法远程下载js
        (<any>window).serverConfig = serverConfig;
        //下载远程代码
        try {
            await downloadConfigurator();
        }
        catch (error) {
            console.warn("downloadConfigurator failed, fallback to local network config", error);
        }
        //下载完成后，执行真正获得config的操作
        try {
            success = (<any>window).ConfigInit ? await (<any>window).ConfigInit() : true;
        }
        catch (error) {
            console.warn("ConfigInit failed, fallback to local network config", error);
            success = true;
        }
        applyRuntimeNetworkFallback();
        //获取平台sdk接口对象
        client = (<any>window).client && (<any>window).client.client;

        DecimalUnit = (<any>window).DecimalUnit;

        initCall = false;

        (<any>window).isGameQuit = false;

        return success;
    }

    export function reload() {
        console.log("sdk reload");
        ((<any>window).reload && (<any>window).reload()) || window.location.reload();
    }

    export function recharge() {
        console.log("sdk.recharge");
        let sdkClient = getRuntimeSdkClient();
        if (sdkClient && sdkClient.recharge) sdkClient.recharge();
    }

    export function quit() {
        console.log("quit");

        (<any>window).isGameQuit = true;

        let sdkClient = getRuntimeSdkClient();
        if (sdkClient && sdkClient.quit) sdkClient.quit();
        if ((<any>window).config?.appExtra?.hideNoAuto) {
            (<any>window).stopAuto?.();
            (<any>window).StopAuto?.();
        }
        let gameQuitEvent: (() => void)[] = (<any>window).gameQuitEvent;
        if (gameQuitEvent) {
            for (let event of gameQuitEvent) {
                event?.();
            }
        }
        if (!(<any>window).config?.appExtra?.quitNotDestroy) {
            destroy();
        }
    }

    export function loadingSuccess() {
        if (!client)
            return
        console.log("sdk loadingSuccess", client.loadingSuccess);
        if (client && client.loadingSuccess) client.loadingSuccess();
    }

    export async function loadingFailed() {
        if (!client)
            return
        console.log("sdk loadingFailed", client.loadingFailed);
        if (client && client.loadingFailed) client.loadingFailed();
    }
}


cc.game.on(cc.game.EVENT_SHOW, () => {
    (<any>window).gameHide = false;
});
cc.game.on(cc.game.EVENT_HIDE, () => {
    (<any>window).gameHide = true;
});

export let isGameHide = () => (<any>window).gameHide;

(<any>window).HotGameRecharge = sdk.recharge;
(<any>window).HotGameQuit = sdk.quit;

export let DecimalUnit: {

    humanReadable(value: number, maxFractionDigits?: number, fractionDigits?: number): string

    getFractionDigits(value: number, unit: number, fractionDigits: number, maxFractionDigits: number): number
}

export async function Load<T extends cc.Asset>(url) {
    let result = await new Promise<T>((res, rej) => {
        cc.assetManager.loadRemote<T>(url, {}, (err, asset) => {
            res(asset)
        })
    });
    return result;
}

export async function download(id: string, url: string, type: string, options: Record<string, any>): Promise<any> {
    let result = await new Promise<any>((res, rej) => {
        cc.assetManager.downloader.download(id, url, type, options, (err, asset) => {
            if (err) {
                console.error(err);
            }
            res(asset)
        })
    });
    return result;
}

export let showRedeem: () => boolean = () => (<any>window).config?.gameExtra?.showRedeem;

export let rememberGear: () => boolean = () => (<any>window).config?.appExtra?.rememberGear == null || (<any>window).config?.appExtra?.rememberGear;

export let mergeSecond: () => number = () => (<any>window).config?.appExtra?.mergeSecond;

export let realtimeBalance: () => boolean = () => (<any>window).config?.appExtra?.realtimeBalance == null || (<any>window).config?.appExtra?.realtimeBalance;

export let mergeGear: () => number = () => (<any>window).config?.appExtra?.mergeGear == null ? 2 : (<any>window).config?.appExtra?.mergeGear;

export let delayRecord = (action: string, queryTime: number, extra: string) => (<any>window).delayRecord?.(action, queryTime, extra);

export let actionRecord = (action: string) => (<any>window).actionRecord?.(action);

let canvas = () => cc.Canvas.instance;

let allWidget = canvas()?.getComponentsInChildren(cc.Widget) || [];

(async function () {

    let events = (<any>window).onGameScreenChanged = [() => { }];

    // (<any>window).onGameNodeStart = () => {
    //     for (let e of events)
    //         e?.();
    // }

    // return;

    let viewSize1: cc.Size = cc.size(0, 0);
    let viewSize2: cc.Size = cc.size(0, 0);

    let scene1: cc.Scene;
    let scene2: cc.Scene;

    viewSize1 = cc.view.getVisibleSizeInPixel();
    (async () => {
        while (true) {
            if (IsScreenChanged() && canvas() != null) {
                //ResetWidget();
                await new Promise(res => {
                    cc.tween(canvas().node)
                        .delay(0.01)
                        .call(() => {
                            ResizeCallback();
                        })
                        .delay(0.05)
                        .call(() => {
                            if(serverConfig.platId==undefined||serverConfig.platId<2000||serverConfig.platId>=3000){
                                for (let e of events)
                                    e?.();
                            }

                        })
                        .delay(0.01)
                        .call(() => {
                            res(0);
                        }).start();
                })
            }
            else {
                await delay(20);
            }
        }
    })();

    cc.game.on(cc.game.EVENT_SHOW, async () => {
        ResizeCallback();
        await delay(50);
        for (let e of events)
            e?.();
    })

    function IsScreenChanged() {
        let isChanged = false;
        if (canvas() == null)
            return isChanged
        viewSize2 = cc.view.getVisibleSizeInPixel();
        if (IsSizeDiff(viewSize1, viewSize2))
            isChanged = true;
        viewSize1 = cc.view.getVisibleSizeInPixel();
        scene2 = cc.director.getScene();
        if (scene2?.uuid != scene1?.uuid) {
            isChanged = true;
            // allWidget = canvas()?.getComponentsInChildren(cc.Widget) || [];
        }
        scene1 = cc.director.getScene();
        return isChanged;
    }

    // function ResetWidget() {
    //     console.warn("updateAlignment count", allWidget.length);
    //     for (let widget of allWidget) {
    //         if (widget != null && widget.isValid && widget.enabled)
    //             widget.alignMode = cc.Widget.AlignMode.ALWAYS;
    //     }
    //     setTimeout(() => {
    //         for (let widget of allWidget) {
    //             if (widget != null && widget.isValid && widget.enabled)
    //                 widget.alignMode = cc.Widget.AlignMode.ONCE;
    //         }
    //     }, 1000);
    // }

    function IsSizeDiff(a: cc.Size, b: cc.Size) {
        return a.width != b.width || a.height != b.height
    }

    function ResizeCallback() {
        if (canvas() == null)
            return;
        viewSize2 = cc.view.getVisibleSizeInPixel();
        var reso = canvas().designResolution;
        var rateSize = viewSize2.height / viewSize2.width;
        var rateReso = reso.height / reso.width;
        canvas().fitWidth = rateSize >= rateReso;
        canvas().fitHeight = !canvas().fitWidth;
        console.log("ScreenChanged", {
            fitWidth: canvas().fitWidth,
            fitHeight: canvas().fitHeight,
            designResolution: reso,
            curSize: viewSize2,
        });
    }
})();

export function onBgScaler(node: cc.Node, log = true) {
    let realDR = this.fitVisibleSizeInPixel ? cc.view.getVisibleSizeInPixel() : cc.size(node.parent.width, node.parent.height);
    var rate = realDR.height / realDR.width / (node.height / node.width);
    if (rate > 1) {//适应更瘦的尺寸
        node.scale = realDR.height / node.height;
    }
    else {//适应更扁的尺寸
        node.scale = realDR.width / node.width;
    }
    if (log) {
        console.log("FillScaler", {
            parent: {
                h: node.parent.height,
                w: node.parent.width,
            },
            [this.name]: {
                h: node.height,
                w: node.width,
            },
            ["VisibleSizeInPixel"]: {
                h: cc.view.getVisibleSizeInPixel().height,
                w: cc.view.getVisibleSizeInPixel().width,
            },
            ["realDR"]: {
                h: realDR.height,
                w: realDR.width,
            },
            scale: node.scale
        });
    }
    new Promise(async (res) => {
        let getGameConfig = (<any>window).GetGameConfig;
        if (typeof getGameConfig !== "function") {
            res(0);
            return;
        }
        let sudConfig = await getGameConfig();
        if (sudConfig?.ui?.game_bg?.hide && node != null && node.isValid) {
            node.active = false;
            console.log("sudConfig.ui.game_bg.hide", node.name)
        }
        res(0);
    })
}
