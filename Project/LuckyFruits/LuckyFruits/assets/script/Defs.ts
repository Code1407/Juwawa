// this is a generate file, do't modify

interface Account {
    diamond: number
    avatar: string
    nickname: string
    level: number
}

interface PlayerSettings {
    soundVol: number
    lastBetAmountButton: number
}

interface LuckyFruitsRankItem {
    uid: string
    profile: string
    name: string
    revenue: number
}

interface LuckyFruitsRoundStep {
    todayRound: number
    status: number
    remainSecond: number
    serverNowMs: number
    phaseStartedAtMs: number
    phaseEndsAtMs: number
    timelineVersion: number
    rollStartPos: number
    winPos: number
    resultDetail: number[]
    resultPos: number[]
}

interface LuckyFruitsRoundResult {
    todayRound: number
    rollStartPos: number
    winPos: number
    resultDetail: number[]
    resultPos: number[]
}

interface LuckyFruitsHistoryItem {
    date: string
    round: number
    roundResult: number
}

interface LuckyFruitsMyHistoryItem {
    date: string
    round: number
    betDatails: number[]
    roundResult: number
    resultDetail: number[]
}

interface LuckyFruitsPlayerBetList {
    uid: string
    betGradeArr: number[]
    betGradeNum: number[][]
}

interface enterGame {
}

interface enterGameResp {
    uid: string
    roundStep: LuckyFruitsRoundStep
    account: Account
    todayRevenue: number
    lastWheelAmount: number[][]
    curRoundWheelAmount: number[][]
    curRoundAllWheelAmount: LuckyFruitsPlayerBetList[]
    curRoundTotalWheelAmount: number[][]
    gameHistory: LuckyFruitsHistoryItem[]
    myHistory: LuckyFruitsMyHistoryItem[]
    lastBetAmountButton: number
    playerSettings: PlayerSettings
}

interface LuckyFruitsBetData {
    betPosition: number
    chipValue: number
    chipCount: number
}

interface bet {
    todayRound: number
    betList: LuckyFruitsBetData[]
    betGradeArr: number[]
    betGradeNumArr: number[][]
    betDiamonList: number[]
}

interface betResp {
    code: number
    accountDiamond: number
    betGradeNum: number[][]
}

interface setBetAmountButton {
    betAmountButtonIndex: number
}

interface setBetAmountButtonResp {
    code: number
}

interface synchronize {
}

interface synchronizeResp {
    uid: string
    roundStep: LuckyFruitsRoundStep
    account: Account
    todayRevenue: number
    lastWheelAmount: number[][]
    curRoundWheelAmount: number[][]
    curRoundAllWheelAmount: LuckyFruitsPlayerBetList[]
    curRoundTotalWheelAmount: number[][]
    gameHistory: LuckyFruitsHistoryItem[]
    myHistory: LuckyFruitsMyHistoryItem[]
    lastBetAmountButton: number
    playerSettings: PlayerSettings
}

interface updateSettings {
    config: PlayerSettings
}

interface updateSettingsResp {
    code: number
}

interface dbmHeartbeat {
}

interface dbmHeartbeatResp {
    code: number
}

interface onRoundStep {
    todayRound: number
    status: number
    remainSecond: number
    serverNowMs: number
    phaseStartedAtMs: number
    phaseEndsAtMs: number
    timelineVersion: number
    rollStartPos: number
    winPos: number
    resultDetail: number[]
    resultPos: number[]
}

interface onResultHandler {
    todayRound: number
    rollStartPos: number
    winPos: number
    resultDetail: number[]
    resultPos: number[]
}

interface onbatNoticeAll {
    uid: string
    wheelAmount: number[][]
}

interface onRewardHandler {
    winCard: string
    resultDetail: number[]
}


interface onbatListRound {
    uid: string
    flyPlayerPos: number
    batIndex: number[]
    num: number[][]
}

interface onMaintenance {
}

interface onPlayerUpdate {
    uid: string
    diamond: number
    itemAmount: number[]
    todayRound: number
}

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

