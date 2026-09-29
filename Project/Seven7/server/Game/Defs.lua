-- this is a generate file, do't modify

 return {
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
    { name = "RankData", type = 7, objs = {
        pid = {type = 2, range = {min = 0, max = 9223372036854775807},},
        name = {type = 4, range = {min = 0, max = 256},},
        avatarUrl = {type = 4, range = {min = 0, max = 256},},
        rankNum = {type = 2, range = {min = 0, max = 65535},},
        score = {type = 2, range = {min = 0, max = 9223372036854775807},},
        bet = {type = 2, range = {min = 0, max = 9223372036854775807},},
        win = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScPlayerEnterGamePush", type = 7, objs = {
        pBaseData = {type = 7, obj = "PlayerBaseData"},
        openAudio = {type = 1,},
        chipIndex = {type = 2, range = {min = 0, max = 65535},},
    },},
    { name = "CsCurGameInfoReq", type = 7, objs = {
    },},
    { name = "CsCurGameInfoResp", type = 7, objs = {
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        gameState = {type = 2, range = {min = 0, max = 9223372036854775807},},
        prepareTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betWorld = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        betSelf = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "ScGamePreparePush", type = 7, objs = {
        prepareTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "BetData", type = 7, objs = {
        rewardID = {type = 2, range = {min = 0, max = 65535},},
        chipValue = {type = 2, range = {min = 0, max = 9223372036854775807},},
        chipCount = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsBetReq", type = 7, objs = {
        betList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "BetData"},},
    },},
    { name = "CsBetResp", type = 7, objs = {
        errorCode = {type = 2, range = {min = -32768, max = 32767},},
        money = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "BetData"},},
    },},
    { name = "ScUpdateWorldBetPush", type = 7, objs = {
        betMap = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        betList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "BetData"},},
        pid = {type = 2, range = {min = 0, max = 9223372036854775807},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScPlayerRoundResultPush", type = 7, objs = {
        errorCode = {type = 2, range = {min = -32768, max = 32767},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        playerBet = {type = 2, range = {min = 0, max = 9223372036854775807},},
        playerWin = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScOpenRewardPush", type = 7, objs = {
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        rewardID = {type = 2, range = {min = 0, max = 65535},},
        jpRewards = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 65535},},},
        zhuanPanIndex = {type = 2, range = {min = 0, max = 65535},},
        roundRank3 = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "RankData"},},
    },},
    { name = "GameResultData", type = 7, objs = {
        prepareTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        resultID = {type = 2, range = {min = 0, max = 65535},},
        jpRewards = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 65535},},},
    },},
    { name = "CsGameHistoryReq", type = 7, objs = {
    },},
    { name = "CsGameHistoryResp", type = 7, objs = {
        list = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "GameResultData"},},
    },},
    { name = "BetOnceData", type = 7, objs = {
        betTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betList = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "BetData"},},
    },},
    { name = "BetRoundData", type = 7, objs = {
        serverIndex = {type = 2, range = {min = 0, max = 65535},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        prepareTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        rewardID = {type = 2, range = {min = 0, max = 65535},},
        jpRewards = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 65535},},},
        winNum = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betInfo = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "BetOnceData"},},
    },},
    { name = "HistoryData", type = 7, objs = {
        serverIndex = {type = 2, range = {min = 0, max = 9223372036854775807},},
        prepareTime = {type = 2, range = {min = 0, max = 9223372036854775807},},
        round = {type = 2, range = {min = 0, max = 9223372036854775807},},
        betMap = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
        result = {type = 6, key = {type = 4, range = {min = 0, max = 256},}, value = {type = 2, range = {min = 0, max = 9223372036854775807},},},
    },},
    { name = "CsSelfBetHistoryReq", type = 7, objs = {
    },},
    { name = "CsSelfBetHistoryResp", type = 7, objs = {
        list = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "HistoryData"},},
    },},
    { name = "CsGameLatelyHistoryReq", type = 7, objs = {
    },},
    { name = "CsGameLatelyHistoryResp", type = 7, objs = {
        list = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 65535},},},
    },},
    { name = "ScGameLatelyHistoryPush", type = 7, objs = {
        list = {type = 5, range = {min = 0, max = 256}, value = {type = 2, range = {min = 0, max = 65535},},},
        jpRewardCount = {type = 2, range = {min = 0, max = 65535},},
    },},
    { name = "CsAudioChangeReq", type = 7, objs = {
        openAudio = {type = 1,},
    },},
    { name = "CsChipChangeReq", type = 7, objs = {
        chipIndex = {type = 2, range = {min = 0, max = 65535},},
    },},
}