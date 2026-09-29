/** 客户端网络协议事件 */
export enum NetEvent {
    /**玩家进入游戏推送 */
    NET_SC_PLAYER_ENTER_GAME_PUSH = "ScPlayerEnterGamePush",
    /**请求当前游戏信息 */
    NET_CS_CUR_GAME_INFO_REQ = "CsCurGameInfoReq",
    /**请求当前游戏信息回包 */
    NET_CS_CUR_GAME_INFO_RESP = "CsCurGameInfoResp",
    /**游戏押注准备推送 */
    NET_SC_GAME_PREPARE_PUSH = "ScGamePreparePush",
    /**请求下注 */
    NET_CS_BET_REQ = "CsBetReq",
    /**请求下注回包 */
    NET_CS_BET_RESP = "CsBetResp",
    /**全局下注信息推送 */
    NET_SC_UPDATE_WORLD_BET_PUSH = "ScUpdateWorldBetPush",
    /**玩家押注结果推送 */
    NET_SC_PLAYER_ROUND_RESULT_PUSH = "ScPlayerRoundResultPush",
    /**开奖信息推送 */
    NET_SC_OPEN_REWARD_PUSH = "ScOpenRewardPush",
    /**游戏开奖历史请求 */
    NET_CS_GAME_HISTORY_REQ = "CsGameHistoryReq",
    /**游戏最近开奖历史请求 */
    NET_CS_GAME_LATELY_HISTORY_REQ = "CsGameLatelyHistoryReq",
    NET_CS_GAME_LATELY_HISTORY_RESP = "CsGameLatelyHistoryResp",
    NET_SC_GAME_LATELY_HISTORY_PUSH = "ScGameLatelyHistoryPush",
    /**游戏开奖历史请求回包 */
    NET_CS_GAME_HISTORY_RESP = "CsGameHistoryResp",
    /**我的下注记录请求 */
    NET_CS_SELF_BET_HISTORY_REQ = "CsSelfBetHistoryReq",
    /**我的下注记录请求回包 */
    NET_CS_SELF_BET_HISTORY_RESP = "CsSelfBetHistoryResp",
    /**音频开关切换 */
    NET_CS_AUDIO_CHANGE_REQ = "CsAudioChangeReq",
    /**默认选择筹码切换 */
    NET_CS_CHIP_CHANGE_REQ = "CsChipChangeReq",
}