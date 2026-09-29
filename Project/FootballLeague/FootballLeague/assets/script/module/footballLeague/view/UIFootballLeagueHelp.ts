import { _decorator, Node, Button, find, EventTouch } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueHelp')
export class UIFootballLeagueHelp extends GameComponent {

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {

    }
    start() {
        var backBtn = find("Root/mask", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_START, this.btn_close)
    }

    private btn_close() {
        oops.gui.remove(UIID.FootballLeagueUI_Help);
    }
}


