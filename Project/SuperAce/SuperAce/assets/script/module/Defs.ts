// this is a generate file, do't modify

interface RankUserInfo {
    uid: string
    avatar: string
    name: string
    rank: number
    bonus: number
    score: number
    get: boolean
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

interface CsGetTodayRealTimeRankReq {
}

interface CsGetTodayRealTimeRankResp {
    timestamp: number
    timezone: number
    uid: string
    rank: number
}

interface CsGetRankListByDateStrReq {
    dateStr: string
}

interface CsGetRankListByDateStrResp {
    dateStr: string
    rankUsers: RankUserInfo[]
}

interface SuperAceSettings {
    soundVol: number
    lastBetAmountButton: number
    isSpeed: boolean
}

interface SuperAceAccount {
    diamond: number
    avatar: string
    nickname: string
    uid: string
}

interface SuperAceResultItem {
    slotResult: number[]
    eliminateIndexs: number[]
    multiple: number
    multiples: number[]
    changeGoldenIndexs: number[]
    copyWildIndexs: number[]
    multipleKinds: number[]
}

interface SuperAceResults {
    betAmount: number
    calculateAmount: number
    resultItems: SuperAceResultItem[]
    multiple: number
    multiples: number[]
    freeCount: number
    multipleKinds: number[]
}

interface SuperAceEnterData {
    account: SuperAceAccount
    hasLastResult: boolean
    lastResult: SuperAceResults
    playerSettings: SuperAceSettings
    runningRoundId: number
    machineStatus: number
}

interface CsSuperAceEnterReq {
}

interface CsSuperAceEnterResp {
    account: SuperAceAccount
    hasLastResult: boolean
    lastResult: SuperAceResults
    playerSettings: SuperAceSettings
    runningRoundId: number
    machineStatus: number
}

interface CsSuperAceBetNormalReq {
    betAmount: number
    calculateAmount: number
}

interface CsSuperAceBetNormalResp {
    code: number
    hasResult: boolean
    result: SuperAceResults
    roundId: number
}

interface CsSuperAceBetFreeReq {
}

interface CsSuperAceBetFreeResp {
    code: number
    hasResult: boolean
    result: SuperAceResults
    roundId: number
}

interface CsSuperAceStopRoundReq {
    roundId: number
}

interface CsSuperAceStopRoundResp {
    code: number
    accountDiamond: number
}

interface CsSuperAceSynchronizeReq {
}

interface CsSuperAceSynchronizeResp {
    code: number
    data: SuperAceEnterData
}

interface CsSuperAceUpdateSettingsReq {
    playerSettings: SuperAceSettings
}

interface CsSuperAceUpdateSettingsResp {
    code: number
    playerSettings: SuperAceSettings
}

interface ScSuperAceRoundStepPush {
    runningRoundId: number
    status: number
    accountDiamond: number
}

interface ScSuperAceAccountUpdatePush {
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

interface ScTodayRealTimeRankPush {
    timestamp: number
    timezone: number
    uid: string
    rank: number
}
