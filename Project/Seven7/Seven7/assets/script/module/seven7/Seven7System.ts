import { oops } from "db://oops-framework/core/Oops";
import IMvc from "../mvc/IMvc";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { GameEvent } from "../common/GameEvent";
import { NetEvent } from "../common/NetEvent";
import { GameGlobal } from "../common/GameGlobal";

export default class Seven7System extends IMvc {

    init(): void {
        oops.network.listenMsg(NetEvent.NET_SC_PLAYER_ENTER_GAME_PUSH, this.sc_player_enter_game_push);

        oops.network.listenMsg(NetEvent.NET_CS_CUR_GAME_INFO_RESP, this.cs_cur_game_info_resp);

        oops.network.listenMsg(NetEvent.NET_SC_GAME_PREPARE_PUSH, this.sc_game_prepare_push);

        oops.network.listenMsg(NetEvent.NET_CS_BET_RESP, this.cs_bet_resp);
        oops.network.listenMsg(NetEvent.NET_SC_UPDATE_WORLD_BET_PUSH, this.sc_update_world_bet_push);

        oops.network.listenMsg(NetEvent.NET_SC_PLAYER_ROUND_RESULT_PUSH, this.sc_rank_info_push);
        oops.network.listenMsg(NetEvent.NET_SC_OPEN_REWARD_PUSH, this.sc_open_reward_push);

        oops.network.listenMsg(NetEvent.NET_CS_GAME_HISTORY_RESP, this.cs_game_history_resp);
        oops.network.listenMsg(NetEvent.NET_CS_SELF_BET_HISTORY_RESP, this.cs_self_bet_history_resp);
    }

    //登录玩家数据
    private sc_player_enter_game_push(msg: ScPlayerEnterGamePush) {
        if (!msg || !msg.pBaseData) {
            console.error("ScPlayerEnterGamePush is nil");
            return;
        }
        GameProxyMgr.playerProxy.update_player_base_data(msg.pBaseData);
        GameGlobal.SoundOpen = msg.openAudio;
        GameGlobal.ChipIndex = msg.chipIndex && Number(msg.chipIndex) || 1;
        oops.message.dispatchEvent(GameEvent.MSG_PLAYER_ENTER_GAME_PUSH);
    }

    //请求当前这局游戏信息
    cs_cur_game_info_req(): void {
        oops.network.pushMsg(NetEvent.NET_CS_CUR_GAME_INFO_REQ, {});
    }
    private cs_cur_game_info_resp(msg: CsCurGameInfoResp): void {
        GameProxyMgr.seven7Proxy.cs_cur_game_info_resp(msg);
        oops.message.dispatchEvent(GameEvent.MSG_CUR_GAME_INFO, msg);
    }


    //游戏准备推送
    sc_game_prepare_push(msg: ScGamePreparePush): void {
        if (!msg) {
            console.error("ScGamePreparePush is nil");
            return;
        }
        GameProxyMgr.seven7Proxy.sc_game_prepare_push(msg);
        oops.message.dispatchEvent(GameEvent.MSG_GAME_PREPARE_PUSH, msg);
    }


    //请求下注
    cs_bet_req(data: CsBetReq): void {
        oops.network.pushMsg(NetEvent.NET_CS_BET_REQ, data);
    }
    private cs_bet_resp(msg: CsBetResp): void {
        if (msg == null) {
            console.error("cs_bet_resp is null");
            return;
        }

        if(msg.errorCode && msg.errorCode != 0){
            oops.gui.showErrorCode(msg.errorCode);
            GameProxyMgr.playerProxy.update_player_coins(msg.money || 0);
            return;
        }

        GameProxyMgr.seven7Proxy.s2cUpdateCurBetInfo(msg);
        GameProxyMgr.playerProxy.update_player_coins(msg.money || 0);
        oops.message.dispatchEvent(GameEvent.MSG_UPDATE_SELF_BET);
    }

    //同步全局下注信息
    private sc_update_world_bet_push(msg: ScUpdateWorldBetPush): void {
        if (msg == null) {
            console.error("sc_update_world_bet_push is nil");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_UPDATE_WORLD_BET, msg);
    }

    //排名信息
    private sc_rank_info_push(msg: ScPlayerRoundResultPush): void {
        if (!msg) {
            return;
        }

        // if(msg.errorCode && msg.errorCode != 0){
        //     oops.gui.showErrorCode(msg.errorCode);
        // }

        GameProxyMgr.seven7Proxy.update_player_round_result(msg);
        //sdk同步积分接口已经同步积分
        //let coin = GameProxyMgr.playerProxy.get_player_coins() + (msg.playerWin || 0);
        //GameProxyMgr.playerProxy.update_player_coins(coin);
    }

    //服务器开奖通知
    private sc_open_reward_push(msg: ScOpenRewardPush) {
        if (!msg) {
            return;
        }
        GameProxyMgr.seven7Proxy.s2cOpenReward(msg);
        oops.message.dispatchEvent(GameEvent.MSG_OPEN_REWARD, msg);
    }

    //请求开奖历史记录
    cs_game_history_req(): void {
        oops.network.pushMsg(NetEvent.NET_CS_GAME_HISTORY_REQ, {});
    }
    private cs_game_history_resp(msg: CsGameHistoryResp) {
        if (msg == null) {
            console.error("服务器开奖记录为Null");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_SHOW_GAME_HISTORY, msg);
    }

    //请求我的下注记录
    cs_self_bet_history_req(): void {
        oops.network.pushMsg(NetEvent.NET_CS_SELF_BET_HISTORY_REQ, {});
    }
    private cs_self_bet_history_resp(msg: CsSelfBetHistoryResp) {
        if (msg == null) {
            console.error("CsSelfBetHistoryResp is Null");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_SHOW_SELF_BET_HISTORY, msg);
    }


    cs_audio_change_req(openAudio: boolean): void {
        let msg: CsAudioChangeReq = {
            openAudio: openAudio
        };
        oops.network.pushMsg(NetEvent.NET_CS_AUDIO_CHANGE_REQ, msg);
    }

    cs_chip_change_req(chipIndex: number): void {
        let msg: CsChipChangeReq = {
            chipIndex: chipIndex
        };
        oops.network.pushMsg(NetEvent.NET_CS_CHIP_CHANGE_REQ, msg);
    }
}


