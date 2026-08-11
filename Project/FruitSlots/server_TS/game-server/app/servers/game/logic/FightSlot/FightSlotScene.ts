import { getLogger } from 'pinus-logger';
import { Application } from 'pinus';
import IGameScene from "../GameScene";
import FightSlotPlayer from "./FightSlotPlayer";
import GameServer from "../../GameServer";
import Redis from "../../database/db/redis";
import { EGameStatus, strServiceMaintenance } from "../../interface/IGame";
import { gConst, IBetResp, IJackpotAmountPool, IResults, IRoundStep, ISceneListen } from '../../interface/IFightSlot';
import { IGameRate, defaultGameRate } from './FightSlotMachine';
import { SceneShiftBase } from '../GameBase/ShiftGame/SceneShiftBase';
let logger = getLogger(gConst.gameName, __filename);

const poolRate = [200, 400, 1000, 6000];

class JackpotAmountPool {
    private jackpotAmountPool: IJackpotAmountPool = {}

    constructor(private redis: Redis) { }

    async initJackpotPool() {

    }

    async saveJackpotPool() {
        await this.redis.setJackpotPool(JSON.stringify(this.jackpotAmountPool));
    }

    getAllPool(): IJackpotAmountPool {
        return this.jackpotAmountPool;
    }

    getPoolAmount(betAmount: number, poolIndex: number): number {
        if (!this.jackpotAmountPool[betAmount])
            this.jackpotAmountPool[betAmount] = [
                betAmount * poolRate[0],
                betAmount * poolRate[1],
                betAmount * poolRate[2],
                betAmount * poolRate[3],
            ]
        let jaclpotAmount = this.jackpotAmountPool[betAmount][poolIndex];
        return jaclpotAmount;
    }

    increasePoolAmount(betAmount: number, poolIndex: number, amount: number) {
        if (!this.jackpotAmountPool[betAmount])
            this.jackpotAmountPool[betAmount] = [
                0,
                0,
                0,
                0,
            ]
        let incr = amount;

        this.jackpotAmountPool[betAmount][poolIndex] += incr;
    }

    decreasePoolAmount(betAmount: number, poolIndex: number, amount: number) {
        if (!this.jackpotAmountPool[betAmount])
            this.jackpotAmountPool[betAmount] = [
                0,
                0,
                0,
                0,
            ]
        this.jackpotAmountPool[betAmount][poolIndex] -= amount;
    }
}

const tick = 1000;

export default class FightSlotScene extends SceneShiftBase<FightSlotPlayer, IGameRate> implements ISceneListen, IGameScene {

    jackpotAmountPool: JackpotAmountPool;

    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }
    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }
    onDestroy() { }
    async onSceneInit() {
        this.jackpotAmountPool = new JackpotAmountPool(this.redis);
        await this.jackpotAmountPool.initJackpotPool();
    }
    onHeartbeat() {
        this.onRoundStep({ runningRoundID: 0, status: EGameStatus.heartbeat, accountDiamond: 0, jackpotPool: this.jackpotAmountPool.getAllPool(), results: null });
        // this.ReadGameRate();
    }
    // }}

    // async ReadGameRate() {
    //     let rateStr: string = await this.redis.getRate();
    //     if (rateStr) {
    //         let rate = JSON.parse(rateStr);
    //         this.gameRates = {
    //             [1]: rate,
    //             [10]: rate,
    //             [1000]: rate,
    //             [10000]: rate,
    //         };
    //     }
    //     else {
    //         await this.redis.setRate(JSON.stringify(defaultGameRate()));
    //     }
    // }

    onMaintenance() {
        this.broadcast("onMaintenance", strServiceMaintenance);
    }

    onRoundStep2Player(uid: string, runningRoundID: number, status: EGameStatus, accountDiamond: number, results: IResults) {
        if (Object.keys(this.playerList).includes(uid)) {
            this.send2Player("onRoundStep", uid, {
                runningRoundID: runningRoundID,
                status: status,
                accountDiamond: accountDiamond,
                jackpotPool: this.jackpotAmountPool.getAllPool(),
                results: results
            });
        }
    }

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            roundStep.runningRoundID = player.runningRoundID;
            roundStep.results = player.runningResults;
            roundStep.status = player.machineStatus;
            roundStep.accountDiamond = player.accountDiamond();
            roundStep.jackpotPool = this.jackpotAmountPool.getAllPool();
            this.send2Player("onRoundStep", uid, roundStep);
        }
    }

    onResultHandler(uid: string, resp: IBetResp) {
        this.send2Player("onResultHandler", uid, resp);
    }

    onAccountDiamondUpdate(uid: string, amount: { value: number; offset?: number; }) {
        this.send2Player("onAccountDiamondUpdate", uid, { value: amount.value, offset: amount?.offset });
    }

    onTest(uid: string, resp: any) {
        this.send2Player("onTest", uid, resp);
    }
}