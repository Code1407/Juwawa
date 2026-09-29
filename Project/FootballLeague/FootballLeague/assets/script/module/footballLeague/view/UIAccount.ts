import { _decorator, Component, Sprite, Label, SpriteFrame } from 'cc';
import GameModelMgr from '../../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

@ccclass('UIAccount')
export class UIAccount extends Component {
    @property(Label)
    private lb_coins: Label;

    @property(Sprite)
    private icon_coins: Sprite;

    start() {
        this.update_coins();
    }

    update_coins() {
        this.lb_coins.string = GameModelMgr.playerModel.get_player_coins().toLocaleString();
    }

    update_icon_coins(coinsSp: SpriteFrame) {
        if (coinsSp) {
            this.icon_coins.spriteFrame = coinsSp;
        }
    }
}


