import IMvc from "../mvc/IMvc";
import { oops } from "db://oops-framework/core/Oops";
import { ConstantCfgMgr, ConstantKey } from "../common/ConstantCfgMgr";
import { GameGlobal } from "../common/GameGlobal";
import { EGameScene, EGameState } from "./WheelGlobal";

export default class FootballLeagueProxy extends IMvc {
    private gameState: number = EGameState.Bet; // 状态
    private round: number = 0;     //当前期数
    private prepareTime: number = 0;    //准备时间
    private todayRevenue: number = 0;   //今日收益
    private sceneType: EGameScene = EGameScene.Normal;

    private toDayRank3: Array<RankData> = []; //今日前三名数据
    private roundRank3: Array<RankData> = []; //当局三名数据

    private curGameInfo: CsCurGameInfoResp = null;
    private curHotRewardInfo: ScHotBetRewardPush = null;
    /** 当前局是否已有服务端下发的全服卡牌下注数据。 */
    private hasAllBetInfo: boolean = false;
    private curRankInfo: ScRankInfoPush = null;    //排名信息
    private curResultInfo: ScOpenRewardPush = null;  //结果信息
    /** 最近一次由服务端下发的 JP 单池值；切换下注档位不能改变它。 */
    private jackpotValue: number = 0;

    private curbetMapByScene: Map<number, Map<number, number>> = new Map();
    private curbetMapClientByScene: Map<number, Map<number, number>> = new Map();
    private wheelMultipleByScene: Map<number, number[]> = new Map();

    private repeatRound: number = 0;
    private repeatMapByScene: Map<number, Map<number, Map<number, number>>> = new Map();//Map<sceneType, Map<rewardID, Map<chipValue, chipCount>>>
    private repeatMapTempByScene: Map<number, Map<number, Map<number, number>>> = new Map();//Map<sceneType, Map<rewardID, Map<chipValue, chipCount>>>

    init(): void { }

    cs_cur_game_info_resp(msg: CsCurGameInfoResp) {
        this.clear();

        this.curGameInfo = msg;
        this.hasAllBetInfo = true;
        this.update_scene_wheel_multiple(msg);
        this.gameState = msg.gameState;
        this.round = msg.round;
        this.prepareTime = msg.prepareTime;
        this.sceneType = this.normalize_scene_type((msg as any).team_id || this.sceneType);
        this.todayRevenue = this.get_scene_number(msg, "todayRevenue", msg.todayRevenue || 0, EGameScene.Master);

        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            let betSelf = this.get_scene_value(msg, "betSelf", msg.betSelf, scene);
            this.curbetMapByScene.set(scene, this.create_bet_map(betSelf));
        }
        this.client_bet_info_sync_server();

        this.toDayRank3 = this.get_scene_rank_data(msg, "toDayRank3", msg.toDayRank3 || []);
    }

    sc_game_prepare_push(msg: ScGamePreparePush): void {
        this.clear();
        this.hasAllBetInfo = false;
        this.gameState = EGameState.Bet;
        this.round = msg.round;
        this.prepareTime = msg.prepareTime;
        if (this.repeatMapTempByScene != null && this.repeatMapTempByScene.size > 0) {
            this.repeatMapByScene = this.clone_repeat_map_by_scene(this.repeatMapTempByScene);
            this.repeatMapTempByScene.clear();
        }
    }

    sc_update_self_bet_info(msg: CsBetResp): void {
        let sceneType = this.normalize_scene_type((msg as any).sceneType || this.sceneType);
        let curbetMap = this.get_scene_bet_map(sceneType);
        if (msg.betList === null || msg.betList.length <= 0) {
            this.client_bet_info_sync_server();
            return;
        }

        for (let i = 0; i < msg.betList.length; i++) {
            let betInfo = msg.betList[i];
            let rewardID = betInfo.rewardID;
            let chipValue = betInfo.chipValue;
            let chipCount = betInfo.chipCount;

            let hadBetNum = 0;
            if (curbetMap.has(rewardID)) {
                hadBetNum = curbetMap.get(rewardID);
            }
            curbetMap.set(rewardID, hadBetNum + chipValue * chipCount);

            if (this.repeatRound != this.round) {
                this.repeatRound = this.round;
            }

            this.add_repeat_bet_temp(sceneType, rewardID, chipValue, chipCount);
        }
        this.client_bet_info_sync_server();
    }

    s2cRankInfo(data: ScRankInfoPush): void {
        this.curRankInfo = data;
        this.update_scene_wheel_multiple(data);
        // todayRevenue 是服务端按玩家单播的个人当日收益，不能用共享奖池金额覆盖。
        this.todayRevenue = this.get_scene_number(data, "todayRevenue", this.todayRevenue);
    }

    s2cOpenReward(msg: ScOpenRewardPush): void {
        this.curResultInfo = msg;
        this.update_scene_wheel_multiple(msg);
        this.gameState = EGameState.Run;
        this.toDayRank3 = this.get_scene_rank_data(msg, "toDayRank3", msg.toDayRank3 || []);
        this.roundRank3 = this.get_scene_rank_data(msg, "roundRank3", msg.roundRank3 || []);
    }

    s2cHotRewardInfo(msg: ScHotBetRewardPush): void {
        this.curHotRewardInfo = msg;
        this.hasAllBetInfo = true;
        this.update_scene_wheel_multiple(msg);
    }

    /****************get*******************/

    set_scene_type(sceneType: number): boolean {
        let nextScene = this.normalize_scene_type(sceneType);
        if (this.sceneType == nextScene) {
            return false;
        }
        this.sceneType = nextScene;
        this.toDayRank3 = this.get_scene_rank_data(this.curResultInfo || this.curGameInfo, "toDayRank3", []);
        this.roundRank3 = this.get_scene_rank_data(this.curResultInfo, "roundRank3", []);
        return true;
    }

    get_scene_type(): EGameScene {
        return this.sceneType;
    }

    get_scene_index(): number {
        return this.sceneType - 1;
    }

    get_scene_chip_rate(sceneType: number = this.sceneType): number {
        const cfgMultiples = ConstantCfgMgr.getValue(ConstantKey.BetMultiple);
        const sceneIndex = this.normalize_scene_type(sceneType) - 1;
        const multiple = Array.isArray(cfgMultiples)
            ? cfgMultiples[sceneIndex]
            : typeof cfgMultiples === "string"
                ? cfgMultiples.split("|")[sceneIndex]
                : null;
        const rate = Number(multiple);
        return rate > 0 ? rate : 1;
    }

    get_scene_chip_value(baseValue: number, sceneType: number = this.sceneType): number {
        return baseValue * this.get_scene_chip_rate(sceneType);
    }

    is_master_scene(): boolean {
        return this.sceneType == EGameScene.Master;
    }

    get_game_state() {
        return this.gameState;
    }

    set_game_state(gameState: EGameState) {
        this.gameState = gameState;
    }

    get_cur_prepareTime_Time(): number {
        return this.prepareTime || 0;
    }

    get_cur_round(): number {
        return this.round;
    }

    get_today_revenue(): number {
        return this.todayRevenue;
    }

    get_today_rank3_info() {
        return this.get_scene_rank_data(this.curResultInfo || this.curGameInfo, "toDayRank3", this.toDayRank3);
    }

    get_round_rank3_info() {
        return this.get_scene_rank_data(this.curResultInfo, "roundRank3", this.roundRank3);
    }

    get_cur_bet_map() {
        return this.get_scene_bet_map(this.sceneType);
    }

    get_cur_bet_total() {
        let num = 0;
        for (let betNum of this.get_cur_bet_map().values()) {
            num = num + betNum;
        }
        return num;
    }

    get_self_bet_total_all_scene(): number {
        let num = 0;
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            num += this.sum_bet_map(this.get_scene_bet_map(scene));
        }
        return num;
    }

    get_self_bet_client_total_all_scene(): number {
        let num = 0;
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            num += this.sum_bet_map(this.get_scene_bet_map_client(scene));
        }
        return num;
    }

    get_cur_bet_client_total(): number {
        return this.sum_bet_map(this.get_cur_bet_map_client());
    }

    get_cur_all_bet_total(): number {
        let source = this.curRankInfo || this.curResultInfo || this.curHotRewardInfo || this.curGameInfo;
        return this.get_scene_number(source, "betTotal", 0);
    }

    get_all_bet_total_all_scene(): number {
        let source = this.curRankInfo || this.curResultInfo || this.curHotRewardInfo || this.curGameInfo;
        return this.get_all_scene_number(source, "betTotal");
    }

    get_hot_team_id(sceneType: number = this.sceneType): number {
        let source = this.curHotRewardInfo || this.curGameInfo || this.curRankInfo || this.curResultInfo;
        return Math.max(0, Math.floor(this.get_scene_number(source, "hotTeamId", 0, sceneType)));
    }

    get_cur_bet_type_count() {
        return this.get_cur_bet_map().size;
    }

    get_repeat_bet_info() {
        return this.get_repeat_bet_info_by_scene(this.sceneType);
    }

    get_repeat_bet_info_by_scene(sceneType: number) {
        return this.get_repeat_map(this.repeatMapByScene, sceneType);
    }

    get_repeat_bet_requests_all_scene(): CsBetReq[] {
        let requests: CsBetReq[] = [];
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            let betList: BetData[] = [];
            let repeatMap = this.get_repeat_bet_info_by_scene(scene);
            for (const [rewardID, betInfo] of repeatMap) {
                for (const [chipValue, chipCount] of betInfo) {
                    if (rewardID > 0 && chipValue > 0 && chipCount > 0) {
                        betList.push({
                            rewardID: rewardID,
                            chipValue: chipValue,
                            chipCount: chipCount
                        });
                    }
                }
            }
            if (betList.length > 0) {
                requests.push({
                    team_id: scene,
                    sceneType: scene,
                    betList: betList
                });
            }
        }
        return requests;
    }

    get_repeat_total_all_scene(): number {
        let total = 0;
        let requests = this.get_repeat_bet_requests_all_scene();
        for (let req of requests) {
            for (let bet of req.betList || []) {
                total += bet.chipValue * bet.chipCount;
            }
        }
        return total;
    }

    has_repeat_bet_info_all_scene(): boolean {
        return this.get_repeat_bet_requests_all_scene().length > 0;
    }

    has_auto_bet_source_all_scene(): boolean {
        return this.has_repeat_map(this.repeatMapByScene) || this.has_repeat_map(this.repeatMapTempByScene);
    }

    get_rewards() {
        return this.get_scene_value(this.curResultInfo, "rewards", this.curResultInfo && this.curResultInfo.rewards);
    }

    get_zhuanpan_id() {
        return this.get_scene_number(this.curResultInfo, "zhuanPanId", this.curResultInfo && this.curResultInfo.zhuanPanId || 0);
    }

    get_cur_win(): number {
        return this.curRankInfo && Number(this.curRankInfo.winNum) || 0;
    }

    get_result_errorcode(){
        return this.curRankInfo && this.curRankInfo.errorCode;
    }

    get_bet_value(rewardID: number) {
        let curbetMap = this.get_cur_bet_map();
        if (curbetMap.has(rewardID)) {
            return curbetMap.get(rewardID);
        }
        return 0;
    }

    /** 当前场次指定卡牌的全服下注总额。 */
    get_all_bet_value(rewardID: number): number {
        if (!this.hasAllBetInfo) {
            return 0;
        }
        let source = this.curHotRewardInfo || this.curGameInfo;
        let betMap = this.get_scene_value(source, "hotBetMap", {}) || {};
        return Math.max(0, Number(betMap[rewardID] || betMap[rewardID.toString()] || 0));
    }

    get_reward_multiple(zhuanPanId: number, sceneType: number = this.sceneType): number {
        let scene = this.normalize_scene_type(sceneType);
        let multiples = this.wheelMultipleByScene.get(scene);
        let index = Number(zhuanPanId) || 0;
        if (!multiples || index <= 0) {
            return 0;
        }
        return Number(multiples[index - 1] || multiples[index] || 0);
    }

    get_cur_bet_map_client() {
        return this.get_scene_bet_map_client(this.sceneType);
    }

    set_cur_bet_map_client(rewardId, betValue) {
        this.set_scene_bet_map_client(this.sceneType, rewardId, betValue);
    }

    set_scene_bet_map_client(sceneType: number, rewardId, betValue) {
        let hadBetNum = 0;
        let curbetMapClient = this.get_scene_bet_map_client(sceneType);
        if (curbetMapClient.has(rewardId)) {
            hadBetNum = curbetMapClient.get(rewardId);
        }
        curbetMapClient.set(rewardId, hadBetNum + betValue);
    }

    client_bet_info_sync_server() {
        this.curbetMapClientByScene.clear();
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            let serverMap = this.get_scene_bet_map(scene);
            let clientMap = new Map<number, number>();
            for (const [rewardID, betValue] of serverMap) {
                clientMap.set(rewardID, betValue);
            }
            this.curbetMapClientByScene.set(scene, clientMap);
        }
    }

    private sum_bet_map(betMap: Map<number, number>): number {
        let num = 0;
        for (let betNum of betMap.values()) {
            num = num + (Number(betNum) || 0);
        }
        return num;
    }

    get_hot_rewards(msg: ScHotBetRewardPush | CsCurGameInfoResp = null): any[] {
        let source = msg || this.curHotRewardInfo || this.curGameInfo;
        let rewards = this.get_scene_number_array(source, "rewards", []);
        if (rewards.length <= 0) {
            rewards = this.get_scene_number_array(source, "hotRewards", this.curGameInfo && this.curGameInfo.hotRewards || []);
        }
        let hotBetMap = this.get_scene_value(source, "hotBetMap", this.curGameInfo && (this.curGameInfo as any).hotBetMap || {}) || {};
        return rewards.map(rewardId => {
            let key = rewardId != null ? rewardId.toString() : "";
            return {
                rewardID: Number(rewardId) || 0,
                betValue: Number(hotBetMap[key] || hotBetMap[rewardId] || 0)
            };
        });
    }

    get_jackpot_value(): number {
        // 不使用下注档位，也不以 todayRevenue 或配置初始值兜底；JP 只认服务端数据。
        const sources = [this.curRankInfo, this.curResultInfo, this.curGameInfo];
        for (const source of sources) {
            let pool = this.get_scene_value(source, "jackpotAmountPool", null, EGameScene.Master)
                || this.get_scene_value(source, "jackpotPool", null, EGameScene.Master);
            let poolAmount = this.get_current_jackpot_pool_amount(pool);
            if (poolAmount != null) {
                this.jackpotValue = poolAmount;
                return poolAmount;
            }

            let value = this.get_scene_number(source, "jp", 0, EGameScene.Master);
            if (value > 0) {
                this.jackpotValue = value;
                return value;
            }
            value = this.get_scene_number(source, "jackpot", 0, EGameScene.Master);
            if (value > 0) {
                this.jackpotValue = value;
                return value;
            }
        }
        return this.jackpotValue;
    }

    /**
     * 中奖 JP 必须读取个人单播 ScRankInfoPush。ScOpenRewardPush 是全服开奖广播，
     * 其中 jackpotAmount 可能是所有中奖玩家的合计，不能拿来做本人的弹窗金额。
     */
    get_jackpot_win_amount(data: ScRankInfoPush = this.curRankInfo): number {
        if (!data || !data.sceneInfos) {
            return 0;
        }
        const masterInfo = this.pick_scene_payload(data.sceneInfos, EGameScene.Master);
        return Math.max(0, Math.floor(Number(masterInfo && masterInfo.jackpotAmount) || 0));
    }

    get_game_result_zhuanpan_id(data: GameResultData | HistoryData | ScOpenRewardPush): number {
        return this.get_scene_number(data, "zhuanPanId", data && data.zhuanPanId || 0);
    }

    clear(): void {
        this.curGameInfo = null;
        this.curResultInfo = null;
        this.curRankInfo = null;
        this.curHotRewardInfo = null;
        this.hasAllBetInfo = false;
        this.toDayRank3 = [];
        this.roundRank3 = [];
        this.curbetMapByScene.clear();
        this.curbetMapClientByScene.clear();
    }

    private update_scene_wheel_multiple(source: any): void {
        if (!source) {
            return;
        }
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            let values = this.get_scene_number_array(source, "wheelMultiple", [], scene);
            if (values.length > 0) {
                this.wheelMultipleByScene.set(scene, values);
            }
        }
    }

    private get_scene_bet_map(sceneType: number): Map<number, number> {
        let scene = this.normalize_scene_type(sceneType);
        if (!this.curbetMapByScene.has(scene)) {
            this.curbetMapByScene.set(scene, new Map<number, number>());
        }
        return this.curbetMapByScene.get(scene);
    }

    private get_scene_bet_map_client(sceneType: number): Map<number, number> {
        let scene = this.normalize_scene_type(sceneType);
        if (!this.curbetMapClientByScene.has(scene)) {
            this.curbetMapClientByScene.set(scene, new Map<number, number>());
        }
        return this.curbetMapClientByScene.get(scene);
    }

    private get_repeat_map(root: Map<number, Map<number, Map<number, number>>>, sceneType: number): Map<number, Map<number, number>> {
        let scene = this.normalize_scene_type(sceneType);
        if (!root.has(scene)) {
            root.set(scene, new Map<number, Map<number, number>>());
        }
        return root.get(scene);
    }

    private add_repeat_bet_temp(sceneType: number, rewardID: number, chipValue: number, chipCount: number) {
        let repeatMap = this.get_repeat_map(this.repeatMapTempByScene, sceneType);
        if (!repeatMap.has(rewardID)) {
            repeatMap.set(rewardID, new Map<number, number>());
        }
        let chipMap = repeatMap.get(rewardID);
        chipMap.set(chipValue, (chipMap.get(chipValue) || 0) + chipCount);
    }

    private clone_repeat_map_by_scene(source: Map<number, Map<number, Map<number, number>>>): Map<number, Map<number, Map<number, number>>> {
        let result = new Map<number, Map<number, Map<number, number>>>();
        for (const [sceneType, repeatMap] of source) {
            let sceneMap = new Map<number, Map<number, number>>();
            for (const [rewardID, chipMap] of repeatMap) {
                sceneMap.set(rewardID, new Map<number, number>(chipMap));
            }
            result.set(sceneType, sceneMap);
        }
        return result;
    }

    private has_repeat_map(source: Map<number, Map<number, Map<number, number>>>): boolean {
        for (const [, repeatMap] of source) {
            for (const [, chipMap] of repeatMap) {
                for (const [, chipCount] of chipMap) {
                    if (chipCount > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private create_bet_map(betSelf: any): Map<number, number> {
        let map = new Map<number, number>();
        if (!betSelf) {
            return map;
        }
        for (const key in betSelf) {
            let rewardID = Number(key);
            let betNum = Number(betSelf[key]) || 0;
            if (rewardID > 0 && betNum > 0) {
                map.set(rewardID, betNum);
            }
        }
        return map;
    }

    private get_current_jackpot_pool_amount(pool: any): number | null {
        if (!pool || typeof pool != "object") {
            return null;
        }

        // 服务端使用 key=0 的全局单 JP 池；禁止根据当前 ChipIndex 切换展示值。
        let amount = pool["0"];
        if (amount === undefined || amount === null) {
            amount = pool[0];
        }
        if (amount === undefined || amount === null) {
            return null;
        }
        return Math.max(0, Math.floor(Number(amount) || 0));
    }

    private normalize_scene_type(sceneType: number): EGameScene {
        let value = Number(sceneType);
        if (value == EGameScene.Advanced || value == EGameScene.Master) {
            return value;
        }
        return EGameScene.Normal;
    }

    private get_scene_rank_data(source: any, field: string, fallback: RankData[]): RankData[] {
        return this.get_scene_value(source, field, fallback) || [];
    }

    private get_scene_number(source: any, field: string, fallback: number = 0, sceneType: number = this.sceneType): number {
        let value = this.get_scene_value(source, field, fallback, sceneType);
        return Number(value) || 0;
    }

    private get_all_scene_number(source: any, field: string): number {
        if (!source) {
            return 0;
        }

        let total = 0;
        let hasScenePayload = false;
        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            let payload = this.get_scene_payload(source, scene);
            if (payload && payload[field] !== undefined && payload[field] !== null) {
                total += Number(payload[field]) || 0;
                hasScenePayload = true;
            }
        }
        if (hasScenePayload) {
            return total;
        }

        let directValue = source[field];
        if (directValue !== undefined && directValue !== null && typeof directValue != "object") {
            return Number(directValue) || 0;
        }

        if (directValue === undefined || directValue === null) {
            return 0;
        }

        for (let scene = EGameScene.Normal; scene <= EGameScene.Master; scene++) {
            total += this.get_scene_number(source, field, 0, scene);
        }
        return total;
    }

    private get_scene_number_array(source: any, field: string, fallback: number[] = [], sceneType: number = this.sceneType): number[] {
        let value = this.get_scene_value(source, field, fallback, sceneType);
        let values = this.normalize_number_array(value);
        if (values.length > 0) {
            return values;
        }
        return this.normalize_number_array(fallback);
    }

    private normalize_number_array(value: any): number[] {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value.map(item => Number(item) || 0).filter(item => item > 0);
        }
        if (typeof value == "object" && typeof value.length == "number") {
            let result = [];
            for (let i = 0; i < value.length; i++) {
                let num = Number(value[i]) || 0;
                if (num > 0) {
                    result.push(num);
                }
            }
            return result;
        }
        if (typeof value == "object") {
            return Object.keys(value)
                .filter(key => !isNaN(Number(key)))
                .sort((a, b) => Number(a) - Number(b))
                .map(key => Number(value[key]) || 0)
                .filter(item => item > 0);
        }
        let num = Number(value) || 0;
        return num > 0 ? [num] : [];
    }

    private get_scene_value(source: any, field: string, fallback: any = null, sceneType: number = this.sceneType): any {
        if (!source) {
            return fallback;
        }

        let scene = this.normalize_scene_type(sceneType);
        let payload = this.get_scene_payload(source, scene);
        if (payload && payload[field] !== undefined && payload[field] !== null) {
            return payload[field];
        }

        let value = source[field];
        if (value === undefined || value === null) {
            return fallback;
        }

        return this.pick_scene_value(value, scene, fallback, field);
    }

    private get_scene_payload(source: any, sceneType: EGameScene): any {
        if (!source) {
            return null;
        }

        let selfScene = Number(source.sceneType || source.scene || source.type);
        if (selfScene && selfScene == sceneType) {
            return source;
        }

        let fields = ["sceneInfos", "sceneInfo", "sceneData", "sceneDatas", "gameInfos", "gameInfo", "resultInfos", "results", "jpData"];
        for (let i = 0; i < fields.length; i++) {
            let container = source[fields[i]];
            let payload = this.pick_scene_payload(container, sceneType);
            if (payload) {
                return payload;
            }
        }
        return null;
    }

    private pick_scene_payload(container: any, sceneType: EGameScene): any {
        if (!container) {
            return null;
        }

        if (Array.isArray(container)) {
            for (let i = 0; i < container.length; i++) {
                let item = container[i];
                let itemScene = Number(item && (item.sceneType || item.scene || item.type));
                if (itemScene == sceneType) {
                    return item;
                }
            }
            return container[sceneType - 1] || container[sceneType] || null;
        }

        if (typeof container == "object") {
            for (const key in container) {
                let item = container[key];
                let itemScene = Number(item && (item.sceneType || item.scene || item.type));
                if (itemScene == sceneType) {
                    return item;
                }
            }
            let keys = this.get_scene_keys(sceneType);
            for (let i = 0; i < keys.length; i++) {
                let payload = container[keys[i]];
                if (payload !== undefined && payload !== null) {
                    return payload;
                }
            }
        }

        return null;
    }

    private pick_scene_value(value: any, sceneType: EGameScene, fallback: any, field: string): any {
        if (Array.isArray(value)) {
            let candidate = value[sceneType - 1];
            if (Array.isArray(candidate) || typeof candidate == "object") {
                return candidate;
            }
            if (field == "zhuanPanId" || field == "winNum" || field == "todayRevenue" || field == "betTotal" || field == "jp" || field == "jackpot") {
                return candidate !== undefined ? candidate : fallback;
            }
            return value;
        }

        if (typeof value == "object") {
            if ((field == "rewards" || field == "hotRewards") && this.is_number_array_object(value)) {
                return value;
            }
            if (field == "hotBetMap" && this.is_number_map_object(value)) {
                return value;
            }
            let keys = this.get_scene_keys(sceneType);
            for (let i = 0; i < keys.length; i++) {
                let candidate = value[keys[i]];
                if (candidate !== undefined && candidate !== null) {
                    return candidate;
                }
            }
        }

        return value;
    }

    private is_number_array_object(value: any): boolean {
        if (!value || typeof value != "object" || Array.isArray(value)) {
            return false;
        }
        let keys = Object.keys(value);
        if (keys.length <= 0) {
            return false;
        }
        return keys.every(key => key == "length" || (!isNaN(Number(key)) && typeof value[key] != "object"));
    }

    private is_number_map_object(value: any): boolean {
        if (!value || typeof value != "object" || Array.isArray(value)) {
            return false;
        }
        let keys = Object.keys(value);
        if (keys.length <= 0) {
            return false;
        }
        return keys.every(key => value[key] === null || value[key] === undefined || typeof value[key] != "object");
    }

    private get_scene_keys(sceneType: EGameScene): string[] {
        let names = ["", "normal", "advanced", "master"];
        let name = names[sceneType];
        let upperName = name.charAt(0).toUpperCase() + name.slice(1);
        return [
            sceneType.toString(),
            (sceneType - 1).toString(),
            name,
            upperName
        ];
    }
}


