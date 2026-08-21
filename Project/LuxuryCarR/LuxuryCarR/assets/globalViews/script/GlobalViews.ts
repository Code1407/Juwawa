// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import AntiAddiction from "./AntiAddiction";
import { delay, isNetworkReady } from "./GlobalModules";
import { isSocketClose } from "./NetworkStatus";
import DBMUI from "./ui/DBMUI";
import { EnumTweenEasing } from "./utl/EnumTweenEasing_EX";
import TradeError from "./view/TradeError_EX";

let onViewsLoaded: (() => void)[] = (<any>window).onViewsLoaded;

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalViews extends cc.Component {
    static Instance: GlobalViews
    @property(cc.Node)
    disconnectRollView: cc.Node;
    @property(cc.Node)
    disconnectView: cc.Node;
    @property(cc.Node)
    disconnectView2: cc.Node;
    @property(cc.Node)
    autoQuitView: cc.Node;
    @property(cc.Node)
    timerToAutoQuitView: cc.Node;
    @property(cc.Node)
    userStatusErrorView: cc.Node;
    @property(cc.Node)
    maintenanceView: cc.Node;
    @property(cc.Node)
    rechargeView: cc.Node;
    @property(cc.Node)
    closeServerView: cc.Node;
    @property(TradeError)
    tradeError: TradeError;
    @property(cc.Node)
    cheatWarningView: cc.Node;
    @property(DBMUI)
    dbmUI: DBMUI;
    @property(cc.Node)
    btnDebugRecharge: cc.Node;

    @property(cc.Node)
    roll1: cc.Node;
    @property(cc.Node)
    roll2: cc.Node;

    async start() {
        console.log(`GlobalViews start`);
        GlobalViews.Instance = this;
        (<any>window).globalViews = this;
        (<any>window).disconnectRollView = this.disconnectRollView;
        (<any>window).disconnectView = this.disconnectView;
        (<any>window).disconnectView2 = this.disconnectView2;
        (<any>window).userStatusErrorView = this.userStatusErrorView;
        (<any>window).maintenanceView = this.maintenanceView;
        (<any>window).rechargeView = this.rechargeView;
        (<any>window).closeServerView = this.closeServerView;
        if ((<any>window).pendingCloseServerView && this.closeServerView) {
            this.closeServerView.active = true;
        }
        (<any>window).cheatWarningView = this.cheatWarningView;
        (<any>window).isGlobalViewsLoaded = true;

        console.log(`GlobalViews Finish`);
        while (onViewsLoaded != null && onViewsLoaded.length > 0)
            onViewsLoaded.shift()?.();

        cc.tween(this.roll1).repeatForever(cc.tween(this.roll1).by(1, { angle: 60 })).start();
        cc.tween(this.roll2).repeatForever(cc.tween(this.roll2).by(1, { angle: -60 })).start();
        cc.tween(this.roll1).repeatForever(
            cc.tween(this.roll1)
                .to(1, { scale: 0.25 }, { easing: EnumTweenEasing[EnumTweenEasing.sineInOut] })
                .to(1, { scale: 0.5 }, { easing: EnumTweenEasing[EnumTweenEasing.sineInOut] })
        ).start();
        cc.tween(this.roll2).repeatForever(
            cc.tween(this.roll2)
                .to(1, { scale: 0.6 }, { easing: EnumTweenEasing[EnumTweenEasing.sineInOut] })
                .to(1, { scale: 0.5 }, { easing: EnumTweenEasing[EnumTweenEasing.sineInOut] })
        ).start();
        if ((<any>window).dbmUINode != null) {
            this.dbmUI.node.setParent((<any>window).dbmUINode);
            this.dbmUI.node.position = cc.Vec3.ZERO;
            this.dbmUI.node.active = true;
            this.startDBM();
        }
    }
    dbmDelay = 0;
    dbmInterval = -1;
    dbmRunning = false;
    async startDBM() {
        if (this.dbmRunning) {
            return;
        }
        this.dbmRunning = true;
        while (this.isValid) {
            clearInterval(this.dbmInterval);
            if (isSocketClose) {
                await delay(1000);
                continue;
            }
            if (!isNetworkReady()) {
                await delay(1000);
                continue;
            }

            // JsNet already has a built-in ping loop. Reusing its delay avoids
            // spawning extra dbmHeartbeat requests that can timeout during reconnect.
            this.dbmDelay = Number((<any>window).netDelay) || 0;
            this.dbmUI.updateOffset(this.dbmDelay);
            await delay(1000);
        }
        this.dbmRunning = false;
        clearInterval(this.dbmInterval);
    }

    onDestroy() {
        this.dbmRunning = false;
        clearInterval(this.dbmInterval);
    }
}
