
local gRandom = gRandom --随机数生成器
local gConfigMgr = gConfigMgr --游戏逻辑配置管理器
local push_item = push_item --推送配置接口
local push_tag_item = push_tag_item
local json = json --json接口
local hash = hash --计算字符串哈希

--入口函数
function Run(allCount)
    log_info("run({}) start...", allCount)
    local cfg = gConfigMgr:getBaseConfig("Symbol")
    log_info("cfg = `{}`", log_view(cfg))
    local count = 0
    while true do
        local tab = {}
        for i = 1, 30, 1 do
            local flag = gRandom:gen_between_int(1, 14)
            tab[i] = flag
        end
        local buf = json.encode(tab)
        local item = buf:data()
        push_item(100, item)
        count = count + 1
        if count >= allCount then
            break
        end
    end
    log_info("run end...")
end