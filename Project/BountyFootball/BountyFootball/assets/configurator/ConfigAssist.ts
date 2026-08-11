import { ConfigKey, getQuery } from "./Config";
import { setDisconnectView2 } from "./GlobalViewsLoader_configurator";
import { HttpRequest } from "./HttpRequest";
import { debugPrint, delay, setDebug, setGameCoin } from "./Util";

export async function load<T extends cc.Asset>(url: string, force: boolean = false): Promise<T> {
    return new Promise(async (resolve, reject) => {
        let asset: T;

        try {
            if (force) {
                asset = await downloadResource<T>(url);
                if (asset) {
                    cc.assetManager.assets.add(url, asset);
                    resolve(asset);
                }

                return;
            }

            // 检查图片是否已经被缓存
            asset = cc.assetManager.assets.get(url) as T;
            if (asset) {
                resolve(asset);
            } else {
                // 如果没有缓存，从网络下载图片
                asset = await downloadResource<T>(url);
                if (asset) {
                    cc.assetManager.assets.add(url, asset);
                    resolve(asset);
                }
            }
        } catch (e) {
            resolve(null);
        }
    });
}

export async function downloadResource<T extends cc.Asset>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        // 如果没有缓存，从网络下载资源
        cc.assetManager.loadRemote<T>(url, (err, asset) => {
            if (err) {
                // 处理错误
                console.error('Error downloading resource:', err);
                reject(err);
            } else {
                // 确保加载的资源
                if (asset) {
                    // 下载完成后可以选择缓存到 cc.assetManager.assets 中，以便之后使用
                    cc.assetManager.assets.add(url, asset);
                    resolve(asset);
                } else {
                    reject(new Error('Loaded asset is not a texture'));
                }
            }
        });
    });
}

export class ConfigAssist {
    // 下载数据
    private static async download(url: string): Promise<any> {
        // console.debug("downloading: ", url);

        return HttpRequest.do("GET", url);
    }

    // 本地读取数据
    private static async readLocalFile(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle('config', (err, bundle) => {
                if (err) {
                    console.error(err);
                    resolve(null);

                    return;
                }

                bundle.load(path, cc.JsonAsset, (err, asset) => {
                    if (err) {
                        console.error(err);
                        resolve(null);

                        return;
                    }

                    resolve(asset.json);
                });
            });
        });
    }

    private static async getSdkConfig(configUrl: string, sdkName: string, isLocal: boolean): Promise<any | null> {
        let sdkConfig = (<any>window).sdkConfig;
        if (sdkConfig) {
            return sdkConfig;
        }

        if (!configUrl) {
            console.error("configUrl is empty!");
            return null;
        }

        // 从本地加载配置
        if (isLocal) {
            let data = await this.readLocalFile(configUrl);
            if (!data) {
                return null;
            }

            try {
                sdkConfig = data;
            } catch (e) {
                console.error("local json can't be parsed: " + e);
                return null;
            }

            // 按版本设置调试打印开关
            sdkConfig.debug && setDebug(sdkConfig.debug.includes((<any>window).gameVersion));

            // 打印日志
            debugPrint("loaded:", configUrl);
            debugPrint("sdkConfig:", sdkConfig);
            (<any>window).sdkConfig = sdkConfig;

            return sdkConfig;
        }

        // 从网络加载
        let jsonString: string = (<any>window).configJsonString;
        configUrl += `/${sdkName}/${sdkName}.json?v=${(<any>window).gameVersion}&timestamp=${Date.now()}`;
        while (!jsonString) {
            console.warn("try download config", configUrl);
            try {
                jsonString = await this.download(configUrl);
            } catch (e) {
                console.error("download error:", e, 'url', configUrl);
                setDisconnectView2(true);
                await delay(1000);
                continue;
            }
            setDisconnectView2(false);
            console.log("download config success", configUrl);

            (<any>window).configJsonString = jsonString;
        }

        if (jsonString == null || jsonString == "") {
            console.error("jsonString's empty!");
            return null;
        }
        // console.debug("jsonString:", jsonString);

        sdkConfig = (<any>window).sdkConfig || JSON.parse(jsonString);
        if (sdkConfig == null) {
            console.error("jsonString can't be parsed:" + jsonString);

            return null;
        }

        // 按版本设置调试打印开关
        sdkConfig.debug && setDebug(sdkConfig.debug.includes((<any>window).gameVersion));

        // 打印日志
        debugPrint("downloaded:", configUrl);
        debugPrint("jsonString:", jsonString);
        debugPrint("sdkConfig:", sdkConfig);
        (<any>window).sdkConfig = sdkConfig;

        return sdkConfig;
    }

    public static async getConfig(key: ConfigKey): Promise<any> {
        let { configUrl, gameName, sdkName, appName, isLocal } = key;
        let sdkConfig = await this.getSdkConfig(configUrl, sdkName, isLocal);
        if (!sdkConfig) {
            return null;
        }

        let adaptedConfig = null;
        let defaultConfig = null;
        // 获取精确配置
        let waitAdapted = (async () => {
            if (appName && appName !== "default") {
                adaptedConfig = await this.getExactConfig(sdkConfig, appName, gameName);
                debugPrint("exactConfig:", adaptedConfig);
            }
        })();
        // 获取默认配置
        let waitDefault = (async () => {
            defaultConfig = await this.getExactConfig(sdkConfig, "default", gameName);
            debugPrint("defaultConfig:", defaultConfig);
        })();

        await waitAdapted;
        await waitDefault;

        if (!adaptedConfig && !defaultConfig) {
            return null;
        }

        // 合并配置
        // 精确配置不存在，则使用默认配置
        if (!adaptedConfig) {
            adaptedConfig = defaultConfig;
        } else {
            defaultConfig && Object.keys(defaultConfig).forEach(key => {
                !adaptedConfig[key] && defaultConfig[key] && (adaptedConfig[key] = defaultConfig[key]);
            });
        }

        // 设置游戏币
        let waitCoin = (async () => {
            if (adaptedConfig.gameCoinIcon && adaptedConfig.gameCoinIcon.length > 0) {
                let texture = await load<cc.Texture2D>(adaptedConfig.gameCoinIcon + `?v=${(<any>window).gameVersion}`, true);
                if (texture) {
                    adaptedConfig.gameCoin = new cc.SpriteFrame(texture);
                }
            }
        })()

        // 设置筹码
        let waitChips: Promise<void>[] = [];
        if (adaptedConfig.chipUrls) {
            adaptedConfig.chips = new Map<string, cc.SpriteFrame>();
            for (const key in adaptedConfig.chipUrls) {
                let chip = adaptedConfig.chipUrls[key];
                waitChips.push((async () => {
                    try {
                        let texture = await load<cc.Texture2D>(chip + `?v=${(<any>window).gameVersion}`, true);
                        if (texture) {
                            let frame = new cc.SpriteFrame(texture);
                            frame.name = key;
                            debugPrint("set chip:", key + frame);
                            adaptedConfig.chips.set(key, frame);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                })())
            }
        }

        // 活动入口图标
        let waitActivity = (async () => {
            if (adaptedConfig.activity?.enable) {
                try {
                    let texture = await load<cc.Texture2D>(adaptedConfig.activity.iconUrl + `?t=${Date.now()}`);
                    if (texture) {
                        let frame = new cc.SpriteFrame(texture);
                        (<any>window).activityIcon = frame;
                    }
                }
                catch (err) {
                    console.error(err)
                }
            }
        })()

        await waitCoin;
        for (let wait of waitChips)
            await wait;
        await waitActivity;

        debugPrint("adaptedConfig:", adaptedConfig);

        return adaptedConfig;
    }

    private static async getExactConfig(sdkConfig, appName: string, gameName: string): Promise<any | null> {
        let appConfig = sdkConfig.apps[appName];
        if (appConfig == null) {
            return null;
        }

        let adaptedConfig = this.getAdaptedConfig(appConfig, gameName);
        adaptedConfig.sdkId = sdkConfig.sdkId;
        adaptedConfig.sdkLibUrl = sdkConfig.sdkLibUrl;

        return adaptedConfig;
    }

    private static getAdaptedConfig(appConfig: any, gameName: string) {
        // 获取服务器地址
        let smartEnv: string = null;
        if (window.location.href.indexOf("test") > -1) {
            smartEnv = "dev";
        }
        let envString = (<any>window).game_env || getQuery("game_env") || smartEnv;
        console.log("game_env: " + envString);
        let env = envString || "pro";
        let server = appConfig.servers[env];
        if (!server) {
            console.error("server is not found!");
            return null;
        }
        let rankUrl: string = null;
        if (appConfig.rankUrls) {
            rankUrl = appConfig.rankUrls[env] as string;
        }

        // 获取配置
        let adaptedConfig: any = {};
        adaptedConfig.servers = appConfig.servers;
        adaptedConfig.host = server.host;
        adaptedConfig.port = server.port;
        adaptedConfig.appId = appConfig.appId;
        adaptedConfig.appName = appConfig.appName;
        adaptedConfig.enableRank = appConfig.enableRank;
        adaptedConfig.rankUrl = rankUrl;
        adaptedConfig.rank = appConfig.rank && appConfig.rank[env];
        adaptedConfig.activity = appConfig.activity && appConfig.activity[env];
        if (!adaptedConfig.rank) {
            let rank: any = {};
            rank.enable = appConfig.enableRank;
            rank.platform =
                (!adaptedConfig.appName || adaptedConfig.appName == "default")
                    ? adaptedConfig.sdkName
                    : adaptedConfig.appName;
            rank.url = rankUrl;
        }
        adaptedConfig.branch = {
            globalViews: appConfig.branch?.globalViews[env],
            rank: appConfig.branch?.rank[env],
        }
        adaptedConfig.appExtra = appConfig.extra;

        if (appConfig.games) {
            let gameConfig = appConfig.games[gameName];
            if (!gameConfig) {
                console.error("gameConfig is not found!");
                return adaptedConfig;
            }

            adaptedConfig.gameId = gameConfig.gameId;
            adaptedConfig.gameName = gameConfig.gameName;
            adaptedConfig.gameCoinIcon = gameConfig.gameCoinIcon || appConfig.appCoinIcon;
            adaptedConfig.betGradeAmounts = gameConfig.betGradeAmounts;
            adaptedConfig.chipUrls = gameConfig.chipUrls;
            adaptedConfig.gameExtra = gameConfig.extra;
        }

        adaptedConfig.setGameCoin = (...sprites: cc.Sprite[]) => setGameCoin(adaptedConfig.gameCoin, ...sprites)

        return adaptedConfig;
    }
}