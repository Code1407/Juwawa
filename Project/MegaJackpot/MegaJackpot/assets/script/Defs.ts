// this is a generate file, do't modify

interface HistoryItem {
    date: string
    round: number
    orderId: string
    bet: number
    win: number
    multiple: number
    gameType: number
    results: number[]
}

interface HistorySummary {
    todayWin: number
    monthWin: number
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

interface test {
    betAmount: number
    count: number
}

interface testResp {
    count: number
    winCount: number
    averageMultiple: number
}

interface PlayerSettings {
    soundVol: number
    lastBetAmountButton: number
    isSpeed: boolean
}

interface Account {
    diamond: number
    avatar: string
    nickname: string
    level: number
}

interface LineSame {
    lineNum: number
    target: number
    count: number
}

interface Results {
    betAmount: number
    results: number[]
    lineSames: LineSame[]
    multiple: number
    multiples: number[]
    freeWinAmount: number
    freeCount: number
    jackpotAmount: number
    jackpotAmountPool: {}
}

interface RoundStep {
    runningRoundID: number
    status: number
    accountDiamond: number
    jackpotPool: {}
    results: Results
}

interface Hint {
    avatarUrl: string
    playerUid: string
    userName: string
    winTime: number
    amount: number
}

interface AccountDiamondUpdate {
    value: number
    offset: number
}

interface BetResp {
    code: number
    result: Results
    roundId: number
}

interface RoundResultResp {
    accountDiamond: number
}

interface enterGame {
    uid: string
    token: string
    lang: string
    ua: string
}

interface enterGameResp {
    account: Account
    jackpotAmountPool: {}
    betAmounts: number[]
    betAmountIndex: number
    lastResult: Results
    playerSettings: PlayerSettings
    history: HistoryItem[]
    historySummary: HistorySummary
    roundStep: RoundStep
}

interface betNormal {
    betAmount: number
}

interface betNormalResp {
    code: number
    result: Results
    roundId: number
}

interface betFree {
}

interface betFreeResp {
    code: number
    result: Results
    roundId: number
}

interface stopRound {
    roundId: number
}

interface stopRoundResp {
    accountDiamond: number
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
    account: Account
    jackpotAmountPool: {}
    betAmounts: number[]
    betAmountIndex: number
    lastResult: Results
    playerSettings: PlayerSettings
    history: HistoryItem[]
    historySummary: HistorySummary
}

interface updateSettings {
    config: PlayerSettings
}

interface updateSettingsResp {
    code: number
}

interface sendBetAmounts {
    betAmounts: number[]
}

interface sendBetAmountsResp {
    code: number
    betAmounts: number[]
}

interface dbmHeartbeat {
}

interface dbmHeartbeatResp {
    code: number
}

interface userAction {
    action: string
    extra: string
}

interface userActionResp {
    code: number
}

interface userDelay {
    action: string
    extra: string
}

interface userDelayResp {
    code: number
}

interface onMaintenance {
}

interface onRoundStep {
    runningRoundID: number
    status: number
    accountDiamond: number
    jackpotPool: {}
    results: Results
}

interface onJackpotHint {
    avatarUrl: string
    playerUid: string
    userName: string
    winTime: number
    amount: number
}

interface onWinHint {
    avatarUrl: string
    playerUid: string
    userName: string
    winTime: number
    amount: number
}

interface onResultHandler {
    code: number
    result: Results
    roundId: number
}

interface onStopRound {
    accountDiamond: number
}

interface onAccountDiamondUpdate {
    value: number
    offset: number
}

interface PlayerBaseData {
    playerId: number
    playerUid: string
    name: string
    avatarUrl: string
    coins: number
}

interface ScLoginSucPush {
    pBaseData: PlayerBaseData
    bonusWheelSegmentMultipliers: number[]
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

interface ResourceData {
    resType: number
    resId: number
    resCount: number
    oddsType: number
    gemeExt: {}
    roundId: number
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

