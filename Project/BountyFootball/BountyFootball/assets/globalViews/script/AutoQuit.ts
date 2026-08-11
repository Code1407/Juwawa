import { StopGame, delay, pinus, pinusRequest, setActive } from "./GlobalModules";
import GlobalViews from "./GlobalViews";
import { EDisconnectType, curDisconnectType, setDisconnectType } from "./NetworkStatus";



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

let timeoutIdle = 0;
let timeoutQuit = 0;

export function onAutoQuit() {
    setDisconnectType(EDisconnectType.autoQuit);
}
function updateAutoQuit() {
    let config = (<any>window).config;
    timeToAutoQuit = Date.now() + (config?.gameExtra?.autoQuit?.quitTime || quitTime) * 1000;
    timeToShowTips = Date.now() + (config?.gameExtra?.autoQuit?.idleTime || idleTime) * 1000;
    setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
    setActive(GlobalViews.Instance?.autoQuitView, false, "autoQuitView");
    clearInterval(timeoutIdle);
    clearInterval(timeoutQuit);
    timeoutIdle = setInterval(() => {
        if (Date.now() > timeToShowTips) {
            setActive(GlobalViews.Instance?.timerToAutoQuitView, true, "timerToAutoQuitView");
        }
    }, 500);
    timeoutQuit = setInterval(async () => {
        if (Date.now() > timeToAutoQuit) {
            clearTimeout(timeoutIdle);//idleTime可以设置得比quitTime长，这里得将它强行清除
            if (curDisconnectType < EDisconnectType.autoQuit) {
                setDisconnectType(EDisconnectType.autoQuit);
                setActive(GlobalViews.Instance?.autoQuitView, true, "autoQuitView");
                setActive(GlobalViews.Instance?.timerToAutoQuitView, false, "timerToAutoQuitView");
                StopGame(`自动退出 客户端倒计时结束`);
                pinusRequest("autoQuit", {});
                await delay(200);//request 会被下面的 disconnect 阻断
                pinus().disconnect();
            }
        }
    }, 500);
}
(<any>window).updateAutoQuit = () => updateAutoQuit();