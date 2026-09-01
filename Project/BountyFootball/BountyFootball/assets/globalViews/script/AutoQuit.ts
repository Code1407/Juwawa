import { StopGame, delay, pinus, pinusRequest, setActive } from "./GlobalModules";
import GlobalViews from "./GlobalViews";
import { EDisconnectType, setDisconnectType } from "./NetworkStatus";



export let timeToAutoQuit = Date.now();
export let timeToShowTips = Date.now();
export let idleTime =300;//挂机时间
export let quitTime =330;//强退时间
// export let idleTime = 40;//挂机时间
// export let quitTime = 60;//强退时间


if ((<any>window).gameName?.includes("Fishing")) {
    idleTime = 10;
    quitTime = 40;
}

let timeoutIdle: any = 0;
let timeoutQuit: any = 0;

function isAutoBetActive(): boolean {
    return (<any>window).isAutoBetActive === true;
}

function refreshAutoQuitDeadline() {
    let config = (<any>window).config;
    timeToAutoQuit = Date.now() + (config?.gameExtra?.autoQuit?.quitTime || quitTime) * 1000;
    timeToShowTips = Date.now() + (config?.gameExtra?.autoQuit?.idleTime || idleTime) * 1000;
}

if ((<any>window).isAutoQuitLocked == null) {
    (<any>window).isAutoQuitLocked = false;
}

export function onAutoQuit() {
    (<any>window).isAutoQuitLocked = true;
    setDisconnectType(EDisconnectType.autoQuit);
}
function updateAutoQuit() {
    if ((<any>window).isAutoQuitLocked) {
        clearInterval(timeoutIdle);
        clearInterval(timeoutQuit);
        setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
        setActive(GlobalViews.Instance?.autoQuitView, true, "autoQuitView");
        return;
    }
    refreshAutoQuitDeadline();
    setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
    setActive(GlobalViews.Instance?.autoQuitView, false, "autoQuitView");
    clearInterval(timeoutIdle);
    clearInterval(timeoutQuit);
    timeoutIdle = setInterval(() => {
        if (isAutoBetActive()) {
            refreshAutoQuitDeadline();
            setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
            return;
        }
        if (Date.now() > timeToShowTips) {
            // 前端超时后不再弹出 timerToQuit 倒计时窗口。
            // setActive(GlobalViews.Instance?.timerToAutoQuitView, true, "timerToAutoQuitView");
            clearInterval(timeoutIdle);
        }
    }, 500);
    timeoutQuit = setInterval(async () => {
        if (isAutoBetActive()) {
            refreshAutoQuitDeadline();
            setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
            return;
        }
        if (Date.now() > timeToAutoQuit) {
                clearInterval(timeoutIdle);
                onAutoQuit();
                setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
                StopGame(`自动退出 客户端倒计时结束`, true);
                clearInterval(timeoutQuit);
                // pinusRequest("autoQuit", {});
                // await delay(200);//request 会被下面的 disconnect 阻断
                // pinus().disconnect();
        }
    }, 500);
}
(<any>window).updateAutoQuit = () => updateAutoQuit();
