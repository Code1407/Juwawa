import { _decorator, Component, Node, find } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
const { ccclass, property } = _decorator;

@ccclass('UIRankHelp')
export class UIRankHelp extends Component {
    start() {
        var close1 = find("btnClose", this.node);
        close1.on(Node.EventType.TOUCH_END, this.on_click_close)

        var close2 = find("bjk_1/btnClose3", this.node);
        close2.on(Node.EventType.TOUCH_END, this.on_click_close)
    }

    private on_click_close(){
        oops.gui.remove(UIID.UI_Rank_Help);
    }
        
}


