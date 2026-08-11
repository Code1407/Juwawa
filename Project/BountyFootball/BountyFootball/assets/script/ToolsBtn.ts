// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import Audio from "./Audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class toolsBtn extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property(cc.Node)
    btnItems: Array<cc.Node> = [];

    @property(cc.Node)
    ViewBlackground: cc.Node = null;

    // @property(cc.Node)
    // onBtn: cc.Node = null;
    isClick = false;
    switchBtn = true;
    target = -100;

    onLoad() {
        for (let btn of this.btnItems) {
            btn.position = cc.v3(0, 0, 0)
            btn.active = false;
        }
    }

    start() {
        let __this = this;
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            this.OnClick();
            __this.node.scaleX = this.node.scaleY = 1.2;
        });
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            __this.node.scaleX = this.node.scaleY = 1;
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.node.scaleX = this.node.scaleY = 1;
        });


        this.ViewBlackground.on(cc.Node.EventType.TOUCH_START, () => {
            if (this.switchBtn) return;
            for (let i = 0; i < this.btnItems.length; i++) {
                cc.tween(this.btnItems[i])
                    .to(0.20 + 0.05 * i, { position: cc.v3(0, 0, 0) }, cc.easeBackIn())
                    .call(() => {
                        this.switchBtn = true;
                        this.btnItems[i].active = false;
                    })
                    .start();
            }
            this.isClick = false;
        });
    }

    OnClick() {
        if (this.isClick) return;
        // this.onBtn.active = this.switchBtn;
        // this.node.parent.scale = 1;
        this.isClick = true;
        Audio.Instance.playshow_result();

        if (this.switchBtn) {
            for (let i = 0; i < this.btnItems.length; i++) {
                this.btnItems[i].active = true;
                cc.tween(this.btnItems[i])
                    .to(0.30 - 0.05 * i, { position: cc.v3(0, 0 - 100 * (i + 1), 0) }, cc.easeBackOut())
                    .call(() => {
                        this.switchBtn = false;
                    })
                    .start();
            }
        } else if (!this.switchBtn) {
            for (let i = 0; i < this.btnItems.length; i++) {
                cc.tween(this.btnItems[i])
                    .to(0.20 + 0.05 * i, { position: cc.v3(0, 0, 0) }, cc.easeBackIn())
                    .call(() => {
                        this.switchBtn = true;
                        this.btnItems[i].active = false;
                    })
                    .start();
            }
        }
        setTimeout(() => {
            this.isClick = false;
        }, 500);
    }

    getWorldPosition(localPos) {
        const worldPos = this.node.convertToWorldSpaceAR(localPos);
        return this.node.parent.convertToNodeSpaceAR(worldPos);
    }

    // update (dt) {}
}
