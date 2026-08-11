import { IEnterGameResp, IBetResp, gConst, EBetAmountIndex, IResults, IPlayer, IRoundResultResp, IHistoryItem } from "../../interface/IPirateKing";
import { getLogger } from 'pinus-logger';
let logger = getLogger(gConst.gameName, __filename);

import IGamePlayer from "../GamePlayer"
import { PirateKing_round, EGameType } from "../../database/entity/PirateKingEntity";
import { EGameStatus, ETradeCode } from "../../interface/IGame";
import { bigWinMultiple, lineCount } from "./PirateKingConfig";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
import { spDetail, UserBetDetail } from "../../database/entity/BalanceEntity";
import PirateKingScene from "./PirateKingScene";
import { PirateKingMachine } from "./PirateKingMachine";

interface IRoundResult {
    gameType: EGameType,
    revenue2user: number,
    jackpotAmount: number // 目前只用于提示，不用于计算
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    lastBetAmountButton: EBetAmountIndex = EBetAmountIndex.single;
    lastResult: IResults = null;
    historyList: IHistoryItem[] = [];
}

export default class PirateKingPlayer
    extends PlayerShiftBase<DataEntity, IRoundResult>
    implements IPlayer, IGamePlayer {
    protected userEntity: DataEntity;
    private machine: PirateKingMachine = new PirateKingMachine(this.scene, this);

    historyMap: Map<number, IHistoryItem> = new Map();
    roundResults: { [roundId: number]: IBetResp } = {};

    runningRoundID: number;
    runningResults: IResults;
    machineStatus: EGameStatus = EGameStatus.stop;

    totalBet = 0;

    myTest = false;
    testCount = 0;

    constructor(protected scene: PirateKingScene) {
        super(logger);
    }

    get Diamond(): number {
        return this.account.diamond;
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

    async initPlayer() {
        if (this.machineStatus == EGameStatus.stop) this.changeMachineStatus(EGameStatus.bet, null);
        let userEntity = await this.getUserEntity(this.uid);
        this.userEntity = userEntity ? userEntity : new DataEntity;
        this.updateTotalBet();
    }
    // }}

    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
    }

    async settleResult(roundId: number) {
        let resp = this.roundResults[roundId];
        let result = this.endRound(roundId);
        if (!result)
            return;

        delete this.roundResults[roundId];

        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.jackpotAmount })
        let code = await this.winOrder(roundId, result.revenue2user, orderDetail);
        let offset = 0;
        if (code == ETradeCode.success)
            offset = resp.result.jackpotAmount > 0 ? resp.result.jackpotAmount : resp.result.multiple * resp.result.betAmount;
        this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond, offset: offset });

        this.updateTotalBet();

        if (result.revenue2user > 0 && this.scene.topUserUids.includes(this.uid)) {
            this.scene.totalHints.push({
                uid: this.uid,
                betResp: {
                    code: ETradeCode.success,
                    result: {
                        betAmount: resp.result.betAmount,
                        results: [],
                        lineSames: [],
                        multiple: resp.result.multiple,
                        multiples: [],
                        jackpotAmount: resp.result.jackpotAmount,
                    },
                    roundId: roundId,
                    extra: null,// this.userEntity,
                }
            })
        }
    }
    // }}

    getClientResp(): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            betAmountIndex: this.userEntity.lastBetAmountButton,
            playerSettings: this.userEntity.playerSettings,
            lastResult: this.userEntity.lastResult,
            historyList: this.userEntity.historyList
        }
        return resp;
    }

    updateTotalBet() {
        this.totalBet = 0;
        for (let i in this.userEntity.balance.betDetail)
            this.totalBet += this.userEntity.balance.betDetail[i].betTotal;
    }

    test() {
        return;
        if (this.scene.getEnv() == "development") this.myTest = true;

        if (this.myTest && this.testCount < 100000) {
            if (this.machineStatus == EGameStatus.bet) {
                this.betNormal(1);
            } else if (this.machineStatus == EGameStatus.run) {
                this.stopRound(this.runningRoundID);
                if (++this.testCount % 100 == 0) {
                    // 通过 redis 的 dingding 数据可以记录该值
                    console.log(this.uid, "round " + this.testCount + " :", "bet", this.userEntity.balance.betDetail[1].betTotal, "revenue", this.userEntity.balance.betDetail[1].revenueTotal);
                }
            }
        }
    }

    changeMachineStatus(machineStatus: EGameStatus, results: IResults) {
        this.machineStatus = machineStatus;
        this.runningResults = results;
        if (machineStatus != EGameStatus.run) this.runningRoundID = 0;
        this.scene.onRoundStep2Player(this.uid, this.runningRoundID, machineStatus, this.account.diamond, results);
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.coolDown) {
            logger.warn("betNormal", "this.coolDown", JSON.stringify(this.userEntity));
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", JSON.stringify(this.userEntity));
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
        let offset = 0;
        if (code == ETradeCode.success)
            offset = -linesBetAmount;
        this.scene.onAccountDiamondUpdate(this.uid, { value: this.account.diamond, offset: offset });
        if (code == ETradeCode.success) {
            result = this.machine.generateResults(betAmount);
            let resp: IBetResp = {
                code: code,
                result: result,
                roundId: roundId,
                extra: null,
            }
            this.runningRoundID = roundId;
            this.runRound(roundId, EGameType.normal, result);
            this.roundResults[roundId] = resp;
            this.scene.onResultHandler(this.uid, resp);

            let historyList = this.userEntity.historyList ? this.userEntity.historyList : [];
            let historyItem: IHistoryItem = {
                time: new Date().getTime().toString(),
                round: roundId,
                betAmount: result.betAmount,
                lineSames: result.lineSames,
                multiple: result.multiple,
                jackpotAmount: result.jackpotAmount
            }
            historyList.push(historyItem);
            this.historyMap.set(roundId, historyItem);
            if(historyList.length > 20) historyList.shift();
            this.userEntity.historyList = historyList;
        }

        return {
            code: code,
            result: null,
            roundId: roundId,
            extra: null,
        }
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        this.changeMachineStatus(EGameStatus.final, null);
        let historyItem = this.historyMap.get(roundId);
        this.scene.onHistoryUpdate(historyItem, this.uid);
        this.historyMap.delete(roundId);
        this.settleResult(roundId);
        this.changeMachineStatus(EGameStatus.bet, null);
        return { accountDiamond: this.account.diamond };
    }

    // {{ 记账，每个游戏不同。
    // runRound 里面的内容如果不理解，可以不填。但先尝试尽量去理解。
    private runRound(roundId: number, gameType: EGameType, result: IResults) {
        this.changeMachineStatus(EGameStatus.run, result);

        this.userEntity.lastResult = result;
        let revenue = (result.betAmount * result.multiple) + result.jackpotAmount;
        let revenue2user = 0;
        if (gameType == EGameType.normal) {
            revenue2user = revenue;
        }

        let runningRound: IRoundResult = {
            gameType: gameType,
            revenue2user: revenue2user,
            jackpotAmount: result.jackpotAmount
        };
        this.startRound(roundId, runningRound);

        let line_revenue: number[] = [];
        for (let i = 0; i < result.multiples.length; i++) {
            line_revenue.push(result.betAmount * result.multiples[i]);
        }
        let now = new Date;
        let round = new PirateKing_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid,
            round.game_type = gameType;
        round.rate_type = this.machine.getLastRoundRateType();
        round.result = JSON.stringify(result);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jackpot = result.jackpotAmount;
        round.bet = result.betAmount * lineCount;
        round.revenue = revenue;
        round.save_time = now;

        this.scene.mysql.insertRound(round);

        let buttonBetDetail: UserBetDetail = this.incrBetCount(result.betAmount, round.bet, round.revenue);
        if (!buttonBetDetail.sp) buttonBetDetail.sp = new spDetail;
        if (result.multiple >= bigWinMultiple) buttonBetDetail.sp.nBigwin++;
        if (result.jackpotAmount) buttonBetDetail.sp.nJackpot++;
    }
    // }}

    async setBetAmountButton(betAmountButtonIndex: EBetAmountIndex) {
        this.userEntity.lastBetAmountButton = betAmountButtonIndex;
    }
}