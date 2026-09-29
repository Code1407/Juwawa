---@class RandomPool
RandomPool = class__()

function RandomPool:ctor__(idList)
    self.pool = {}
    for i, v in ipairs(idList) do
        self.pool[i] = v
    end
end

function RandomPool:getRandId()
    local count = #self.pool
    if count == 0 then
        return nil
    end

    local index = gRandom:gen_between_int(1, count)
    local id = self.pool[index]
    table.remove(self.pool, index)
    return id
end

function RandomPool:isEmpty()
    return #self.pool == 0
end