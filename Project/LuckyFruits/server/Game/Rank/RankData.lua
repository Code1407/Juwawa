-- ============================================================
-- RankData 模块：排行榜数据结构与增量排序
-- 维护一个定容排行榜，支持增量更新与高效重排序。
-- 排序规则：积分降序优先，积分相同则按更新时间升序（先达成者排前）。
-- 性能优化：采用"先定位后移动"策略，避免每次比较都交换表元素，
--          中间玩家每人只更新一次rankNum。
-- 被 RankCommon 用于本地排行榜的日榜/周榜数据管理。
-- ============================================================

---@class RankData
RankData = class__()

-- 比较两个排行项的优先级：a是否应排在b前面
-- 规则：积分高者排前；积分相同则更新时间晚者排前（先达成者排前）
-- 注意：双方updateTime均为空时保持原有顺序（返回false）
local function _isHigherRank(a, b)
    if a.score ~= b.score then
        return a.score > b.score
    end
    -- 分数相同时，有updateTime才参与比较；双方都为空则保持原有顺序。
    if a.updateTime ~= nil or b.updateTime ~= nil then
        return (a.updateTime or 0) > (b.updateTime or 0)
    end
    return false
end

-- 构造函数：初始化排行榜数据结构
-- rankMaxSize为容量上限，超出部分从榜尾淘汰
-- rankDataMap可选：用于从已有数据恢复排行榜
function RankData:ctor__(rankMaxSize, rankDataMap)
    self.rankMaxSize = rankMaxSize
    self.dataList = {}   -- UID到排行项的映射（含已淘汰但仍在dataList中的项）
    self.rankList = {}   -- 有序排行榜数组（仅含榜内项）

    -- 从已有数据映射恢复排行榜：转换为数组并排序、赋名次、裁剪
    if rankDataMap then
        for uid, data in pairs(rankDataMap) do
            data.uid = uid
            data.rankNum = 0
            self.rankList[#self.rankList + 1] = data
            self.dataList[uid] = data
        end

        -- 排序并赋名次
        table.sort(self.rankList, _isHigherRank)
        local rankLength = math.min(#self.rankList, rankMaxSize)
        for index, item in ipairs(self.rankList) do
            item.rankNum = index <= rankLength and index or 0
        end
        -- 淘汰榜外项：从榜尾删除保持数组连续
        for index = #self.rankList, rankLength + 1, -1 do
            -- 始终从榜尾删除，保持数组连续，并避免删除中间元素产生额外搬移。
            table.remove(self.rankList, index)
        end
    end
end


-- 更新排行榜：插入或更新某UID的排行项并重新排序
-- data必须包含uid字段，否则拒绝写入
function RankData:updateRankList(data)
    -- RankCommon统一传入完整排行对象；缺少uid时不能写入dataList。
    if type(data) ~= "table" or data.uid == nil then
        return false
    end

    local uid = data.uid
    local rankData = self.dataList[uid]
    -- 记录旧值用于增量排序方向判断
    local oldScore = rankData and rankData.score or 0
    local oldUpdateTime = rankData and rankData.updateTime or nil
    local oldRank = rankData and rankData.rankNum or 0
    if rankData then
        -- 已存在：更新字段（保留rankNum不动，由后续排序更新）
        for key, value in pairs(data) do
            if key ~= "rankNum" then
                rankData[key] = value
            end
        end
    else
        -- 新增：初始化rankNum为0
        data.rankNum = 0
        rankData = data
        self.dataList[uid] = rankData
    end

    return self:updateRanking(rankData, oldRank, oldScore, oldUpdateTime)
end

-- 增量重排序：根据分数变化方向选择向上或向下比较
-- 榜内项：分数增加向上比较，减少向下比较，相同按updateTime判断
-- 榜外项：调用compare尝试插入
function RankData:updateRanking(data, oldRank, oldScore, oldUpdateTime)
    if self.rankMaxSize <= 0 then
        data.rankNum = 0
        return false
    end

    -- 空榜：直接插入为第一名
    if #self.rankList <= 0 then
        data.rankNum = 1
        self.rankList[1] = data
        return true
    end

    --在排行榜内
    if oldRank > 0 then
        -- 增量排序只比较新旧分数，确定方向后只向一个方向移动。
        if data.score > oldScore then
            --分数增加，向上比较
            return self:compareUp(oldRank)
        elseif data.score < oldScore then
           --分数减少，向下比较
           return self:compareDown(oldRank)
        elseif data.updateTime ~= nil or oldUpdateTime ~= nil then
            -- 分数相同时，有updateTime才决定局部移动方向，空值按0处理。
            if (data.updateTime or 0) > (oldUpdateTime or 0) then
                return self:compareUp(oldRank)
            elseif (data.updateTime or 0) < (oldUpdateTime or 0) then
                return self:compareDown(oldRank)
            end
        end
        return false
    --不在排行榜内
    else
       return self:compare(data)
    end
end

-- 处理分数增加的情况（向上比较）
-- 优化：先定位目标位置，再统一后移中间元素，避免反复交换
function RankData:compareUp(startIndex)
    local rankList = self.rankList
    local moveData = rankList[startIndex]
    local targetIndex = startIndex

    -- 先只比较并定位，避免每前进一名都交换两次表元素。
    for i = startIndex - 1, 1, -1 do
        if _isHigherRank(moveData, rankList[i]) then
            targetIndex = i
        else
            break
        end
    end

    if targetIndex == startIndex then
        return false
    end

    -- 目标位置确定后统一后移，中间玩家每人只更新一次。
    for i = startIndex, targetIndex + 1, -1 do
        local shiftData = rankList[i - 1]
        rankList[i] = shiftData
        shiftData.rankNum = i
    end
    rankList[targetIndex] = moveData
    moveData.rankNum = targetIndex
    return true
end

-- 处理分数减少的情况（向下比较）
-- 优化：先定位目标位置，再统一前移中间元素
function RankData:compareDown(startIndex)
    local rankList = self.rankList
    local moveData = rankList[startIndex]
    local targetIndex = startIndex

    -- 先只比较并定位，避免每后退一名都交换两次表元素。
    for i = startIndex + 1, #rankList do
        if _isHigherRank(rankList[i], moveData) then
            targetIndex = i
        else
            break
        end
    end

    if targetIndex == startIndex then
        return false
    end

    -- 目标位置确定后统一前移，中间玩家每人只更新一次。
    for i = startIndex, targetIndex - 1 do
        local shiftData = rankList[i + 1]
        rankList[i] = shiftData
        shiftData.rankNum = i
    end
    rankList[targetIndex] = moveData
    moveData.rankNum = targetIndex
    return true
end

-- 处理不在排行榜中的玩家(向上比较)
-- 榜满且未超过榜尾时拒绝插入，避免插入后又删除自身并留下错误rankNum
function RankData:compare(data)
    local rankList = self.rankList
    local curRankLength = #rankList
    local lastPlayer = rankList[curRankLength]
    if curRankLength >= self.rankMaxSize and not _isHigherRank(data, lastPlayer) then
        -- 榜单已满且未超过榜尾时不插入，避免插入后又删除自身并留下错误rankNum。
        data.rankNum = 0
        return false
    end
    
    -- 定位插入位置
    local insertPos = curRankLength + 1
    for i = curRankLength, 1, -1 do
        if _isHigherRank(data, rankList[i]) then
            insertPos = i
        else
            break
        end
    end

    -- 榜满时移除榜尾，否则长度+1
    local isFull = curRankLength >= self.rankMaxSize
    local newRankLength = isFull and curRankLength or curRankLength + 1
    local removeData = isFull and lastPlayer or nil

    -- 直接移动数组并覆盖榜尾，省去table.insert后再table.remove的重复搬移。
    for i = newRankLength, insertPos + 1, -1 do
        local shiftData = rankList[i - 1]
        rankList[i] = shiftData
        shiftData.rankNum = i
    end
    rankList[insertPos] = data
    data.rankNum = insertPos

    if removeData then
        -- 被挤出榜单的数据仍保留在dataList中，因此名次必须重置为0。
        removeData.rankNum = 0
    end
    return true
end

-- 获取排行榜列表：返回榜内项的副本（最多rankMaxSize条）
function RankData:getRankList()
    local rank = {}
    local curRankLength = #self.rankList
    if curRankLength <= 0 then
        return rank
    end

    local rankLength = math.min(curRankLength, self.rankMaxSize)
    table.move(self.rankList, 1, rankLength, 1, rank)
    return rank
end

-- 获取全量数据映射（含已淘汰但仍在dataList中的项）
function RankData:getRankDataList()
    return self.dataList
end

-- 清空排行榜：同时清空有序列表与数据映射
function RankData:clear()
    self.dataList = {}
    self.rankList = {}
end
