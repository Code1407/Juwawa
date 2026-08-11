import GlobalRankUI from "../ui/GlobalRankUI";
import { GameDelay } from "./CCAsync_Rank";
import { EnumTweenEasing } from "./EnumTweenEasing_Rank";

const { ccclass, property } = cc._decorator;

enum Action {
    open,
    close,
}

@ccclass("ActiveCtrlElement_Rank")
class ActiveCtrlElement {
    @property({ type: cc.Enum(Action) })
    action: Action = Action.open
    @property(cc.Node)
    ui: cc.Node = null;
}

@ccclass
export default class ActiveCtrl extends cc.Component {
    @property()
    twOp = true;
    @property()
    twSc = true;
    @property(ActiveCtrlElement)
    ctrlElements: ActiveCtrlElement[] = [];

    protected onLoad(): void {
        this.ctrlElements.forEach(element => {
            switch (element.action) {
                case Action.close:
                    this.node.on(cc.Node.EventType.TOUCH_END, async () => {
                        console.log("close " + element.ui.name);
                        closeUI(element.ui, this.twSc, this.twOp);
                    })
                    break;
                case Action.open:
                    this.node.on(cc.Node.EventType.TOUCH_END, async () => {
                        console.log("open " + element.ui.name);
                        openUI(element.ui, this.twSc, this.twOp);
                    })
                    break;
            }
        });
    }

}
let node: cc.Node;
export function openUI(ui: cc.Node, twSc = false, twOp = false) {
    ui.active = true;
    // if (twSc) {
    //     ui.scale = 0.8;
    //     cc.tween(ui).to(1 / 8, { scale: 1 }, { easing: EnumTweenEasing[EnumTweenEasing.backOut] }).start()
    // }
    // if (twOp) {
    //     ui.opacity = 0;
    //     cc.tween(ui).to(1 / 8, { opacity: 255 }, { easing: EnumTweenEasing[EnumTweenEasing.cubicOut] }).start()
    // }
}
export async function closeUI(ui: cc.Node, twSc = false, twOp = false) {
    // if (twSc)
    //     cc.tween(ui).to(1 / 8, { scale: 0.8 }).start()
    // if (twOp)
    //     cc.tween(ui).to(1 / 8, { opacity: 0 }).start()
    // if (twSc || twOp)
    //     await GameDelay(GlobalRankUI.Instance.node, 1 / 6);
    ui.active = false;
}