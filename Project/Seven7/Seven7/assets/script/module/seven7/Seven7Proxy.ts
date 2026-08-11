
import IMvc from "../mvc/IMvc";

export default class Seven7Proxy extends IMvc {
    private round: number = 0;          //当前期数
    private prepareTime: number = 0;    //准备时间

    private selfBetResult: ScPlayerRoundResultPush = null;    //自己下注游戏结果
    private curResultInfo: ScOpenRewardPush = null;  //结果信息

    private curbetMap: Map<number, number> = new Map();

    private repeatMapPeriods: number = 0;
    private repeatMapInfo: Map<number, Map<number, number>> = new Map();//Map<rewardID, Map<chipID, count>>
    private repeatMapRecordCur: Map<number, Map<number, number>> = new Map();//Map<rewardID, Map<chipID, count>>

    init(): void {

    }

    clear(): void {
        this.curResultInfo = null;
        this.selfBetResult = null;
        this.curbetMap.clear();
    }

    cs_cur_game_info_resp(msg: CsCurGameInfoResp) {
        this.clear();
        this.round = msg.round;
        this.prepareTime = msg.prepareTime;

        if (msg.betSelf) {
            for (const key in msg.betSelf) {
                let rewardID = Number(key);
                let betNum = msg.betSelf[key];
                if (rewardID > 0 && betNum > 0) {
                    this.curbetMap.set(rewardID, betNum);
                }
            }
        }
    }

    sc_game_prepare_push(msg: ScGamePreparePush): void {
        this.clear();
        this.round = msg.round;
        this.prepareTime = msg.prepareTime;

        if (this.repeatMapRecordCur != null && this.repeatMapRecordCur.size > 0) {
            this.repeatMapInfo.clear();
            for (const [rewardID, betInfo] of this.repeatMapRecordCur) {
                if (!this.repeatMapInfo.has(rewardID)) {
                    let map = new Map();
                    this.repeatMapInfo.set(rewardID, map);
                }
                for (const [chipID, chipCount] of betInfo) {
                    let map = this.repeatMapInfo.get(rewardID);
                    map.set(chipID, chipCount);
                }
            }
            this.repeatMapRecordCur.clear();
        }
    }

    s2cUpdateCurBetInfo(data: CsBetResp): void {
        if (data.betList === null || data.betList.length <= 0) {
            return;
        }

        for (let i = 0; i < data.betList.length; i++) {
            let betInfo = data.betList[i];
            let rewardID = betInfo.rewardID;
            let chipValue = betInfo.chipValue;
            let chipCount = betInfo.chipCount;
            let hadBetNum = 0;
            if (this.curbetMap.has(rewardID)) {
                hadBetNum = this.curbetMap.get(rewardID);
            }
            this.curbetMap.set(rewardID, hadBetNum + chipValue * chipCount);

            //保存下注信息
            if (this.repeatMapPeriods != this.round) {
                this.repeatMapRecordCur.clear();
                this.repeatMapPeriods = this.round;
            }

            if (this.repeatMapRecordCur.has(rewardID)) {
                let map = this.repeatMapRecordCur.get(rewardID);
                let hadchipCount = 0;
                if (map.has(chipValue)) {
                    hadchipCount = map.get(chipValue);
                }
                map.set(chipValue, chipCount + hadchipCount);
            }
            else {
                let map = new Map();
                map.set(chipValue, chipCount);
                this.repeatMapRecordCur.set(rewardID, map);
            }
        }
    }

    update_player_round_result(data: ScPlayerRoundResultPush): void {
        this.selfBetResult = data;
    }

    s2cOpenReward(data: ScOpenRewardPush): void {
        this.curResultInfo = data;
    }


    /****************get*******************/

    get_cur_prepareTime_Time(): number {
        return this.prepareTime || 0;
    }

    get_cur_round(): number {
        return this.round;
    }

    getCurRewardID() {
        return this.curResultInfo && this.curResultInfo.rewardID || 0;
    }

    get_jp_rewards() {
        return this.curResultInfo && this.curResultInfo.jpRewards || [];
    }

    getRewardZhuanPanIndex() {
        return this.curResultInfo && this.curResultInfo.zhuanPanIndex || -1;
    }

    getCurResultRound() {
        return this.curResultInfo && this.curResultInfo.round || 0;
    }

    getCurBetNumByRewardID(rewardID: number) {
        if (this.curbetMap.has(rewardID)) {
            return this.curbetMap.get(rewardID);
        }
        return 0;
    }

    get_self_win(): number {
        return this.selfBetResult && this.selfBetResult.playerWin || 0;
    }

    get_self_bet(): number {
        let num = 0;
        for (let betNum of this.curbetMap.values()) {
            num = num + betNum;
        }
        return num;
    }

    get_result_errorcode(){
        return this.selfBetResult && this.selfBetResult.errorCode;
    }

    get_rank3_info(): RankData[] {
        return this.curResultInfo && this.curResultInfo.roundRank3 || [];
    }

    getRepeatBetInfo() {
        return this.repeatMapInfo;
    }
}


