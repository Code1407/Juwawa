require "GameBase.SvrSystemBase"
require "GameError"
require "Seven7CfgMgr"
require "CommomDefine"
require "GameBetData"
require "GameAnalyData"

Seven7Main = class__(SvrSystemBase)

local GameState = {
    NONE = 0,
    PREPARE = 1,
    OPENREWARD = 2
}

function Seven7Main:ctor__()
    SvrSystemBase.ctor__(self, "Seven7Main")

    self.delayTimeDefault = 8
    self.gameState = GameState.NONE
    self.roundOrders = {} --每局游戏订单记录
    self.settlemenTimerId = nil
    self.prepareTimerId = nil
    self.dalayPrepareTimerId = nil

    self.roundResult = {
        round = 0,
        roundId = 0,
        rewardId = nil,
        jpRewards = nil,
        zhuanPanId = nil
    }
    self:cfgConstantInit()
end

--数据加载回调
function Seven7Main:onLoad(data)
    if not data then
        data = {
            curGameInfo = {round = 0, prepareTime = 0, roundId = 0},
            resultHistory = {},
            resetRoundTime = 0
        }
    end

    SvrSystemBase.onLoad(self, data)
    self:resetRound()
end

function Seven7Main:cfgConstantInit()
    self.betTime = Seven7CfgMgr:getCfgConstantValue(EConstantKey.BetTime) + 2
    self.maxShowResult = Seven7CfgMgr:getCfgConstantValue(EConstantKey.ShowGameResultCount)
    self.maxSaveResult = Seven7CfgMgr:getCfgConstantValue(EConstantKey.SaveGameResultCount)
end

function Seven7Main:clearData()
    self.roundOrders = {}
    self.gameBetData = nil

    if self.settlemenTimerId then
        gTimer:removeTimer(self.settlemenTimerId)
        self.settlemenTimerId = nil
    end

    if self.prepareTimerId then
        gTimer:removeTimer(self.prepareTimerId)
        self.prepareTimerId = nil
    end

    if self.dalayPrepareTimerId then
        gTimer:removeTimer(self.dalayPrepareTimerId)
        self.dalayPrepareTimerId = nil
    end
end

function Seven7Main:onOClock(hour)
   if hour == 0 then
        self:resetRound()
   end     
end

function Seven7Main:resetRound()
    local data = self:getData()
    if not data.resetRoundTime then
        data.resetRoundTime = 0
    end
    local lastResetTime = data.resetRoundTime
    local nowTime = app__:utc_s()
    if lastResetTime == 0 then
        data.curGameInfo.round = 0
        data.curGameInfo.roundId = 0
        data.resetRoundTime = nowTime 
        return
    end

    local date1 = os.date("*t", nowTime)
    local date2 = os.date("*t", lastResetTime)

    local isSameDay = date1.year == date2.year and date1.month == date2.month and date1.day == date2.day
    if not isSameDay then
        data.curGameInfo.round = 0
        data.curGameInfo.roundId = 0
        data.resetRoundTime = nowTime 
    end
end

--------------------------------------------

function Seven7Main:playerEnterOrLeave(state)
    if state == 1 then    --有玩家进入
        if self.gameState == GameState.NONE then
            self:betPrepare()
        end
    end
end

function Seven7Main:betPrepare()
    self:clearData()
    
    if gApp:isWaitClosing() then
        gApp:finishClosing()
        log_info("服务器在更新关闭过程中,停止下一局押注")
        return
    end

    if not gWorld:hasPlayer() then
        self.gameState = GameState.NONE
        self:clearData()
        return
    end

    self.gameBetData = GameBetData()
    local data = self:getData() 
    self.gameState = GameState.PREPARE

    local round = (data.curGameInfo.round or 0) + 1
    local time = app__:utc_s()
    data.curGameInfo.round = round
    data.curGameInfo.roundId = GenUnionIncrId(round)
    data.curGameInfo.prepareTime = time
    
    self:betPrepareCountDown()
    Router.Client.ScGamePreparePush({prepareTime = time, round = data.curGameInfo.roundId}, gWorld)
    log_info("开始押注 时间:{0} 期数:{1}", time, round)
end

--10s+2s(留2s网络延时缓冲)倒计时开始(下注)
function Seven7Main: betPrepareCountDown ()
    self.prepareTimerId = gTimer:addOnceTimer((self.betTime-1) * 1000, function ()
        self:countDownEndCallback()
    end)
end

--10s倒计时结束(开奖、结算)
function Seven7Main:countDownEndCallback()
    self:checkHaveSdkOrderId(function ()
        self:betSettlement()
    end)
end

--判断sdk是否还有订单未处理
function Seven7Main:checkHaveSdkOrderId(callback)
    if next(self.roundOrders) ~= nil then
        gTimer:addOnceTimer(2000, function ()
            callback()
        end)
    else
        callback()
    end
end

--延时准备
function Seven7Main:dealyPrepare(delayTime)
    local dt = delayTime or self.delayTimeDefault
    self.dalayPrepareTimerId = gTimer:addOnceTimer(dt * 1000, function ()
        self:betPrepare()
    end)
end

--押注结算
function Seven7Main:betSettlement()
    self.gameState = GameState.OPENREWARD
    local gamedata = self:getData()
    self.roundOrders = {}

    if not self.gameBetData then
        self:dealyPrepare()
        return
    end

    --获取游戏结果
    local gameAnalyData = GameAnalyData(self.gameBetData, gamedata.curGameInfo.roundId)
    local result = gameAnalyData:get_game_result()
    log_info("第{0}局开奖结果:rewardId:{1} jpId:{2}", gamedata.curGameInfo.round, result.rewardId, result.jpId or 0)

    if not result or not result.zhuanPanId or not result.rewardId then
        self:dealyPrepare()
        return log_error("gameAnalyData:get_game_result nil")
    end

    local openRewardDt = self.delayTimeDefault
    if result.zhuanPanId == 6 then
        if result.jpId == 2 or result.jpId == 3 then
            openRewardDt =  self.delayTimeDefault + 2
        end
        if result.jpId == 4 then
            openRewardDt =  self.delayTimeDefault + 4
        end
    end

    local rewardIds = {}
    local zhuanPanId = result.zhuanPanId
    local rewardId = result.rewardId
    local jpRewards = nil
    table.insert(rewardIds, rewardId)
    if Seven7CfgMgr:checkRewardIs77(rewardId) and result.jpId then
        jpRewards = Seven7CfgMgr:getJpRewards(result.jpId)
        if jpRewards then
            for _, id in ipairs(jpRewards) do
                table.insert(rewardIds, id)
            end
        end
    end

    self.roundResult = {
        round = gamedata.curGameInfo.round,
        roundId = gamedata.curGameInfo.roundId,
        rewardId = rewardId,
        jpRewards = jpRewards,
        zhuanPanId = zhuanPanId
    }

    --保存游戏结果
    self:saveGameResult(rewardId, jpRewards or {})

    local cfgReward = gConfigMgr:getBaseConfig("Reward")

    local playersBetData = self.gameBetData:getPlayersBetData()
    local havePlayerBet = next(playersBetData) ~= nil
    local winPlayerList = {}
    local winPlayerNum = 0

    local commitAnalyPlayer = {}
    local commitAnalyReward = {}
   
    for pid, pbetInfo in pairs(playersBetData) do
        local player = gWorld:findAllPlayer(pid)
        if player then
            local playerUid = player:getUid()
            commitAnalyPlayer[pid] = player
            local betMap = pbetInfo.betMap
            local betTotal = pbetInfo.betTotal
            local win = 0
            local presult = {}
            for _, id in ipairs(rewardIds) do
                local singleWin = 0
                if cfgReward[id] then
                    if betMap[id] and betMap[id] > 0 then
                        singleWin = cfgReward[id].Multiple * betMap[id]
                        win = win + singleWin
                    end
                    presult[tostring(id)] = singleWin
                else
                    log_error("betSettlement-cfgReward data is nil:{0}", id)
                end
            end

            log_info("结算时玩家[{0}] 总计押注:{1}, 押注详情:{2}", playerUid, betTotal, log_view(betMap))

            self.gameBetData:updatePlayerRewardMap(pid, presult)

            if win > 0 then
                table.insert(winPlayerList, {
                    pid = pid,
                    win = win,
                    betTotal = betTotal,
                })
                winPlayerNum = winPlayerNum + 1
            else
                self:syncStatisPlayerData(gamedata.curGameInfo.roundId, player, pid, playerUid)              
            end 
            player:saveGameResult(presult, gamedata.curGameInfo.roundId)
            commitAnalyReward[pid] = win
        end     
    end

    if next(commitAnalyPlayer) then
        gAnaly:multiCommitAnaly(commitAnalyPlayer, commitAnalyReward, gamedata.curGameInfo.roundId, result.gameOddsResult)
    end

    if winPlayerNum > 0 then
        local patformData = {win_id = table.concat(rewardIds, " ")} 
        self:betAddCoins(winPlayerNum, winPlayerList, gameAnalyData, openRewardDt, patformData)  
    else       
        if havePlayerBet then
            self:syncStatisGameData(gamedata.curGameInfo.roundId)
        end
        self:broadcastResult()
        self:dealyPrepare(openRewardDt)
    end
end

--广播结果(结果和排名分开发消息，排名只发下注了的玩家，节省性能,广播数不一样，占用内存)
function Seven7Main:broadcastResult(roundRank3)
    Router.Client.ScOpenRewardPush({
        round = self.roundResult.roundId,
        zhuanPanIndex = self.roundResult.zhuanPanId,
        rewardID = self.roundResult.rewardId,
        jpRewards = self.roundResult.jpRewards,
        roundRank3 = roundRank3 or {}
    }, gWorld)
end

function Seven7Main:betAddCoins(winPlayerNum, winPlayerList, gameAnalyData, openRewardDt, patformData)
    local gamedata = self:getData()
    local backCount = 0
    local backPlayerList = {}

    self.settlemenTimerId = gTimer:addOnceTimer(2000, function ()
        if self.settlemenTimerId then
            self:resultSort(backPlayerList)
        end
    end)

    local oddsType = gameAnalyData:get_odds_type()
    for _, pinfo in ipairs(winPlayerList) do  
        local pid = pinfo.pid
        local win = pinfo.win
        local player = gWorld:findAllPlayer(pid)
        if player then
            local playerUid = player:getUid()
            player:addCoins(gamedata.curGameInfo.roundId, oddsType, ECoinsOperateType.WinAdd, win, function (ercode, orderID, backPlayer)
                backCount = backCount + 1
                if backPlayer then
                    local realWin = 0
                    if ercode == 0 then  
                        realWin = win
                        table.insert(backPlayerList, {pid = pid, win = win, betTotal = pinfo.betTotal})
                        log_info("玩家[{0}]在{1}局下注赢取积分[{2}]添加成功",playerUid, gamedata.curGameInfo.round, realWin)
                        
                        if self.gameBetData then
                            self.gameBetData:updateReward(realWin)
                            self.gameBetData:updatePlayerRewardTotal(pid, realWin)
                        else
                            log_error("sdk 加钱回调 gameBetData 为nil存:uid:{} round:{}", playerUid, gamedata.curGameInfo.round)
                        end
                        self:syncStatisPlayerData(gamedata.curGameInfo.roundId, backPlayer, pid, playerUid)  
                    else
                        log_error("SDK加钱有错:uid:{0}, orderID:{1}, addCoins:{2}, round:{3}, ercode:{4}", playerUid, orderID, win, gamedata.curGameInfo.round, ercode)
                        local msg = {errorCode = ercode, round = gamedata.curGameInfo.round, playerBet = self.gameBetData:getPlayerBetTotal(pid), playerWin = 0}
                        Router.Client.ScPlayerRoundResultPush(msg, backPlayer)
                    end   
                else
                    log_error("SDK 加钱回调参数player为nil:uid:{0}, addCoins:{1}, round:{2}, ercode:{3}", playerUid, win, gamedata.curGameInfo.round, ercode)
                end
                
                if backCount >= winPlayerNum then
                    self:resultSort(backPlayerList, openRewardDt)
                end
            end, patformData)           
        end   
    end
end

function Seven7Main:resultSort(playerList, openRewardDt)
    local gamedata = self:getData()
    self:syncStatisGameData(gamedata.curGameInfo.roundId)
    --排序
    table.sort(playerList, function(a, b)
        return a.win > b.win
    end)

    local rank3 = {}
    for i = 1, 3 do
        if playerList[i] then
            local pid = playerList[i].pid
            local player = gWorld:findPlayer(pid)
            if player then
                table.insert(rank3, {
                    pid = playerList[i].pid,
                    name = player:getName(),
                    avatarUrl = player:getAvatarUrl(),
                    score = playerList[i].win,
                    rankNum = i,
                    bet = playerList[i].betTotal,
                    win = playerList[i].win,
                })
            end
        end
    end

    --分配排名
    local rankNum = 0
    local lastWin = nil
    for _, item in ipairs(playerList) do
        if lastWin == nil then
            rankNum = 1
            lastWin = item.win         
        elseif item.win < lastWin then
            rankNum = rankNum + 1
            lastWin = item.win
        end 
        item.rankNum = rankNum
        local player = gWorld:findPlayer(item.pid)
        if player then
            Router.Client.ScPlayerRoundResultPush({
                errorCode = 0,
                round = gamedata.curGameInfo.round, 
                playerBet = self.gameBetData:getPlayerBetTotal(item.pid),
                playerWin = item.win,
            }, player)
        end         
    end

    self:broadcastResult(rank3)
    self:dealyPrepare(openRewardDt)
    if self.settlemenTimerId then
        gTimer:removeTimer(self.settlemenTimerId)
        self.settlemenTimerId = nil
    end 
end

--保存开奖结果数据
function Seven7Main:saveGameResult(rewardId, jpRewards)
    local data = self:getData()

    --结果存系统
    table.insert(data.resultHistory, {
            round = data.curGameInfo.roundId, 
            time =  data.curGameInfo.prepareTime,
            resultID = rewardId,
            jpRewards = jpRewards
        }
    ) 
    if #data.resultHistory > self.maxSaveResult + 1 then
        table.remove(data.resultHistory, 1)
    end 
end

function Seven7Main:checkFruitCountValid(pid, betList)
    local cfgReward = gConfigMgr:getBaseConfig("Reward")
    local cfg = gApp:getProjCommon()
    local max = 0
    if not cfg or not cfg.Custom or not cfg.Custom.betFruitMax then
        log_info("Custom.betFruitMax cfg is nil")
        --启用默认配置
        max = Seven7CfgMgr:getCfgConstantValue(EConstantKey.SelectFruitMax)
    else
        max = cfg.Custom.betFruitMax
    end
    log_info("押注水果限制:{0}", max)
    local hadBetMap = self.gameBetData:getPlayerBetMap(pid)
    local hadNum = 0
    for betid, betValue in pairs(hadBetMap) do
        local isFruit = cfgReward[betid] and cfgReward[betid].IsFruit == 1 or false
        if isFruit then
            hadNum = hadNum + 1
        end
    end

    local curBetNum = 0
    local curBetMap = {}
    for _, value in pairs(betList) do
        local rewardID = value.rewardID
        local isFruit = cfgReward[rewardID] and cfgReward[rewardID].IsFruit == 1 or false
        if isFruit and not hadBetMap[rewardID] and not curBetMap[rewardID] then
            curBetMap[rewardID] = true
            curBetNum = curBetNum + 1
        end
    end

    local totalNum = hadNum + curBetNum
    return totalNum <= max
end

function Seven7Main:getBetTotal(betList)
    local betAllNum = 0
    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local chipNum = chipValue * chipCount  
        betAllNum = betAllNum + chipNum
    end
    return betAllNum
end

--把betId拼接成字符串反给平台
function Seven7Main:getBetStr(betList)
    local betIds = {}
    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local betId = value.rewardID
        if chipValue and chipValue > 0 and chipCount and chipCount > 0 and betId then
            table.insert(betIds, betId)
        end
    end
    local str = table.concat(betIds, " ")
    return {bet_id = str}
end

function Seven7Main:checkChipIsValid(betList, uid, round)
    local chipValueArr = {}
    local cfg = gApp:getProjCommon()
    if not cfg or not cfg.Costs or #cfg.Costs <= 0 then
        log_info("jsNet costs cfg is nil")

        --启用默认配置
        local cfgChips =  Seven7CfgMgr:getCfgConstantValue(EConstantKey.BetChips)
        if not cfgChips then
            log_error("default costs cfg is nil")
            return false
        end
        chipValueArr = cfgChips
    else
        for _, value in ipairs(cfg.Costs) do
            table.insert(chipValueArr,value.Coins)
        end
    end

    for _, value in pairs(betList) do
        local chipValue = value.chipValue
        local isValid = false
        for _, coins in pairs(chipValueArr) do
            if coins == chipValue then
                isValid = true
            end
        end
        if not isValid then
            log_error("round:{0}局玩家{1}押注筹码值[{2}]不合法", round, uid, chipValue)
            return false
        end
    end
    return true
end

--每局押注次数限制
function Seven7Main:checkBetCountIsValid(pid)
    local cfg = gApp:getProjCommon()
    local max = 0
    if not cfg or not cfg.Custom or not cfg.Custom.betCountMax then
        log_error("jsNet Custom.betCountMax cfg is nil")

        --启用默认配置
        max = Seven7CfgMgr:getCfgConstantValue(EConstantKey.BetCountMax)
    else
        max = cfg.Custom.betCountMax
    end
    local palyerCount = self.gameBetData:getPlayerBetCount(pid)
    return palyerCount < max
end

--获取延时下注
function Seven7Main:getDelayRewardCoins(uid, roundId, betMap)
    local round = GenDayIncrId(roundId)
    local gamedata = self:getData()
    if not gamedata.resultHistory or #gamedata.resultHistory > 0 then
        return 0
    end

    if not betMap then
        log_error("玩家[{0}]在{1}局延时发奖betMap为nil", uid, round)
        return 0
    end

    local cfgReward = gConfigMgr:getBaseConfig("Reward")
    local reward = 0 
    for _, item in pairs(gamedata.resultHistory) do
        if roundId == item.round then
            local openRewards = {item.rewardId}
            if item.jpRewards then
                for _, id in ipairs(item.jpRewards) do
                    table.insert(openRewards, id)
                end
            end

            for _, id in pairs(openRewards) do
                if cfgReward[id] and cfgReward[id].Multiple and betMap[id] and betMap[id] > 0 then
                    local add = cfgReward[id].Multiple * betMap[id]
                    reward = reward + add
                end
            end
        end
    end
    return reward
end

--下注延时情记录
function Seven7Main:delayRewardRecord(roundId, orderId, betMsg, uid, oddsType, changeType, subCoins, gameExt, player)
    if not player then
        log_error("下注延时情记录player{0}为nil", uid)
        return
    end

    if not betMsg then
        log_error("下注延时情记录betMsg{0}为nil", uid)
        return
    end

    local round = GenDayIncrId(roundId)
    local betMap = {}
    local betIdStr = nil
    for _, value in pairs(betMsg.betList) do
        local rewardId = value.rewardID
        local chipValue = value.chipValue
        local chipCount = value.chipCount
        local betNum = chipValue * chipCount
        if not betMap[rewardId] then
            betMap[rewardId] = 0
        end

        local betStr = tostring(rewardId)
        betMap[rewardId] = betMap[rewardId] + betNum
        if not betIdStr then
            betIdStr = betStr
        else
            betIdStr = betIdStr .. "," .. betStr
        end
    end

    local reward = self:getDelayRewardCoins(uid, roundId, betMap)
    if reward > 0 then
        player:subCoinsDelayReward(roundId, betIdStr, orderId, oddsType, changeType, subCoins, reward, gameExt)
        log_info("玩家{0}下注延时中奖统计: round:{1} betIdStr:{2} orderId:{3} subCoins:{4} reward:{5}", uid, round, betIdStr, orderId, subCoins, reward)
    end
end

--------------------Msg------------------------
function Seven7Main:csCurGameInfoReq(pid)
    local gamedata = self:getData() 
    local backMsg = {
        round = gamedata.curGameInfo.roundId,
        prepareTime = gamedata.curGameInfo.prepareTime,
        gameState = self.gameState,
        betWorld = {},
        betSelf = {}
    }
    if self.gameState ~= GameState.NONE then
        local info = self.gameBetData:getScGlobalBetInfo()
        backMsg.betWorld = info.betMap
        backMsg.betSelf = self.gameBetData:getScPlayerBetData(pid) 
    end
    return backMsg
end

--更新下注
function Seven7Main:csBetReq(pid, msg)
    if not pid or pid <= 0 or not msg or not msg.betList or #msg.betList <= 0 then
        return
    end

    local curPlayer = gWorld:findAllPlayer(pid)
    if not curPlayer then
        return 
    end

    local playerUid = curPlayer:getUid()
    local playerMoney = curPlayer:getCoins()
    local gamedata = self:getData() 

    local backMsg = {
        errorCode = 0,
        money = playerMoney,
        betList = {}
    }

    local curTime = app__:utc_s()
    local curRoundId = gamedata.curGameInfo.roundId
    local curRound = gamedata.curGameInfo.round
    local curBetMsg = msg

    --检查SDK
    if not curPlayer:checkSdkIsValid() then
        log_error("round:{0}局中{1}sdk状态不对",curRound, playerUid)
        backMsg.errorCode = GameError.GE_SdkCoinsError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查筹码
    if not self:checkChipIsValid(msg.betList, playerUid, curRound) then
        backMsg.errorCode = GameError.GE_ChipError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查押注次数
    if not self:checkBetCountIsValid(pid) then
        backMsg.errorCode = GameError.GE_BetCountOver
        log_error("round:{0}局中{1}游戏押注次数超出次数",curRound, playerUid)
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查下注时游戏状态
    if self.gameState ~= GameState.PREPARE then
        log_error("round:{0}局中{1}押注时游戏状态不对:{2}",curRound, playerUid, self.gameState)
        backMsg.errorCode = GameError.GE_BetTimeError
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查下注水果数量
    local canBet = self:checkFruitCountValid(pid, msg.betList)
    if not canBet then
        log_error("round:{0}局中{1}游戏押注水果数量超出限制",curRound, playerUid)
        backMsg.errorCode = GameError.GE_FruitCountOver
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    --检查钱是否够
    local betAllNum = self:getBetTotal(msg.betList)
    local moneyEnough = curPlayer:coinsEnough(betAllNum)
    
    if not moneyEnough or betAllNum <= 0 then
        log_error("round:{0}局中{1}押注钱不够:当前Coins:{2}-押注Coins:{3}",curRound, playerUid, playerMoney, betAllNum)
        backMsg.errorCode = GameError.GE_MoneyNotEnough
        return Router.Client.CsBetResp(backMsg, curPlayer)
    end

    local patformData = self:getBetStr(msg.betList)
    --扣钱
    local orderId = curPlayer:subCoins(curRoundId, ECoinsOperateType.BetSub, betAllNum, function (errorCode, orderID, backPlayer)
        if orderID then
            self.roundOrders[orderID] = nil
        end

        if not backPlayer then
            log_error("扣钱回调找不到玩家:uid:{0} 押注总额:{1} orderID:{2} errorCode:{3} round:{4}", playerUid, betAllNum, orderID, errorCode, curRound)
            return
        end

        if errorCode ~= 0 then
            log_error("扣钱回调有错:uid:{0} 押注总额:{1} orderID:{2} errorCode:{3} round:{4}", playerUid, betAllNum, orderID, errorCode, curRound)
            backMsg.errorCode = errorCode
            return Router.Client.CsBetResp(backMsg, backPlayer)
        end

        --下注回调状态不为游戏准备状态
        if self.gameState ~= GameState.PREPARE or curRoundId ~= gamedata.curGameInfo.roundId then
            log_info("下注Sdk回调超时, 状态不对: uid:{0} orderID:{1}, betAllNum:{2}, round_bet:{3}, round_now:{4} betInfo:{5}", playerUid, orderID, betAllNum, curRound, gamedata.curGameInfo.round, log_view(curBetMsg.betList or {}))
            self:delayRewardRecord(curRoundId, orderID, curBetMsg, playerUid, 0, ECoinsOperateType.BetSub, betAllNum, patformData, backPlayer)
            return
        end

        --排行榜
        local rankPSys = backPlayer:getSystem("RankPSystem")
        if rankPSys then
            rankPSys:updateRankList(betAllNum)
        end

        playerMoney = backPlayer:getCoins()
        local betInfo = {
            betTime = curTime,
            betList = {}
        }

        for _, value in pairs(msg.betList) do
            local rewardID = value.rewardID
            local chipValue = value.chipValue
            local chipCount = value.chipCount
            local chipNum = chipValue * chipCount  
            self.gameBetData:updateBetValue(pid, rewardID, chipNum)
            self.gameBetData:updatePlayerBetCount(pid)
            table.insert(betInfo.betList, value)
            log_info("玩家押注: uid:{0} 期数:{1} 押注奖励ID:{2} 筹码大小:{3} 筹码数量:{4} ", playerUid, curRound, rewardID, chipValue, chipCount)
        end
        --保存押注数据到玩家
        local pBetMap = self.gameBetData:getPlayerBetMap(pid)
        backPlayer:saveBetInfo(gamedata.curGameInfo.prepareTime, curRoundId, betInfo, pBetMap)

        --同步押注信息给所有玩家
        local data = self.gameBetData:getScGlobalBetInfo()
        data.betList = msg.betList
        data.pid = pid
        data.round = gamedata.curGameInfo.roundId
        Router.Client.ScUpdateWorldBetPush(data, gWorld)
        backMsg.money = playerMoney
        backMsg.betList = msg.betList
        Router.Client.CsBetResp(backMsg, backPlayer)
        log_info("玩家该次押注数据合并: uid:{0} 押注总额:{1} 时间:{2} 期数:{3}", playerUid, betAllNum, curTime, curRound)
    end, patformData)

    if orderId then
        self.roundOrders[orderId] = true
    end 
end

--游戏历史记录
function Seven7Main:csGameHistoryReq()
    local gamedata = self:getData()
    local result = {}
    result.list = {}
    if gamedata.resultHistory and #gamedata.resultHistory > 0 then
        result.list = gamedata.resultHistory
        -- local length = #gamedata.resultHistory
        -- local finalData = gamedata.resultHistory[length]
        -- if finalData.round ~= gamedata.curGameInfo.roundId then
        --     result.list = gamedata.resultHistory
        --     return result
        -- end

        -- if length > 1 then
        --     table.move(gamedata.resultHistory, 1, length - 1, 1, result.list)
        --     return result
        -- end
    end
    return result
end

--玩家下注历史记录
function Seven7Main:csSelfBetHistoryReq(player)
    if player then
        local msg = {
            list = {}
        }
        local betHistory = player:getBetHistory()
        local len = #betHistory
        local showMax = Seven7CfgMgr:getCfgConstantValue(EConstantKey.ShowSelfBetRecordCount) 
        local showCount = 0
        if betHistory and len > 0 then
            showCount = math.min(len, showMax)
        end
        if showCount > 0 then
            for i = 1, showCount do
                local info = betHistory[i]
                local tb = {
                    serverIndex = info.serverIndex,
                    prepareTime = info.prepareTime,
                    round = info.round,
                    betMap = info.betMap,
                    result = info.result,
                }
                table.insert(msg.list, tb)
            end
        end
        Router.Client.CsSelfBetHistoryResp(msg, player)
    end
end


--------------------数据统计------------------------

--统计上传游戏数据
function Seven7Main:syncStatisGameData(roundId)
    if not self.gameBetData then
        return
    end

    local gamePayData = {}
    local gameRewardData = {}

    local playersBetData = self.gameBetData:getPlayersBetData()
    for pid, _ in pairs(playersBetData) do
        local player = gWorld:findAllPlayer(pid)
        if player then
            local uid = player:getUid()
            gamePayData[uid] = {
                betMap = self.gameBetData:getPlayerBetMap(pid),
                betTotal = self.gameBetData:getPlayerBetTotal(pid)
            }
            gameRewardData[uid] = {
                rewardMap = self.gameBetData:getPlayerRewardMap(pid),
                rewardTotal = self.gameBetData:getPlayerRewardTotal(pid)
            }
        end
    end
    gApp:statisGameRound(roundId, gamePayData, gameRewardData)

    local betTotal = self.gameBetData:getBetTotal()
    local rewardTotal = self.gameBetData:getRewardTotal()
    log_info("游戏数据统计: ServerIndex:{0} round:{1} 总投注:{2} 总奖励:{3}", gApp:getServerIndex(), self.roundResult.roundId, betTotal, rewardTotal)
end

--统计上传玩家数据
function Seven7Main:syncStatisPlayerData(roundId, player, pid, playerUid)
    if not self.gameBetData then
        return
    end

    if not player then
        return
    end

    local gamedata = self:getData()
    if not gamedata.curGameInfo or not gamedata.curGameInfo.roundId then
        return
    end

    if roundId ~= gamedata.curGameInfo.roundId then
        log_error("syncStatisPlayerData roundId 不一致")
        return
    end
    
    if self.gameBetData:getPlayerBetTotal(pid) <= 0 then
        return
    end

    local payData = {}
    local rewardData = {}

    payData.betMap = self.gameBetData:getPlayerBetMap(pid)
    payData.betTotal = self.gameBetData:getPlayerBetTotal(pid)
    rewardData.rewardMap = self.gameBetData:getPlayerRewardMap(pid)
    rewardData.rewardTotal = self.gameBetData:getPlayerRewardTotal(pid)

    local round = GenDayIncrId(roundId)
    player:statisGameRound(roundId, payData, rewardData)
    log_info("玩家数据统计:uid:{0} ServerIndex:{1} round:{2} 总投注:{3} 总奖励:{4}",playerUid, gApp:getServerIndex(), round, payData.betTotal, rewardData.rewardTotal)
end

