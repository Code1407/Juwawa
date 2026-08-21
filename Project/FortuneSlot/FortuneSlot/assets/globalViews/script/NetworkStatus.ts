import { setActive } from "./GlobalModules";
import GlobalViews from "./GlobalViews";

export enum EDisconnectType {
    networkError,
    none,
    loginOther,
    autoQuit,
    maintenance
}

export let secTimeoutRoll = () => {
    if ((<any>window).config?.appExtra?.TimeoutRoll != null) {
        return (<any>window).config?.appExtra?.TimeoutRoll;
    }
    return 5;
};

export let secTimeoutDisconnect = () => {
    if ((<any>window).config?.appExtra?.TimeoutRoll != null && (<any>window).config?.appExtra?.TimeoutDisconnect != null) {
        return (<any>window).config?.appExtra?.TimeoutRoll + (<any>window).config?.appExtra?.TimeoutDisconnect;
    }
    return 10;
};

let loopShowInterval = -1;

export let curDisconnectType: EDisconnectType = EDisconnectType.none;
export let isSocketClose = false;
export let isEnterGame = false;

export async function onClose() {
    if ((<any>window).isGameQuit) {
        return;
    }
    isSocketClose = true;
    isEnterGame = false;
    (<any>window).isNetworkError = () => true;
}

export function onNetworkHeartbeat(_secDelay: number, isServerCall: boolean) {
    if ((<any>window).breakRoundStep) {
        return;
    }
    isSocketClose = false;
    (<any>window).isNetworkError = () => false;
    if (isServerCall) {
        setDisconnectType(EDisconnectType.none);
        setActive(GlobalViews.Instance?.disconnectRollView, false, "disconnectRollView");
    }
}

export function setDisconnectType(type: EDisconnectType) {
    clearInterval(loopShowInterval);
    if (type > curDisconnectType || curDisconnectType == EDisconnectType.none) {
        curDisconnectType = type;
        if (curDisconnectType == EDisconnectType.none) {
            setDisconnectTypeBase(type);
        }
        else {
            setDisconnectTypeBase(type);
            loopShowInterval = setInterval(() => {
                setDisconnectTypeBase(type);
            }, 200);
        }
        switch (type) {
            case EDisconnectType.networkError:
                console.log("show disconnectView2");
                break;
            case EDisconnectType.loginOther:
                console.log("show disconnectView");
                break;
            case EDisconnectType.autoQuit:
                console.log("show autoQuitView");
                break;
        }
    }
}

export function setDisconnectTypeBase(type: EDisconnectType) {
    setActive(GlobalViews.Instance?.disconnectView2, type == EDisconnectType.networkError, "disconnectView2");
    setActive(GlobalViews.Instance?.disconnectView, type == EDisconnectType.loginOther, "disconnectView");
    setActive(GlobalViews.Instance?.autoQuitView, type == EDisconnectType.autoQuit, "autoQuitView");
    //setActive(GlobalViews.Instance?.maintenanceView, type == EDisconnectType.maintenance, "maintenanceView");
}

export function onLoginOther() {
    setDisconnectType(EDisconnectType.loginOther);
}

export function onMaintenance() {
    setDisconnectType(EDisconnectType.maintenance);
}
