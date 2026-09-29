import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
const { ccclass, property } = _decorator;

@ccclass('BetTypeOverTip')
export class BetTypeOverTip extends Component {
    @property(Node)
    private btn_confrim: Node;

    @property(Node)
    private btn_mask: Node;

    @property(Label)
    private lab_content: Label;

    onLoad(): void {
        this.btn_confrim.on(Node.EventType.TOUCH_START, this.on_close.bind(this));
        this.btn_mask.on(Node.EventType.TOUCH_START, this.on_close.bind(this));
    }

    refresh_tip_content(max_count) {
        if (max_count > 0) {
            this.lab_content.string = oops.language.getLanguage("Greedy_Bet_Count_Over", max_count)
        }
    }

    on_show() {
        this.node.active = true;
    }

    on_close() {
        this.node.active = false;
    }
}


