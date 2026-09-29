import { _decorator } from 'cc';
import IMvc from "../mvc/IMvc";
import GameSystemMgr from "../mvc/GameSystemMgr";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { oops } from 'db://oops-framework/core/Oops';
import { GameEvent } from '../common/GameEvent';
import { GameGlobal } from '../common/GameGlobal';

const { ccclass, property } = _decorator;

@ccclass('FootballLeagueModel')
export default class FootballLeagueModel extends IMvc {
    //#region 网络

    //请求当前这局游戏信息
    cs_cur_game_info_req(): void {
        GameSystemMgr.footballLeagueSystem.cs_cur_game_info_req();
    }

    //下注更新
    cs_bet_req(chipInfo: CsBetReq) {
        GameSystemMgr.footballLeagueSystem.cs_bet_req(chipInfo);
    }

    //转盘开奖历史记录
    cs_game_history_req(): void {
        GameSystemMgr.footballLeagueSystem.cs_game_history_req();
    }

    //我的下注记录
    cs_self_bet_history_req(): void {
        GameSystemMgr.footballLeagueSystem.cs_self_bet_history_req();
    }

    //今日收益排行榜
    cs_rank_req(): void {
        GameSystemMgr.footballLeagueSystem.cs_rank_req();
    }

    cs_audio_change_req(openAudio): void {
        GameSystemMgr.footballLeagueSystem.cs_audio_change_req(openAudio);
    }

    cs_chip_change_req(chipIndex): void {
        GameSystemMgr.footballLeagueSystem.cs_chip_change_req(chipIndex);
    }

    cs_team_change_req(teamId: number): void {
        GameSystemMgr.footballLeagueSystem.cs_team_change_req(teamId);
    }

    //#endregion
    set_scene_type(sceneType: number): void {
        if (GameProxyMgr.footballLeagueProxy.set_scene_type(sceneType)) {
            oops.message.dispatchEvent(GameEvent.MSG_SCENE_CHANGE, sceneType);
            oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_UPDATE, {
                value: GameProxyMgr.footballLeagueProxy.get_jackpot_value(),
                serverTime: oops.network.ServerTime
            });
        }
    }

    get_scene_type(): number {
        return GameProxyMgr.footballLeagueProxy.get_scene_type();
    }

    get_scene_index(): number {
        return GameProxyMgr.footballLeagueProxy.get_scene_index();
    }

    get_team_id(): number {
        return GameGlobal.getTeamId();
    }

    set_team_id(teamId: number): number {
        let nextTeamId = GameGlobal.setTeamId(teamId);
        this.set_scene_type(nextTeamId);
        return nextTeamId;
    }

    get_scene_chip_value(baseValue: number): number {
        return GameProxyMgr.footballLeagueProxy.get_scene_chip_value(baseValue);
    }

    is_master_scene(): boolean {
        return GameProxyMgr.footballLeagueProxy.is_master_scene();
    }

    get_game_state(): number {
        return GameProxyMgr.footballLeagueProxy.get_game_state();
    }

    set_game_state(gameState: number) {
        GameProxyMgr.footballLeagueProxy.set_game_state(gameState);
    }

    get_cur_prepareTime_Time(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_prepareTime_Time();
    }

    getTodayRevenue(): number {
        return GameProxyMgr.footballLeagueProxy.get_today_revenue();
    }

    get_cur_round(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_round();
    }

    getCurRewardID(): number[] {
        return GameProxyMgr.footballLeagueProxy.get_rewards();
    }

    getCurBetNum(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_bet_total();
    }

    getSelfBetTotalAllScene(): number {
        return GameProxyMgr.footballLeagueProxy.get_self_bet_total_all_scene();
    }

    getSelfBetClientTotalAllScene(): number {
        return GameProxyMgr.footballLeagueProxy.get_self_bet_client_total_all_scene();
    }

    get_cur_bet_client_total(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_bet_client_total();
    }

    get_cur_all_bet_total(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_all_bet_total();
    }

    getAllBetTotalAllScene(): number {
        return GameProxyMgr.footballLeagueProxy.get_all_bet_total_all_scene();
    }

    get_hot_team_id(sceneType?: number): number {
        return GameProxyMgr.footballLeagueProxy.get_hot_team_id(sceneType);
    }

    get_today_rank3_info() {
        return GameProxyMgr.footballLeagueProxy.get_today_rank3_info();
    }

    get_round_rank3_info() {
        return GameProxyMgr.footballLeagueProxy.get_round_rank3_info();
    }

    getCurWinNum(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_win();
    }

    get_bet_value(rewardID: number) {
        return GameProxyMgr.footballLeagueProxy.get_bet_value(rewardID);
    }

    get_all_bet_value(rewardID: number): number {
        return GameProxyMgr.footballLeagueProxy.get_all_bet_value(rewardID);
    }

    get_reward_multiple(zhuanPanId: number): number {
        return GameProxyMgr.footballLeagueProxy.get_reward_multiple(zhuanPanId);
    }

    get_result_errorcode(){
        return GameProxyMgr.footballLeagueProxy.get_result_errorcode();
    }

    get_zhuanpan_id(): number {
        return GameProxyMgr.footballLeagueProxy.get_zhuanpan_id();
    }

    get_hot_rewards(msg: ScHotBetRewardPush | CsCurGameInfoResp = null): any[] {
        return GameProxyMgr.footballLeagueProxy.get_hot_rewards(msg);
    }

    get_jackpot_value(): number {
        return GameProxyMgr.footballLeagueProxy.get_jackpot_value();
    }

    get_jackpot_win_amount(): number {
        return GameProxyMgr.footballLeagueProxy.get_jackpot_win_amount();
    }

    get_game_result_zhuanpan_id(data: GameResultData | HistoryData | ScOpenRewardPush): number {
        return GameProxyMgr.footballLeagueProxy.get_game_result_zhuanpan_id(data);
    }

    get_repeat_info() {
        return GameProxyMgr.footballLeagueProxy.get_repeat_bet_info();
    }

    get_repeat_bet_requests_all_scene(): CsBetReq[] {
        return GameProxyMgr.footballLeagueProxy.get_repeat_bet_requests_all_scene();
    }

    get_repeat_total(): number {
        let repeat = GameProxyMgr.footballLeagueProxy.get_repeat_bet_info();
        let betNum = 0;
        for (const [rewardID, betInfo] of repeat) {
            for (const [chipValue, chipCount] of betInfo) {
                betNum = betNum + chipValue * chipCount;
            }
        }
        return betNum;
    }

    get_repeat_total_all_scene(): number {
        return GameProxyMgr.footballLeagueProxy.get_repeat_total_all_scene();
    }

    get_cur_bet_type_count(): number {
        return GameProxyMgr.footballLeagueProxy.get_cur_bet_type_count();
    }

    get_cur_bet_map() {
        return GameProxyMgr.footballLeagueProxy.get_cur_bet_map();
    }

    get_cur_bet_map_client() {
        return GameProxyMgr.footballLeagueProxy.get_cur_bet_map_client();
    }

    set_cur_bet_map_client(rewardId, betValue) {
        GameProxyMgr.footballLeagueProxy.set_cur_bet_map_client(rewardId, betValue);
    }

    set_scene_bet_map_client(sceneType: number, rewardId, betValue) {
        GameProxyMgr.footballLeagueProxy.set_scene_bet_map_client(sceneType, rewardId, betValue);
    }

    check_can_open_auto(): boolean {
        return GameProxyMgr.footballLeagueProxy.has_auto_bet_source_all_scene();
    }
}


