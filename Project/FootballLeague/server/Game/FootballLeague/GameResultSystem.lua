require "GameBase.GameSystemBase"
require "GameError"

GameResultSystem = class__(GameSystemBase)

--构造函数
function GameResultSystem:ctor__()
    GameSystemBase.ctor__(self, "GameResultSystem")
end

--数据加载回调
function GameResultSystem:onLoad(data)
    if not data then 
        data = {}
    end
    GameSystemBase.onLoad(self, data)
end

--保存开奖结果
function GameResultSystem:setResultData(rewardResultID, periodsNum, prepareTime)
    local serverIndex = gApp:getServerIndex()
    local data = self:getData() 
    if not data[serverIndex] then
        data[serverIndex] = {}
    end
    if not data[serverIndex][periodsNum] then
        data[serverIndex][periodsNum] = {}
    end
    data[serverIndex][periodsNum].periodsNum = periodsNum
    data[serverIndex][periodsNum].prepareTime = prepareTime
    data[serverIndex][periodsNum].rewardResultID = rewardResultID
end


function GameResultSystem:getdaa(betHistory, nowPeriodsNum)
    if not betHistory then
        return nil
    end
    local data = self:getData() 
    local curServerID = gApp:getServerIndex()
    local tb = {}
    tb.list = {}
    for _, value in pairs(betHistory) do
        local serverID = value.serverIndex
        local periodsNum = value.periodsNum
        local isCurGame = (curServerID == serverID) and (nowPeriodsNum == periodsNum)
        if not isCurGame then
        local resultID = data and data[serverID] and data[serverID][periodsNum] and data[serverID][periodsNum].rewardResultID or nil
            if  resultID then
                value.rewardResultID = resultID
                table.insert(tb.list, value)  
            end
        end       
    end
    return tb
end

