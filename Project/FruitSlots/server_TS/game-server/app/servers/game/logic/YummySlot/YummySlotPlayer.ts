import { getLogger } from "pinus";
import { IOrderWithTime } from "../../sdk/ISdk";
import { EGameStatus, ETradeCode, IPlayerSettings } from "../../interface/IGame";
import IGamePlayer from "../GamePlayer";
import YummySlotScene from "./YummySlotScene";
import YummySlotMachine, { GetResultRevenue } from "./YummySlotMachine";
import { bigWinMultiple, connectMultiples, defaultRate, linePaths, normalHistoryLimit, scatterID, specailHistoryLimit } from "./YummySlotConfig";
import { IBetResp, IEnterGameResp, IGameSettings, IPlayer, IResultHistoryItem, IResults, gConst } from "../../interface/IYummySlot";
import { EGameType, YummySlot_round } from "../../database/entity/YummySlotEntity";
import { PlayerShiftBase, ShiftEntity } from "../GameBase/ShiftGame/PlayerShiftBase";
import { UserBetDetail, spDetail } from "../../database/entity/BalanceEntity";
let logger = getLogger(gConst.gameName, __filename);
let uuid = require("uuid");

export class CoolDown {
    cd: boolean = false;
    ms = 100;
    callCount: number = 0;
    IsCoolDown(): boolean {
        this.callCount++;
        if (this.cd) {
            return this.cd;
        }
        this.cd = true;
        setTimeout(() => {
            this.cd = false;
        }, this.ms);
        return false;
    }
}

export interface IFreeRound {
    betAmount: number; //押注
    multiple: number; //倍数总和
    roundResults: IResults[];
}

interface IRoundResult {
    gameType: EGameType,
    revenue2user: number,
    targets: number[],
    jackpotAmount: number, // 目前只用于提示，不用于计算
    bonusAmount: number,
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    playerSettings: IGameSettings = {
        soundVol: 1,
        lastBetAmountButton: 0,
        lineCount: linePaths.length,
    };
    freeRoundId: number = 0;//free game已经进行了多少局
    freeRound: IFreeRound = null;
    lastResult: IResults = null;
    normalHistory: IResultHistoryItem[] = [];
    specailHistory: IResultHistoryItem[] = [];
}

export default class YummySlotPlayer extends PlayerShiftBase<DataEntity, IRoundResult> implements IPlayer, IGamePlayer {
    runningRoundID: number;
    runningResults: IResults;
    machineStatus: EGameStatus = EGameStatus.bet;
    protected userEntity: DataEntity;
    public machine: YummySlotMachine = new YummySlotMachine(this.scene, this);
    maxBetAmount = 0;
    betNormalCoolDown: CoolDown = new CoolDown();
    betFreeCoolDown: CoolDown = new CoolDown();
    freeRound: IFreeRound = null;
    freeRoundId: number = 0;//free game已经进行了多少局
    constructor(protected scene: YummySlotScene) {
        super(logger);
    }

    // {{ 照抄就好，不放在基类是方便每个游戏各自调试自己的入口
    async enterGame(maxBetAmount: number): Promise<IEnterGameResp> {
        this.maxBetAmount = maxBetAmount;
        if (!this.userEntity) await this.initPlayer();
        return this.getClientResp();
    }

    async synchronize(): Promise<IEnterGameResp> {
        let account = await this.queryUserAccount();
        if (account) this.account = account;
        return this.enterGame(this.maxBetAmount);
    }

    async initPlayer() {
        //console.log(this.uid, "enter game");
        let userEntity = await this.getUserEntity(this.uid);
        this.userEntity = userEntity ? userEntity : new DataEntity;
        this.freeRound = this.userEntity.freeRound;
        this.freeRoundId = this.userEntity.freeRoundId;
        // this.test(1, 100000);
    }
    // }}

    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
        //console.log(this.uid, "quit game");
    }

    async settleResult(roundId: number) {
        let result = this.endRound(roundId);
        if (!result) return;

        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.jackpotAmount });
        let lastResult = this.userEntity.lastResult;
        if (!this.isTest)
            await this.winOrder(roundId, result.revenue2user, orderDetail);

        if (!this.isTest)
            this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond, offset: result.revenue2user });
        return;
        if (lastResult.multiple > 0) {
            this.scene.totalWinHints.push({
                nickname: this.account.nickname,
                winAmount: Math.round(lastResult.multiple * lastResult.betAmount),
                targets: lastResult.targets,
                avatar: this.account.avatar
            });
        }
        if (lastResult.jackpotAmount > 0) {
            this.scene.totalJackpotHints.push({
                nickname: this.account.nickname,
                jackpotAmount: Math.round(lastResult.jackpotAmount),
                avatar: this.account.avatar
            })
        }
    }
    // }}

    getClientResp(): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            playerSettings: this.userEntity.playerSettings,
            lastResult: this.userEntity.lastResult,
            normalHistory: this.userEntity.normalHistory,
            specailHistory: this.userEntity.specailHistory,
            connectMultiples: connectMultiples,
            bonusGameMultiples: this.machine.getGameRate(0).bonusGameResult,
            timezone: this.scene.gameServer.sdkConfig.timezone,
        }
        return resp;
    }

    isTest = false;

    async test(betAmount: number, lineCount: number, testCount: number) {

        if (this.scene.getEnv() != "development")
            return;

        lineCount = Math.min(linePaths.length, lineCount);
        lineCount = Math.max(0, lineCount);

        console.warn("run_test", "uid", this.uid, "betAmount", betAmount, "lineCount", lineCount, "testCount", testCount);

        this.isTest = true;

        let totalBet = 0;
        let totalRevenue = 0;
        let rate = 0;

        let revenue = 0;

        let winRound = 0;

        let bigFreeRound = 0;
        let totalFreeCount = 0;
        let totalBolnusCount = 0;
        let jackpotWin = 0;
        let freeWin = 0;
        let bonusWin = 0;

        let result: IResults = null;

        for (let i = 0; i < testCount + 1; i++) {
            if (result?.freeCount) {
                result = this.machine.generateResults(i, betAmount, lineCount, result)
                if (result.freeCount <= 0) {
                    bigFreeRound++;
                    if (bigFreeRound % 100 == 0) {
                        // this.scene.onTest(this.uid, {
                        //     bigFreeRound,
                        //     totalFreeCount,
                        //     winFreeRound,
                        // })
                    }
                }
                freeWin += GetResultRevenue(result);
            } else {
                totalBet += betAmount * lineCount;
                result = this.machine.generateResults(i, betAmount, lineCount, result)
                if (result.freeCount > 0) {
                    totalFreeCount += result.freeCount;
                    //console.log("in free", totalFreeCount);
                }
            }
            revenue = GetResultRevenue(result);
            totalRevenue += revenue;
            bonusWin += result.bonusAmount;
            jackpotWin += result.jackpotAmount;
            if (result.bonusAmount > 0) {
                totalBolnusCount++;
            }
            if (revenue > 0) {
                winRound++;
            }
            rate = totalRevenue / totalBet;
            if (i % 10000 == 0) {
                this.scene.onTest(this.uid, {
                    i,
                    //totalFreeCount,
                    totalBet,
                    totalRevenue,
                    rate,
                    //freeWin,
                    //bonusWin,
                    //jackpotWin
                    winRate: winRound / i,
                })
            }
            this.coolDown = false;
        }
        this.isTest = false;
        console.log("test finish");
    }

    async betNormal(amount: number, lineCount: number): Promise<IBetResp> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.betNormalCoolDown.IsCoolDown() && !this.isTest) {
            logger.warn("betNormal coolDown", "uid", this.uid);
            return null;
        }

        if (this.betNormalCoolDown.callCount > 20) {
            console.warn("bet call count", this.betNormalCoolDown.callCount);
        }
        this.betNormalCoolDown.callCount = 0;

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", "uid", this.uid);
            return null;
        }
        this.machineStatus = EGameStatus.run;

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.warn("残余未结算的局", "betNormal", "this.userEntity.runningRounds", JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }
        this.userEntity.freeRound = this.freeRound = null;
        this.userEntity.freeRoundId = this.freeRoundId = 0;

        let result: IResults = null;
        let roundId = await this.scene.incrTodayRoundID();
        let code = ETradeCode.unknow;
        if (!this.isTest)
            code = await this.betOrder(roundId, amount * lineCount);
        else
            code = ETradeCode.success;
        if (!this.isTest)
            this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond });
        if (code == ETradeCode.success) {
            result = this.machine.generateResults(roundId, amount, lineCount, this.userEntity.lastResult);
            this.runningRoundID = roundId;
            result.roundId = roundId;
            await this.runRound(roundId, EGameType.normal, result);
        }
        else {
            this.machineStatus = EGameStatus.bet;
        }
        if (!this.isTest)
            this.scene.onResultHandler(this.uid, { code: code, result: result, roundId: roundId });
        return { code: code, result: result, roundId: roundId };
    }

    async betFree() {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.betFreeCoolDown.IsCoolDown() && !this.isTest) {
            logger.warn("betNormal coolDown", "uid", this.uid);
            return null;
        }

        if (this.betFreeCoolDown.callCount > 20) {
            console.warn("bet call count", this.betFreeCoolDown.callCount);
        }
        this.betFreeCoolDown.callCount = 0;

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", "uid", this.uid);
            return null;
        }
        this.machineStatus = EGameStatus.run;

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.warn("残余未结算的局", "betNormal", "this.userEntity.runningRounds", JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }

        let result: IResults = null;
        let roundId = await this.scene.incrTodayRoundID();
        result = this.machine.generateResults(roundId, this.userEntity.lastResult.betAmount, this.userEntity.lastResult.lineCount, this.userEntity.lastResult);
        this.runningRoundID = roundId;
        result.roundId = roundId;
        await this.runRound(roundId, EGameType.free, result);
        if (!this.isTest)
            this.scene.onResultHandler(this.uid, { code: ETradeCode.success, result: result, roundId: roundId });
    }

    /**停止转动后的结算 */
    async stopRound(roundId: number): Promise<number> {
        let lastResult = this.userEntity.lastResult;
        lastResult.stopRound = true;
        await this.settleResult(roundId);
        this.machineStatus = EGameStatus.bet;
        return 0;
    }

    private async runRound(roundId: number, gameType: EGameType, result: IResults) {

        this.userEntity.lastResult = result;
        this.userEntity.freeRound = this.freeRound;
        this.userEntity.freeRoundId = this.freeRoundId;
        let revenue = Math.round((result.betAmount * result.multiple) + result.jackpotAmount + result.bonusAmount);
        let revenue2user = 0;
        if (gameType == EGameType.normal) {
            revenue2user = revenue
        }
        else if (gameType == EGameType.free && result.freeCount == 0) {
            revenue2user = result.freeWinAmount;
        }
        this.startRound(roundId, {
            gameType: gameType,
            targets: result.targets,
            revenue2user: revenue2user,
            jackpotAmount: result.jackpotAmount,
            bonusAmount: result.bonusAmount,
        })

        if (this.isTest)
            return;

        let line_revenue: number[] = [];
        for (let i = 0; i < result.multiples.length; i++) {
            line_revenue.push(result.betAmount * result.multiples[i]);
        }
        let now = new Date;
        let round = new YummySlot_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid;
        round.game_type = gameType;
        round.rate_type = this.machine.getLastRoundRateType();
        round.result = JSON.stringify(result);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jackpot = result.jackpotAmount; // 还没做该功能
        round.jackpot_pool = this.scene.jackpotPool
        round.bet = gameType == EGameType.normal ? result.betAmount * result.lineCount : 0;
        round.revenue = revenue;
        round.save_time = now;

        this.scene.mysql.insertRound(round);

        if (!result.isFreeRound) {//普通局
            let history = this.ResultToHistory(result);
            let isNormalData = history.freeWinAmount == null && history.bonusIndexs == null && history.jackpotAmount == null;
            if (this.userEntity.normalHistory == null)
                this.userEntity.normalHistory = [];
            if (this.userEntity.specailHistory == null)
                this.userEntity.specailHistory = [];
            if (isNormalData) {
                this.userEntity.normalHistory.push(history)
                while (this.userEntity.normalHistory.length > normalHistoryLimit) {
                    this.userEntity.normalHistory.shift();
                }
            }
            else {
                this.userEntity.specailHistory.push(history)
                while (this.userEntity.specailHistory.length > specailHistoryLimit) {
                    this.userEntity.specailHistory.shift();
                }
            }
        }
        else {
            let history = this.FindLastHistory(this.userEntity.specailHistory, result.freeFromRound);
            if (history != null) {
                history.freeWinAmount = result.freeWinAmount;
            }
            else {
                console.warn("freeFromRound not found", result.freeFromRound, "curRound", roundId);
            }
        }

        let buttonBetDetail: UserBetDetail = this.incrBetCount(result.betAmount, round.bet, round.revenue);
        if (!buttonBetDetail.sp) buttonBetDetail.sp = new spDetail;
        if (result.multiple >= bigWinMultiple) buttonBetDetail.sp.nBigwin++;
        if (result.jackpotAmount) buttonBetDetail.sp.nJackpot++;
    }
    ResultToHistory(result: IResults) {
        let history: IResultHistoryItem = {
            timestamp: result.timestamp,
            results: result.results,
            roundId: result.roundId,
            betAmount: result.betAmount,
            lineCount: result.lineCount,
            lineSames: result.lineSames,
        }
        if (result.freeCount > 0) {
            history.freeWinAmount = result.freeWinAmount;
            history.freeFromRound = result.freeFromRound;
        }
        if (result.bonusAmount > 0)
            history.bonusIndexs = result.bonusIndexs;
        if (result.jackpotAmount > 0)
            history.jackpotAmount = result.jackpotAmount;
        return history;
    }
    FindLastHistory(resultHistory: IResultHistoryItem[], roundId: number) {
        let history: IResultHistoryItem = null
        for (let i = resultHistory.length - 1; i > -1; i--)
            if (resultHistory[i].roundId == roundId) {
                history = resultHistory[i]
                break
            }
        return history;
    }
}
