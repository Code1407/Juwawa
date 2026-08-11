import { getLogger } from 'pinus-logger';
import { Application } from 'pinus';
import IGameScene from "../GameScene";
import FruitSlotsPlayer from "./FruitSlotsPlayer";
import GameServer from "../../GameServer";
import Redis from "../../database/db/redis";
import { EGameStatus } from "../../interface/IGame";
import { gConst, IHint, IJackpotAmountPool, initJackpotAmountPool, IResults, IRoundStep, ISceneListen } from '../../interface/IFruitSlots';
import { defaultGameRate, IGameRate } from './FruitSlotsMachine';
import { SceneShiftBase } from '../GameBase/ShiftGame/SceneShiftBase';
let logger = getLogger(gConst.gameName, __filename);

class JackpotAmountPool {
    private jackpotAmountPool: IJackpotAmountPool = JSON.parse(JSON.stringify(initJackpotAmountPool));

    constructor(private redis: Redis) {}

    async initJackpotPool() {
        let jackpotAmountPoolStr = await this.redis.getJackpotPool();
        if (jackpotAmountPoolStr?.length > 0) {
            let jackpotAmountPool = JSON.parse(jackpotAmountPoolStr);
            if (Object.keys(jackpotAmountPool).length >= 4) {
                this.jackpotAmountPool = jackpotAmountPool;
            }
        }
    }

    async saveJackpotPool() {
        await this.redis.setJackpotPool(JSON.stringify(this.jackpotAmountPool));
    }

    getAllPool(): IJackpotAmountPool {
        return this.jackpotAmountPool;
    }

    getPoolAmount(poolIndex: number): number {
        if (!this.jackpotAmountPool[poolIndex]) this.jackpotAmountPool[poolIndex] = 0;
        let jackpotAmount = this.jackpotAmountPool[poolIndex];
        return jackpotAmount;
    }

    increasePoolAmount(poolIndex: number, amount: number) {
        if (!this.jackpotAmountPool[poolIndex]) this.jackpotAmountPool[poolIndex] = 0;

        let incr = amount;
        if (this.jackpotAmountPool[poolIndex] > poolIndex * 22000) incr = amount / 4;
        else if (this.jackpotAmountPool[poolIndex] > poolIndex * 20000) incr = amount / 2;
        else if (this.jackpotAmountPool[poolIndex] < poolIndex * 15000 && poolIndex >= 1000) incr = amount + amount;
        else if (this.jackpotAmountPool[poolIndex] < poolIndex * 17000 && poolIndex >= 100) incr = amount + amount / 2;

        this.jackpotAmountPool[poolIndex] += incr;
    }

    decreasePoolAmount(poolIndex: number, amount: number) {
        if (!this.jackpotAmountPool[poolIndex]) this.jackpotAmountPool[poolIndex] = 0;
        this.jackpotAmountPool[poolIndex] -= amount;
    }
}

const tick = 1000;

export default class FruitSlotsScene 
    extends SceneShiftBase<FruitSlotsPlayer, IGameRate> 
    implements IGameScene, ISceneListen
{
    jackpotAmountPool: JackpotAmountPool;

    constructor(app: Application, gameServer: GameServer, sdkName: string) { 
        super(gameServer, gConst.gameName, logger);
    }

    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }
    onDestroy() {}
    async onSceneInit() {
        this.jackpotAmountPool = new JackpotAmountPool(this.redis)
        await this.jackpotAmountPool.initJackpotPool();
    }
    onHeartbeat() {
        this.onRoundStep({runningRoundID: 0, status: EGameStatus.heartbeat, accountDiamond: 0, jackpotPool: this.jackpotAmountPool.getAllPool(), results: null});
    }
    // }}

    onRoundStep2Player(uid: string, runningRoundID: number, status: EGameStatus, accountDiamond: number, results: IResults) {
        if (Object.keys(this.playerList).includes(uid)) {
            this.send2Player("onRoundStep", uid, {
                runningRoundID: runningRoundID, 
                status: status, 
                accountDiamond: accountDiamond, 
                jackpotPool: this.jackpotAmountPool.getAllPool(), 
                results: results});
        }
    }

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            roundStep.runningRoundID = player.runningRoundID;
            roundStep.results = player.runningResults;
            roundStep.status = player.machineStatus;
            roundStep.accountDiamond = player.Diamond;
            roundStep.jackpotPool = this.jackpotAmountPool.getAllPool();
            this.send2Player("onRoundStep", uid, roundStep);
        }
    }

    onJackpotHint(hint: IHint) {
        this.broadcast("onJackpotHint", hint);
    }
}