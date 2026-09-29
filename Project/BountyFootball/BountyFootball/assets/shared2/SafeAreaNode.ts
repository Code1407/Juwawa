// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html


const { ccclass, property } = cc._decorator;

@ccclass
export default class SafeAreaNode extends cc.Component {

    @property(cc.Node)
    gameNode: cc.Node = null;

    @property()
    setScale = true;

    callback

    start() {
       // this.node.opacity=0
        if (!this.isValid)
            return;
        this.gameNode = this.gameNode || this.node;
        this.callback = this.ResizeCallback.bind(this);
        (<any>window).onGameScreenChanged.push(this.callback);
        let allWidget = this.getComponentsInChildren(cc.Widget);
        let originAlignMode: { [uuid: string]: cc.Widget.AlignMode } = {};
        for (let widget of allWidget) {
            originAlignMode[widget.node.uuid] = widget.alignMode;
            widget.alignMode = cc.Widget.AlignMode.ALWAYS;
        }
        setTimeout(() => {
            if (this.isValid)
                for (let widget of allWidget) {
                    widget.alignMode = originAlignMode[widget.node.uuid];
                }
        }, 1000);
    }

    protected onDestroy(): void {
        let events: (() => void)[] = (<any>window).onGameScreenChanged;
        events.splice(events.indexOf(this.callback), 1);
    }

    ResizeCallback() {
        this.node.opacity=255
        let widget = this.gameNode.getComponent(cc.Widget);
        if (widget != null) {
            if ((<any>window).sdkSetGameSize != null) {
                widget.enabled = false;
            }
            else {
                widget.alignMode = cc.Widget.AlignMode.ALWAYS;
            }
        }
        (<any>window).sdkSetGameSize?.(this.gameNode, this.setScale);
    }

    // update (dt) {}
}