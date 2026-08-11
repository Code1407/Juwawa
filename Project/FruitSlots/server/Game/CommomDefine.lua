-- ============================================================
-- 通用枚举定义模块
-- 定义了游戏中使用的各类枚举常量
-- ============================================================

-- 单控分析类型：控制玩家输赢的策略类型
EAnalyType = {
    NoLimit = 0,    -- 无限制（不进行单控）
    PlayerWin = 1,  -- 玩家赢（控制玩家获胜）
    PlayerLoss = 2, -- 玩家输（控制玩家失败）
}

-- 游戏赔率结果码
EGameOddsResult = {
    Unknown = 0,       -- 未知
    Success = 1,       -- 成功
    RerandomMax = 2,   -- 达到重随机上限
    RulerMax = 3,      -- 达到规则上限
    SlotBusy = 4,      -- 老虎机忙碌中
    AllPlayerWin = 5,  -- 所有玩家获胜
    SameWithAnaly = 6, -- 与分析结果一致
}

-- 金币操作类型
ECoinsOperateType = {
    WinAdd = 1,   -- 获胜增加
    BetSub = 2,   -- 下注扣除
    MailAdd = 3,  -- 邮件发放增加
    RankAdd = 100,-- 排行榜奖励增加
}

-- 特殊回合ID
ESpecialRoundId = {
    RankAward = 999999,  -- 排行榜奖励回合
    MailAward = 1000000, -- 邮件奖励回合
}

-- 邮件奖励状态
EMailRewardState = {
    NoReward = 0,   -- 无奖励
    NoReceive = 1,  -- 未领取
    Received = 2,   -- 已领取
}

-- 资源类型
EResourceType = {
    Coins = 1,       -- 金币
    AvatarFrame = 2, -- 头像框
}
