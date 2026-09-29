import { _decorator, Component, Node, Button, find, EventTouch, Label } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { AvatarItem } from "db://assets/script/module/seven7/view/AvatarItem";
import { UIID } from '../../common/GameUIConfig';
import GameModelMgr from '../../mvc/GameModelMgr';

const { ccclass, property } = _decorator;

@ccclass('UISeven7CurBetResult')
export class UISeven7CurBetResult extends GameComponent {

    @property(AvatarItem)
    private selfAvatar: AvatarItem;

    @property(Label)
    private lb_self_bet: Label;

    @property(Label)
    private lb_self_win: Label;

    @property(Node)
    private rank3_root: Node;

    private showWorldBet: boolean = true;

    onAdded(args: any) {
        setTimeout(() => {
            this.btn_close();
        }, 2500);

        let cfg = oops.network.getgetClientConfig();
        this.showWorldBet = cfg?.custom?.showothers ?? true;
        this.reset_rank3_nods();
        this.show_rank3_info();
        this.show_self_info();
        return true;
    }

    private reset_rank3_nods() {
        for (let i = 1; i <= 3; i++) {
            let nod = find(`No${i}`, this.rank3_root)
            if (nod) {
                nod.active = false;
            }
        }
    }

    private set_rank_info(rank: number, rankData: RankData) {
        let nod = find(`No${rank}`, this.rank3_root)
        if (!nod) {
            return
        }
        let avatar = find("avatar", nod).getComponent(AvatarItem);
        avatar.init(rankData.avatarUrl, rankData.name);

        let lb_bet = find("bet/bg/value", nod).getComponent(Label);
        lb_bet.string = (rankData.bet || 0).toLocaleString('en-US');

        let lb_win = find("win/bg/value", nod).getComponent(Label);
        lb_win.string = (rankData.win || 0).toLocaleString('en-US');

        let nod_bet = find("bet", nod);
        nod_bet.active = this.showWorldBet;
        nod.active = true;
    }

    private show_rank3_info() {
        let rankList = GameModelMgr.seven7Model.get_rank3_info();
        for (let i = 0; i < rankList.length; i++) {
            let rankData = rankList[i];
            this.set_rank_info(i + 1, rankData);
        }
    }

    private show_self_info() {
        this.selfAvatar.initSelf();
        this.lb_self_bet.string = GameModelMgr.seven7Model.get_self_bet().toLocaleString('en-US');
        this.lb_self_win.string = GameModelMgr.seven7Model.get_self_win().toLocaleString('en-US');
    }

    private btn_close() {
        oops.gui.remove(UIID.Seven7UI_CurBetResult, false);
    }
}


