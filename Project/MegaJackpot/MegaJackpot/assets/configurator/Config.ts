import { BetGrade } from "./BetGrade";
import { ClientSwitch } from "./ClientSwitch";
import { ConfigAssist } from "./ConfigAssist";
import { LoadActivity, LoadGlobalViews, LoadRank, downloadJs } from "./DownloadJs";
import { setDisconnectView2 } from "./GlobalViewsLoader_configurator";
import { debugPrint, delay } from "./Util";

export const isIOS = navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

let gameLang_vn = [
    "GreedyLion",
    "FruitParty2",
    "Lucky77",
    "Ludo",
    "Rocket",
    "TeenPatti",
    "TeenPatti99",
    "Wheel77",
    "Lucky77x12",
    "Dice",
    "Roulette",
    "RoyalTeenPatti",
    "SuperColor",
]

export function getQuery(name: string): string {
    if (!window.location.search)
        return "";
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let result = window.location.search.slice(1).match(reg);
    if (result)
        return decodeURI(result[2]);
    return "";
}
export class ConfigKey {
    constructor(public configUrl: string, public gameName: string,
        public sdkName?: string, public appName?: string,
        public isLocal?: boolean) {
    }
};

export class Config {
    // 获取配置
    static async init(key: ConfigKey): Promise<boolean> {
        //user信息
        let user = (<any>window).user || {};
   
        user.lang = user.lang || getQuery("lang");
        user.uid = user.uid || getQuery("uid");
        user.token = user.token || getQuery("token");
        user.extra = user.extra || {};
        user.extra.version = (<any>window).gameVersion;
        user.ua = navigator.userAgent;
        (<any>window).user = user;
        //语言兼容
        if (gameLang_vn.includes((<any>window).gameName) && user.lang == "vi")
            user.lang = "vn"
        //配置
        let config = null;
        while (config == null) {
            config = await ConfigAssist.getConfig(key);
            if (config == null) {
                console.error("config is null")
                setDisconnectView2(true);
                await delay(1000);
            }
        }
        setDisconnectView2(false);
        (<any>window).config = config;
        //sdk
        if ((<any>window).remoteJsAllow && config.sdkLibUrl && config.sdkLibUrl.length > 0) {
            console.log("try download sdkLibUrl");
            config.sdkExports = await downloadJs(config.sdkLibUrl + `?v=${(<any>window).gameVersion}`);
        }
        //档位信息
        let betGrate = new BetGrade(config.betGradeAmounts, config.chips);
        (<any>window).betGrade = betGrate;

        user.extra.gameId = config.gameId;
        user.extra.gameName = config.gameName;

        debugPrint("user:", user);

        return true;
    }

    static async clearTempResource() {
        (<any>window).configJsonString = null;
        (<any>window).sdkConfig = null;
    }
}


let client: any;
(<any>window).ConfigInit = async (dataOverride = null) => {
    //开头这一大串用于决定下载地址
    if ((<any>window).gameName == null) {
        console.error("gameName", (<any>window).gameName);
    }
    let gameName = (<any>window).gameName;
    const remoteJson = getQuery("json");
    let isLocal = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost$)/.test(window.location.hostname)
        && ((remoteJson && remoteJson != "remote") || !remoteJson);
    console.log("hostname:", window.location.hostname, "isLocal:", isLocal);
    // config文件地址
    let configUrl = "/config"; // 如有特殊情况，自行处理。如：sud需要打成小游戏包，则只能写死
    let sdkName = dataOverride?.sdkName || getQuery("sdk") || "hg"; // 默认为测试环境，如有特殊情况，自行处理。如：sud需要打成小游戏包，则只能写死
    let appName = dataOverride?.appName || getQuery("app") || "1"; // 默认为1：本地127.0.0.1:3000
    if (dataOverride?.configUrl != null) {
        configUrl = dataOverride?.configUrl
    }
    else {
        if (sdkName == "hg") {
            configUrl = "https://test.hotgame.win/config";
            (<any>window).game_env = "dev";
        }

        // await downloadJs(configUrl + "/index.js?ts="+new Date().getTime());
        configUrl += `/sdk`;
        isLocal && (configUrl = "default");
    }

    if (cc.sys.platform == cc.sys.WECHAT_GAME) {//微信平台不支持远程拉取，所以不用等待config加载
        LoadGlobalViews();//下载通用弹窗分包
    }

    let configSuccess = false;
    let clientSuccess = true;

    //下载config
    let waitConfig = (async () => {
        configSuccess = await Config.init({ configUrl, gameName, sdkName, appName, isLocal });
        if (!configSuccess) {
            console.error("config init failed!", { configUrl, gameName, sdkName, appName, isLocal });
            return configSuccess;
        }
        (<any>window).serverConfig.host = (<any>window).config.host;
        (<any>window).serverConfig.port = (<any>window).config.port;
        ClientSwitch();//config加载完成后开始执行平台方定制的需求
        if (cc.sys.platform != cc.sys.WECHAT_GAME) {
            LoadGlobalViews();//下载通用弹窗分包
        }
        LoadRank();//下载排行榜分包
        LoadActivity();//下载平台方的活动入口图标
    })()

    //下载平台方sdk接口
    let waitClient = (async () => {
        if (dataOverride?.client != null) {
            client = dataOverride?.client;
        }
        else {
            !isLocal && await new Promise((res, rej) => {
                cc.assetManager.loadScript(configUrl + `/${sdkName}/client.js?v=${(<any>window).gameVersion}&ts=${Date.now()}`, (err, asset) => {
                    if (err) {
                        console.error(err);
                        rej(asset);
                    }
                    setTimeout(() => {
                        res(asset);
                    }, 100);
                });
            })
        }
    })()

    await waitConfig;
    await waitClient;

    client = (<any>window).client && (<any>window).client.client;

    //sdk初始化
    console.log("client: " + JSON.stringify(client));
    if (client && client.init) {
        clientSuccess = await client.init();
        console.log("client init", (clientSuccess ? "success" : "failed"));
        if (!clientSuccess) {
            return clientSuccess;
        }
    }

    return configSuccess && clientSuccess;
}
