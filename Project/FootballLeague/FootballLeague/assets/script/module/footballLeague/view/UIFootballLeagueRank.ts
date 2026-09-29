import { _decorator, Node, Button, find, SpriteFrame } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import List from 'db://assets/script/framework/list/List';
import { UIFootballLeagueRankItem } from './UIFootballLeagueRankItem';
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UIFootballLeagueRank')
export class UIFootballLeagueRank extends GameComponent {

    @property(List)
    list: List = null;

    listData: any;

    private icon_coins: SpriteFrame = null

    onAdded(args: any) {
        if (args && Object.keys(args).length > 0) {
            this.icon_coins = args;
        }
        return true;
    }

    start() {
        var backBtn = find("Root/btn_Close", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_END, this.btn_close)

        this.on(GameEvent.MSG_SHOW_RANK, this.onHandler, this);
        GameModelMgr.footballLeagueModel.cs_rank_req();
    }

    private onHandler(event: string, args: any) {
        switch (event) {
            case GameEvent.MSG_SHOW_RANK:
                this.showRank(args);
                break;
        }
    }


    private showRank(args: CsRevenueRankResp) {
        if (args == null || args.list == null || Object.keys(args.list).length === 0 || args.list.length <= 0) {
            return;
        }
        this.listData = args.list;
        this.list.numItems = args.list.length;
    }

    onListRender(item: any, idx: number) {
        let data = this.listData[idx];
        let itemUt: UIFootballLeagueRankItem = item.getComponent(UIFootballLeagueRankItem);
        itemUt.init(data);
        itemUt.update_icon_coins(this.icon_coins);
    }

    private btn_close() {
        oops.gui.remove(UIID.FootballLeagueUI_Rank);
    }
}


