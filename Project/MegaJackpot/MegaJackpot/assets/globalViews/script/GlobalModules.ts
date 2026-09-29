import { onAutoQuit } from "./AutoQuit";
import GlobalViews from "./GlobalViews";
import { onClose, onLoginOther, onMaintenance, onNetworkHeartbeat, secTimeoutRoll } from "./NetworkStatus";

// 5秒没心跳，或检查浏览器状态为断网，发生其中之一，弹菊花。
// 5秒没心跳的菊花时长为5秒。
// 检查浏览器状态为菊花时长为10秒。
// 超过以上时间，弹断网提示框。

// 一但收到心跳，则中止断网状态（菊花和提示框都要消失）。
// 或判断出浏览器状态为连网时，则中止断网状态（菊花和提示框都要消失）。

export let gameName = () => (<any>window).gameName;
export let serverConfig = () => (<any>window).serverConfig;
export let pinus = () => (<any>window).pinus;
export let isNetworkReady = () => (<any>window).isNetworkReady;
//以上这些写法是为了方便找查引用，提高阅读效率

export async function pinusInit(): Promise<void> {
    return new Promise(resolve => {
        pinus().init({
            host: serverConfig().host,
            port: serverConfig().port,
            log: true
        }, resolve);
    });
}

export async function pinusRequest(routerName: string, msg: any): Promise<any> {
    let router = `${serverConfig().routerPath}.${gameName()}.${routerName}`;
    return new Promise(resolve => {
        pinus().request(router, msg, (data) => {
            resolve(data);
        });
    });
}

export function pinusResp(routerName: string, cb: any) {
    pinus().on(routerName, cb);
}

export async function pinusRequestBranch(gameBranch: string, routerName: string, msg: any): Promise<any> {
    let router = `${serverConfig().routerPath}.${gameBranch}.${routerName}`;
    return new Promise(resolve => {
        pinus().request(router, msg, (data) => {
            resolve(data);
        });
    });
}

export let setActive = (<any>window).setActive = (node, active: boolean, name = "") => {//在浏览器可调试
    if (node != null) {
        node.active = active;
    }
    else {
        if (active)
            console.warn(`${name} is null`)
    }
}

export async function delay(ms: number) {
    await new Promise((res) => {
        setTimeout(() => {
            res(0)
        }, ms);
    })
}

enum ETradeCode {
    success = 0,
    insufficient = -1,  // 余额不足
    missTime = -2,      // 错过下注时间
    sdkDisconnect = -3, // 平台sdk不通
    closeServer = -4,   // 服务器发生严重错误导致关服
    tokenInvalid = -5,  // 无效token
    coolDown = -6,      // 冷却
    timeout = -7,       // 超时
    fail = -8,
    betDone = -9,        //重复下注
    betPassMax = -10,    //下注超过最大限制
    repeatOrder = -11,   // 重复订单
    userStatusError = -12,   // 用户状态异常
    CoinFrozen = -24,    // 金币冻结
    nothing = -99997,
    userException = -99998,
    unknow = -99999,
}

function showCloseServerNotice() {
    (<any>window).pendingCloseServerView = true;
    setActive(GlobalViews.Instance?.closeServerView, true, "closeServerView");
}

(<any>window).breakRoundStep = false;

export let sdkInit = async () => await (<any>window).sdkInit?.();

if (pinus() != null) {
    pinusResp("onRoundStep", (data) => {
        (<any>window).isNetworkReady = true;
        onNetworkHeartbeat(secTimeoutRoll(), true);
    });
    pinusResp("onChangeToken", (data) => {
        onChangeToken(data);
    });
    pinusResp("onKeepConnection", () => {
        (<any>window).isNetworkReady = true;
        onNetworkHeartbeat(secTimeoutRoll(), true);
    });
    pinusResp("close", () => {
        console.log("断网");
        onClose();
    });
    pinusResp('onAutoQuit', () => {
        onAutoQuit();
        StopGame(`自动退出 服务端倒计时结束`, true);
    });
    pinusResp("onMaintenance", () => {
        onMaintenance();
        StopGame(`维护`);
    });
    pinusResp("onLoginOther", () => {
        onLoginOther();
        StopGame(`顶号`);
    });
}

window.removeEventListener("online", (<any>window).OnLineReload);
if ((<any>window).networkInterval != null) {
    clearInterval((<any>window).networkInterval);
}
window.ononline = null;

(<any>window).checkAddiction = () => {
    console.warn(`checkAddiction not ready`);
};
function onChangeToken(token: string) {
    console.log("new token", token);
    (<any>window).user.token = token;
    (<any>window).onChangeToken?.(token);
}

export async function StopGame(str: string, immediately: boolean = false) {
    console.log(`Stop Game`, str);
    if (!immediately) {
        await new Promise((res) => {
            let id = setInterval(() => {
                if (!(<any>window).waitRound) {
                    res(0);
                    clearInterval(id);
                }
            }, 100);
        });
    }
    (<any>window).stopGame?.();
}

(<any>window).checkTradeCode = (code: number) => {
    switch (code) {
        case ETradeCode.insufficient: setActive(GlobalViews.Instance?.rechargeView, true, "rechargeView"); break;
        case ETradeCode.userStatusError: setActive(GlobalViews.Instance?.userStatusErrorView, true, "userStatusErrorView");
            StopGame(`用户异常`);
            break;
        case ETradeCode.sdkDisconnect: setActive(GlobalViews.Instance?.maintenanceView, true, "maintenanceView"); break;   
        case ETradeCode.closeServer: showCloseServerNotice(); break;
        case ETradeCode.CoinFrozen: setActive(GlobalViews.Instance?.coinFrozenView, true, "coinFrozenView"); break;
        case ETradeCode.success:
        case ETradeCode.missTime:
        case ETradeCode.coolDown:
        case ETradeCode.fail:
        case ETradeCode.betDone:
        case ETradeCode.betPassMax:
        case ETradeCode.repeatOrder:
        case ETradeCode.nothing:
            break;
        default:
            console.warn("Unhandled trade code", code);
            setActive(GlobalViews.Instance?.maintenanceView, true, "maintenanceView");
            break;
    }
    if (code != ETradeCode.success) {
        console.warn("TradeCode", code);
        console.warn(ETradeCode[code]);
    }
}

let intervalTryStartHeartbeat = setInterval(() => {
    if (cc.director.getScene() != null) {
        onNetworkHeartbeat(secTimeoutRoll() * 2, false);
        clearInterval(intervalTryStartHeartbeat);
    }
}, 1000)
