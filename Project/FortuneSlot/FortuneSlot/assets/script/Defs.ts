// this is a generate file, do't modify

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

interface HistoryItem {
    date: string
    round: number
    betAmount: number
    lines: number[]
    goods: number[]
    win: number
    wheelMultiple: number
    isExtra: boolean
}

interface Results {
    betAmount: number
    calculateAmount: number
    slotResults: number[]
    multiple: number
    multiples: number[]
    wheelMultipleIndex: number
    wheelExtraIndex: number
}

interface RoundStep {
    runningRoundID: number
    status: number
    accountDiamond: number
}

interface Hint {
    userName: string
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
    history: HistoryItem[]
}

interface enterGame {
}

interface enterGameResp {
    account: Account
    playerSettings: PlayerSettings
    lastResult: Results
    history: HistoryItem[]
}

interface betNormal {
    betAmount: number
    calculateAmount: number
    isExtra: boolean
}

interface betNormalResp {
    code: number
}

interface betFree {
}

interface betFreeResp {
    code: number
}

interface stopRound {
    roundId: number
}

interface stopRoundResp {
    accountDiamond: number
    history: HistoryItem[]
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
    playerSettings: PlayerSettings
    lastResult: Results
    history: HistoryItem[]
}

interface updateSettings {
    config: PlayerSettings
}

interface updateSettingsResp {
    code: number
}

interface test {
    betAmount: number
    calculateAmount: number
    isExtra: boolean
}

interface testResp {
    code: number
}

interface dbmHeartbeat {
}

interface dbmHeartbeatResp {
    code: number
}

interface onMaintenance {
}

interface onRoundStep {
    runningRoundID: number
    status: number
    accountDiamond: number
}

interface onJackpotHint {
    userName: string
    amount: number
}

interface onResultHandler {
    code: number
    result: Results
    roundId: number
}

interface onStopRound {
    accountDiamond: number
    history: HistoryItem[]
}

interface onAccountDiamondUpdate {
    value: number
    offset: number
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

interface PlayerBaseData {
    playerId: number
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

