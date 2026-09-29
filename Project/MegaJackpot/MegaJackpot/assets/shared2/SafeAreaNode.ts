// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class SafeAreaNode extends cc.Component {

    @property(cc.Node)
    gameNode: cc.Node = null;

    @property()
    setScale = true;

    private callback: () => void = null;

    protected onLoad(): void {
        this.gameNode = this.gameNode || this.node;
        // Safe-area adjustment must not leave the node transparent.
        this.node.opacity = 255;
    }

    protected start(): void {
        if (!this.isValid) {
            return;
        }

        this.callback = this.resizeCallback.bind(this);

        const win = <any>window;
        win.onGameScreenChanged = win.onGameScreenChanged || [];
        win.onGameScreenChanged.push(this.callback);

        const allWidgets = this.getComponentsInChildren(cc.Widget);
        const originAlignMode: { [uuid: string]: cc.Widget.AlignMode } = {};

        for (const widget of allWidgets) {
            originAlignMode[widget.node.uuid] = widget.alignMode;
            widget.alignMode = cc.Widget.AlignMode.ALWAYS;
        }

        // Do the first adjustment instead of waiting for a resize event.
        this.scheduleOnce(() => {
            if (this.isValid) {
                this.resizeCallback();
            }
        }, 0);

        this.scheduleOnce(() => {
            if (!this.isValid) {
                return;
            }

            for (const widget of allWidgets) {
                if (widget && widget.isValid) {
                    widget.alignMode = originAlignMode[widget.node.uuid];
                }
            }
        }, 1);
    }

    protected onDestroy(): void {
        const events: (() => void)[] =
            (<any>window).onGameScreenChanged || [];
        const index = events.indexOf(this.callback);

        if (index >= 0) {
            events.splice(index, 1);
        }

        this.callback = null;
    }

    private resizeCallback(): void {
        if (!this.isValid || !this.gameNode) {
            return;
        }

        this.node.opacity = 255;

        const widget = this.gameNode.getComponent(cc.Widget);
        const sdkSetGameSize = (<any>window).sdkSetGameSize;

        if (typeof sdkSetGameSize === "function") {
            if (widget != null) {
                widget.enabled = false;
            }

            sdkSetGameSize(this.gameNode, this.setScale);
        }
        else if (widget != null) {
            widget.enabled = true;
            widget.alignMode = cc.Widget.AlignMode.ALWAYS;
            widget.updateAlignment();
        }
    }
}
