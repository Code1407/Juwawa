import {defaultMinHintAmount, defaultMinHintMultiple, EHintReason} from "./HintAssist";
import {IHintMsg } from "./IHintPlayer";
import Redis from "../database/db/redis";

/**
 * 飘屏规则
 */
export abstract class HintRule {
    private ready = false;
    reason: EHintReason;
    conditions: any[];
    callback: () => void;

    constructor(protected redis: Redis) {
        this.init().then(() => {
            this.ready = true;
            if (this.callback) {
                this.callback();
            }
        });
    }

    abstract matched(player: IHintMsg): boolean;

    abstract min(players: IHintMsg[]): IHintMsg;

    abstract init(): Promise<void>;

    then(fn: () => void) {
        this.callback = fn;

        if (this.ready) {
            fn();
        }
    }
}

export class HintMultipleRule extends HintRule {

    async init() {
        const minMultipleAmount = await this.redis.getHintMultipleMinAmount() as number || defaultMinHintAmount;
        const minMultiple = await this.redis.getHintMinMultiple() as number || defaultMinHintMultiple;

        this.reason = EHintReason.multiple;
        this.conditions = [minMultipleAmount, minMultiple];
    }

    matched(player: IHintMsg): boolean {
        const minAmount = this.conditions[0] as number;
        const minMultiple = this.conditions[1] as number;

        return player.multiple >= minMultiple && player.rewardAmount >= minAmount;
    }

    min(players: IHintMsg[]): IHintMsg {
        let min = players[0];

        players.forEach( player => {
            if (player.rewardAmount < min.rewardAmount) {
                min = player;
            } else if (player.rewardAmount == min.rewardAmount && player.multiple < min.multiple) {
                min = player;
            }
        });

        return min;
    }
}

export class HintJackpotRule extends HintRule {
    async init() {
        const minJackpotAmount = await this.redis.getHintJackpotMinAmount() as number || defaultMinHintAmount;

        this.reason = EHintReason.jackpot;
        this.conditions = [minJackpotAmount];
    }

    matched(player: IHintMsg): boolean {
        return player.jackpotRound && player.rewardAmount >= (this.conditions[0] as number);
    }

    min(players: IHintMsg[]): IHintMsg {
        let min = players[0];

        players.forEach( player => {
            if (player.rewardAmount < min.rewardAmount) {
                min = player;
            }
        });

        return min;
    }

}
