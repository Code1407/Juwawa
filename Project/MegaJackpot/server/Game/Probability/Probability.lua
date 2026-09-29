-- ============================================================
-- 加权随机概率工具类
-- 根据权重列表构建区间划分，高效查询随机命中项
-- ============================================================

---@class Probability
Probability = class__()

-- 构造函数：根据权重列表初始化概率区间
-- weightList: 权重数组（与idList一一对应）
-- idList:     选项ID数组
function Probability:ctor__(weightList, idList)
    self.total = 0       -- 权重总和
    self.rangeList = {}  -- 区间列表 [{first, second}, ...]
    self.idList = idList

    if weightList and idList and #weightList > 0 and #weightList == #idList then
        local firstWeight = tonumber(weightList[1])
        if not firstWeight or firstWeight < 0 then
            log_error("Probability ctor invalid weight at index 1")
            return
        end
        self.total = firstWeight
        local x = 0

        -- 从第二个元素开始，构建前闭后开区间
        for i = 2, #weightList, 1 do
            table.insert(self.rangeList,{
                first = x,
                second = self.total
            })
            x = self.total
            local weight = tonumber(weightList[i])
            if not weight or weight < 0 then
                self.total = 0
                self.rangeList = {}
                log_error("Probability ctor invalid weight at index:{0}", i)
                return
            end
            self.total = self.total + weight
        end

        -- 插入最后一个区间
        table.insert(self.rangeList,{
            first = x,
            second = self.total
        })
    else
        log_error("Probability ctor fail")
    end
end

-- 根据指定随机数查找对应索引
-- randNum: [0, total) 范围内的随机数
-- 返回: 命中的区间索引（从1开始），-1表示未找到
function Probability:getRandIndex(randNum)
    for index, rangeData in pairs(self.rangeList) do
        if randNum >= rangeData.first and randNum < rangeData.second then
            return index
        end
    end
    return -1
end

-- 使用内部随机数生成器获取随机区间索引
function Probability:getRandRange()
    if not self.total or self.total <= 0 or #self.rangeList <= 0 then
        return -1
    end
    local r = gRandom:gen_between_int(0, self.total - 1)
    return self:getRandIndex(r)
end

-- 获取随机命中的ID
function Probability:getRandId()
    local index = self:getRandRange()
    if index < 1 then
        return nil
    end
    return self.idList[index]
end
