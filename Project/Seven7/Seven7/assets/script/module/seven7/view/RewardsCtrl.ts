import { _decorator, Component, Node } from 'cc';
import { UISeven7RewardItem } from "db://assets/script/module/seven7/view/UISeven7RewardItem";
import { TableReward } from "db://assets/script/table/TableReward";
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";
import GameModelMgr from '../../mvc/GameModelMgr';
import { oops } from 'db://oops-framework/core/Oops';
const { ccclass, property } = _decorator;

@ccclass('RewardsCtrl')
export class RewardsCtrl extends Component {
    @property(UISeven7RewardItem)
    private rewardItems: Array<UISeven7RewardItem> = [];

    private _clickFunc: Function = null;

    start(): void {
        this.update_show_world_bet();
    }

    public init_rewards(clickFunc: Function) {
        this._clickFunc = clickFunc;
        var table = JsonUtil.get(TableReward.TableName);
        if (table == null) {
            console.error("cfg TableReward is nil");
            return
        }

        for (let index = 0; index < this.rewardItems.length; index++) {
            let id = index + 1;
            let cfgData = table[id];
            if (cfgData != null) {
                this.rewardItems[index].init(cfgData, this.on_click_reward_item.bind(this));
            }
        }
    }

    public update_show_world_bet(){
        let cfg = oops.network.getgetClientConfig();
        let show = cfg?.custom?.showothers ?? true;
        for (let index = 0; index < this.rewardItems.length; index++) {
            this.rewardItems[index].showWorldBet(show);
        }
    }

    public update_bet_value(betMap, isSelf: boolean = true) {
        if (betMap == null) {
            return;
        }
        for (const key in betMap) {
            let rewardID = Number(key);
            let betNum = betMap[key];
            for (let index = 0; index < this.rewardItems.length; index++) {
                if (rewardID == this.rewardItems[index].get_id()) {
                    if (isSelf) {
                        this.rewardItems[index].updateSlefBetNum(betNum);
                    } else {
                        this.rewardItems[index].updateWorldBetNum(betNum);
                    }
                }
            }
        }
    }

    public update_self_bet_value() {
        for (let index = 0; index < this.rewardItems.length; index++) {
            let rewardID = this.rewardItems[index].get_id();
            let betNum = GameModelMgr.seven7Model.getCurBetNumByRewardID(rewardID);
            this.rewardItems[index].updateSlefBetNum(betNum);
        }
    }

    public clear_item_bet_info() {
        for (let index = 0; index < this.rewardItems.length; index++) {
            this.rewardItems[index].updateWorldBetNum(0);
            this.rewardItems[index].updateSlefBetNum(0);
        }
    }

    public get_reward_item_world_pos(rewardId: number) {
        for (let index = 0; index < this.rewardItems.length; index++) {
            if (rewardId == this.rewardItems[index].get_id()) {
                let pos = this.rewardItems[index].node.getWorldPosition();
                return pos;
            }
        }
        return null;
    }

    private on_click_reward_item(rewardID: number) {
        if (this._clickFunc) {
            this._clickFunc(rewardID);
        }
    }
}


