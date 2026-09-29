import { oops } from "db://oops-framework/core/Oops";
import IMvc from "../mvc/IMvc";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { GameEvent } from "../common/GameEvent";
import { GameGlobal } from "../common/GameGlobal";
import { NetEvent } from "../common/NetEvent";
import { ETradeCode } from "../../framework/commom/FrameDefine";
import { EGameScene } from "./WheelGlobal";

export default class FootballLeagueSystem extends IMvc {

    init(): void {
        oops.network.listenMsg("ScPlayerEnterGamePush", this.sc_player_enter_game_push);
        oops.network.listenMsg("CsCurGameInfoResp", this.cs_cur_game_info_resp);

        oops.network.listenMsg("ScGamePreparePush", this.sc_game_prepare_push);

        oops.network.listenMsg("CsBetResp", this.cs_bet_resp);

        oops.network.listenMsg("ScRankInfoPush", this.sc_rank_info_push);
        oops.network.listenMsg("ScOpenRewardPush", this.sc_open_reward_push);
        oops.network.listenMsg("ScJackpotHintPush", this.sc_jackpot_hint_push);

        oops.network.listenMsg("CsGameHistoryResp", this.cs_game_history_resp);
        oops.network.listenMsg("CsSelfBetHistoryResp", this.cs_self_bet_history_resp);

        oops.network.listenMsg("CsRevenueRankResp", this.cs_rank_resp);

        oops.network.listenMsg("CsRevenueRankResp", this.cs_rank_resp);
        oops.network.listenMsg(NetEvent.NET_SC_BET_REWARD_PUSH, this.sc_hot_bet_reward_push);
    }

    //登录玩家数据
    private sc_player_enter_game_push(msg: ScPlayerEnterGamePush) {
        if (!msg || !msg.pBaseData) {
            console.error("ScPlayerEnterGamePush is Null");
            return;
        }
        GameProxyMgr.playerProxy.update_player_base_data(msg.pBaseData);
        GameGlobal.SoundOpen = msg.openAudio;
        GameGlobal.ChipIndex = msg.chipIndex && Number(msg.chipIndex) || 1;
        GameGlobal.setTeamId(msg.team_id);
        GameProxyMgr.footballLeagueProxy.set_scene_type(GameGlobal.getTeamId());
        oops.message.dispatchEvent(GameEvent.MSG_PLAYER_ENTER_GAME_PUSH);
    }

    //请求当前这局游戏信息
    cs_cur_game_info_req(): void {
        oops.network.pushMsg("CsCurGameInfoReq", { team_id: GameGlobal.getTeamId() });
    }
    private cs_cur_game_info_resp(msg: CsCurGameInfoResp): void {
        if (!msg) {
            console.error("CsCurGameInfoResp is null");
            return;
        }
        if (msg.team_id) {
            GameGlobal.setTeamId(msg.team_id);
            GameProxyMgr.footballLeagueProxy.set_scene_type(GameGlobal.getTeamId());
        }
        GameProxyMgr.footballLeagueProxy.cs_cur_game_info_resp(msg);
        oops.message.dispatchEvent(GameEvent.MSG_CUR_GAME_INFO, msg);
        oops.message.dispatchEvent(GameEvent.MSG_TODAY_REVENUE_UPDATE, GameProxyMgr.footballLeagueProxy.get_today_revenue());
        oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_UPDATE, {
            value: GameProxyMgr.footballLeagueProxy.get_jackpot_value(),
            // 必须使用服务端随消息下发的同一时刻，不能使用各端收到消息时的当前时间。
            serverTime: msg.serverTime || oops.network.ServerTime,
            // 重新进入 Master 时，即使奖池目标值未变化，也要重新按分段时间安排滚动。
            force: Number(msg.team_id) === EGameScene.Master
        });
    }

    //游戏准备推送
    sc_game_prepare_push(msg: ScGamePreparePush): void {
        if (!msg) {
            console.error("ScGamePreparePush is nil");
            return;
        }
        GameProxyMgr.footballLeagueProxy.sc_game_prepare_push(msg);
        oops.message.dispatchEvent(GameEvent.MSG_GAME_PREPARE_PUSH, msg);
    }

    //请求下注
    cs_bet_req(chipInfo: CsBetReq): void {
        chipInfo.team_id = chipInfo.team_id || chipInfo.sceneType || GameGlobal.getTeamId();
        chipInfo.sceneType = chipInfo.sceneType || chipInfo.team_id || GameGlobal.getTeamId();
        oops.network.pushMsg("CsBetReq", chipInfo);
    }
    private cs_bet_resp(msg: CsBetResp): void {
        if (msg == null) {
            console.error("CsBetResp is null");
            return;
        }

        GameProxyMgr.playerProxy.update_player_coins(msg.money);

        if(msg.errorCode && msg.errorCode != 0){
            if(msg.errorCode == ETradeCode.BetTypeCountError){ //下注奖励类型超出
                oops.message.dispatchEvent(GameEvent.MSG_BET_TYPE_COUNT_OVER);
            }else if(msg.errorCode == ETradeCode.UserStatusError){ //用户状态异常
                oops.gui.showAccounErrortUI();
            }else if(msg.errorCode == ETradeCode.Insufficient){//余额不足
                oops.gui.showRechargeUI();
            }else{
                oops.gui.toast("common_bet_error", true)
            }
            return;
        }

        GameProxyMgr.footballLeagueProxy.sc_update_self_bet_info(msg);
        oops.message.dispatchEvent(GameEvent.MSG_UPDATE_SELF_BET);
    }

    //排名信息
    private sc_rank_info_push(data: ScRankInfoPush): void {
        if (data == null) {
            console.error("排名信息错误");
            return;
        }
        GameProxyMgr.playerProxy.update_player_coins(data.money);
        GameProxyMgr.footballLeagueProxy.s2cRankInfo(data);
        oops.message.dispatchEvent(GameEvent.MSG_TODAY_REVENUE_UPDATE, GameProxyMgr.footballLeagueProxy.get_today_revenue());
        oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_DATA_CHANGED);
        const jackpotWinAmount = GameProxyMgr.footballLeagueProxy.get_jackpot_win_amount(data);
        if (jackpotWinAmount > 0) {
            oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_WIN, jackpotWinAmount);
        }
    }

    //服务器开奖通知
    private sc_open_reward_push(msg: ScOpenRewardPush) {
        if (!msg) {
            console.error("ScOpenRewardPush is null");
            return;
        }
        GameProxyMgr.footballLeagueProxy.s2cOpenReward(msg);
        oops.message.dispatchEvent(GameEvent.MSG_OPEN_REWARD, msg);
        oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_DATA_CHANGED);
    }

    // 全服展示通知不参与本地结算；本地 JP 弹窗仍严格由 ScRankInfoPush 驱动。
    private sc_jackpot_hint_push(msg: ScJackpotHintPush) {
        const amount = Math.max(0, Math.floor(Number(msg && msg.amount) || 0));
        if (amount <= 0) {
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_HINT, {
            userName: String(msg && msg.userName || ""),
            amount: amount,
        });
    }

    //请求开奖历史记录
    cs_game_history_req(): void {
        oops.network.pushMsg("CsGameHistoryReq", { team_id: GameGlobal.getTeamId() });
    }
    private cs_game_history_resp(msg: CsGameHistoryResp) {
        if (!msg) {
            console.error("CsGameHistoryResp is null");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_SHOW_GAME_HISTORY, msg);
    }

    //请求我的下注记录
    cs_self_bet_history_req(): void {
        oops.network.pushMsg("CsSelfBetHistoryReq", { team_id: GameGlobal.getTeamId() });
    }
    private cs_self_bet_history_resp(msg: CsSelfBetHistoryResp) {
        if (!msg) {
            console.error("CsSelfBetHistoryResp is null");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_SHOW_SELF_BET_HISTORY, msg);
    }

    //请求今日收益排行榜
    cs_rank_req(): void {
        oops.network.pushMsg("CsRevenueRankReq", {});
    }
    private cs_rank_resp(msg: CsRevenueRankResp) {
        if (!msg) {
            console.error("CsRevenueRankResp is null");
            return;
        }
        oops.message.dispatchEvent(GameEvent.MSG_SHOW_RANK, msg);
    }

    sc_hot_bet_reward_push(msg: ScHotBetRewardPush) {
        if (!msg) {
            return;
        }
        GameProxyMgr.footballLeagueProxy.s2cHotRewardInfo(msg);
        oops.message.dispatchEvent(GameEvent.MSG_UPDATE_HOT_REWARDS, msg);
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

    cs_team_change_req(teamId: number): void {
        let msg: CsTeamChangeReq = {
            team_id: GameGlobal.setTeamId(teamId)
        };
        oops.network.pushMsg(NetEvent.NET_CS_TEAM_CHANGE_REQ, msg);
        // 场次切换仅保存服务端玩家状态，不会主动下发当前奖池；紧随其后拉取快照。
        // 同一连接内消息按发送顺序处理，快照会读取刚切换后的场次。
        if (msg.team_id === EGameScene.Master) {
            this.cs_cur_game_info_req();
        }
    }
}
