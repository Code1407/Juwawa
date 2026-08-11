require "GameBase.GameSystemBase"
require "GameError"

Seven7Result = class__(SvrSystemBase)

--构造函数
function Seven7Result:ctor__()
    SvrSystemBase.ctor__(self, "Seven7Result")
end

--数据加载回调
function Seven7Result:onLoad(data)
    if not data then 
        data = {}
    end
    SvrSystemBase.onLoad(self, data)
end

--存储游戏结果
function Seven7Result:setResultData(rewardID, periodsNum, prepareTime)
    local data = self:getData() 
    data[periodsNum]{
        periodsNum = periodsNum,
        prepareTime = prepareTime,
        rewardID = rewardID
    }
end

--存储下注信息
function Seven7Result:insetResultForBetHistory(betHistory, nowPeriodsNum)
    if not betHistory then
        return nil
    end
    local data = self:getData() 
    local tb = {}
    tb.list = {}
    for _, value in pairs(betHistory) do
        local periodsNum = value.periodsNum
        local isCurGame = (curServerID == serverID) and (nowPeriodsNum == periodsNum)
        if not isCurGame then
           local resultID = data and data[serverID] and data[serverID][periodsNum] and data[serverID][periodsNum].rewardID or nil
            if  resultID then
                value.rewardID = resultID
                table.insert(tb.list, value)  
            end
        end       
    end
    return tb
end

