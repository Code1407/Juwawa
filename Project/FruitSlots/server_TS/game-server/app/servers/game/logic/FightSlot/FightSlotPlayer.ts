import { IEnterGameResp, gConst, IResults, IPlayer, IRoundResultResp } from "../../interface/IFightSlot";
import { getLogger } from 'pinus-logger';
let logger = getLogger(gConst.gameName, __filename);

import IGamePlayer from "../GamePlayer"
import { EGameType, FightSlot_round } from "../../database/entity/FightSlotEntity";
import { EGameStatus, ETradeCode, get2ArrAverage } from "../../interface/IGame";
import { FightSlotMachine } from "./FightSlotMachine";
import { bigWinMultiple, jackpotPoolMultiple, jackpotWinWeightDef, linePaths } from "./FightSlotConfig";
import FightSlotScene from "./FightSlotScene";
import { PlayerShiftBase, ShiftEntity } from "../GameBase/ShiftGame/PlayerShiftBase";
import { UserBetDetail, spDetail } from "../../database/entity/BalanceEntity";

export interface IFreeRound {
    betAmount: number; //押注
    multiple: number; //倍数总和
    roundResults: IResults[];
}

interface IRoundResult {
    gameType: EGameType,
    freeCount: number,
    revenue2user: number,
    jackpotAmount: number // 目前只用于提示，不用于计算
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    freeRoundId: number = 0;//free game已经进行了多少局
    freeRound: IFreeRound = null;
    lastResult: IResults = null;
}

const jpProgressMultiple = get2ArrAverage(jackpotPoolMultiple, jackpotWinWeightDef) / 5; 

export default class FightSlotPlayer extends PlayerShiftBase<DataEntity, IRoundResult> implements IPlayer, IGamePlayer {
    protected userEntity: DataEntity;
    machine: FightSlotMachine = new FightSlotMachine(this.scene, this);

    runningRoundID: number;
    runningResults: IResults;
    machineStatus: EGameStatus = EGameStatus.stop;

    freeRound: IFreeRound = null;
    freeRoundId: number = 0;//free game已经进行了多少局

    browserUA: string;

    constructor(protected scene: FightSlotScene) {
        super(logger);
    }

    getProgressRevenue(betAmount: number): number {
        let progressRevenue = 0;
        let jpProgressMultipleValue = jpProgressMultiple;
        if (this.userEntity?.lastResult?.progressOfJackpot && this.userEntity.lastResult.progressOfJackpot[betAmount]) {
            progressRevenue += this.userEntity.lastResult.progressOfJackpot[betAmount] * betAmount * jpProgressMultipleValue;
        }
        return progressRevenue;
    }
    // {{ 照抄就好，不放在基类是方便每个游戏各自调试自己的入口
    async enterGame(): Promise<IEnterGameResp> {
        if (!this.userEntity) await this.initPlayer();
        return this.getClientResp();
    }

    async synchronize(): Promise<IEnterGameResp> {
        let account = await this.synchronizeBase();
        if (account) this.account = account;
        return this.enterGame();
    }

    async initPlayer() {
        //console.log(this.uid, "enter game");
        if (this.machineStatus == EGameStatus.stop) this.changeMachineStatus(EGameStatus.bet, null);
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

        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.jackpotAmount })
        if (!this.isTest)
            await this.winOrder(roundId, result.revenue2user, orderDetail);

        if (!this.isTest)
            this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond, offset: result.revenue2user });
        // if (result.jackpotAmount > 0) {
        //     this.scene.onJackpotHint({
        //         userName: this.account.nickname, 
        //         amount: result.jackpotAmount});
        // }
    }
    // }}

    getClientResp(): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            playerSettings: this.userEntity.playerSettings,
            lastResult: this.userEntity.lastResult
        }
        return resp;
    }

    isTest = false;

    async test(betAmount: number, testCount: number) {

        if (this.scene.getEnv() != "development")
            return;

        console.warn("run_test", "uid", this.uid, "betAmount", betAmount, "testCount", testCount);

        this.isTest = true;

        let bet = 0;
        let revenue = 0;
        let rate = 0;

        let bigFreeRound = 0;
        let winFreeRound = 0;
        let totalFreeCount = 0;

        for (let i = 0; i < testCount + 1; i++) {
            if (this.userEntity.lastResult?.freeCount) {
                await this.betFree();
                if (this.userEntity.lastResult.freeCount <= 0) {
                    bigFreeRound++;
                    totalFreeCount += this.userEntity.lastResult.freeCountMax
                    winFreeRound += this.userEntity.runningRounds[this.runningRoundID].revenue2user;
                    if (bigFreeRound % 1000 == 0) {
                        // this.scene.onTest(this.uid, {
                        //     bigFreeRound,
                        //     totalFreeCount,
                        //     winFreeRound,
                        // })
                    }
                }
            } else {
                bet += betAmount * linePaths.length;
                await this.betNormal(betAmount);
            }
            revenue += this.userEntity.runningRounds[this.runningRoundID].revenue2user;
            rate = revenue / bet;
            await this.stopRound(this.runningRoundID);
            if (i % 10000 == 0) {
                this.scene.onTest(this.uid, {
                    i,
                    bet,
                    revenue,
                    rate,
                })
            }
            this.coolDown = false;
        }
        this.isTest = false;
        console.log("test finish");
    }

    changeMachineStatus(machineStatus: EGameStatus, results: IResults) {
        this.machineStatus = machineStatus;
        this.runningResults = results;
        if (machineStatus != EGameStatus.run) this.runningRoundID = 0;
        if (!this.isTest)
            this.scene.onRoundStep2Player(this.uid, this.runningRoundID, machineStatus, this.account.diamond, results);
    }

    async DebugResult(resultDev: any) {
        this.machine.resultsDev = resultDev;
        return null;
    }

    async betNormal(betAmount: number) {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", this.machineStatus);
            return null;
        }

        if (this.coolDown) {
            logger.warn("betNormal coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.userEntity && Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.warn("betNormal", "Object.keys(this.userEntity.runningRounds).length > 0", JSON.stringify(this.userEntity));
            await this.stopRunningRound();
        }

        if (this.userEntity.lastResult) {
            this.userEntity.lastResult.freeWinAmount = 0;
            this.userEntity.lastResult.progressOfFree = 0;
            this.userEntity.lastResult.freeCount = 0;
            this.userEntity.lastResult.freeCountMax = 0;
        }
        this.userEntity.freeRound = this.freeRound = null;
        this.userEntity.freeRoundId = this.freeRoundId = 0;

        let result: IResults = null;
        let linesBetAmount = betAmount * linePaths.length;
        let roundId = await this.scene.incrTodayRoundID();
        let code = ETradeCode.unknow;
        if (!this.isTest)
            code = await this.betOrder(roundId, linesBetAmount);
        else
            code = ETradeCode.success;
        if (!this.isTest)
            this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond });
        if (code == ETradeCode.success) {
            result = this.machine.generateResults(betAmount, this.userEntity.lastResult);
            result.freeWinAmount = 0;
            this.runningRoundID = roundId;
            await this.runRound(roundId, EGameType.normal, result);
        }
        if (!this.isTest)
            this.scene.onResultHandler(this.uid, { code: code, result: result, roundId: roundId });
    }

    async betFree() {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.error(JSON.stringify(this.userEntity));
            logger.warn("this.machineStatus:", this.machineStatus);
            return null;
        }

        if (!this.userEntity.lastResult) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
                result: null,
                roundId: 0
            }
        }

        let freeCount = this.userEntity.lastResult.freeCount;
        let betAmount = this.userEntity.lastResult.betAmount;
        if (!freeCount || !betAmount) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
                result: null,
                roundId: 0
            }
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betFree", "this.machineStatus != EGameStatus.bet", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.coolDown) {
            logger.warn("betFree coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.userEntity && Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.error(JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }

        let roundId = await this.scene.incrTodayRoundID();
        let result = this.machine.generateResults(betAmount, this.userEntity.lastResult);
        this.runningRoundID = roundId;
        await this.runRound(roundId, EGameType.free, result);

        if (!this.isTest)
            this.scene.onResultHandler(this.uid, { code: 0, result: result, roundId: roundId });
    }

    async betSuper() {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.error(JSON.stringify(this.userEntity));
            logger.warn("this.machineStatus:", this.machineStatus);
            return null;
        }

        if (!this.userEntity.lastResult) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
                result: null,
                roundId: 0
            }
        }

        let freeCount = this.userEntity.lastResult.freeCount;
        let betAmount = this.userEntity.lastResult.betAmount;
        if (!freeCount || !betAmount) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
                result: null,
                roundId: 0
            }
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betFree", "this.machineStatus != EGameStatus.bet", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.coolDown) {
            logger.warn("betFree coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.error(JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }

        let roundId = await this.scene.incrTodayRoundID();
        let result = this.machine.generateResults(betAmount, this.userEntity.lastResult);
        this.runningRoundID = roundId;
        await this.runRound(roundId, EGameType.super_free, result);

        if (!this.isTest)
            this.scene.onResultHandler(this.uid, { code: 0, result: result, roundId: roundId });
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        this.changeMachineStatus(EGameStatus.final, null);
        this.settleResult(roundId);
        this.changeMachineStatus(EGameStatus.bet, null);
        return { accountDiamond: this.account.diamond };
    }

    private async runRound(roundId: number, gameType: EGameType, result: IResults) {
        this.changeMachineStatus(EGameStatus.run, result);

        this.userEntity.lastResult = result;
        this.userEntity.freeRound = this.freeRound;
        this.userEntity.freeRoundId = this.freeRoundId;
        let revenue = (result.betAmount * result.multiple) + result.jackpotAmount;
        let revenue2user = 0;
        if (gameType == EGameType.normal) {
            revenue2user = revenue;
        } else if (gameType == EGameType.free && result.freeCount == 0) {
            revenue2user = result.freeWinAmount;
        }
        this.startRound(roundId, {
            gameType: gameType,
            freeCount: result.freeCount,
            revenue2user: revenue2user,
            jackpotAmount: result.jackpotAmount
        })

        if (this.isTest)
            return;

        let line_revenue: number[] = [];
        for (let i = 0; i < result.multiples.length; i++) {
            line_revenue.push(result.betAmount * result.multiples[i]);
        }
        let rateType = this.machine.getLastRoundRateType();
        let now = new Date;
        let round = new FightSlot_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid;
        round.game_type = gameType;
        round.rate_type = rateType;
        round.result = JSON.stringify(result);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jp = result.jackpotAmount; // 还没做该功能
        round.jp_index = result.jackpotWinIndex; // 还没做该功能
        round.jp_pool = null; // JSON.stringify(this.scene.jackpotAmountPool.getAllPool()[result.betAmount]);
        round.bet = gameType == EGameType.normal ? result.betAmount * linePaths.length : 0;
        round.revenue = revenue;
        round.save_time = now;

        this.scene.mysql.insertRound(round);

        let buttonBetDetail: UserBetDetail = this.incrBetCount(result.betAmount, round.bet, round.revenue);
        if (!buttonBetDetail.sp) buttonBetDetail.sp = new spDetail;
        if (result.multiple >= bigWinMultiple) buttonBetDetail.sp.nBigwin++;
        if (result.jackpotAmount) buttonBetDetail.sp.nJackpot++;
        if (gameType == EGameType.free && result.freeCount == 0) buttonBetDetail.sp.nFree++;
    }

    async setBetAmountButton(betAmountButtonIndex: number) {
        this.userEntity.playerSettings.lastBetAmountButton = betAmountButtonIndex;
        await this.saveUserEntity();
    }
}
