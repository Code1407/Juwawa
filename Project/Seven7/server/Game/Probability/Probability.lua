---@class Probability
Probability = class__()

function Probability:ctor__(weightList, idList)
    self.total = 0
    self.rangeList = {}
    self.idList = idList

    if weightList and idList and #weightList == #idList then

        self.total = weightList[1]
        local x = 0

        for i = 2, #weightList, 1 do
            table.insert(self.rangeList,{
                first = x,
                second = self.total 
            })
            x = self.total
            self.total = self.total + weightList[i]
        end

        table.insert(self.rangeList,{
            first = x,
            second = self.total 
        })
    else
        log_error("Probability ctor fail")
    end
end

function Probability:getRandIndex(randNum)
    for index, rangeData in pairs(self.rangeList) do
        if randNum >= rangeData.first and randNum < rangeData.second then
            return index
        end
    end
    return -1
end


function Probability:getRandRange()
    local r = gRandom:gen_between_int(0, self.total - 1)
    return self:getRandIndex(r)
end

function Probability:getRandId()
    local index = self:getRandRange()
    if index < 1 then
        return nil
    end
    return self.idList[index]
end