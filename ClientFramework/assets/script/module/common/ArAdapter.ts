import { _decorator, Component, Layout } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
const { ccclass, property } = _decorator;

@ccclass('ArAdapter')
export class ArAdapter extends Component {
    @property(Layout)
    private layout: Layout = null

    start() {
        if (!this.layout) {
            this.layout = this.node.getComponent(Layout);
        }
        this.refresh();
    }

    private refresh() {
        if (oops.language.checkUINeedOverturn()) {
            this.layout.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
        } else {
            this.layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        }
    }
}


