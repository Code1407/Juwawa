-- this is a generate file, do't modify
return {
    { name = "RankUserInfo", type = 7, objs = {
        uid = {type = 4, range = {min = 0, max = 256},},
        avatar = {type = 4, range = {min = 0, max = 256},},
        name = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
        bonus = {type = 2, range = {min = 0, max = 9223372036854775807},},
        score = {type = 2, range = {min = 0, max = 9223372036854775807},},
        get = {type = 1,},
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
    { name = "CsGetTodayRealTimeRankReq", type = 7, objs = {
    },},
    { name = "CsGetTodayRealTimeRankResp", type = 7, objs = {
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
        timezone = {type = 2, range = {min = 0, max = 4294967295},},
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
    },},
    { name = "CsGetRankListByDateStrReq", type = 7, objs = {
        dateStr = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "CsGetRankListByDateStrResp", type = 7, objs = {
        dateStr = {type = 4, range = {min = 0, max = 256},},
        rankUsers = {type = 5, range = {min = 0, max = 256}, value = {type = 7, obj = "RankUserInfo"},},
    },},
    { name = "SuperAceSettings", type = 7, objs = {
        soundVol = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        lastBetAmountButton = {type = 2, range = {min = 0, max = 65535},},
        isSpeed = {type = 1,},
    },},
    { name = "SuperAceAccount", type = 7, objs = {
        diamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
        avatar = {type = 4, range = {min = 0, max = 256},},
        nickname = {type = 4, range = {min = 0, max = 256},},
        uid = {type = 4, range = {min = 0, max = 256},},
    },},
    { name = "SuperAceResultItem", type = 7, objs = {
        slotResult = {type = 5, range = {min = 20, max = 20}, value = {type = 2, range = {min = -32768, max = 32767},},},
        eliminateIndexs = {type = 5, range = {min = 0, max = 20}, value = {type = 2, range = {min = 0, max = 65535},},},
        multiple = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        multiples = {type = 5, range = {min = 0, max = 4096}, value = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},},
        changeGoldenIndexs = {type = 5, range = {min = 0, max = 20}, value = {type = 2, range = {min = 0, max = 65535},},},
        copyWildIndexs = {type = 5, range = {min = 0, max = 20}, value = {type = 2, range = {min = 0, max = 65535},},},
        multipleKinds = {type = 5, range = {min = 9, max = 9}, value = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},},
    },},
    { name = "SuperAceResults", type = 7, objs = {
        betAmount = {type = 2, range = {min = 0, max = 9223372036854775807},},
        calculateAmount = {type = 2, range = {min = 0, max = 9223372036854775807},},
        resultItems = {type = 5, range = {min = 0, max = 128}, value = {type = 7, obj = "SuperAceResultItem"},},
        multiple = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},
        multiples = {type = 5, range = {min = 0, max = 4096}, value = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},},
        freeCount = {type = 2, range = {min = 0, max = 65535},},
        multipleKinds = {type = 5, range = {min = 9, max = 9}, value = {type = 3, range = {min = 0, max = 9.223372036854776e+18},},},
    },},
    { name = "SuperAceEnterData", type = 7, objs = {
        account = {type = 7, obj = "SuperAceAccount"},
        hasLastResult = {type = 1,},
        lastResult = {type = 7, obj = "SuperAceResults"},
        playerSettings = {type = 7, obj = "SuperAceSettings"},
        runningRoundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        machineStatus = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "CsSuperAceEnterReq", type = 7, objs = {
    },},
    { name = "CsSuperAceEnterResp", type = 7, objs = {
        account = {type = 7, obj = "SuperAceAccount"},
        hasLastResult = {type = 1,},
        lastResult = {type = 7, obj = "SuperAceResults"},
        playerSettings = {type = 7, obj = "SuperAceSettings"},
        runningRoundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        machineStatus = {type = 2, range = {min = -2147483648, max = 2147483647},},
    },},
    { name = "CsSuperAceBetNormalReq", type = 7, objs = {
        betAmount = {type = 2, range = {min = 0, max = 9223372036854775807},},
        calculateAmount = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSuperAceBetNormalResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        hasResult = {type = 1,},
        result = {type = 7, obj = "SuperAceResults"},
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSuperAceBetFreeReq", type = 7, objs = {
    },},
    { name = "CsSuperAceBetFreeResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        hasResult = {type = 1,},
        result = {type = 7, obj = "SuperAceResults"},
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSuperAceStopRoundReq", type = 7, objs = {
        roundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSuperAceStopRoundResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "CsSuperAceSynchronizeReq", type = 7, objs = {
    },},
    { name = "CsSuperAceSynchronizeResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        data = {type = 7, obj = "SuperAceEnterData"},
    },},
    { name = "CsSuperAceUpdateSettingsReq", type = 7, objs = {
        playerSettings = {type = 7, obj = "SuperAceSettings"},
    },},
    { name = "CsSuperAceUpdateSettingsResp", type = 7, objs = {
        code = {type = 2, range = {min = -2147483648, max = 2147483647},},
        playerSettings = {type = 7, obj = "SuperAceSettings"},
    },},
    { name = "ScSuperAceRoundStepPush", type = 7, objs = {
        runningRoundId = {type = 2, range = {min = 0, max = 9223372036854775807},},
        status = {type = 2, range = {min = -2147483648, max = 2147483647},},
        accountDiamond = {type = 2, range = {min = 0, max = 9223372036854775807},},
    },},
    { name = "ScSuperAceAccountUpdatePush", type = 7, objs = {
        value = {type = 2, range = {min = 0, max = 9223372036854775807},},
        offset = {type = 2, range = {min = 0, max = 9223372036854775807},},
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
    { name = "ScTodayRealTimeRankPush", type = 7, objs = {
        timestamp = {type = 2, range = {min = 0, max = 9223372036854775807},},
        timezone = {type = 2, range = {min = 0, max = 4294967295},},
        uid = {type = 4, range = {min = 0, max = 256},},
        rank = {type = 2, range = {min = 0, max = 4294967295},},
    },},
}
