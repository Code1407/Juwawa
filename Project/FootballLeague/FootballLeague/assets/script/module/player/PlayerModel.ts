import IMvc from "../mvc/IMvc";
import GameProxyMgr from '../mvc/GameProxyMgr';
import { _decorator } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
const { ccclass, property } = _decorator;

@ccclass('PlayerModel')
export default class PlayerModel extends IMvc {

    get_player_base_data() {
        return GameProxyMgr.playerProxy.get_palyer_base_data();
    }

    get_player_name(): string {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return pBaseData.name;
    }

    get_player_avatar_url(): string {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return pBaseData.avatarUrl;
    }

    get_player_id(): number {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return pBaseData.playerId;
    }

    get_player_coins(): number {
        return GameProxyMgr.playerProxy.get_player_coins();
    }

    set_player_coins(add: number): void {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        pBaseData.coins += add;
        if (pBaseData.coins < 0) {
            pBaseData.coins = 0;
            console.error("Player Coins < 0 !!!");
        }
    }

    check_login_game_suc(): boolean {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return pBaseData != null;
    }

    check_is_self_by_pid(playerId: number): boolean {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return playerId > 0 && pBaseData.playerId == playerId;
    }

    check_is_self_by_uid(playerUid: string): boolean {
        let pBaseData = GameProxyMgr.playerProxy.get_palyer_base_data();
        return pBaseData.playerUid == playerUid;
    }

    check_sdk_valid(): boolean {
        return GameProxyMgr.playerProxy.check_sdk_valid();
    }

    check_coins_enough(showTip: boolean, cost: number): boolean {
        if (this.get_player_coins() < cost) {
            if (showTip) {
                oops.gui.toast("common_score_not_enough", true)
            }
            return false;
        }
        return true;
    }
}