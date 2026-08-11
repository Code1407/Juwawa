require "FortuneSlot.FortuneSlotCommon"
require "FortuneSlot.FortuneSlotConfig"

FortuneSlotMachine = class__()

function FortuneSlotMachine:ctor__(scene, playerSys)
    self.scene = scene
    self.playerSys = playerSys
    self.lastRoundRateType = FORateType.normal
end

function FortuneSlotMachine:getGameRate(betAmount)
    if self.scene.gameRates and self.scene.gameRates[betAmount] then
        return FOCloneTable(self.scene.gameRates[betAmount])
    end
    return FOCloneTable(self.scene.gameRateDefault or FortuneSlotDefaultGameRate())
end

function FortuneSlotMachine:setLastRoundRateType(rateType)
    self.lastRoundRateType = rateType or FORateType.normal
end

function FortuneSlotMachine:getLastRoundRateType()
    return self.lastRoundRateType or FORateType.normal
end

function FortuneSlotMachine:balanceKill(buttonAmount, calculateAmount, revenue)
    return FORateType.normal
end

function FortuneSlotMachine:getResults(betAmount, calculateAmount1, isExtra,GamePlayer,roundId)
    local gameRate = self:getGameRate(betAmount)
    local calculateAmount=0
    if isExtra then
        calculateAmount=math.floor(betAmount/1.5)
    else
        calculateAmount=betAmount
    end
    self:setLastRoundRateType(gameRate.rateType or FORateType.normal)
    local slot = (isExtra and gameRate.slotExtra) or gameRate.slot
    local slotResults = {}
    local slotResults1={}
    local singleAnalyPlayer=gAnaly:singleAnaly(GamePlayer,roundId)
    local singleAnalyType  =singleAnalyPlayer.analyType
    local singleRewardMax  =singleAnalyPlayer.rewardMax
    local singleoddsType   =singleAnalyPlayer.oddsType
    local singleMaxTimes   =singleAnalyPlayer.rerandomMax
    local rewardRateMax    =singleAnalyPlayer.rewardRateMax
    local rewardwaterRuler =singleAnalyPlayer.waterRuler
    local gameSingleTemp   =0

    local gameMax1  =nil
    local addCoins1 =0
    local rewardMult1=singleRewardMax
    local rewardMult2=rewardRateMax/10000*calculateAmount
    local rewardMult =0
    if rewardMult1~=0 and rewardMult2==0 then
        rewardMult=rewardMult1
    elseif rewardMult1==0 and rewardMult2~=0 then
        rewardMult=rewardMult2
    elseif rewardMult1~=0 and rewardMult2~=0 then
        if rewardMult1<=rewardMult2 then
            rewardMult=rewardMult1
        else
            rewardMult=rewardMult2
        end
    end
    for q=1,100 do
        slotResults1 = self:runGenerateResults(betAmount, calculateAmount, slot, isExtra and true or false,singleAnalyPlayer)
        addCoins1= FORoundInt((slotResults1.multiple or 0) * (calculateAmount or 0))
        if gameMax1==nil or addCoins1<=gameMax1 then
            slotResults=slotResults1
            gameMax1=addCoins1
        end
        if gameMax1<=rewardMult or rewardMult==0 then
            break
        end
    end
    log_info("调控第一次的数值为"..tostring(gameMax1))
    if singleAnalyType==2 then
        if gameMax1>0 then--赢了不准赢
            local addCoins =0
            for q=1,100 do
                slotResults1 = self:runGenerateResults(betAmount, calculateAmount, slot, isExtra and true or false,singleAnalyPlayer)
                addCoins= FORoundInt((slotResults1.multiple or 0) * (calculateAmount or 0))
                if addCoins==0 then
                    slotResults=slotResults1
                    break
                end
            end
        else
                gameSingleTemp=2
                singleoddsType=0            
        end
    elseif singleAnalyType==1 then
        if gameMax1==0 then
            local addCoins =0
            for q=1,singleMaxTimes do
                slotResults1 = self:runGenerateResults(betAmount, calculateAmount, slot, isExtra and true or false,singleAnalyPlayer)
                addCoins= FORoundInt((slotResults1.multiple or 0) * (calculateAmount or 0))
                if addCoins>0 and addCoins>rewardwaterRuler and rewardwaterRuler>0 then
                    gameSingleTemp=1
                end
                if addCoins>0 and (addCoins<rewardwaterRuler or rewardwaterRuler==0) and (addCoins<rewardMult or rewardMult==0) then
                    slotResults=slotResults1
                    break
                end
            end
        else
            if gameMax1>rewardwaterRuler then
                gameSingleTemp=2
                singleoddsType=0
            end
        end
    end

    local historyItem = self:getHistory(slotResults.slotResults, betAmount, calculateAmount, isExtra and true or false)
    historyItem.win = FORoundInt((slotResults.multiple or 0) * (calculateAmount or 0))
    self.playerSys:saveHistory(historyItem)
    local gameresult=GameOddsResult.Success
    if singleAnalyType==1 then
        if gameSingleTemp==1 then
            if FORoundInt((slotResults.multiple or 0) * (calculateAmount or 0))==0 then
                gameresult=GameOddsResult.RulerMax
            end
        elseif gameSingleTemp==2 then
            gameresult=GameOddsResult.SameWithAnaly
        else
            if FORoundInt((slotResults.multiple or 0) * (calculateAmount or 0))==0 then
                gameresult=GameOddsResult.RerandomMax
            end
        end
    end
    return slotResults,singleoddsType,gameresult
end

function FortuneSlotMachine:runGenerateResults(betAmount, calculateAmount, slot, isExtra,singleAnalyPlayer)
    local roundResult = self:generateResults(betAmount, calculateAmount, slot, isExtra,singleAnalyPlayer)
    local revenue = FORoundInt((roundResult.multiple or 0) * (roundResult.calculateAmount or 0))
    log_info("此时打出来的revenue为"..revenue)
    return roundResult
end

function FortuneSlotMachine:generateResults(betAmount, calculateAmount, slot, isExtra,singleAnalyPlayer)
    local slotResults = {}
    for index = 1, 12 do
        local probability = FOCloneTable(slot)
        --受到jp和大奖的影响，对第四行的数据进行篡改
        local itemResult=nil
        if (index - 1) % 4==3 then
            local probabilityFour={}
            local prodefault =0
            local prodefault1=1
            for indey = 1, #probability[4] do
                probabilityFour[indey]=probability[4][indey]--克隆
                if indey<=5 then
                    prodefault=prodefault+probabilityFour[indey]
                end
            end
            probabilityFour[6]=probabilityFour[6]+singleAnalyPlayer.bigRewardAddRate/10000
            probabilityFour[7]=probabilityFour[7]+singleAnalyPlayer.jpAddRate/10000
            prodefault1=prodefault1-probabilityFour[6]-probabilityFour[7]
            local lessen=prodefault1/prodefault
            for indey = 1, 5 do
                probabilityFour[indey]=probabilityFour[indey]*lessen
            end
            itemResult = FORateRandom(probabilityFour, 0, #probabilityFour - 1)
        else
            itemResult = FORateRandom(probability[((index - 1) % 4) + 1], 0, #(probability[((index - 1) % 4) + 1] or {}) - 1)
        end
        table.insert(slotResults, itemResult)
    end

    local multipleResult = self:calculateMultiple(slotResults, betAmount, calculateAmount, isExtra,singleAnalyPlayer)
    local wheelMultiple = multipleResult.wheelMultipleIndex < 0 and 0 or (tonumber(FOWheelMultiples[multipleResult.wheelMultipleIndex + 1]) or 0)
    local wheelExtraMultiple = multipleResult.wheelExtraIndex < 0 and 1 or (tonumber(FOWheelExtraMultiples[multipleResult.wheelExtraIndex + 1]) or 1)
    local specialIndex = (slotResults[8] or 0) + 1
    local specialMultiple = tonumber(FOSpecialMultiples[specialIndex]) or 1

    local lineMultipleSum = 0
    for _, lineMultiple in ipairs(multipleResult.multiples or {}) do
        lineMultipleSum = lineMultipleSum + (tonumber(lineMultiple) or 0)
    end

    local multiple = lineMultipleSum * specialMultiple + wheelMultiple * wheelExtraMultiple

    return {
        betAmount = FORoundInt(betAmount or 0),
        calculateAmount = FORoundInt(calculateAmount or 0),
        slotResults = slotResults,
        multiple = tonumber(multiple) or 0,
        multiples = multipleResult.multiples,
        wheelMultipleIndex = multipleResult.wheelMultipleIndex,
        wheelExtraIndex = multipleResult.wheelExtraIndex,
    }
end

function FortuneSlotMachine:calculateMultiple(results, betAmount, calculateAmount, isExtra,singleAnalyPlayer)
    local multiples = {}
    local gameRate = self:getGameRate(betAmount)
    for lineIndex, connectPaths in ipairs(FOConnectIndexs) do
        local target = results[(connectPaths[1] or 0) + 1]
        local count = 1
        for pathIndex = 2, #connectPaths do
            local resultIndex = (connectPaths[pathIndex] or 0) + 1
            if target == 7 then
                target = results[resultIndex]
            end
            if results[resultIndex] == target or results[resultIndex] == 7 then
                count = count + 1
            end
            if count == 3 then
                table.insert(multiples, FOGoodsMultiples[(target or 0) + 1] or 0)
            end
        end
    end
    
    local wheelSymbol = results[8] or 0
    local S_wheelMultipleIndex=wheelSymbol == 6 and FORateRandom(gameRate.wheelRate, 0, #(gameRate.wheelRate or {}) - 1) or -1
    local S_wheelExtraIndex   =isExtra and FORateRandom(gameRate.wheelExtraRate, 0, #(gameRate.wheelExtraRate or {}) - 1) or -1
    if singleAnalyPlayer.jpPotStageMax>0 then
        if S_wheelMultipleIndex>=singleAnalyPlayer.jpPotStageMax then
            S_wheelMultipleIndex=singleAnalyPlayer.jpPotStageMax-1
        end
        if S_wheelExtraIndex>=singleAnalyPlayer.jpPotStageMax then
            S_wheelExtraIndex=singleAnalyPlayer.jpPotStageMax-1
        end
    end
    return {
        multiples = multiples,
        specialWheel = FOSpecialMultiples[wheelSymbol + 1] or 1,
        wheelMultipleIndex =S_wheelMultipleIndex,
        wheelExtraIndex    =S_wheelExtraIndex   ,
    }
end

function FortuneSlotMachine:getHistory(results, betAmount, calculateAmount, isExtra)
    local lines = {}
    local goods = {}
    for lineIndex, connectPaths in ipairs(FOConnectIndexs) do
        local target = results[(connectPaths[1] or 0) + 1]
        local count = 1
        for pathIndex = 2, #connectPaths do
            local resultIndex = (connectPaths[pathIndex] or 0) + 1
            if target == 7 then
                target = results[resultIndex]
            end
            if results[resultIndex] == target or results[resultIndex] == 7 then
                count = count + 1
            end
            if count == 3 then
                table.insert(lines, lineIndex - 1)
                table.insert(goods, target or 0)
            end
        end
    end

    return {
        date = "",
        round = 0,
        betAmount = FORoundInt(betAmount or 0),
        lines = lines,
        goods = goods,
        win = 0,
        wheelMultiple = results[8] or 0,
        isExtra = isExtra and true or false,
    }
end

function FortuneSlotMachine:isExpect(multiple, regenerateRange)
    local min = regenerateRange and FOToSafeNumber(regenerateRange.min, 0) or 0
    local max = regenerateRange and FOToSafeNumber(regenerateRange.max, 0) or 0
    multiple = FOToSafeNumber(multiple, 0)
    return multiple > min and multiple <= max
end

function FortuneSlotMachine:test(betAmount, calculateAmount, isExtra)
    return { code = 0 }
end
