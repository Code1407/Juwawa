---@class RankData
RankData = class__()

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

function RankData:ctor__(rankMaxSize, rankDataMap)
    self.rankMaxSize = rankMaxSize
    self.dataList = {}
    self.rankList = {}

    if rankDataMap then
        for uid, data in pairs(rankDataMap) do
            data.uid = uid
            data.rankNum = 0
            self.rankList[#self.rankList + 1] = data
            self.dataList[uid] = data
        end

        table.sort(self.rankList, _isHigherRank)
        local rankLength = math.min(#self.rankList, rankMaxSize)
        for index, item in ipairs(self.rankList) do
            item.rankNum = index <= rankLength and index or 0
        end
        for index = #self.rankList, rankLength + 1, -1 do
            -- 始终从榜尾删除，保持数组连续，并避免删除中间元素产生额外搬移。
            table.remove(self.rankList, index)
        end
    end
end


function RankData:updateRankList(data)
    -- RankCommon统一传入完整排行对象；缺少uid时不能写入dataList。
    if type(data) ~= "table" or data.uid == nil then
        return false
    end

    local uid = data.uid
    local rankData = self.dataList[uid]
    local oldScore = rankData and rankData.score or 0
    local oldUpdateTime = rankData and rankData.updateTime or nil
    local oldRank = rankData and rankData.rankNum or 0
    if rankData then
        for key, value in pairs(data) do
            if key ~= "rankNum" then
                rankData[key] = value
            end
        end
    else
        data.rankNum = 0
        rankData = data
        self.dataList[uid] = rankData
    end

    return self:updateRanking(rankData, oldRank, oldScore, oldUpdateTime)
end

function RankData:updateRanking(data, oldRank, oldScore, oldUpdateTime)
    if self.rankMaxSize <= 0 then
        data.rankNum = 0
        return false
    end

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
function RankData:compare(data)
    local rankList = self.rankList
    local curRankLength = #rankList
    local lastPlayer = rankList[curRankLength]
    if curRankLength >= self.rankMaxSize and not _isHigherRank(data, lastPlayer) then
        -- 榜单已满且未超过榜尾时不插入，避免插入后又删除自身并留下错误rankNum。
        data.rankNum = 0
        return false
    end
    
    local insertPos = curRankLength + 1
    for i = curRankLength, 1, -1 do
        if _isHigherRank(data, rankList[i]) then
            insertPos = i
        else
            break
        end
    end

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

function RankData:getRankDataList()
    return self.dataList
end

function RankData:clear()
    self.dataList = {}
    self.rankList = {}
end
