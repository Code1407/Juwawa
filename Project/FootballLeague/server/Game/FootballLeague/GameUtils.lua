
GameUtils = {}
function GameUtils:isSameDay(timestamp1, timestamp2)
    local date1 = self:getDateTable(timestamp1)
    local date2 = self:getDateTable(timestamp2)

    return date1.year == date2.year 
        and date1.month == date2.month 
        and date1.day == date2.day
end

function GameUtils:getDateTable(timestamp)
    local date = os.date("*t", timestamp)
    return {
        year = date.year,
        month = date.month,
        day = date.day
    }
end
