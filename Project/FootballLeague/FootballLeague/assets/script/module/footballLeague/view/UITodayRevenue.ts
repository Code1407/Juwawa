import { _decorator, Component, Sprite, Label, SpriteFrame } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

@ccclass('UITodayRevenue')
export class UITodayRevenue extends Component {
    @property(Label)
    private lb_win: Label;

    @property(Sprite)
    private icon_coins: Sprite;

    start() {
        oops.message.on(GameEvent.MSG_TODAY_REVENUE_UPDATE, this.update_revenue, this);
    }

    onDestroy() {
        oops.message.off(GameEvent.MSG_TODAY_REVENUE_UPDATE, this.update_revenue, this);
    }

    update_revenue() {
        this.lb_win.string = GameModelMgr.footballLeagueModel.getTodayRevenue().toLocaleString();
    }

    update_icon_coins(coinsSp: SpriteFrame) {
        if (coinsSp) {
            this.icon_coins.spriteFrame = coinsSp;
        }
    }
}


