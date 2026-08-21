

let onViewsLoaded: (() => void)[] = (<any>window).onViewsLoaded;

function TryCall(view: string, todo: () => void) {
    if ((<any>window).isGlobalViewsLoaded) {//如果资源已经加载完成
        todo();//直接执行
    }
    else {//如果资源还没加载完成
        console.warn(`${view} not load`)
        onViewsLoaded.push(todo);//把唤起命令加入队列中，等到资源加载完成再执行
    }
}

export function setDisconnectView(active: boolean) {
    let todo = () => { (<any>window).setActive((<any>window).disconnectView, active) };
    TryCall(`disconnectView`, todo);
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
export function isNetworkError(): boolean {
    if (!(<any>window).isGlobalViewsLoaded)
        return false;
    return (<any>window).isNetworkError();
}

export function updateAutoQuit() {
    let todo = () => { (<any>window).updateAutoQuit?.() };
    TryCall(`updateAutoQuit`, todo);
}

export let waitGlobalViews: Promise<number>;//可用于阻塞线程，直到远程资源加载完毕