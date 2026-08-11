import { IEnterGameResp, IBetResp, gConst, IResults, IPlayer, IRoundResultResp, IHoneyJarData, IHoneyJarItem, IHistoryItem } from "../../interface/IBeeSlot";
import { getLogger } from 'pinus-logger';
import IGamePlayer from "../GamePlayer"
import { BeeSlot_round, EGameType } from "../../database/entity/BeeSlotEntity";
import BeeSlotScene from "./BeeSlotScene";
import { BeeSlotMachine } from "./BeeSlotMachine";
import { EGameStatus, ETradeCode } from "../../interface/IGame";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
import { spDetail, UserBetDetail } from "../../database/entity/BalanceEntity";
import { bigWinMultiple, jackpotPoolMultiples, lineCount } from "./BeeSlotConfig";
let logger = getLogger(gConst.gameName, __filename);

interface IRoundResult {
    gameType: EGameType,
    revenue2user: number,
    jackpotAmount: number // 目前只用于提示，不用于计算
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    lastBetAmountButton: number = 0;
    lastResult: IResults = null;
    honeyJarData: IHoneyJarData = {};
    totalFreeResults: IResults[] = [];
    freeHandselHoneyJars: IHoneyJarItem[][] = [];
    historyItems: IHistoryItem[] = [];
}

export default class BeeSlotPlayer
    extends PlayerShiftBase<DataEntity, IRoundResult>
    implements IPlayer, IGamePlayer {
    protected userEntity: DataEntity;
    machine: BeeSlotMachine = new BeeSlotMachine(this.scene, this);
    machineStatus: EGameStatus = EGameStatus.stop;

    regenerateCount = 0;
    regenerateWinCount = 0;

    constructor(protected scene: BeeSlotScene) {
        super(logger);
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
        if (this.machineStatus == EGameStatus.stop) this.changeMachineStatus(EGameStatus.bet);
        let userEntity = await this.getUserEntity(this.uid);
        if (!userEntity) {
            userEntity = new DataEntity;
        }
        this.userEntity = userEntity;
        if (!this.userEntity.totalFreeResults) {
            this.userEntity.totalFreeResults = [];
            this.userEntity.freeHandselHoneyJars = [];
        }
        if (this.userEntity?.lastResult?.freeCount > 0 && this.userEntity?.totalFreeResults?.length === 0) {
            let lastResult = this.userEntity.lastResult;
            this.userEntity.freeHandselHoneyJars = this.machine.getFreeHandselHoneyJars(lastResult.betAmount);
            let gameRate = this.machine.getGameRate(lastResult.betAmount);
            let copyFreeHandselHoneyJars = JSON.parse(JSON.stringify(this.userEntity.freeHandselHoneyJars));
            this.userEntity.totalFreeResults = this.machine.getTotalFreeResults(lastResult.betAmount, lastResult.freeCount, lastResult.freeTotalCount, lastResult.honeyJarDataByBet, copyFreeHandselHoneyJars, gameRate);
        }
    }
    // }}

    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
    }

    async settleResult(roundId: number) {
        let result = this.endRound(roundId);
        if (!result) return;
        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.jackpotAmount })
        await this.winOrder(roundId, result.revenue2user, orderDetail);
        this.scene.onAccountDiamondUpdate(this.uid, { value: this.accountDiamond(), offset: result.revenue2user });
    }
    // }}

    getClientResp(): IEnterGameResp {
        if (!this.userEntity?.historyItems) this.userEntity.historyItems = [];
        let resp: IEnterGameResp = {
            account: this.account,
            betAmountIndex: this.userEntity.lastBetAmountButton,
            lastResult: this.userEntity.lastResult,
            honeyJarData: this.userEntity.honeyJarData,
            playerSettings: this.userEntity.playerSettings,
            historyItems: this.userEntity.historyItems
        }
        return resp;
    }

    changeMachineStatus(machineStatus: EGameStatus) {
        this.machineStatus = machineStatus;
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
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

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.warn("betNormal", "Object.keys(this.userEntity.runningRounds).length > 0", JSON.stringify(this.userEntity));
            await this.stopRunningRound();
        }

        let result: IResults = null;
        let linesBetAmount = betAmount * lineCount;
        let roundId = await this.scene.incrTodayRoundID();
        let code = await this.betOrder(roundId, linesBetAmount);
        if (code == ETradeCode.success) {
            this.scene.onAccountDiamondUpdate(this.uid, { value: this.accountDiamond() });
            let honeyJarDataByBet = this.userEntity.honeyJarData[betAmount];
            result = this.machine.generateResults(betAmount, honeyJarDataByBet);
            this.runRound(roundId, EGameType.normal, result);
        }
        this.scene.onResultHandler(this.uid, { code: code, result: result, roundId: roundId });
    }

    async betFree(): Promise<IBetResp> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.error(JSON.stringify(this.userEntity));
            logger.warn("betFree", "this.machineStatus != EGameStatus.bet", "this.machineStatus:", this.machineStatus);
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

        if (this.coolDown) {
            logger.warn("betFree coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.error(JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }

        let betAmount = this.userEntity.lastResult.betAmount;
        if (!betAmount || this.userEntity?.totalFreeResults?.length === 0) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
                result: null,
                roundId: 0
            }
        }

        let roundId = await this.scene.incrTodayRoundID();
        let result = this.userEntity.totalFreeResults.shift();
        this.runRound(roundId, EGameType.free, result);
        this.scene.onResultHandler(this.uid, { code: 0, result: result, roundId: roundId });
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        this.changeMachineStatus(EGameStatus.final);
        this.settleResult(roundId);
        this.changeMachineStatus(EGameStatus.bet);
        return { accountDiamond: this.account.diamond };
    }

    // {{ 记账，每个游戏不同。
    // runRound 里面的内容如果不理解，可以不填。但先尝试尽量去理解。
    private runRound(roundId: number, gameType: EGameType, result: IResults) {
        this.changeMachineStatus(EGameStatus.run);
        this.userEntity.lastResult = result;
        this.userEntity.honeyJarData[result.betAmount] = result.honeyJarDataByBet;
        if (result.honeyJarArrayLine) {
            //连线完成重置蜜罐
            this.userEntity.honeyJarData[result.betAmount] = [];
            this.save();
        }

        let revenue = (result.betAmount * result.multiple) + result.jackpotAmount;
        let revenue2user = 0;
        if (gameType == EGameType.normal) {
            revenue2user = revenue;
        } else if (gameType == EGameType.free && result.freeCount == 0) {
            revenue2user = result.freeWinAmount;
            this.userEntity.freeHandselHoneyJars = [];
        }

        let runningRound: IRoundResult = {
            gameType: gameType,
            revenue2user: revenue2user,
            jackpotAmount: result.jackpotAmount
        };
        this.startRound(roundId, runningRound);

        let linesBetAmount = gameType == EGameType.normal ? result.betAmount * lineCount : 0;
        this.addHistory(roundId, linesBetAmount, revenue);

        let accountingResult = JSON.parse(JSON.stringify(result));
        delete accountingResult.honeyJarDataByBet;
        delete accountingResult.honeyJarRunItems;
        if (result.honeyJarRunItems) {
            let runHoneyJar = [];
            for (let i = 0; i < result.honeyJarRunItems.length; i++) {
                let item = { id: null, amount: 0, wheel: null };
                item.id = result.honeyJarRunItems[i].id;
                item.amount = result.honeyJarRunItems[i].awardAmount;
                item.wheel = result.honeyJarRunItems[i].jackpotPoolIndex;
                runHoneyJar.push(item);
            }
            accountingResult['runHoneyJar'] = runHoneyJar;
        }
        if (result.freeTotalCount === 0) {
            delete accountingResult.freeCount;
            delete accountingResult.freeTotalCount;
            delete accountingResult.freeWinAmount;
            delete accountingResult.freeGameWildMultiple;
        }
        if (!result.honeyJarArrayLine) {
            delete accountingResult.honeyJarArrayLine;
        }
        if (result.wheelJackpotPoolIndex == null) {
            delete accountingResult.wheelJackpotPoolIndex;
        }
        if (result.jackpotAmount === 0) {
            delete accountingResult.jackpotAmount;
        }

        let line_revenue: number[] = [];
        for (let i = 0; i < result.multiples.length; i++) {
            line_revenue.push(result.betAmount * result.multiples[i]);
        }
        let rateType = this.machine.getLastRoundRateType();
        let now = new Date;
        let round = new BeeSlot_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid;
        round.game_type = gameType;
        round.rate_type = rateType;
        round.result = JSON.stringify(accountingResult);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jp = result.jackpotAmount;
        //round.jackpot_pool = result.jackpotAmountPool[result.betAmount];
        round.bet = linesBetAmount;
        round.revenue = revenue;
        round.save_time = now;

        this.scene.mysql.insertRound(round);

        let buttonBetDetail: UserBetDetail = this.incrBetCount(result.betAmount, round.bet, round.revenue);
        if (!buttonBetDetail.sp) buttonBetDetail.sp = new spDetail;
        if (result.multiple >= bigWinMultiple) buttonBetDetail.sp.nBigwin++;
        if (result.jackpotAmount) buttonBetDetail.sp.nJackpot++;
        if (gameType == EGameType.free && result.freeCount == 0) buttonBetDetail.sp.nFree++;
    }
    // }}

    async setBetAmountButton(betAmountButtonIndex: number, betAmount: number) {
        this.userEntity.lastBetAmountButton = betAmountButtonIndex;
        this.handselHoneyJar(betAmount);
    }

    async handselHoneyJar(betAmount: number) {
        if (!(betAmount in this.userEntity.honeyJarData) || this.userEntity.honeyJarData[betAmount].length === 0) {
            let honeyJarDataByBet: IHoneyJarItem[] = [];
            if (this.userEntity?.totalFreeResults?.length > 0 && this.userEntity?.freeHandselHoneyJars?.length > 0) {
                honeyJarDataByBet = this.userEntity.freeHandselHoneyJars.shift();
            } else {
                honeyJarDataByBet = this.machine.handselHoneyJar(betAmount);
            }
            this.userEntity.honeyJarData[betAmount] = honeyJarDataByBet;
            this.forceSaveUserEntity();
            this.scene.onHandselHoneyJar(this.uid, honeyJarDataByBet);
        }
    }

    override getProgressRevenue(betAmount: number): number {
        let honeyJarRunByBet = this.userEntity.honeyJarData[betAmount];
        if (honeyJarRunByBet && honeyJarRunByBet.length > 0) {
            let progressRevenue = 0;
            for (let i = 0; i < honeyJarRunByBet.length; i++) {
                let honeyJarItem = honeyJarRunByBet[i];
                progressRevenue += honeyJarItem.awardAmount;
                if (honeyJarRunByBet[i].jackpotPoolIndex) {
                    progressRevenue += betAmount * lineCount * jackpotPoolMultiples[honeyJarItem.jackpotPoolIndex];
                }
            }
            return progressRevenue / 2;
        }
        return 0;
    }

    public saveFreeData(totalFreeResults: IResults[], freeHandselHoneyJars: IHoneyJarItem[][]) {
        this.userEntity.totalFreeResults = totalFreeResults;
        this.userEntity.freeHandselHoneyJars = freeHandselHoneyJars;
    }

    private addHistory(roundId: number, linesBetAmount: number, revenue: number) {
        let historyItem: IHistoryItem = {
            time: new Date(),
            round: roundId,
            cost: linesBetAmount,
            win: revenue,
        }
        this.userEntity.historyItems.push(historyItem);
        if (this.userEntity.historyItems.length > 100) this.userEntity.historyItems.shift();
    }

    public test(betAmount: number, testCount: number) {
        return;
        console.log("测试开始......");
        this.regenerateCount = 0;
        this.regenerateWinCount = 0;
        let totalFreeResults: IResults[] = [];
        let honeyJarDataByBet: IHoneyJarItem[] = [];
        let freeHandselHoneyJars: IHoneyJarItem[][] = [];
        let totalBetAmount = 0;
        let totalRevenue = 0;
        let totalJackpotAmount = 0;
        let totalLineCount = 0
        let intoFreeCount = 0;
        let totalWinCount = 0;
        let result: IResults = null;

        honeyJarDataByBet = this.machine.handselHoneyJar(betAmount);
        for (let i = 0; i < testCount; i++) {
            if (totalFreeResults.length > 0) {
                result = totalFreeResults.shift();
                if (result.freeCount <= 0) {
                    intoFreeCount++;
                    freeHandselHoneyJars = [];
                }
            } else {
                totalBetAmount += betAmount * lineCount;
                result = this.machine.generateResults(betAmount, honeyJarDataByBet);
                if (result.freeCount > 0 && totalFreeResults.length === 0) {
                    freeHandselHoneyJars = this.machine.getFreeHandselHoneyJars(betAmount);
                    let afterHoneyJarDataByBet = result.honeyJarArrayLine ? freeHandselHoneyJars.shift() : JSON.parse(JSON.stringify(result.honeyJarDataByBet));
                    let gameRate = this.machine.getGameRate(betAmount)
                    totalFreeResults = this.machine.getTotalFreeResults(betAmount, result.freeCount, result.freeTotalCount, afterHoneyJarDataByBet, freeHandselHoneyJars, gameRate);
                }
            }
            let revenue = result.betAmount * result.multiple + result.jackpotAmount;
            if (revenue > 0) {
                totalWinCount++;
                totalRevenue += revenue;
            }
            honeyJarDataByBet = result.honeyJarDataByBet;
            if (result.jackpotAmount > 0 && result.honeyJarArrayLine) {
                totalLineCount++;
                totalJackpotAmount += result.jackpotAmount;
                honeyJarDataByBet = [];
                if (totalFreeResults.length > 0 && freeHandselHoneyJars.length > 0) {
                    honeyJarDataByBet = freeHandselHoneyJars.shift();
                } else {
                    honeyJarDataByBet = this.machine.handselHoneyJar(betAmount);
                }
            }
        }
        let rewardRate = (totalRevenue / totalBetAmount).toFixed(6);
        let totalWinRate = (totalWinCount / testCount).toFixed(6);
        let regenerateRate = (this.regenerateWinCount / this.regenerateCount).toFixed(6);
        console.log("测试局数:", testCount);
        console.log("档位:", betAmount * lineCount);
        console.log('总押注:', totalBetAmount);
        console.log('jp奖金:', totalJackpotAmount);
        console.log('总奖金:', totalRevenue);
        console.log('进入免费总次数:', intoFreeCount);
        console.log('蜜罐连线总次数:', totalLineCount);
        console.log('返奖率:', rewardRate);
        // console.log("重随次数:", this.regenerateCount);
        // console.log("重随中奖次数:", this.regenerateWinCount);
        // console.log("重随中奖率:", regenerateRate);
        // console.log("总中奖率:", totalWinRate);
    }

}