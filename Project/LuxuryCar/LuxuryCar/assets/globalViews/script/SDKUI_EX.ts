// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { setActive } from "./GlobalModules";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SDKUI_EX extends cc.Component {
    @property(cc.Node)
    btnRecharge: cc.Node
    @property(cc.Node)
    btnQuit: cc.Node
    @property(cc.Node)
    btnReload: cc.Node
    @property(cc.Node)
    closeBtn: cc.Node 

    protected start(): void {
        this.btnRecharge?.on(cc.Node.EventType.TOUCH_END, async () => {
            console.log(`touch rechage button`);
            (<any>window).isRecharge = true;
            if ((<any>window).HotGameRecharge != null) {
                console.log(`call HotGameRecharge()`);
                (<any>window).HotGameRecharge?.();
            }
            if ((<any>window).recharge != null) {
                console.log(`call recharge()`);
                (<any>window).recharge?.();
            }
        })
        this.btnQuit?.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(`touch quit button`);
            if ((<any>window).HotGameQuit != null) {
                console.log(`call HotGameQuit()`);
                (<any>window).HotGameQuit?.();
            }
            if ((<any>window).quit != null) {
                console.log(`call quit()`);
                (<any>window).quit?.();
            }

            this.close();
        })
        this.btnReload?.on(cc.Node.EventType.TOUCH_END, async () => {
            console.log(`touch reload button`);
            if (this.node.name === "timerToQuit" || this.node.name === "autoQuitView") {
                const isFinalAutoQuit = this.node.name === "autoQuitView";
                const needsReconnect = (<any>window).isNetworkError?.() === true;
                if (isFinalAutoQuit) (<any>window).isAutoQuitLocked = false;
                (<any>window).resetDisconnectType?.();
                this.close();
                (<any>window).updateAutoQuit?.();
                if (isFinalAutoQuit) {
                    if (needsReconnect) {
                        await (<any>window).HotGameReconnect?.();
                    }
                    else {
                        await (<any>window).onReconnect?.();
                    }
                }
                return;
            }
            if ((<any>window).HotGameReconnect) {
                const success = await (<any>window).HotGameReconnect();
                if (success) this.close();
            }
        })
        this.closeBtn?.on(cc.Node.EventType.TOUCH_END, async () => {
            this.close()
        })
    }
    close() {
        this.node.active = false;
    }
}
export async function TryUpdateToken() {
    if ((<any>window).UpdateToken != null) {
        await (<any>window).UpdateToken?.();
    }
}
