// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class MaintenanceView extends cc.Component {

    @property(cc.Node)
    reconnectButton: cc.Node = null;

    @property(cc.Node)
    exitButton: cc.Node = null;

    start() {
        this.reconnectButton?.on(cc.Node.EventType.TOUCH_START, () => {
            window.location.reload();
        });
        this.exitButton?.on(cc.Node.EventType.TOUCH_START, () => {
            (<any>window).quit?.();
        });
    }
    protected onEnable(): void {
        if (this.reconnectButton != null)
            this.reconnectButton.active = false;
        if (this.exitButton != null)
            this.exitButton.active = false;
        setTimeout(() => {
            if (this.reconnectButton != null)
                this.reconnectButton.active = true;
            if (this.exitButton != null)
                this.exitButton.active = true;
        }, 3000);
    }
}
