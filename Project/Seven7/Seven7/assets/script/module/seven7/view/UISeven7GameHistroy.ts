import { _decorator, Node, Button, find, EventTouch, Sprite } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { UIID } from '../../common/GameUIConfig';

const { ccclass, property } = _decorator;

@ccclass('UISeven7GameHistroy')
export class UISeven7GameHistroy extends GameComponent {
    @property(Node)
    itemsRoot: Node;

    @property(Node)
    firstIocn: Node;

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {

    }

    start() {
        var backBtn = find("Root/mask", this.node).getComponent(Button);
        backBtn.node.on(Node.EventType.TOUCH_START, this.btn_close)

        this.on(GameEvent.MSG_SHOW_GAME_HISTORY, this.onHandler, this);
        GameModelMgr.seven7Model.cs_game_history_req();
    }

    private onHandler(event: string, args: any) {
        switch (event) {
            case GameEvent.MSG_SHOW_GAME_HISTORY:
                this.showGameHistory(args)
                break;
        }
    }

    private showGameHistory(args: CsGameHistoryResp) {
        if (args != null && args.list != null && args.list.length > 0) {
            let curRound = GameModelMgr.seven7Model.get_cur_round();
            let newData = args.list[args.list.length - 1];
            if(newData && newData.round == curRound){
                args.list.splice(args.list.length - 1, 1);
            }

            this.firstIocn.active = true;
            for (let i = args.list.length - 1; i >= 0; i--) {
                let rewardId = args.list[i].resultID;
                const rewardPath = `texture/atlas/main/reward_${rewardId}`;
                let index = args.list.length - 1 - i;
                let num = index.toString().padStart(3, '0');
                let path = `item-${num}/icon`;
                let iconNode = find(path, this.itemsRoot);
                if (iconNode) {
                    let icon = iconNode.getComponent(Sprite);
                    super.setSprite(icon, rewardPath, BundleName.SkinDefault);
                }
            }
        } else {
            this.firstIocn.active = false;
        }
    }

    private btn_close(event: EventTouch, data: any) {
        oops.gui.remove(UIID.Seven7UI_GameHistory);
    }
}


