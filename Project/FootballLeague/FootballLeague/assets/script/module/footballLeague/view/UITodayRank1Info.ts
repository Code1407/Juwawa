import { _decorator, Component, Node, Sprite, Label, SpriteFrame } from 'cc';
import GameModelMgr from '../../mvc/GameModelMgr';
import { AvatarItem } from './AvatarItem';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
const { ccclass, property } = _decorator;

@ccclass('UITodayRank1Info')
export class UITodayRank1Info extends Component {
    @property(Label)
    private lb_title: Label;

    @property(Label)
    private lb_win: Label;

    @property(AvatarItem)
    private avatarItem: AvatarItem;

    @property(Sprite)
    private icon_coins: Sprite;

    private coinsSp: SpriteFrame = null;

    onLoad(): void {
        //this.node.on(Node.EventType.TOUCH_START, this.on_click_ranking_btn.bind(this));
    }

    update_rank1_info() {
        let rank3 = GameModelMgr.footballLeagueModel.get_today_rank3_info();
        if (rank3 && rank3.length > 0) {
            this.lb_win.string = rank3[0].score.toLocaleString();
            this.avatarItem.setInfo(rank3[0].name, rank3[0].avatarUrl);
        } else {
            this.lb_win.string = "0";
            this.avatarItem.setInfo("", "");
        }
    }

    update_icon_coins(coinsSp: SpriteFrame) {
        if (coinsSp) {
            this.coinsSp = coinsSp;
            this.icon_coins.spriteFrame = coinsSp;
        }
    }

    private on_click_ranking_btn() {
        oops.gui.openAsync(UIID.FootballLeagueUI_Rank, this.coinsSp);
    }
}


