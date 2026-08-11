import { IEnterGameResp, IBetResp, gConst, EBetAmountIndex, IResults, IPlayer, IRoundResultResp, getRandomNumInt, lineCount, bigWinMultiple } from "../../interface/IFruitSlots";
import { getLogger } from 'pinus-logger';
let logger = getLogger(gConst.gameName, __filename);

import IGamePlayer from "../GamePlayer"
import { EGameType, FruitSlots_round } from "../../database/entity/FruitSlotsEntity";
import FruitSlotsScene from "./FruitSlotsScene";
import { FruitSlotsMachine } from "./FruitSlotsMachine";
import { EGameStatus, ETradeCode } from "../../interface/IGame";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
import { spDetail, UserBetDetail } from "../../database/entity/BalanceEntity";
import { newUserRoundDefault } from "../GameBase/ShiftGame/ConfigShiftDefault";

const jackpotPeriod = 5000;

interface IJackpotRate {
    min: number;
    max: number;
}

interface IJackpotDictionary {
    [betAmount: number]: {
        betRound: number;  // jackpotPeriod 周期里的第几局
        jackpotRound: number[]; // 每 jackpotPeriod 局里出现 jackpot 的场次
    }
}

const jackpotRateDefault = {min: 2, max: 2};

class UserJackpot {
    rate: IJackpotRate = jackpotRateDefault;
    dict: IJackpotDictionary = {};
}

interface IRoundResult {
    gameType: EGameType,
    revenue2user: number,
    jackpotAmount: number // 目前只用于提示，不用于计算
}

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    jackpot:UserJackpot = new UserJackpot();
    lastBetAmountButton: EBetAmountIndex = EBetAmountIndex.single;
    lastResult: IResults = null;
}

export default class FruitSlotsPlayer 
    extends PlayerShiftBase<DataEntity, IRoundResult> 
    implements IPlayer, IGamePlayer 
{
    protected userEntity: DataEntity;
    private machine: FruitSlotsMachine = new FruitSlotsMachine(this.scene, this);

    runningRoundID: number;
    runningResults: IResults;
    machineStatus: EGameStatus = EGameStatus.stop;

    myTest = false;
    
    testCount = 0;

    constructor(protected scene: FruitSlotsScene) {
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
    }
    // }}

    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
    }

    async settleResult(roundId: number) {
        let result = this.endRound(roundId);
        if (!result) return;

        let orderDetail = JSON.stringify({ multiples: this.userEntity.lastResult.multiples, jp: this.userEntity.lastResult.jackpotAmount })
        this.winOrder(roundId, result.revenue2user, orderDetail);

        if (result.jackpotAmount > 0) {
            this.scene.onJackpotHint({
                userName: this.account.nickname, 
                amount: result.jackpotAmount});
        }
    }
    // }}

    getClientResp(): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            jackpotAmountPool: this.scene.jackpotAmountPool.getAllPool(),
            betAmountIndex: this.userEntity.lastBetAmountButton,
            lastResult: this.userEntity.lastResult
        }
        return resp;
    }

    test() {
        return;
        
        if (this.scene.getEnv() == "development") this.myTest = true;

        if (this.myTest && this.testCount < 100000) {
            if (this.machineStatus == EGameStatus.bet) {
                if (this.userEntity.lastResult?.freeCount) {
                    this.betFree();
                } else {
                    this.betNormal(50);
                }
            } else if (this.machineStatus == EGameStatus.run) {
                this.stopRound(this.runningRoundID);
            }
        }
    }

    changeMachineStatus(machineStatus: EGameStatus, results: IResults) {
        this.machineStatus = machineStatus;
        this.runningResults = results;
        if (machineStatus != EGameStatus.run) this.runningRoundID = 0;
        this.scene.onRoundStep2Player(this.uid, this.runningRoundID, machineStatus, this.account.diamond, results);
    }

    private async incrJackpotCount(betAmount: number): Promise<number> {
        let jackpotDefault = JSON.parse(JSON.stringify(jackpotRateDefault));
        let jackpotRateStr = await this.scene.redis.getJackpot();
        let jackpotRate: IJackpotRate = jackpotRateStr ? JSON.parse(jackpotRateStr) : jackpotDefault;
        if (!jackpotRate.min || !jackpotRate.max) jackpotRate = jackpotDefault;

        if (jackpotRate.min != this.userEntity.jackpot.rate.min
        || jackpotRate.max != this.userEntity.jackpot.rate.max) {
            this.userEntity.jackpot.dict = {};
        }

        if (!this.userEntity.jackpot.dict[betAmount]) this.userEntity.jackpot.dict[betAmount] = {betRound: 0, jackpotRound: []};
        let jackpotItem = this.userEntity.jackpot.dict[betAmount];
        let betRound = ++jackpotItem.betRound;
        
        if (betRound % jackpotPeriod == 1) {
            jackpotItem.jackpotRound = [];
            let jackpotCount = getRandomNumInt(jackpotRate.min, jackpotRate.max);
            for (let i = 0; i < jackpotCount; i=i) {
                let round = getRandomNumInt(newUserRoundDefault * 3, jackpotPeriod);
                if (!jackpotItem.jackpotRound.includes(round)) {
                    jackpotItem.jackpotRound.push(round);
                    i++;
                }
            }
            jackpotItem.jackpotRound.sort((a,b)=>a-b);
        }

        return betRound;
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (this.machineStatus != EGameStatus.bet) {
            logger.warn("betNormal", "this.machineStatus != EGameStatus.bet", JSON.stringify(this.userEntity));
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

        if (this.userEntity.lastResult) {
            this.userEntity.lastResult.freeWinAmount = 0;
            this.userEntity.lastResult.freeCount = 0;
        }
        let result: IResults = null;
        let linesBetAmount = betAmount * lineCount;
        let roundId = await this.scene.incrTodayRoundID();
        let code = await this.betOrder(roundId, linesBetAmount);
        if (code == ETradeCode.success) {                
            let jackpotCount = await this.incrJackpotCount(betAmount);
            let jackpotRound = this.userEntity.jackpot.dict[betAmount].jackpotRound;
            let jackpot = false;
            if (jackpotRound.length > 0 && jackpotCount >= jackpotRound[0]) {
                jackpotRound.shift();
                jackpot = true;
            }
            result = await this.machine.generateResults(betAmount, jackpot, 0, 0);
            result.freeWinAmount = 0;
            this.runningRoundID = roundId;
            this.runRound(roundId, EGameType.normal, result);
        }
       
        let resp = {
            code: code,
            result: result,
            roundId: roundId
        }
        return resp;
    }

    async betFree(): Promise<IBetResp> {
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

        let freeWinAmount = this.userEntity.lastResult.freeWinAmount ? this.userEntity.lastResult.freeWinAmount : 0;
        let roundId = await this.scene.incrTodayRoundID();
        let result = await this.machine.generateResults(betAmount, false, freeWinAmount, freeCount);
        this.runningRoundID = roundId;
        this.runRound(roundId, EGameType.free, result);

        return {
            code: 0,
            result: result,
            roundId: roundId
        }
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        this.changeMachineStatus(EGameStatus.final, null);
        this.settleResult(roundId);
        this.changeMachineStatus(EGameStatus.bet, null);
        return {accountDiamond: this.account.diamond};
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
        } else if (gameType == EGameType.free && result.freeCount == 0) {
            revenue2user = result.freeWinAmount;
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
        let round = new FruitSlots_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid,
        round.game_type = gameType;
        round.rate_type = this.machine.getLastRoundRateType();
        round.result = JSON.stringify(result);
        round.line_revenue = JSON.stringify(line_revenue);
        round.jackpot = result.jackpotAmount;
        round.jackpot_pool = result.jackpotAmountPool[result.betAmount];
        round.bet = gameType == EGameType.normal ? result.betAmount * lineCount : 0;
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

    async setBetAmountButton(betAmountButtonIndex: EBetAmountIndex) {
        this.userEntity.lastBetAmountButton = betAmountButtonIndex;
    }
}