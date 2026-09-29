import { _decorator, Label } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { AvatarItem } from "db://assets/script/module/footballLeague/view/AvatarItem";
import GameModelMgr from '../../mvc/GameModelMgr';
import { RollLabel } from '../../../framework/extendComp/RollLabel';

const { ccclass, property } = _decorator;

@ccclass('UIPlayerInfo')
export class UIPlayerInfo extends GameComponent {
    @property(AvatarItem)
    avatar: AvatarItem;

    @property(RollLabel)
    private moneyCurLB: RollLabel;

    @property(RollLabel)
    private moneyRevenueLB: RollLabel;

    private curMoney: number = 0;
    private curRevenueMoney: number = 0;

    start(): void {

    }

    init() {
        this.updateMoney();
        this.avatar.setSelf();
    }

    updateMoney() {
        this.curMoney = GameModelMgr.playerModel.get_player_coins();
        this.curRevenueMoney = GameModelMgr.footballLeagueModel.getTodayRevenue();

        this.moneyCurLB.setValue(this.curMoney);
        this.moneyRevenueLB.setValue(this.curRevenueMoney);
    }

    updateMoneyByRoll() {
        let money = GameModelMgr.playerModel.get_player_coins();
        let revenue = GameModelMgr.footballLeagueModel.getTodayRevenue();

        this.moneyCurLB.startRoll(this.curMoney, money, 1000, 0);
        this.moneyRevenueLB.startRoll(this.curRevenueMoney, revenue, 1000, 0);
    }
}


