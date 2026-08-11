import { Application, getLogger } from "pinus";
import GameServer from "../../GameServer";
import IGameScene from "../GameScene";
import { EGameStatus, strServiceMaintenance } from "../../interface/IGame";
import { gConst, IJackpotHint, IWinHint, IRoundStep, ISceneListen, IBetResp } from "../../interface/IYummySlot";
import YummySlotPlayer from "./YummySlotPlayer";
import { SceneShiftBase } from "../GameBase/ShiftGame/SceneShiftBase";
import { defaultGameRate, IGameRate } from "./YummySlotMachine";
let logger = getLogger(gConst.gameName, __filename);
export default class YummySlotScene extends SceneShiftBase<YummySlotPlayer, IGameRate> implements ISceneListen, IGameScene {
    /**玩家公共jp池 */
    private _jackpotPool: number = 0;
    async initJackpotPool() {
        this._jackpotPool = (Number(await this.redis.getJackpotPool()) || 0);
    }
    async saveJackpotPool() {
        await this.redis.setJackpotPool(Math.floor(this._jackpotPool).toString());
    }
    get jackpotPool() {
        return this._jackpotPool
    }
    IncrJackpotPool(value: number) {
        this._jackpotPool += value;
    }
    DecrJackpotPool(value: number) {
        this._jackpotPool -= value;
    }

    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }
    totalWinHints: IWinHint[] = [];
    totalJackpotHints: IJackpotHint[] = [];
    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }
    onDestroy() {
        this.saveJackpotPool();
    }
    async onSceneInit() {
        this.gameStatus = EGameStatus.run;
        this.initJackpotPool();
    }
    onHeartbeat() {
        this.onRoundStep({ gameStatus: EGameStatus.heartbeat, jackpot: this.jackpotPool, results: null });
        // this.ReadGameRate();
        this.totalWinHints.sort((a, b) => b.winAmount - a.winAmount);
        this.totalWinHints.splice(3);
        if (this.totalWinHints.length > 0) {
            this.onWinHint(this.totalWinHints);
            this.totalWinHints = [];
        }
        this.totalJackpotHints.sort((a, b) => b.jackpotAmount - a.jackpotAmount);
        this.totalJackpotHints.splice(3);
        if (this.totalJackpotHints.length > 0) {
            this.onJackpotHint(this.totalJackpotHints);
            this.totalJackpotHints = [];
        }
    }

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

    onAccountDiamondUpdate(uid: string, amount: { value: number; offset?: number; }) {
        this.send2Player("onAccountDiamondUpdate", uid, amount);
    }
    onResultHandler(uid: string, resp: IBetResp) {
        this.send2Player("onResultHandler", uid, resp);
    }
    onJackpotHint(resp: IJackpotHint[]) {
        this.broadcast("onJackpotHint", resp);
    }
    onWinHint(resp: IWinHint[]) {
        this.broadcast("onWinHint", resp);
    }

    onMaintenance() {
        this.broadcast("onMaintenance", strServiceMaintenance);
    }
    async incrTodayBet(incr: number) {
        await this.dingdingWarn.incrTodayBet(this.today, incr);
    }

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            roundStep.results = player.runningResults;
            roundStep.gameStatus = player.machineStatus;
            roundStep.jackpot = this.jackpotPool;
            this.send2Player("onRoundStep", uid, roundStep);
        }
    }

    onTest(uid: string, resp: any) {
        this.send2Player("onTest", uid, resp);
    }
}