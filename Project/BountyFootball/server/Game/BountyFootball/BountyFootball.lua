-- 加载豪车游戏配置模块
require "BountyFootball.BountyFootballConfig"

-- 游戏状态枚举
-- stop:       停止状态 (轮盘停止转动)
-- bet:        下注状态 (玩家可下注阶段)
-- run:        运行状态 (轮盘正在转动)
-- final:      结算状态 (本局结算)
-- heartbeat:  心跳状态 (等待下一局开始)
-- maintenance:维护状态 (服务器维护中)
LCGameStatus = { stop = 0, bet = 1, run = 2, final = 4, heartbeat = 7, maintenance = 99998 }

-- 交易结果码枚举，用于下注/结算等交易的返回状态
-- success:      操作成功
-- insufficient: 金币不足
-- missTime:     超时错过下注时间
-- closeServer:  服务器已关闭
-- fail:         操作失败
-- repeatOrder:  重复订单
LCTradeCode = { success = 0, insufficient = -1, missTime = -2, closeServer = -4, fail = -8, repeatOrder = -11 }

-- 深拷贝函数
-- 功能：对传入的值进行递归深拷贝，确保返回的表与原表完全独立
-- 参数：v - 任意值（若为 table 则递归拷贝，否则直接返回）
-- 返回：拷贝后的新值
function LCClone(v)
    if type(v) ~= "table" then return v end
    local out = {}
    for k, value in pairs(v) do
        out[k] = LCClone(value)
    end
    return out
end

-- 数组求和函数
-- 功能：对传入的数组中每个元素取整（向下取整）后求和，负数按 0 计算
-- 参数：values - 数值数组
-- 返回：求和后的整数值
function LCArraySum(values)
    local total = 0
    for _, value in ipairs(values or {}) do
        total = total + math.max(0, math.floor(tonumber(value) or 0))
    end
    return total
end

-- 创建空下注数组
-- 功能：返回一个包含 10 个 0 的数组，表示 10 个下注位置均无下注
-- 返回：长度为 10 的全零数组
function LCEmptyBets()
    return { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
end

-- 等级数量：从通用配置获取，默认 4 级  平台配置可覆盖 平台可能配置为 1 级或更多级
local function LCGetGradeCount()
    -- 本地配置仅作为平台配置尚未就绪时的兜底。
    local count = 4
    local localGradeCount = BountyFootballConst and tonumber(BountyFootballConst.gradeCount) or nil
    if localGradeCount and localGradeCount > 0 then
        count = math.floor(localGradeCount)
    end

    -- RespGameConfig.CommonConfig 由框架缓存到 gApp，字段名为 Costs。
    -- 平台配置优先级最高，并允许配置为任意大于 0 的档位数量。
    local commonConfig = gApp and gApp.getProjCommon and gApp:getProjCommon() or nil
    local costs = type(commonConfig) == "table" and commonConfig.Costs or nil
    if type(costs) == "table" then
        local platformCount = #costs
        if platformCount > 0 then
            count = platformCount
        end
    end
    return count
end

-- 创建空下注矩阵（10 个轮子 × gradeCount 级）
-- 参数：gradeCount number 可选，等级数量，默认从配置获取或 5
-- 返回：10 × gradeCount 的全零二维数组
function LCEmptyChipCounts(gradeCount)
    gradeCount = math.max(1, gradeCount or LCGetGradeCount())
    local result = {}
    for i = 1, 10 do
        local row = {}
        for j = 1, gradeCount do
            row[j] = 0
        end
        result[i] = row
    end
    return result
end

function LCMergeChipCounts(base, delta)
    local gradeCount = LCGetGradeCount()
    if base and base[1] then
        gradeCount = math.max(gradeCount, #base[1])
    end
    if delta and delta[1] then
        gradeCount = math.max(gradeCount, #delta[1])
    end
    gradeCount = math.max(1, gradeCount)
    local result = LCClone(base or LCEmptyChipCounts(gradeCount))
    for i = 1, 10 do
        local resultRow = result[i]
        if not resultRow or #resultRow < gradeCount then
            local newRow = {}
            for j = 1, gradeCount do
                newRow[j] = (resultRow and resultRow[j]) or 0
            end
            resultRow = newRow
            result[i] = resultRow
        end
        local deltaRow = delta and delta[i] or {}
        local deltaLen = #deltaRow
        for j = 1, gradeCount do
            local baseVal = math.max(0, math.floor(tonumber(resultRow[j]) or 0))
            local deltaVal = 0
            if j <= deltaLen then
                deltaVal = math.max(0, math.floor(tonumber(deltaRow[j]) or 0))
            end
            resultRow[j] = baseVal + deltaVal
        end
    end
    return result
end

-- 概率随机结果函数
-- 功能：基于配置的概率权重，随机抽取一个结果索引
-- 逻辑流程：
--   1. 计算所有结果的概率总和 total
--   2. 若 total <= 0，说明配置未加载，重新加载配置后再次计算
--   3. 若 total 仍 <= 0，返回 0 作为默认结果
--   4. 生成 [0, 1) 区间内的随机数 roll（优先使用 gRandom 随机生成器）
--   5. 遍历每个结果，累加其相对概率 (probability / total) 形成游标 cursor
--   6. 当 roll < cursor 时，返回当前结果索引（i - 1，从 0 开始计数）
--   7. 若所有概率累加后仍未命中，返回最后一个结果索引
-- 返回：随机选中的结果索引（0 基）
function LCRandomResult()
    local total, cursor = 0, 0
    for _, probability in ipairs(LCResultProbability or {}) do
        total = total + probability
    end
    if total <= 0 then
        BountyFootballLoadConfig()
        for _, probability in ipairs(LCResultProbability or {}) do
            total = total + probability
        end
    end
    if total <= 0 then
        return 0
    end

    local roll = (gRandom and gRandom.gen_between_int and gRandom:gen_between_int(0, 999999) / 1000000) or math.random()
    for i, probability in ipairs(LCResultProbability or {}) do
        cursor = cursor + probability / total
        if roll < cursor then
            return i - 1
        end
    end
    return #(LCResultProbability or {}) - 1
end

-- 收益计算函数
-- 功能：根据下注金额和开奖结果计算本局收益
-- 计算公式：收益 = 下注金额 × 赔率
-- 逻辑：
--   1. 将结果 result 转为位置索引（+1 转为 1 基索引）
--   2. 通过 LCResultBetIndex 查找该结果对应的下注位置
--   3. 通过 LCWheelMultiple 获取该位置的赔率
--   4. 收益 = bets[betIndex] × LCWheelMultiple[position]，向下取整
-- 参数：bets   - 下注数组（每个位置的下注金额）
--       result - 开奖结果索引
-- 返回：本局收益金额（整数）
function LCRevenue(bets, result)
    local position = math.floor(tonumber(result) or -1) + 1
    local betIndex = LCResultBetIndex[position]
    if not betIndex then
        return 0
    end
    return math.floor((tonumber(bets[betIndex]) or 0) * (LCWheelMultiple[position] or 0))
end

-- 获取玩家账户信息
-- 功能：从玩家对象中提取钻石数、头像、昵称、等级等信息，封装为字典返回
-- 参数：player - 玩家对象
-- 返回：包含 diamond(钻石), avatar(头像), nickname(昵称), level(等级) 的字典
function LCAccount(player)
    return { diamond = math.floor(player:getCoins() or 0), avatar = player:getAvatarUrl() or "", nickname = player:getName() or "", level = 0 }
end
