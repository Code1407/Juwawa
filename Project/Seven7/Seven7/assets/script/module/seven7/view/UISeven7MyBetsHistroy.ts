import { _decorator, Component, Node, Button, find, EventTouch, instantiate } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { UISeven7MyBetsHistroyItem } from "db://assets/script/module/seven7/view/UISeven7MyBetsHistroyItem";
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UISeven7MyBetsHistroy')
export class UISeven7MyBetsHistroy extends GameComponent {

    @property(Node)
    itemContent: Node;

    @property(UISeven7MyBetsHistroyItem)
    itemPrefab: UISeven7MyBetsHistroyItem;

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {

    }
    start() {
        var backBtn = find("Root/mask", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_START, this.btn_close)

        this.on(GameEvent.MSG_SHOW_SELF_BET_HISTORY, this.onHandler, this);
        GameModelMgr.seven7Model.cs_self_bet_history_req();
    }

    private onHandler(event: string, args: any) {
        switch (event) {
            case GameEvent.MSG_SHOW_SELF_BET_HISTORY:
                this.showMyBetHistory(args)
                break;
        }
    }


    private showMyBetHistory(args: CsSelfBetHistoryResp) {
        if (args == null || args.list == null || Object.keys(args.list).length === 0 || args.list.length <= 0) {
            return;
        }

        let curRound = GameModelMgr.seven7Model.get_cur_round();
        for (let i = 0; i < args.list.length; i++) {
            let data = args.list[i];
            if (i == 0 && data.round == curRound) {
                continue;
            }
            let item = instantiate(this.itemPrefab.node)
            item.getComponent(UISeven7MyBetsHistroyItem).init(data);
            item.parent = this.itemContent;
            item.active = true;
        }
    }

    private btn_close(event: EventTouch, data: any) {
        oops.gui.remove(UIID.Seven7UI_MyBetsHistroy);
    }
}


