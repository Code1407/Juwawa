import { StopGame, delay, pinus, pinusRequest, setActive } from "./GlobalModules";
import GlobalViews from "./GlobalViews";
import { EDisconnectType, curDisconnectType, setDisconnectType } from "./NetworkStatus";



export let timeToAutoQuit = Date.now();
export let timeToShowTips = Date.now();
export let idleTime =330;//挂机时间
export let quitTime =300;//强退时间
// export let idleTime = 40;//挂机时间
// export let quitTime = 60;//强退时间


if ((<any>window).gameName?.includes("Fishing")) {
    idleTime = 10;
    quitTime = 40;
}

let timeoutQuit = 0;

export function onAutoQuit() {
    setDisconnectType(EDisconnectType.autoQuit);
}
function updateAutoQuit() {
    let config = (<any>window).config;
    timeToAutoQuit = Date.now() + (config?.gameExtra?.autoQuit?.quitTime || quitTime) * 1000;
    setActive(GlobalViews.Instance?.autoQuitView, false, "autoQuitView");
    clearInterval(timeoutQuit);
    timeoutQuit = setInterval(async () => {
        if (Date.now() > timeToAutoQuit) {
                setActive(GlobalViews.Instance?.autoQuitView, true, "autoQuitView");
                StopGame(`自动退出 客户端倒计时结束`);
                clearInterval(timeoutQuit);
                // pinusRequest("autoQuit", {});
                // await delay(200);//request 会被下面的 disconnect 阻断
                // pinus().disconnect();
        }
    }, 500);
}
(<any>window).updateAutoQuit = () => updateAutoQuit();