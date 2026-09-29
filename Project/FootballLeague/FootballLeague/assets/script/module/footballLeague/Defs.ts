// this is a generate file, do't modify

interface PlayerBaseData {
    playerId: number
    playerUid: string
    name: string
    avatarUrl: string
    coins: number
}

interface ResourceData {
    resType: number
    resId: number
    resCount: number
    oddsType: number
    gemeExt: {}
    roundId: number
}

interface ScLoginSucPush {
    pBaseData: PlayerBaseData
}

interface CsSyncTimeReq {
    cTime: number
}

interface CsSyncTimeResp {
    cTime: number
    sTime: number
}

interface CsPlayerBaseDataReq {
}

interface CsPlayerBaseDataResp {
    pBaseData: PlayerBaseData
}

interface ScCoinsUpdatePush {
    coins: number
}

interface ScSdkStatePush {
    state: number
}

interface RankUserInfo {
    uid: string
    avatar: string
    name: string
    rank: number
    bonus: number
    score: number
    get: boolean
}

interface CsGetTodayRealTimeRankReq {
}

interface CsGetTodayRealTimeRankResp {
    timestamp: number
    timezone: number
    uid: string
    rank: number
}

interface ScTodayRealTimeRankPush {
    timestamp: number
    timezone: number
    uid: string
    rank: number
}

interface CsDayRankAwardReq {
}

interface ScDayRankAwardPush {
    uid: string
    rank: number
    bonus: number
    score: number
    rankUsers: RankUserInfo[]
}

interface CsWeekRankAwardReq {
}

interface ScWeekRankAwardPush {
    uid: string
    rank: number
    bonus: number
    score: number
    rankUsers: RankUserInfo[]
}

interface CsGetRankListByDateStrReq {
    dateStr: string
}

interface CsGetRankListByDateStrResp {
    dateStr: string
    rankUsers: RankUserInfo[]
}

interface CsReceiveDayAwardReq {
}

interface CsReceiveDayAwardResp {
    code: number
    accountDiamond: number
    bonus: number
}

interface CsReceiveWeekAwardReq {
}

interface CsReceiveWeekAwardResp {
    code: number
    accountDiamond: number
    bonus: number
}

interface MailData {
    uId: string
    mailId: number
    mailCfgId: number
    gameId: number
    rewards: ResourceData[]
    rewardState: number
    extraJson: string
    sendTime: number
    read: boolean
}

interface CsMailListReq {
}

interface CsMailListResp {
    mails: MailData[]
}

interface ScNewMailPush {
    mail: MailData
}

interface CsMailReadReq {
    mails: number[]
}

interface CsMailReadResp {
    mails: number[]
}

interface CsMailDeleteReq {
    mails: number[]
}

interface CsMailDeleteAllReadReq {
}

interface CsMailDeleteResp {
    mails: number[]
}

interface CsMailRewardReceiveReq {
    mails: number[]
}

interface CsMailRewardReceiveResp {
    errorCode: number
    mailId: number
    reward: ResourceData
}

interface RankData {
    pid: number
    name: string
    avatarUrl: string
    rankNum: number
    score: number
}

interface SceneResultData {
    sceneType: number
    zhuanPanId: number
    rewards: number[]
    wheelMultiple: number[]
    winNum: number
    betSelf: {}
    hotBetMap: {}
    hotTeamId: number
    betTotal: number
    roundRank3: RankData[]
    jackpot: number
    jackpotAmount: number
    jackpotAmountPool: {}
}

interface ScPlayerEnterGamePush {
    pBaseData: PlayerBaseData
    openAudio: boolean
    chipIndex: number
    team_id: number
}

interface CsCurGameInfoReq {
    team_id: number
}

interface CsCurGameInfoResp {
    team_id: number
    gameState: number
    round: number
    prepareTime: number
    /** 服务端下发时刻（毫秒），用于同步 JP 动画。 */
    serverTime: number
    betSelf: {}
    todayRevenue: number
    toDayRank3: RankData[]
    hotRewards: number[]
    hotBetMap: {}
    betTotal: number
    sceneInfos: SceneResultData[]
    jackpotAmountPool: {}
}

interface ScGamePreparePush {
    prepareTime: number
    round: number
}

interface BetData {
    rewardID: number
    chipValue: number
    chipCount: number
}

interface CsBetReq {
    team_id: number
    sceneType: number
    betList: BetData[]
}

interface CsBetResp {
    errorCode: number
    team_id: number
    sceneType: number
    money: number
    betList: BetData[]
}

interface ScRankInfoPush {
    errorCode: number
    round: number
    zhuanPanId: number
    rewards: number[]
    winNum: number
    money: number
    rankNum: number
    todayRevenue: number
    sceneInfos: SceneResultData[]
    jackpotAmountPool: {}
}

interface ScOpenRewardPush {
    round: number
    zhuanPanId: number
    rewards: number[]
    toDayRank3: RankData[]
    roundRank3: RankData[]
    sceneInfos: SceneResultData[]
    jackpotAmountPool: {}
}

interface ScJackpotHintPush {
    userName: string
    amount: number
}

interface ScHotBetRewardPush {
    rewards: number[]
    hotBetMap: {}
    betTotal: number
    sceneInfos: SceneResultData[]
}

interface GameResultData {
    team_id: number
    prepareTime: number
    round: number
    zhuanPanId: number
    rewards: number[]
    sceneInfos: SceneResultData[]
}

interface CsGameHistoryReq {
    team_id: number
}

interface CsGameHistoryResp {
    list: GameResultData[]
}

interface BetOnceData {
    betTime: number
    betList: BetData[]
}

interface BetRoundData {
    serverIndex: number
    round: number
    prepareTime: number
    rewardID: number
    win: number
    betInfo: BetOnceData[]
}

interface HistoryData {
    team_id: number
    serverIndex: number
    prepareTime: number
    round: number
    betMap: {}
    rewards: number[]
    addCoins: number
    zhuanPanId: number
    sceneInfos: SceneResultData[]
}

interface CsSelfBetHistoryReq {
    team_id: number
}

interface CsSelfBetHistoryResp {
    list: HistoryData[]
}

interface CsRevenueRankReq {
}

interface CsRevenueRankResp {
    list: RankData[]
}

interface CsAudioChangeReq {
    openAudio: boolean
}

interface CsChipChangeReq {
    chipIndex: number
}

interface CsTeamChangeReq {
    team_id: number
}

