import { EGameStatus } from "../../../interface/IGame";
import IGameMachine from "../../GameMachine";
import { PlayerCountDownBase, CoundDownEntity } from "./PlayerCountDownBase";
import { SceneCountDownBase } from "./SceneCountDownBase";

export interface IRoundStepCountDown {
    todayRound: number;
    status: EGameStatus;
    remainSecond: number;
}

type CountDownPlayer = PlayerCountDownBase<CoundDownEntity>;

export abstract class MachineCountDownBase<RountStepType extends IRoundStepCountDown> implements IGameMachine {
    protected abstract roundStep: RountStepType;
    abstract start();
    abstract stop();
    abstract update(dt: number);
    abstract onNewRound();
    abstract setGameRate(probability: any);
    abstract validRate(probability: any): boolean;

    protected lifecycle: NodeJS.Timeout;
    protected loop = true;
    protected resultCountMap: { [result: number]: number } = {};
    private isNewDay = false;

    constructor(protected scene: SceneCountDownBase<CountDownPlayer, MachineCountDownBase<RountStepType>>) {
    }

    async initMachine() {
        this.start();
        await this.newRound();
        let frameTime = 1000;
        this.lifecycle = setInterval(() => this.update(frameTime), frameTime);
    }

    async restart(): Promise<EGameStatus> {
        if (this.loop == false) {
            this.loop = true;
            await this.initMachine();
        }
        return this.status();
    }

    status(): EGameStatus {
        return this.roundStep.status;
    }

    todayRound(): number {
        return this.roundStep.todayRound;
    }

    resetRoundIfNewDay() {
        if (this.isNewDay) {
            this.roundStep.todayRound = 0;
            this.isNewDay = false;
        }
    }

    onNewDay() {
        this.isNewDay = true;
    }

    getRoundStep(): RountStepType {
        return JSON.parse(JSON.stringify(this.roundStep));
    }

    RecordResults(results: number[]) {
        for (let r of results) {
            this.resultCountMap[r] = (this.resultCountMap[r] || 0) + 1;
        }
        return this.resultCountMap;
    }

    async newRound() {
        this.scene.redis.setTodayRound(this.scene.today, this.roundStep.todayRound);
        if (!this.loop) {
            this.stop();
            return false;
        }
        await this.scene.newRound();
        this.onNewRound();
    }

    async destroy(): Promise<EGameStatus> {
        await this.forceDestroy();
        return this.status();
    }

    async forceDestroy() {
        this.loop = false;
        this.stop();
        clearInterval(this.lifecycle);
        await this.scene.redis.setTodayRound(this.scene.today, this.roundStep.todayRound);
    }
}