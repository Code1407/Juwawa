import { IRedeemResp } from "../shared3/interface/IRedeem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalViewsLoader extends cc.Component {

    @property(cc.Node)
    viewsContainor: cc.Node = null;
    @property(cc.Node)
    dbmUINode: cc.Node = null;
    async start() {
        console.log(`GlobalViewsLoader start`);
        (<any>window).GlobalViewsContainor = this.viewsContainor;
        (<any>window).dbmUINode = this.dbmUINode;

        // GlobalViews is instantiated under this container at runtime. Keep the
        // container above RankStart and GlobalMailUI so global dialogs cannot be
        // covered by either UI layer.
        if (this.viewsContainor?.parent) {
            this.viewsContainor.setSiblingIndex(this.viewsContainor.parent.childrenCount - 1);
        }
    }
}


(<any>window).isGlobalViewsLoaded = false;
let onViewsLoaded: (() => void)[] = [];

(<any>window).onViewsLoaded = onViewsLoaded;

function TryCall(view: string, todo: () => void) {
    if ((<any>window).isGlobalViewsLoaded) {
        todo();
    }
    else {
        console.warn(`${view} not load`)
        onViewsLoaded.push(todo);
    }
}

export function setDisconnectView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).disconnectView, active) };
    TryCall(`disconnectView`, todo);
}
export function setDisconnectRollView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).disconnectRollView, active) };
    TryCall(`disconnectRollView`, todo);
}
export function setDisconnectView2(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).disconnectView2, active) };
    TryCall(`disconnectView2`, todo);
}
export function setUserStatusErrorView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).userStatusErrorView, active) };
    TryCall(`userStatusErrorView`, todo);
}
export function setMaintenanceView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).maintenanceView, active) };
    TryCall(`maintenanceView`, todo);
}
export function setRechargeView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).rechargeView, active) };
    TryCall(`rechargeView`, todo);
}
export function setCheatWarningView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).cheatWarningView, active) };
    TryCall(`cheatWarningView`, todo);
}
export function checkTradeCode(code: number) {
    let todo = () => { (<any>window).checkTradeCode(code) };
    TryCall(`checkTradeCode`, todo);
}
export function checkAddiction() {
    let todo = () => { (<any>window).checkAddiction() };
    TryCall(`checkAddiction`, todo);
}
export function TryAddictionWarning() {
    if ((<any>window).addiction)
        (<any>window).AddictionWarning()
    return (<any>window).addiction
}
export function RedeemLogin() {
    let todo = () => { (<any>window).RedeemLogin() };
    TryCall(`RedeemLogin`, todo);
}
export function RedeemData() {
    return (<any>window).RedeemData as IRedeemResp;
}
export function IsRedeemOpenable() {
    let redeemData = RedeemData();
    if (redeemData) {
        if (redeemData.totalBet >= redeemData.betLevel[redeemData.got]) {
            return true;
        }
    }
    return false;
}
export function RedeemOpenAward() {
    let todo = () => { (<any>window).RedeemOpenAward() };
    TryCall(`RedeemOpenAward`, todo);
}
export function isNetworkError(): boolean {
    if ((<any>window).isTimeSyncError === true) {
        return true;
    }
    if (!(<any>window).isGlobalViewsLoaded)
        return false;
    return (<any>window).isNetworkError();
}

export function updateAutoQuit() {
    let todo = () => { (<any>window).updateAutoQuit?.() };
    TryCall(`updateAutoQuit`, todo);
}

export let waitGlobalViews: Promise<number>;//可用于阻塞线程，直到远程资源加载完毕
