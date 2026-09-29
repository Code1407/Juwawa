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
    bet: number
    win: number
}

interface ScPlayerEnterGamePush {
    pBaseData: PlayerBaseData
    openAudio: boolean
    chipIndex: number
}

interface CsCurGameInfoReq {
}

interface CsCurGameInfoResp {
    round: number
    gameState: number
    prepareTime: number
    betWorld: {}
    betSelf: {}
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
    betList: BetData[]
}

interface CsBetResp {
    errorCode: number
    money: number
    betList: BetData[]
}

interface ScUpdateWorldBetPush {
    betMap: {}
    betList: BetData[]
    pid: number
    round: number
}

interface ScPlayerRoundResultPush {
    errorCode: number
    round: number
    playerBet: number
    playerWin: number
}

interface ScOpenRewardPush {
    round: number
    rewardID: number
    jpRewards: number[]
    zhuanPanIndex: number
    roundRank3: RankData[]
}

interface GameResultData {
    prepareTime: number
    round: number
    resultID: number
    jpRewards: number[]
}

interface CsGameHistoryReq {
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
    jpRewards: number[]
    winNum: number
    betInfo: BetOnceData[]
}

interface HistoryData {
    serverIndex: number
    prepareTime: number
    round: number
    betMap: {}
    result: {}
}

interface CsSelfBetHistoryReq {
}

interface CsSelfBetHistoryResp {
    list: HistoryData[]
}

interface CsGameLatelyHistoryReq {
}

interface CsGameLatelyHistoryResp {
    list: number[]
}

interface ScGameLatelyHistoryPush {
    list: number[]
    jpRewardCount: number
}

interface CsAudioChangeReq {
    openAudio: boolean
}

interface CsChipChangeReq {
    chipIndex: number
}

