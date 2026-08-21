

const { ccclass, property } = cc._decorator;

enum Action {
    open,
    close,
}

@ccclass("CtrlElement_shared3")
class ActiveCtrlElement {
    @property({ type: cc.Enum(Action) })
    action: Action = Action.open
    @property(cc.Node)
    ui: cc.Node = null;
}

@ccclass
export default class ActiveCtrl extends cc.Component {
    @property(ActiveCtrlElement)
    ctrlElements: ActiveCtrlElement[] = [];

    protected onLoad(): void {
        this.ctrlElements.forEach(element => {
            switch (element.action) {
                case Action.close:
                    this.node.on(cc.Node.EventType.TOUCH_END, () => {
                        console.log("close " + element.ui.name);
                        element.ui.active = false;
                    })
                    break;
                case Action.open:
                    this.node.on(cc.Node.EventType.TOUCH_END, () => {
                        console.log("open " + element.ui.name);
                        element.ui.active = true;
                    })
                    break;
            }
        });
    }

}
