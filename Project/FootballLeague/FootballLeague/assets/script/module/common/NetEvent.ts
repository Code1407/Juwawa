/** 客户端网络协议事件 */
export enum NetEvent {
    /**热度奖励推送 */
    NET_SC_BET_REWARD_PUSH = "ScHotBetRewardPush",
    /**音频开关切换 */
    NET_CS_AUDIO_CHANGE_REQ = "CsAudioChangeReq",
    /**默认选择筹码切换 */
    NET_CS_CHIP_CHANGE_REQ = "CsChipChangeReq",
    /**球队切换 */
    NET_CS_TEAM_CHANGE_REQ = "CsTeamChangeReq",
}
