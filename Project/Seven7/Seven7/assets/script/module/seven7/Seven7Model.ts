import IMvc from "../mvc/IMvc";
import { _decorator } from 'cc';
import GameSystemMgr from "../mvc/GameSystemMgr";
import GameProxyMgr from "../mvc/GameProxyMgr";
import { GameGlobal } from "../common/GameGlobal";
import { AudioPath } from "./Seven7Global";

const { ccclass, property } = _decorator;

@ccclass('Seven7Model')
export default class Seven7Model extends IMvc {
    //#region 网络

    //请求当前这局游戏信息
    cs_cur_game_info_req(clearData: boolean = true): void {
        if (clearData) {
            this.clearData();
        }
        GameSystemMgr.seven7System.cs_cur_game_info_req();
    }

    //下注更新
    cs_bet_req(chipInfo: CsBetReq) {
        GameGlobal.playAudio(AudioPath.Bet);
        GameSystemMgr.seven7System.cs_bet_req(chipInfo);
    }

    //转盘开奖历史记录
    cs_game_history_req(): void {
        GameSystemMgr.seven7System.cs_game_history_req();
    }


    //我的下注记录
    cs_self_bet_history_req(): void {
        GameSystemMgr.seven7System.cs_self_bet_history_req();
    }

    cs_audio_change_req(openAudio): void {
        GameSystemMgr.seven7System.cs_audio_change_req(openAudio);
    }

    cs_chip_change_req(chipIndex): void {
        GameSystemMgr.seven7System.cs_chip_change_req(chipIndex);
    }
    //#endregion

    get_cur_prepareTime_Time(): number {
        return GameProxyMgr.seven7Proxy.get_cur_prepareTime_Time();
    }

    get_cur_round(): number {
        return GameProxyMgr.seven7Proxy.get_cur_round();
    }

    getCurRewardID(): number {
        return GameProxyMgr.seven7Proxy.getCurRewardID();
    }

    get_jp_rewards() {
        return GameProxyMgr.seven7Proxy.get_jp_rewards();
    }

    getZhuanpanRewardIndex(): number {
        return GameProxyMgr.seven7Proxy.getRewardZhuanPanIndex();
    }

    getCurResultRound(): number {
        return GameProxyMgr.seven7Proxy.getCurResultRound();
    }

    getCurBetNumByRewardID(rewardID: number) {
        return GameProxyMgr.seven7Proxy.getCurBetNumByRewardID(rewardID);
    }

    get_self_win(): number {
        return GameProxyMgr.seven7Proxy.get_self_win();
    }

    get_self_bet(): number {
        return GameProxyMgr.seven7Proxy.get_self_bet();
    }

    get_result_errorcode(){
        return GameProxyMgr.seven7Proxy.get_result_errorcode();
    }

    get_rank3_info(): RankData[] {
        return GameProxyMgr.seven7Proxy.get_rank3_info();
    }

    getRepeatBetInfo() {
        return GameProxyMgr.seven7Proxy.getRepeatBetInfo();
    }

    getRepeatBetNum(): number {
        let repeatMap = GameProxyMgr.seven7Proxy.getRepeatBetInfo();
        let betNum = 0;
        for (const [rewardID, betInfo] of repeatMap) {
            for (const [chipValue, chipCount] of betInfo) {
                betNum = betNum + chipValue * chipCount;
            }
        }
        return betNum;
    }

    checkRewardIs77() {
        let id = this.getCurRewardID();
        return id == 2;
    }

    clearData(): void {
        GameProxyMgr.seven7Proxy.clear()
    }
}


