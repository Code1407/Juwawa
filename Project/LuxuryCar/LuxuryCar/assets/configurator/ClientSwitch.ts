import { actionRecord } from "./Util";

let isRegister = false

export function ClientSwitch() {//config加载完成后开始执行平台方定制的需求
    let config = (<any>window).config;
    if (config?.gameExtra?.removeAuto != null) {
        if (config?.gameExtra?.removeAuto) {//是否当前游戏隐藏“自动”按钮
            (<any>window).hideAutoButton?.();
        }
    }
    else if (config?.appExtra?.removeAuto) {//是否全部游戏隐藏“自动”按钮
        (<any>window).hideAutoButton?.();
    }
    if (config?.appExtra?.removeAgain) {//是否全部游戏隐藏“再来一次”按钮
        (<any>window).hideAgainButton?.();
    }
    if (!isRegister) {//如果重复调用则跳过
        cc.game.on(cc.game.EVENT_SHOW, () => {
            onGameShow((<any>window).config);//游戏从后台切回来时要做的事
        });
        cc.game.on(cc.game.EVENT_HIDE, () => {
            onGameHide((<any>window).config);//游戏切后台时要做的事
        });
        isRegister = true;
    }
    if ((<any>window).gameHide) {//有可能在下载本代码前用户就已经提前切后台
        onGameHide(config);//游戏切后台时要做的事
    }
}

let playerRoundId = 0;
let lastHideTime = 0;
let hideReloadSecond = (<any>window).config?.appExtra?.hideReloadSecond || 60

let hideStopAuto: (config) => boolean = (config) => config?.appExtra?.hideNoAuto == null || config?.appExtra?.hideNoAuto;

let curScene: cc.Scene
let allAu: cc.AudioSource[] = [];

function onGameHide(config) {
    console.log("Hide");
    lastHideTime = Date.now();
    // console.log(cc.game.EVENT_HIDE);
    if (config?.appExtra?.hidekeepSound) {//隐藏后台时继续保持声音？

    }
    else {
        console.log("pause all sound");
        cc.audioEngine.pauseAll();
        if (curScene != cc.director.getScene()) {
            curScene = cc.director.getScene();
            allAu = cc.director.getScene().getComponentsInChildren(cc.AudioSource);
        }
        for (let au of allAu) {
            au.pause();
        }
        (<any>window).hideAllSounds?.();
    }
    if (hideStopAuto(config)) {//切后台时是否停止自动
        (<any>window).stopAuto?.();
        (<any>window).StopAuto?.();
    }
    playerRoundId = (<any>window).playerRoundId;
    actionRecord("hide");
}
function onGameShow(config) {
    console.log("Show");
    if (config?.appExtra?.showReload) {//从后台切回来是否重新加载游戏
        console.warn("come back reload");
        reload();
    } else if (config?.appExtra?.showReloadNextRound && playerRoundId != (<any>window).playerRoundId) {//检查到客户端与服务端的回合数不同步时，是否重新加载游戏
        console.warn("next round reload");
        reload();
    } else if (Date.now() - lastHideTime > hideReloadSecond * 1000) {//后台滞留时间太长重新加载游戏
        console.warn("hide over time reload");
        reload();
    } else if ((<any>window).isNetworkError?.()) {//处在网络异常状态重新加载游戏
        console.warn("network error reload");
        reload();
    }
    else if ((<any>window).isGameQuit) {
        console.warn("game quit reload");
        (<any>window).isGameQuit = false;
        reload();
    }
    else {
        cc.audioEngine.resumeAll();
        for (let au of allAu) {
            au.resume();
        }
        (<any>window).showAllSounds?.();
        actionRecord("show");
    }
    (<any>window).updateBalance?.();
}
function reload() {
    ((<any>window).reload && (<any>window).reload()) || window.location.reload();
}

(<any>window).ClientSwitch = ClientSwitch;
