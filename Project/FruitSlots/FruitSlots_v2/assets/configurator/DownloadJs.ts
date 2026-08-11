import { getQuery } from "./Config";
import { debugPrint } from "./Util";

(<any>window).module = { exports: {} };
let moduleExports: any;
let branch_path = "game/branch/";
export async function downloadAsset<T extends cc.Asset>(url: string): Promise<T> {
    debugPrint(`downloading: ${url}`);

    return new Promise((resolve, reject) => {
        cc.assetManager.loadRemote(url, (err, asset) => {
            if (err) {
                console.error("download error: ", err);
                reject(err);
                return;
            }
            debugPrint(`downloaded successfully: ${url}`);

            if ((<any>window).module) {
                moduleExports = (<any>window).module.exports;
                // delete (<any>window).module;
            }

            resolve(asset as T);
        });
    });
}

export async function downloadJs(url: string): Promise<any> {
    let asset = await downloadAsset<cc.TextAsset>(url);
    debugPrint(JSON.stringify(asset));
    await new Promise((res, rej) => {
        cc.assetManager.loadScript(url + `?t=${Date.now()}`, (err, asset) => {
            if (err) {
                console.error(err)
                rej(err)
            }
            res(asset);
        })
    })

    return moduleExports;
}


//排行榜
export let GlobalRankUI
export async function LoadRank() {
    //一旦不满足条件，就不加载排行榜，并非所有平台都上线排行榜功能
    if ((<any>window).disableRank) {
        console.warn("disableRank");
        return;
    }
    if (GlobalRankUI != null)
        return;
    let gNewRank = false;
    let config = (<any>window).config;
    if (config?.enableRank != null)
        gNewRank = config?.enableRank;
    if (config?.rank?.enable != null)
        gNewRank = config?.rank?.enable;
    if (!gNewRank)
        return;
    //以下这一大串用于决定下载地址
    const remoteJson = getQuery("json");
    const isLocal = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost$)/.test(window.location.hostname)
        && ((remoteJson && remoteJson != "remote") || !remoteJson);
    let env = ""//getQuery("configurator_env")
    let path = branch_path + (getQuery("rank_path") || "rank");
    let host = "https://cdn-web.hotgame.win";
    if (window.location.protocol && window.location.hostname)
        host = `${window.location.protocol}//${window.location.hostname}`;
    if (env == "dev" || isLocal) {
        if (config?.branch?.rank) {
            host = config?.branch?.rank;
        }
        else {
            host = "https://test.hotgame.win";
        }
    }
    let url = `${host}/${path}`;
    let opts = {};
    if ((cc.loader.downloader.bundleVers.rank != null && config?.appExtra?.useLocalBundles) || cc.sys.platform == cc.sys.WECHAT_GAME) {
        url = "rank"
        if (cc.loader.downloader.bundleVers.rank != null)
            opts = { version: cc.loader.downloader.bundleVers.rank };
        if ((<any>window).sudLocalBundleMap != null)
            opts = { version: (<any>window).sudLocalBundleMap[url] };
    }
    else {
        let content = (await download(Math.random().toString(), `${url}/version.json?timestamp=${Date.now()}`, "json", {}));
        opts = content == "js" ? {} : { version: content };
        console.log(url, content);
    }
    //开始下载
    cc.assetManager.loadBundle(url, opts, async (err: Error, bnd: cc.AssetManager.Bundle) => {
        console.log(`Rank Loaded`);
        while ((<any>window).rankViewPos == null || (<any>window).user?.uid == null) {
            await new Promise((res, rej) => {
                setTimeout(() => {
                    res(0);
                }, 500);
            })
        }
        bnd.loadDir(`prefab/GlobalRankUI`, null, null, (err, prefab) => {
            console.log(`GlobalRankUI Loaded`);
            if ((<any>window).disableRank) {
                console.warn("disableRank");
                return;
            }
            (<any>window).GlobalRankUI = GlobalRankUI = cc.instantiate(prefab[0] as cc.Prefab).getComponent(`GlobalRankUI`);
            let rankButton = GlobalRankUI.rankButton;
            let awardButton = GlobalRankUI.awardButton;
            let cvs = cc.director.getScene().getComponentInChildren(cc.Canvas);
            let ins: cc.Node = GlobalRankUI.node;
            ins.setParent((<any>window).rankViewPos);
            let fitSize = Math.min(cvs.designResolution.width, cvs.designResolution.height);
            ins.setScale(cc.Vec3.ONE.multiplyScalar(fitSize / 720));
            ins.position = cc.Vec3.ZERO;
            if ((<any>window).enableRank && (<any>window).jsnet) {
                GlobalRankUI.initRankUI((<any>window).jsnet);
            }
            (<any>window).destoryRank = () => {
                console.warn("destoryRank");
                ins.destroy();
                rankButton.destroy();
                awardButton.destroy();
            }
        })
    });

}
//通用提示框，比如网络断开，比如余额不足
export async function LoadGlobalViews() {
    //开头这一大串用于决定下载地址
    const remoteJson = getQuery("json");
    const isLocal = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|localhost$)/.test(window.location.hostname)
        && ((remoteJson && remoteJson != "remote") || !remoteJson);
    let env = ""//getQuery("configurator_env")
    let path = branch_path + (getQuery("globalViews_path") || "globalViews");
    let host = "https://cdn-web.hotgame.win";
    let config = (<any>window).config;
    if (window.location.protocol && window.location.hostname)
        host = `${window.location.protocol}//${window.location.hostname}`;
    if (env == "dev" || isLocal) {
        if (config?.branch?.globalViews) {
            host = config?.branch?.globalViews;
        }
        else {
            host = "https://test.hotgame.win";
        }
    }
    let url = `${host}/${path}`
    let opts = {};
    if ((cc.loader.downloader.bundleVers.globalViews != null && config?.appExtra?.useLocalBundles) || cc.sys.platform == cc.sys.WECHAT_GAME) {
        url = "globalViews"
        if (cc.loader.downloader.bundleVers.globalViews != null)
            opts = { version: cc.loader.downloader.bundleVers.globalViews };
        if ((<any>window).sudLocalBundleMap != null)
            opts = { version: (<any>window).sudLocalBundleMap[url] };
    }
    else {
        let content = (await download(Math.random().toString(), `${url}/version.json?timestamp=${Date.now()}`, "json", {}));
        opts = content == "js" ? {} : { version: content };
        console.log(url, content);
    }
    //开始下载
    cc.assetManager.loadBundle(url, opts, async (err: Error, bnd: cc.AssetManager.Bundle) => {
        if (err) {
            console.error(err);
        }
        console.log(`GlobalViews Bundle Loaded`);
        bnd.loadDir(`prefab/GlobalViews`, null, null, async (err, prefab) => {
            console.log(`GlobalViews Dir Loaded`);
            let ins: cc.Node = null;
            while (true) {//由于存在切换场景的可能，所以一旦发现被销毁就需要再次生成
                if ((ins == null || !ins.isValid) && (<any>window).GlobalViewsContainor?.isValid) {
                    ins = cc.instantiate(prefab[0] as cc.Prefab);
                    let cvs = cc.director.getScene().getComponentInChildren(cc.Canvas);
                    ins.setParent((<any>window).GlobalViewsContainor);
                    let fitSize = Math.min(cvs.designResolution.width, cvs.designResolution.height);
                    ins.setScale(cc.Vec3.ONE.multiplyScalar(fitSize / 720));
                    ins.position = cc.Vec3.ZERO;
                    (<any>window).globalViews = ins;
                }
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        res(0);
                    }, 1000);
                })
            }
        })
    });
}
//平台活动入口图标
export async function LoadActivity() {
    if ((<any>window).config.activity?.enable) {
        while ((<any>window).activityPos == null) {
            await new Promise((res, rej) => {
                setTimeout(() => {
                    res(0);
                }, 500);
            })
        }
        let frame = (<any>window).activityIcon as cc.SpriteFrame;
        let nodePos = (<any>window).activityPos as cc.Node;
        if (frame != null && nodePos != null) {
            let sp = nodePos.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = frame;
            nodePos.on(cc.Node.EventType.TOUCH_END, () => {
                let url: string = (<any>window).config.activity?.url;
                if (url) {
                    url = url.replace("{uid}", (<any>window).user?.uid);
                    window.location.href = url;
                }
            })
        }
    }
}

export async function download(id: string, url: string, type: string, options: Record<string, any>): Promise<any> {
    let result = await new Promise<any>((res, rej) => {
        cc.assetManager.downloader.download(id, url, type, options, (err, asset) => {
            res(asset)
        })
    });
    return result;
}
