// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../shared/Common";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SDKUI extends cc.Component {
    @property(cc.Node)
    btnRecharge: cc.Node = null
    @property(cc.Node)
    btnQuit: cc.Node = null
    @property(cc.Node)
    btnReload: cc.Node = null
    protected start(): void {
        this.btnRecharge?.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(`touch rechage button`);
            sdk.recharge();
        })
        this.btnQuit?.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(`touch quit button`);
            sdk.quit();
        })
        this.btnReload?.on(cc.Node.EventType.TOUCH_END, async () => {
            console.log(`touch reload button`);
            await TryUpdateToken();
            window.location.reload();
        })
    }
}
export async function TryUpdateToken() {
    if ((<any>window).UpdateToken != null) {
        await (<any>window).UpdateToken?.();
    }
}