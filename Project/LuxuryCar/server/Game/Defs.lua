-- 这是一个自动生成的文件，请勿修改

 return {
    { name = "Account", type = 7, objs = {
        diamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        avatar = {type = 4, range = {min = 0, max = 256},},
        nickname = {type = 4, range = {min = 0, max = 256},},
        level = {type = 2, range = {min = 0, max = 4294967295},},
    },},
    { name = "PlayerSettings", type = 7, objs = {
        soundVol = {type = 2, range = {min = -2147483648, max = 2147483647},},
        isSpeed = {type = 1,},
    },},
    { name = "LuxuryCarRankItem", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        profile = {type = 4, range = {min = 0, max = 256},},
        name = {type = 4, range = {min = 0, max = 256},},
        revenue = {type = 2, range = {min = 0, max = 9223372036854775807},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
    },},
    { name = "LuxuryCarHistoryItem", type = 7, objs = {
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
        date = {type = 4, range = {min = 0, max = 256},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betDatails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        roundResult = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "LuxuryCarPlayerBetList", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        betGradeArr = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},
        betGradeNum = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},},
    },},
    { name = "LuxuryCarRoundStep", type = 7, objs = {
        todayRound = {type = 2, range = {min = 0, max = 9223372036854775807},},
        status = {type = 2, range = {min = -2147483648, max = 2147483647},},
        remainSecond = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 2, range = {min = -2147483648, max = 2147483647},},
        hot = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        roundRank = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarRankItem"},},
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "enterGame", type = 7, objs = {
    },},
    { name = "enterGameResp", type = 7, objs = {
        roundStep = {type = 7, obj = "LuxuryCarRoundStep"},
        historyResults = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        rankList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarRankItem"},},
        uid = {type = 4, range = {min = 0, max = 256},},
        account = {type = 7, obj = "Account"},
        todayRevenue = {type = 2, range = {min = 0, max = 9223372036854775807},},
        wheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        wheelChipAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},},
        totalWheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        curRoundAllWheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarPlayerBetList"},},
        myHistory = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarHistoryItem"},},
        lastBetAmountButton = {type = 2, range = {min = -2147483648, max = 2147483647},},
        playerSettings = {type = 7, obj = "PlayerSettings"},
    },},
    { name = "bet", type = 7, objs = {
        todayRound = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betGradeArr = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},
        betGradeNumArr = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},},
        betDiamonList = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        requestId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "betResp", type = 7, objs = {
        requestId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        wheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        wheelChipAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},},
    },},
    { name = "onResultHandler", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "setBetAmountButton", type = 7, objs = {
        betAmountButtonIndex = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "setBetAmountButtonResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "synchronize", type = 7, objs = {
    },},
    { name = "synchronizeResp", type = 7, objs = {
        roundStep = {type = 7, obj = "LuxuryCarRoundStep"},
        historyResults = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        rankList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarRankItem"},},
        uid = {type = 4, range = {min = 0, max = 256},},
        account = {type = 7, obj = "Account"},
        todayRevenue = {type = 2, range = {min = 0, max = 9223372036854775807},},
        wheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        wheelChipAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},},
        totalWheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        curRoundAllWheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarPlayerBetList"},},
        myHistory = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarHistoryItem"},},
        lastBetAmountButton = {type = 2, range = {min = -2147483648, max = 2147483647},},
        playerSettings = {type = 7, obj = "PlayerSettings"},
    },},
    { name = "updateSettings", type = 7, objs = {
        config = {type = 7, obj = "PlayerSettings"},
    },},
    { name = "updateSettingsResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "dbmHeartbeat", type = 7, objs = {
    },},
    { name = "dbmHeartbeatResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "onRankListChange", type = 7, objs = {
        rankList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarRankItem"},},
    },},
    { name = "onRoundStep", type = 7, objs = {
        todayRound = {type = 2, range = {min = 0, max = 9223372036854775807},},
        status = {type = 2, range = {min = -2147483648, max = 2147483647},},
        remainSecond = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 2, range = {min = -2147483648, max = 2147483647},},
        hot = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        roundRank = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LuxuryCarRankItem"},},
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "onBetListRound", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        flyPlayerPos = {type = 2, range = {min = -2147483648, max = 2147483647},},
        batIndex = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},
        num = {type = 5, range = {min = 0, max = 256}, value = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 4294967295},},},},
    },},
    { name = "onBetNoticeAll", type = 7, objs = {
        wheelAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "onNewDay", type = 7, objs = {
    },},
    { name = "onMaintenance", type = 7, objs = {
    },},
    { name = "onPlayerUpdate", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        diamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        itemAmount = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        todayRound = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "PlayerBaseData", type = 7, objs = {
        playerId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        playerUid = {type = 4, range = {min = 0, max = 256},},
        name = {type = 4, range = {min = 0, max = 256},},
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        coins = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ResourceData", type = 7, objs = {
        resType = {type = 2, range = {min = 0, max = 4294967295},},
        resId = {type = 2, range = {min = 0, max = 4294967295},},
        resCount = {type = 2, range = {min = 0, max = 9223372036854775807},},
        oddsType = {type = 2, range = {min = -2147483648, max = 2147483647},},
        gemeExt = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 4, range = {min = 0, max = 256},},},
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScLoginSucPush", type = 7, objs = {
        pBaseData = {type = 7, obj = "PlayerBaseData"},
    },},
    { name = "CsSyncTimeReq", type = 7, objs = {
        cTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSyncTimeResp", type = 7, objs = {
        cTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        sTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsPlayerBaseDataReq", type = 7, objs = {
    },},
    { name = "CsPlayerBaseDataResp", type = 7, objs = {
        pBaseData = {type = 7, obj = "PlayerBaseData"},
    },},
    { name = "ScCoinsUpdatePush", type = 7, objs = {
        coins = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScSdkStatePush", type = 7, objs = {
        state = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "RankUserInfo", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        avatar = {type = 4, range = {min = 0, max = 256},},
        name = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
        score = {type = 2, range = {min = 0, max = 9223372036854775807},},
        get = {type = 1,},
    },},
    { name = "CsGetTodayRealTimeRankReq", type = 7, objs = {
    },},
    { name = "CsGetTodayRealTimeRankResp", type = 7, objs = {
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
        timezone = {type = 2, range = {min = 0, max = 4294967295},},
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
    },},
    { name = "ScTodayRealTimeRankPush", type = 7, objs = {
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
        timezone = {type = 2, range = {min = 0, max = 4294967295},},
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
    },},
    { name = "CsDayRankAwardReq", type = 7, objs = {
    },},
    { name = "ScDayRankAwardPush", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
        score = {type = 2, range = {min = 0, max = 9223372036854775807},},
        rankUsers = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "RankUserInfo"},},
    },},
    { name = "CsWeekRankAwardReq", type = 7, objs = {
    },},
    { name = "ScWeekRankAwardPush", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
        score = {type = 2, range = {min = 0, max = 9223372036854775807},},
        rankUsers = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "RankUserInfo"},},
    },},
    { name = "CsGetRankListByDateStrReq", type = 7, objs = {
        dateStr = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "CsGetRankListByDateStrResp", type = 7, objs = {
        dateStr = {type = 4, range = {min = 0, max = 256},},
        rankUsers = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "RankUserInfo"},},
    },},
    { name = "CsReceiveDayAwardReq", type = 7, objs = {
    },},
    { name = "CsReceiveDayAwardResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsReceiveWeekAwardReq", type = 7, objs = {
    },},
    { name = "CsReceiveWeekAwardResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "MailData", type = 7, objs = {
        uId = {type = 4, range = {min = 0, max = 256},},
        mailId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        mailCfgId = {type = 2, range = {min = 0, max = 4294967295},},
        gameId = {type = 2, range = {min = 0, max = 4294967295},},
        rewards = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "ResourceData"},},
        rewardState = {type = 2, range = {min = 0, max = 4294967295},},
        extraJson = {type = 4, range = {min = 0, max = 256},},
        sendTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        read = {type = 1,},
    },},
    { name = "CsMailListReq", type = 7, objs = {
    },},
    { name = "CsMailListResp", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "MailData"},},
    },},
    { name = "ScNewMailPush", type = 7, objs = {
        mail = {type = 7, obj = "MailData"},
    },},
    { name = "CsMailReadReq", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsMailReadResp", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsMailDeleteReq", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsMailDeleteAllReadReq", type = 7, objs = {
    },},
    { name = "CsMailDeleteResp", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsMailRewardReceiveReq", type = 7, objs = {
        mails = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsMailRewardReceiveResp", type = 7, objs = {
        errorCode = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        mailId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        reward = {type = 7, obj = "ResourceData"},
    },},
}
