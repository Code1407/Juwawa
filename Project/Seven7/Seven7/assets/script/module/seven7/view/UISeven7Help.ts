import { _decorator, Node, Button, find, EventTouch } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UISeven7Help')
export class UISeven7Help extends GameComponent {

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {

    }
    start() {
        var backBtn = find("Root/mask", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_START, this.btn_close)
    }

    private btn_close(event: EventTouch, data: any) {
        oops.gui.remove(UIID.Seven7UI_Help);
    }
}


