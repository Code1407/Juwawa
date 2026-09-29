-- this is a generate file, do't modify

 return {
    { name = "HistoryItem", type = 7, objs = {
        date = {type = 4, range = {min = 0, max = 256},},
        round = {type = 2, range = {min = -2147483648, max = 2147483647},},
        orderId = {type = 4, range = {min = 0, max = 256},},
        bet = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        win = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        multiple = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        gameType = {type = 2, range = {min = -2147483648, max = 2147483647},},
        results = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
    },},
    { name = "HistorySummary", type = 7, objs = {
        todayWin = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        monthWin = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
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
    { name = "test", type = 7, objs = {
        betAmount = {type = 2, range = {min = -2147483648, max = 2147483647},},
        count = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "testResp", type = 7, objs = {
        count = {type = 2, range = {min = -2147483648, max = 2147483647},},
        winCount = {type = 2, range = {min = -2147483648, max = 2147483647},},
        averageMultiple = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
    },},
    { name = "PlayerSettings", type = 7, objs = {
        soundVol = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        lastBetAmountButton = {type = 2, range = {min = -2147483648, max = 2147483647},},
        isSpeed = {type = 1,},
    },},
    { name = "Account", type = 7, objs = {
        diamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        avatar = {type = 4, range = {min = 0, max = 256},},
        nickname = {type = 4, range = {min = 0, max = 256},},
        level = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "LineSame", type = 7, objs = {
        lineNum = {type = 2, range = {min = -2147483648, max = 2147483647},},
        target = {type = 2, range = {min = -2147483648, max = 2147483647},},
        count = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "Results", type = 7, objs = {
        betAmount = {type = 2, range = {min = -2147483648, max = 2147483647},},
        results = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        lineSames = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "LineSame"},},
        multiple = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        multiples = {type = 5, range = {min = 0, max = 256}, value = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},},
        freeWinAmount = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        freeCount = {type = 2, range = {min = -2147483648, max = 2147483647},},
        jackpotAmount = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        jackpotAmountPool = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},},
    },},
    { name = "RoundStep", type = 7, objs = {
        runningRoundID = {type = 2, range = {min = -2147483648, max = 2147483647},},
        status = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        jackpotPool = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},},
        results = {type = 7, obj = "Results"},
    },},
    { name = "Hint", type = 7, objs = {
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        playerUid = {type = 4, range = {min = 0, max = 256},},
        userName = {type = 4, range = {min = 0, max = 256},},
        winTime = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        amount = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "AccountDiamondUpdate", type = 7, objs = {
        value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        offset = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "BetResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 7, obj = "Results"},
        roundId = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "RoundResultResp", type = 7, objs = {
        accountDiamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "enterGame", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        token = {type = 4, range = {min = 0, max = 256},},
        lang = {type = 4, range = {min = 0, max = 256},},
        ua = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "enterGameResp", type = 7, objs = {
        account = {type = 7, obj = "Account"},
        jackpotAmountPool = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},},
        betAmounts = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        betAmountIndex = {type = 2, range = {min = -2147483648, max = 2147483647},},
        lastResult = {type = 7, obj = "Results"},
        playerSettings = {type = 7, obj = "PlayerSettings"},
        history = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "HistoryItem"},},
        historySummary = {type = 7, obj = "HistorySummary"},
        roundStep = {type = 7, obj = "RoundStep"},
    },},
    { name = "betNormal", type = 7, objs = {
        betAmount = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "betNormalResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 7, obj = "Results"},
        roundId = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "betFree", type = 7, objs = {
    },},
    { name = "betFreeResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 7, obj = "Results"},
        roundId = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "stopRound", type = 7, objs = {
        roundId = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "stopRoundResp", type = 7, objs = {
        accountDiamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
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
        account = {type = 7, obj = "Account"},
        jackpotAmountPool = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},},
        betAmounts = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
        betAmountIndex = {type = 2, range = {min = -2147483648, max = 2147483647},},
        lastResult = {type = 7, obj = "Results"},
        playerSettings = {type = 7, obj = "PlayerSettings"},
        history = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "HistoryItem"},},
        historySummary = {type = 7, obj = "HistorySummary"},
    },},
    { name = "updateSettings", type = 7, objs = {
        config = {type = 7, obj = "PlayerSettings"},
    },},
    { name = "updateSettingsResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "sendBetAmounts", type = 7, objs = {
        betAmounts = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
    },},
    { name = "sendBetAmountsResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        betAmounts = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
    },},
    { name = "dbmHeartbeat", type = 7, objs = {
    },},
    { name = "dbmHeartbeatResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "userAction", type = 7, objs = {
        action = {type = 4, range = {min = 0, max = 256},},
        extra = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "userActionResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "userDelay", type = 7, objs = {
        action = {type = 4, range = {min = 0, max = 256},},
        extra = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "userDelayResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "onMaintenance", type = 7, objs = {
    },},
    { name = "onRoundStep", type = 7, objs = {
        runningRoundID = {type = 2, range = {min = -2147483648, max = 2147483647},},
        status = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        jackpotPool = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},},
        results = {type = 7, obj = "Results"},
    },},
    { name = "onJackpotHint", type = 7, objs = {
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        playerUid = {type = 4, range = {min = 0, max = 256},},
        userName = {type = 4, range = {min = 0, max = 256},},
        winTime = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        amount = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "onWinHint", type = 7, objs = {
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        playerUid = {type = 4, range = {min = 0, max = 256},},
        userName = {type = 4, range = {min = 0, max = 256},},
        winTime = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        amount = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "onResultHandler", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        result = {type = 7, obj = "Results"},
        roundId = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "onStopRound", type = 7, objs = {
        accountDiamond = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "onAccountDiamondUpdate", type = 7, objs = {
        value = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
        offset = {type = 2, range = {min = -9223372036854775808, max = 9223372036854775807},},
    },},
    { name = "PlayerBaseData", type = 7, objs = {
        playerId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        playerUid = {type = 4, range = {min = 0, max = 256},},
        name = {type = 4, range = {min = 0, max = 256},},
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        coins = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScLoginSucPush", type = 7, objs = {
        pBaseData = {type = 7, obj = "PlayerBaseData"},
        bonusWheelSegmentMultipliers = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = -2147483648, max = 2147483647},},},
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
    { name = "ResourceData", type = 7, objs = {
        resType = {type = 2, range = {min = 0, max = 4294967295},},
        resId = {type = 2, range = {min = 0, max = 4294967295},},
        resCount = {type = 2, range = {min = 0, max = 9223372036854775807},},
        oddsType = {type = 2, range = {min = -2147483648, max = 2147483647},},
        gemeExt = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 4, range = {min = 0, max = 256},},},
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
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