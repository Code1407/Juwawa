import { TableZhuanPan } from "db://assets/script/table/TableZhuanPan";
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";
import { _decorator, Component, find } from 'cc';
import { UIRewardItem } from "./UIRewardItem";
import GameModelMgr from "../../mvc/GameModelMgr";
import WheelsEffect from "./WheelsEffect";
import { EGameState } from "../WheelGlobal";
import { SpriteFrame } from "cc";
import { oops } from "db://oops-framework/core/Oops";
import { GameEvent } from "../../common/GameEvent";
const { ccclass } = _decorator;

@ccclass('WheelCtrl')
export class WheelCtrl extends Component {
    static Instance: WheelCtrl = null;

    effWheels: WheelsEffect = null;
    runIndex: number = 0;

    private rewardItems: Array<UIRewardItem> = [];

    onLoad(): void {
        WheelCtrl.Instance = this;
        oops.message.on(GameEvent.MSG_SCENE_CHANGE, this.on_scene_change, this);
    }

    onDestroy(): void {
        oops.message.off(GameEvent.MSG_SCENE_CHANGE, this.on_scene_change, this);
    }

    init(func: Function) {
        var table = JsonUtil.get(TableZhuanPan.TableName);
        if (table == null) {
            return;
        }

        for (let i = 1; i < 9; ++i) {
            let key = i + "";
            let cfg: TableZhuanPan = table[key];
            let rewardId = cfg.Rewards;
            let path = "Wheel" + rewardId;

            let item = find(path, this.node);
            if (item != null) {
                let wheelItem = item.getComponent(UIRewardItem);
                wheelItem.init(cfg, func);
                this.rewardItems.push(wheelItem);
            }
        }

        this.effWheels = new WheelsEffect(this.rewardItems);
        this.effWheels.init();
        this.refresh_scene_info();
    }

    refresh_scene_info() {
        let sceneIndex = GameModelMgr.footballLeagueModel.get_scene_index();
        this.rewardItems.forEach(item => {
            item.setTeamInfo(sceneIndex);
        });
        this.show_bet_hot_rewards(GameModelMgr.footballLeagueModel.get_hot_rewards());
    }

    clear() {
        this.clear_bet_hot_rewards();
        this.effWheels.clearRunAni();
    }

    change_game_status(gameState: EGameState) {
        switch (gameState) {
            case EGameState.Bet:
                this.effWheels.enterBet();
                break;
            case EGameState.Run:
                this.effWheels.enterRun();
                break;
        }
    }

    update_item_bet_info() {
        this.rewardItems.forEach(item => {
            let rewardId = item.get_reward_id();
            let betNum = GameModelMgr.footballLeagueModel.get_all_bet_value(rewardId);
            let hasSelfBet = GameModelMgr.footballLeagueModel.get_bet_value(rewardId) > 0;
            item.update_bet_info(betNum, hasSelfBet);
        });
    }

    update_item_icon_coins(coinsSp: SpriteFrame) {
        this.rewardItems.forEach(item => {
            item.show_conis_icon(coinsSp);
        });
    }

    clear_item_bet_info() {
        this.rewardItems.forEach(item => {
            item.clear_bet_info();
        });
    }

    enter_bet(betSecond: number) {
        this.effWheels.betEffect(betSecond);
    }

    enter_run(runSecond: number) {
        this.runIndex = this.effWheels.runEffect(runSecond);
    }

    enter_run2_final(resultIndex: number): boolean {
        if (this.runIndex == resultIndex) {
            this.effWheels.finalEffect(this.runIndex);
            return true;
        }
        this.runIndex = this.effWheels.runEffect(0);
        return false;
    }

    clear_bet_hot_rewards() {
        for (let i = 0; i < this.rewardItems.length; i++) {
            this.rewardItems[i].clear_hot();
        }
    }

    get_item_by_rewardId(rewardId: number) {
        for (let i = 0; i < this.rewardItems.length; i++) {
            if (rewardId == this.rewardItems[i].get_reward_id()) {
                return this.rewardItems[i];
            }
        }
        return null;
    }

    show_bet_hot_rewards(hotRewards) {
        this.clear_bet_hot_rewards();
        if (!hotRewards || hotRewards.length <= 0) {
            return;
        }
        for (let i = 0; i < hotRewards.length; i++) {
            let hotReward = hotRewards[i];
            let rewardId = this.get_hot_reward_id(hotReward);
            let betValue = this.get_hot_bet_value(hotReward);
            let item = this.get_item_by_rewardId(rewardId);
            if (item) {
                item.show_hot(betValue);
            }
        }
    }

    private get_hot_reward_id(hotReward: any): number {
        if (typeof hotReward == "number") {
            return hotReward;
        }
        return Number(hotReward && (hotReward.rewardID || hotReward.rewardId || hotReward.betId)) || 0;
    }

    private get_hot_bet_value(hotReward: any): number {
        if (!hotReward || typeof hotReward == "number") {
            return 0;
        }
        return Number(hotReward.betValue || hotReward.betNum || hotReward.value) || 0;
    }

    get_reward_item_world_pos(rewardId: number) {
        for (let index = 0; index < this.rewardItems.length; index++) {
            if (rewardId == this.rewardItems[index].get_reward_id()) {
                let pos = this.rewardItems[index].node.getWorldPosition();
                return pos;
            }
        }
        return null;
    }

    private on_scene_change() {
        this.refresh_scene_info();
    }
}


