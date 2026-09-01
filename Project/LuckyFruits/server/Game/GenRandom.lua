-- ============================================================
-- GenRandom 模块：RandomTest 返奖率测试入口
-- 参照 Seven7 的测试口径：所有下注区域等额下注，再用总奖励除以
-- 总下注，避免随机单押带来的区域选择偏差。
-- ============================================================

require "LuckyFruits.LuckyFruits"

-- 标记配置是否已加载，避免重复初始化
local initialized = false

--- 模拟一次等额全押下注与开奖
-- @param price number 模拟下注金额（向下取整，最小为1）
-- @return number  奖励倍率（奖励金额 / 下注金额）
function GenRandom(price)
    -- 首次调用时懒加载LuckyFruits配置
    if not initialized then
        initialized = true
        LuckyFruitsLoadConfig()
    end
    price = math.max(1, math.floor(tonumber(price) or 100))

    -- 与 Seven7 一致，对所有区域各下注一份 price。
    -- LuckyFruits 共 5 个下注区域，因此单局总下注为 price * 5。
    local bets = { price, price, price, price, price }
    local result = LFGenerateResult()
    local totalBet = price * #bets
    local reward = LFRevenue(bets, result.resultDetail)
    local multiple = reward / totalBet

    -- 与 Seven7 一样只返回倍率。RandomTest 收到第二返回值时会按标签
    -- 额外生成 winPos/detail 分组；省略标签后 CSV 只保留汇总数据。
    return multiple
end
