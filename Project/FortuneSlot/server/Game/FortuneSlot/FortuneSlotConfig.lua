require "FortuneSlot.FortuneSlotCommon"

FOLinePaths = {
    {0, 1, 2},
    {0, 5, 10},
    {4, 5, 6},
    {8, 9, 10},
    {8, 5, 2},
}
FOConnectIndexs = FOLinePaths

FOSlotProbabilitysDefault = {
    {0.25, 0.22, 0.16, 0.12, 0.08, 0.07, 0.02, 0.08},
    {0.25, 0.20, 0.16, 0.10, 0.06, 0.05, 0.02, 0.16},
    {0.25, 0.22, 0.20, 0.12, 0.08, 0.07, 0.04, 0.02},
    {0.47, 0.35, 0.10, 0.074, 0.001, 0.0, 0.005},
}

FOSpecialMultiples = {1, 2, 3, 5, 10, 15, 1}
FOGoodsMultiples = {0.4, 1, 1.6, 2, 2.4, 3, 4, 5}

FOSlotProbabilitysExtra = {
    {0.25, 0.22, 0.16, 0.12, 0.08, 0.07, 0.02, 0.08},
    {0.25, 0.20, 0.16, 0.10, 0.06, 0.05, 0.02, 0.16},
    {0.25, 0.22, 0.20, 0.12, 0.08, 0.07, 0.04, 0.02},
    {0.0, 0.52, 0.35, 0.12, 0.004, 0.001, 0.005},
}

FOWheelExtraMultiples = {1, 2, 3, 5, 10, 15}
FOWheelExtraRate = {0.5, 0.33, 0.12, 0.04, 0.009, 0.001}
FOWheelMultiples = {1, 3, 5, 8, 10, 15, 20, 30, 50, 100, 200, 1000}
FOWheelRate = {0.12, 0.27, 0.25, 0.10, 0.08, 0.05, 0.03, 0.06, 0.035, 0.004, 0.001, 0.0}

FORegenerateCount = 1
FORegenerateRange = { min = 0, max = 10 }
FOBalanceMinBet = 0
FOBaseBet = 200
FOBigWinMultiple = FOBaseBet * 10
FO_HEARTBEAT_INTERVAL = 1000
FODefaultRateType = FORateType.normal

local function cfgNumber(value, default)
    local numberValue = tonumber(value)
    if numberValue ~= nil then
        return numberValue
    end
    return default
end

local function cfgTable(name)
    if gConfigMgr and gConfigMgr.getBaseConfig then
        return gConfigMgr:getBaseConfig(name) or {}
    end
    return {}
end

local function firstConfigRow(tab)
    if type(tab) ~= "table" then
        return {}
    end
    if tab[1] ~= nil then
        return tab[1]
    end
    if tab["1"] ~= nil then
        return tab["1"]
    end
    if tab.id ~= nil or tab.baseBet ~= nil then
        return tab
    end
    return {}
end

local function sortedRows(tab)
    local rows = {}
    for key, row in pairs(tab or {}) do
        local sortId = tonumber((type(row) == "table" and (row.id or row.reelIndex or row.symbolId)) or key) or 0
        table.insert(rows, {
            sortId = sortId,
            row = row,
        })
    end
    table.sort(rows, function(a, b)
        return a.sortId < b.sortId
    end)
    return rows
end

local function buildLinePaths(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        table.insert(result, {
            cfgNumber(row.cell1, 0),
            cfgNumber(row.cell2, 0),
            cfgNumber(row.cell3, 0),
        })
    end
    return result
end

local function buildPaytable(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local symbolId = cfgNumber(row.symbolId, nil)
        if symbolId ~= nil then
            result[symbolId + 1] = tonumber(row.lineMultiple) or 0
        end
    end
    return result
end

local function normalizeSection(value)
    if value == nil then
        return ""
    end
    return string.lower(tostring(value)):gsub("%s+", "")
end

local function pushRateRowsBySection(tab)
    local result = {}
    for _, item in ipairs(sortedRows(tab)) do
        local row = item.row or {}
        local section = normalizeSection(row.section or row.group or row.type)
        if section ~= "" then
            result[section] = result[section] or {}
            table.insert(result[section], row)
        end
    end
    return result
end

local function hasArrayValue(tab)
    for _, value in pairs(tab or {}) do
        if value ~= nil then
            return true
        end
    end
    return false
end

local function compactNumericArray(tab, default)
    local result = {}
    local maxIndex = 0
    for index, _ in pairs(tab or {}) do
        if type(index) == "number" and index > maxIndex then
            maxIndex = index
        end
    end
    for index = 1, maxIndex do
        table.insert(result, cfgNumber(tab[index], default or 0))
    end
    return result
end

local function buildRateArrayBySymbol(rows, fieldName, default)
    local values = {}
    local hasAnyField = false
    for orderIndex, row in ipairs(rows or {}) do
        local symbolId = cfgNumber(row.symbolId, nil)
        local index = symbolId ~= nil and (symbolId + 1) or orderIndex
        if row[fieldName] ~= nil then
            hasAnyField = true
            values[index] = cfgNumber(row[fieldName], default or 0)
        end
    end
    if not hasAnyField then
        return {}
    end
    return compactNumericArray(values, default or 0)
end

local function buildValueAndRateArrays(rows)
    local values = {}
    local rates = {}
    for _, row in ipairs(rows or {}) do
        table.insert(values, cfgNumber(row.multiple, 0))
        table.insert(rates, cfgNumber(row.rate, 0))
    end
    return values, rates
end

local function applyFortuneSlotRateConfig(tab)
    local sections = pushRateRowsBySection(tab)
    if next(sections) == nil then
        return false
    end

    local normalRows = sections.normalreel or sections.reel or sections.slot or {}
    if #normalRows > 0 then
        local columns = {{}, {}, {}}
        for orderIndex, row in ipairs(normalRows) do
            local symbolId = cfgNumber(row.symbolId, nil)
            local index = symbolId ~= nil and (symbolId + 1) or orderIndex
            columns[1][index] = cfgNumber(row.column1, 0)
            columns[2][index] = cfgNumber(row.column2, 0)
            columns[3][index] = cfgNumber(row.column3, 0)
        end
        for index = 1, 3 do
            local column = compactNumericArray(columns[index], 0)
            if #column > 0 then
                FOSlotProbabilitysDefault[index] = column
                FOSlotProbabilitysExtra[index] = FOCloneTable(column)
            end
        end
    end

    local normalLastRows = sections.normallast or sections.last or sections.defaultlast or {}
    local normalLast = buildRateArrayBySymbol(normalLastRows, "rate", 0)
    if #normalLast > 0 then
        FOSlotProbabilitysDefault[4] = normalLast
    end

    local extraLastRows = sections.extralast or sections.freelast or {}
    local extraLast = buildRateArrayBySymbol(extraLastRows, "rate", 0)
    if #extraLast > 0 then
        FOSlotProbabilitysExtra[4] = extraLast
    end

    local wheelValues, wheelRates = buildValueAndRateArrays(sections.wheel or {})
    if #wheelValues > 0 and hasArrayValue(wheelValues) then
        FOWheelMultiples = wheelValues
    end
    if #wheelRates > 0 and hasArrayValue(wheelRates) then
        FOWheelRate = wheelRates
    end

    local extraWheelValues, extraWheelRates = buildValueAndRateArrays(sections.extrawheel or sections.freewheel or {})
    if #extraWheelValues > 0 and hasArrayValue(extraWheelValues) then
        FOWheelExtraMultiples = extraWheelValues
    end
    if #extraWheelRates > 0 and hasArrayValue(extraWheelRates) then
        FOWheelExtraRate = extraWheelRates
    end

    return true
end

function FortuneSlotLoadConfig()
    local globalConfig = firstConfigRow(cfgTable("FortuneSlotGlobal"))
    FOBaseBet = cfgNumber(globalConfig.baseBet, FOBaseBet)
    FOBigWinMultiple = cfgNumber(globalConfig.bigWinMultiple, FOBigWinMultiple)
    FOBalanceMinBet = cfgNumber(globalConfig.balanceMinBet, FOBalanceMinBet)
    FORegenerateCount = cfgNumber(globalConfig.regenerateCount, FORegenerateCount)
    FORegenerateRange = {
        min = cfgNumber(globalConfig.regenerateMin, FORegenerateRange.min),
        max = cfgNumber(globalConfig.regenerateMax, FORegenerateRange.max),
    }
    FODefaultRateType = cfgNumber(globalConfig.defaultRateType, FODefaultRateType)
    FO_HEARTBEAT_INTERVAL = cfgNumber(globalConfig.heartbeatInterval, FO_HEARTBEAT_INTERVAL)

    local linePaths = buildLinePaths(cfgTable("FortuneSlotLinePath"))
    if #linePaths > 0 then
        FOLinePaths = linePaths
        FOConnectIndexs = FOLinePaths
    end

    local paytable = buildPaytable(cfgTable("FortuneSlotPaytable"))
    if next(paytable) ~= nil then
        FOGoodsMultiples = paytable
    end

    applyFortuneSlotRateConfig(cfgTable("FortuneSlotRate"))

    local scene = SvrSystem and SvrSystem.FortuneSlot and SvrSystem.FortuneSlot.getScene and SvrSystem.FortuneSlot:getScene() or nil
    if scene then
        scene.gameRateDefault = FortuneSlotDefaultGameRate()
    end
end

function FortuneSlotEnsureConfig()
    if (#FOLinePaths <= 0 or next(FOGoodsMultiples) == nil or #FOSlotProbabilitysDefault <= 0) and gConfigMgr ~= nil then
        FortuneSlotLoadConfig()
    end
end

function FortuneSlotDefaultGameRate()
    return {
        rateType = FODefaultRateType,
        slot = FOCloneTable(FOSlotProbabilitysDefault),
        slotExtra = FOCloneTable(FOSlotProbabilitysExtra),
        wheelRate = FOCloneTable(FOWheelRate),
        wheelExtraRate = FOCloneTable(FOWheelExtraRate),
        regenerateCount = FORegenerateCount,
        regenerateRange = FOCloneTable(FORegenerateRange),
    }
end

if gConfigMgr ~= nil then
    FortuneSlotLoadConfig()
end
