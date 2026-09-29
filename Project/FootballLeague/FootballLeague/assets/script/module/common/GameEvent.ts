/** 游戏事件 */
export enum GameEvent {
    /**玩家进入游戏 */
    MSG_PLAYER_ENTER_GAME_PUSH = "MSG_PLAYER_ENTER_GAME_PUSH",
    /** 获取当前游戏信息 */
    MSG_CUR_GAME_INFO = "MSG_CUR_GAME_INFO",
    /** 游戏开始准备 */
    MSG_GAME_PREPARE_PUSH = "MSG_GAME_PREPARE_PUSH",
    /** 更新本轮下注信息 */
    MSG_UPDATE_SELF_BET = "MSG_UPDATE_SELF_BET",
    /** 更新全局下注信息 */
    MSG_UPDATE_WORLD_BET = "MSG_UPDATE_WORLD_BET",
    /** 更新奖池 */
    MSG_JACKPOT_UPDATE = "MSG_JACKPOT_UPDATE",
    // JP 数据已变更；由主界面在开奖滚动结束后再刷新展示。
    MSG_JACKPOT_DATA_CHANGED = "MSG_JACKPOT_DATA_CHANGED",
    /** 本玩家命中 JP（金额只来自个人 ScRankInfoPush） */
    MSG_JACKPOT_WIN = "MSG_JACKPOT_WIN",
    /** 全服 JP 中奖跑马灯 */
    MSG_JACKPOT_HINT = "MSG_JACKPOT_HINT",
    /** 更新玩家个人今日收益 */
    MSG_TODAY_REVENUE_UPDATE = "MSG_TODAY_REVENUE_UPDATE",
    /** 场景切换 */
    MSG_SCENE_CHANGE = "MSG_SCENE_CHANGE",
    /** 开奖 */
    MSG_OPEN_REWARD = "MSG_OPEN_REWARD",
    //历史抽奖结果 */
    MSG_SHOW_GAME_HISTORY = "MSG_SHOW_GAME_HISTORY",
    //我的下注记录 */
    MSG_SHOW_SELF_BET_HISTORY = "MSG_SHOW_SELF_BET_HISTORY",
    //排行榜 */
    MSG_SHOW_RANK = "MSG_SHOW_RANK",
    //押注热度 */
    MSG_UPDATE_HOT_REWARDS = "MSG_UPDATE_HOT_REWARDS",
    //押注类型数量超出 */
    MSG_BET_TYPE_COUNT_OVER = "MSG_BET_TYPE_COUNT_OVER",
    //音效开关变化 */
    MSG_AUDIO_CHANGE = "MSG_AUDIO_CHANGE",
}
