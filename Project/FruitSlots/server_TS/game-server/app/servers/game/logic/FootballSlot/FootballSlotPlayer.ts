import { getLogger } from "pinus";
import { ERateType } from "../../database/entity/SDKEntity";
import { IBetResp, IEnterGameResp, IPlayer, IResults, IRoundResultResp, gConst } from "../../interface/IFootballSlot";
import { EGameStatus, ETradeCode, arraySum } from "../../interface/IGame";
import IGamePlayer from "../GamePlayer";
import { FootballSlotMachine } from "./FootballSlotMachine";
import { FootballSlotScene } from "./FootballSlotScene";
import { EGameType, FootballSlot_round } from "../../database/entity/FootballSlotEntity";
import { linePaths, bigWinMultiple, lineCount } from "./FootballSlotConfig";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
import { spDetail, UserBetDetail } from "../../database/entity/BalanceEntity";
import { Run } from "./FootballSlotMachineTest";
let logger = getLogger(gConst.gameName, __filename);

interface IRoundResult {
    gameType: EGameType;
    freeCount: number;
    revenue2user: number;
    jackpotAmount: number // 目前只用于提示，不用于计算
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    lastBetAmountButton: number = 0;
    lastResult: IResults = null;
    totalFreeResults: IResults[] = [];
}

export class FootballSlotPlayer
    extends PlayerShiftBase<DataEntity, IRoundResult>
    implements IPlayer, IGamePlayer {
    protected userEntity: DataEntity;
    private machine: FootballSlotMachine = new FootballSlotMachine(this.scene, this);

    roundResults: { [roundId: number]: IResults } = {};
    totalBet = 0;
    runningRoundID: number;
    runningResults: IResults;
    machineStatus: EGameStatus = EGameStatus.stop;

    regenerateCount = 0;
    regenerateWinCount = 0;

    constructor(protected scene: FootballSlotScene) {
        super(logger);
    }

    // {{ 照抄就好，不放在基类是方便每个游戏各自调试自己的入口
    async enterGame(): Promise<IEnterGameResp> {
        if (!this.userEntity) await this.initPlayer();
        return this.getClientResp();
    }

    async synchronize(): Promise<IEnterGameResp> {
        let account = await this.queryUserAccount();
        if (account) this.account = account;
        return this.enterGame();
    }
    // }}

    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
        this.destroyMachine();
    }

    async settleResult(roundId: number) {
        let resp = this.roundResults[roundId];
        let result = this.endRound(roundId);
        if (!result)
            return;

        delete this.roundResults[roundId];

        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.shootGame });
        await this.winOrder(roundId, result.revenue2user, orderDetail);
        this.updateTotalBet();
        this.scene.onAccountDiamondUpdate(this.uid, this.account.diamond);

        if (result.revenue2user > 0 && this.scene.topUserUids.includes(this.uid)) {
            this.scene.totalHints.push({
                uid: this.uid,
                betResp: {
                    wildOfFree: 0,
                    betAmount: resp.betAmount,
                    results: [],
                    lineSames: [],
                    multiple: resp.multiple,
                    multiples: [],
                    shootGame: resp.shootGame,
                    shootGameChance: 0,
                    freeCount: 0,
                    roundId: roundId
                }
            })
        }
    }
    // }}

    async initPlayer() {
        if (this.machineStatus == EGameStatus.stop) this.changeMachineStatus(EGameStatus.bet, null);
        let userEntity = await this.getUserEntity(this.uid);
        this.userEntity = userEntity ? userEntity : new DataEntity;
        this.updateTotalBet();
        if (this.userEntity?.lastResult?.freeCount > 0 && this.userEntity?.totalFreeResults?.length === 0) {
            let lastResult = this.userEntity.lastResult;
            let gameRate = this.machine.getGameRate(lastResult.betAmount);
            this.userEntity.totalFreeResults = this.machine.getTotalFreeResults(lastResult.betAmount, lastResult.freeCount, gameRate);
        }
    }

    getClientResp(): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            betAmountIndex: this.userEntity.lastBetAmountButton,
            playerSettings: this.userEntity.playerSettings,
            lastResult: this.userEntity.lastResult,
        }
        return resp;
    }

    updateTotalBet() {
        for (let i in this.userEntity.balance.betDetail)
            this.totalBet += this.userEntity.balance.betDetail[i].betTotal;
    }

    changeMachineStatus(machineStatus: EGameStatus, results: IResults) {
        this.machineStatus = machineStatus;
        this.runningResults = results;
        if (machineStatus != EGameStatus.run) this.runningRoundID = 0;
        this.scene.onRoundStepToPlayer(this.uid, this.runningRoundID, machineStatus, this.account.diamond, results);
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.coolDown) {//第一层防护墙，0.2秒的冷却时间，防高频触发
            logger.warn("betNormal", "this.coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {//第二层防护墙，在stopRound之前不可触发
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", JSON.stringify(this.userEntity));
            return null;
        }

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.warn("betNormal", "Object.keys(this.userEntity.runningRounds).length > 0", JSON.stringify(this.userEntity));
            await this.stopRunningRound();
        }

        let roundId = -1;
        let result: IResults = null;
        let linesBetAmount = betAmount * linePaths.length;
        roundId = await this.scene.incrTodayRoundID();
        let code = await this.betOrder(roundId, linesBetAmount);
        this.scene.onAccountDiamondUpdate(this.uid, this.accountDiamond());
        if (code == ETradeCode.success) {
            result = this.machine.generateResults(betAmount);
            result.roundId = roundId;
            this.runningRoundID = roundId;
            this.runRound(roundId, EGameType.normal, result);
            this.roundResults[roundId] = result;
            this.scene.onResultHandler(this.uid, result);
        }

        return {
            code: code,
        }
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
            }
        }

        let freeCount = this.userEntity.lastResult.freeCount;
        let betAmount = this.userEntity.lastResult.betAmount;
        if (!freeCount || !betAmount || this.userEntity.totalFreeResults.length === 0) {
            logger.error(JSON.stringify(this.userEntity));
            return {
                code: 0,
            }
        }

        if (Object.keys(this.userEntity.runningRounds).length > 0) { // 逻辑上虽然兼容，但有点神奇，记录下来看这种情况有多少。
            logger.error(JSON.stringify(this.userEntity.runningRounds));
            await this.stopRunningRound();
        }
        
        let roundId = await this.scene.incrTodayRoundID();
        let result = this.userEntity.totalFreeResults.shift();
        result.roundId = roundId;
        this.runningRoundID = roundId;
        this.runRound(roundId, EGameType.free, result);
        this.roundResults[roundId] = result;
        this.scene.onResultHandler(this.uid, result);
        return {
            code: 0,
        }

    }
    shootBall() {
        if (this.userEntity.lastResult != null) {
            this.userEntity.lastResult.shootGameChance--;
            if (this.userEntity.lastResult.shootGameChance < 0) {
                logger.warn("shootGame", this.userEntity);
            }
            else {
                this.saveUserEntity();
            }
        }
        else {
            logger.error("shootGame", this.userEntity);
        }
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        this.changeMachineStatus(EGameStatus.final, null);
        this.settleResult(roundId);
        this.changeMachineStatus(EGameStatus.bet, null);
        return { accountDiamond: this.account.diamond };
    }

    // {{ 记账，每个游戏不同。
    // runRound 里面的内容如果不理解，可以不填。但先尝试尽量去理解。
    private runRound(roundId: number, gameType: EGameType, result: IResults) {
        this.changeMachineStatus(EGameStatus.run, result);
        let shootGameAward = arraySum(result.shootGame) * result.betAmount * linePaths.length;
        this.userEntity.lastResult = result;
        let revenue = (result.betAmount * result.multiple) + shootGameAward;
        let runningRound: IRoundResult = {
            gameType: gameType,
            freeCount: result.freeCount,
            revenue2user: revenue,
            jackpotAmount: shootGameAward
        };
        this.startRound(roundId, runningRound);

        let line_revenue: number[] = [];
        for (let i = 0; i < result.multiples.length; i++) {
            line_revenue.push(result.betAmount * result.multiples[i]);
        }
        let now = new Date;
        let round = new FootballSlot_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid,
        round.game_type = gameType;
        round.rate_type = gameType == EGameType.free ? ERateType.free : this.machine.getLastRoundRateType();
        round.result = JSON.stringify(result);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jackpot = shootGameAward;
        round.bet = gameType == EGameType.normal ? result.betAmount * linePaths.length : 0;
        round.revenue = revenue;
        round.save_time = now;
        this.scene.mysql.insertRound(round);

        let buttonBetDetail: UserBetDetail = this.incrBetCount(result.betAmount, round.bet, round.revenue);
        if (!buttonBetDetail.sp) buttonBetDetail.sp = new spDetail;
        if (result.multiple >= bigWinMultiple) buttonBetDetail.sp.nBigwin++;
        if (gameType == EGameType.free && result.freeCount == 0) buttonBetDetail.sp.nFree++;
        if (shootGameAward > 0) buttonBetDetail.sp.nJackpot++;

    }
    // }}

    async setBetAmountButton(betAmountButtonIndex: number) {
        this.userEntity.lastBetAmountButton = betAmountButtonIndex;
    }

    async destroyMachine() {
        // 足球有射门，需要强行 destroy
        if (this.userEntity.lastResult != null) {
            let i = 0;
            while (this.userEntity.lastResult.shootGameChance > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (i++ > 10) {
                    logger.warn("destroyMachine", this.uid, this.userEntity.lastResult.shootGameChance);
                    break;
                }
            }
            this.userEntity.lastResult.shootGameChance = 0;
        }
    }

    public saveTotalFreeResults(totalFreeResults: IResults[]) {
        this.userEntity.totalFreeResults = totalFreeResults;
    }

    public test(betAmount: number, testCount: number) {
        //return;
        console.log("测试开始......");
        this.regenerateCount = 0;
        this.regenerateWinCount = 0;
        let results: IResults = null;
        let totalFreeResults: IResults[] = [];
        let totalBetAmount = 0;
        let totalWinAmount = 0;
        let totalFreeCount = 0;
        let intoFreeCount = 0;
        let intoShootGame = 0;
        let totalShootWinAmount = 0;
        let totalWinCount = 0;
        let linesBetAmount = betAmount * linePaths.length;
        for (let i = 0; i < testCount; i++) {
            if (totalFreeResults.length > 0) {
                totalFreeCount++;
                results = totalFreeResults.shift();
            } else {
                totalBetAmount += linesBetAmount;
                results = this.machine.generateResults(betAmount);
                if (results.freeCount > 0 && totalFreeResults.length == 0) {
                    let gameRate = this.machine.getGameRate(betAmount);
                    totalFreeResults = this.machine.getTotalFreeResults(betAmount, results.freeCount, gameRate);
                    intoFreeCount++;
                }
            }
            let shootGameAward = arraySum(results.shootGame) * linesBetAmount;
            let revenue = betAmount * results.multiple + shootGameAward;
            totalWinAmount += revenue;
            if (shootGameAward > 0) {
                intoShootGame++;
                totalShootWinAmount += shootGameAward;
            }
            if (revenue > 0) totalWinCount++;
        }

        let rewardRate = (totalWinAmount / totalBetAmount).toFixed(6);
        // let totalWinRate = (totalWinCount / testCount).toFixed(6);
        // let regenerateRate = (this.regenerateWinCount / this.regenerateCount).toFixed(6);
        console.log("测试局数:", testCount);
        console.log("档位:", linesBetAmount);
        console.log('总押注:', totalBetAmount);
        console.log('免费总次数:', intoFreeCount);
        console.log('免费总局数:', totalFreeCount);
        console.log('射门总次数:', intoShootGame);
        console.log('射门总奖金:', totalShootWinAmount);
        console.log('总奖金:', totalWinAmount);
        console.log('返奖率:', rewardRate);
        // console.log("重随次数:", this.regenerateCount);
        // console.log("重随中奖次数:", this.regenerateWinCount);
        // console.log("重随中奖率:", regenerateRate);
        // console.log("总中奖率:", totalWinRate);
        //Run()
    }

}