-- ============================================================
-- 随机奖励生成工具模块
-- 用于批量生成随机符号序列并推送到配置系统
-- 主要用于测试和初始化奖励数据
-- ============================================================

local gRandom = gRandom           -- 随机数生成器
local gConfigMgr = gConfigMgr     -- 游戏逻辑配置管理器
local push_item = push_item       -- 推送配置项接口
local push_tag_item = push_tag_item
local json = json                 -- JSON编解码接口
local hash = hash                 -- 计算字符串哈希

-- 入口函数：批量生成随机奖励序列
-- allCount: 需要生成的奖励序列总数
function Run(allCount)
    log_info("run({}) start...", allCount)
    local cfg = gConfigMgr:getBaseConfig("Symbol")
    log_info("cfg = `{}`", log_view(cfg))
    local count = 0
    while true do
        local tab = {}
        -- 生成30个随机符号（1-14），对应15个格子（5列x3行）
        for i = 1, 30, 1 do
            local flag = gRandom:gen_between_int(1, 14) -- 符号ID范围1~14
            tab[i] = flag
        end
        local buf = json.encode(tab) -- JSON编码
        local item = buf:data()
        push_item(100, item) -- 推送到配置系统
        count = count + 1
        if count >= allCount then
            break
        end
    end
    log_info("run end...")
end