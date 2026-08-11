import Redis from "../database/db/redis";
import {HintJackpotRule, HintMultipleRule, HintRule} from "./HintRule";
import {IHintMsg} from "./IHintPlayer";
import {ISdk} from "../sdk/ISdk";
import { K } from "../model/Decimal";

/**
 * 飘屏理由
 */
export enum EHintReason {
    multiple = "multiple", // 倍数
    jackpot = "jackpot", // 特殊奖励
    topN = "topN", // 一段时间内前N
}

// 默认优先级列表
const defaultPriorityList = [EHintReason.jackpot, EHintReason.multiple, EHintReason.topN];
// 默认最小倍数
export const defaultMinHintMultiple: number = 10;
// 默认最小金额
export const defaultMinHintAmount: number = 100 * K;
// 默认最大飘屏玩家数
const defaultMaxHintPlayerCount: number = 3;
// 默认飘屏间隔
const defaultHintIntervalSeconds: number = 60;

/**
 * 飘屏助手类
 */
export default class HintAssist {
    private rules: Map<EHintReason, HintRule>;
    // 优先级列表
    private priorityList: EHintReason[];
    // 最大飘屏玩家数
    private maxHintPlayerCount: number;
    // 飘屏间隔
    private hintIntervalMillis: number;
    // 飘屏玩家列表
    private hintList: Map<EHintReason, Map<string, IHintMsg>>;
    // 最近飘屏时间
    private lastHintTime: number;
    // 飘屏开关
    private hintEnable: boolean = false;

    constructor(private redis: Redis, ...reasons: EHintReason[]) {
        this.init().then(() => this.setRule(...reasons));
    }

    async addMsg(msg: IHintMsg) {
        if (!this.hintEnable) {
            return;           
        }

        try {
            // 没中奖，不用进飘屏
            if (msg.rewardAmount <= 0) {
                return;
            }

            let rule = this.getRule(msg);
            if (rule == null) {
                return;
            }

            let msgs: Map<string, IHintMsg> = this.hintList[rule.reason];
            if (msgs == null) {
                msgs = new Map<string, IHintMsg>();
            }

            const existPlayer = msgs.get(msg.uid);
            if (existPlayer && existPlayer.rewardAmount >= msg.rewardAmount) {
                return;
            }

            msgs.set(msg.uid, {...msg});
            while (msgs.size > this.maxHintPlayerCount) {
                const player = rule.min([...msgs.values()]);
                msgs.delete(player.uid)
            }

            this.hintList.set(rule.reason, msgs);
        } finally {
            // 重置玩家飘屏属性
            this.resetHintPlayer(msg);
        }
    }

    async hint(sdk: ISdk) {
        if (!this.hintEnable) {
            return;
        }

        if (Date.now() - this.lastHintTime < this.hintIntervalMillis) {
            return;
        }

        this.lastHintTime = Date.now();
        // 每次飘屏后重置
        if (sdk && sdk.hint) {
            await sdk.hint(this.getMessage()).then(() => {
                this.reset();
            });
        } else {
            this.reset();
        }
    }

    setRule(...reasonsOrRules: EHintReason[] | HintRule[]) {
        if (reasonsOrRules != null && reasonsOrRules.length > 0) {
            reasonsOrRules.forEach((reasonOrRule: EHintReason | HintRule) => {
                if (reasonOrRule instanceof HintRule) {
                    reasonOrRule.then(() => this.rules.set(reasonOrRule.reason, reasonOrRule));
                } else {
                    switch (reasonOrRule) {
                        case EHintReason.multiple:
                            this.setRule(new HintMultipleRule(this.redis));
                            break;

                        case EHintReason.jackpot:
                            this.setRule(new HintJackpotRule(this.redis));
                            break;

                        case EHintReason.topN:
                        default:
                            break;

                    }
                }
            });
        }
    }

    private reset() {
        const lastHintTime = this.lastHintTime;
        const reasons = this.rules.keys();

        this.init().then(() => {
            this.lastHintTime = lastHintTime;
            this.setRule(...reasons);
        });
    }

    private resetHintPlayer(smg: IHintMsg) {
        smg.multiple = 0;
        smg.betAmount = 0;
        smg.rewardAmount = 0;
        smg.jackpotRound = false;
        smg.orderId = "";
        smg.roundId = 0;
    }

    private getMessage(): IHintMsg[] {
        let msg: IHintMsg[] = [];
        for (let priority of this.priorityList) {
            let hintPlayers = this.hintList.get(priority);
            if (hintPlayers && hintPlayers.values()) {
                msg = msg.concat(...hintPlayers.values());

                if (msg.length > this.maxHintPlayerCount) {
                    msg.splice(0, msg.length - this.maxHintPlayerCount);
                    msg;
                }
            }
        }

        return msg;
    }

    private async init(): Promise<void> {
        // 飘屏开关
        const hintEnable = await this.redis.getHintEnable() as number;
        this.hintEnable = hintEnable && hintEnable == 1;

        this.priorityList = [];
        let hintPriorityList: string[] = JSON.parse(await this.redis.getHintPriorityList());
        if (hintPriorityList && hintPriorityList.length > 0) {
            hintPriorityList.forEach((reason: string) => {
                this.priorityList.push(EHintReason[reason]);
            })
        }

        if (this.priorityList.length == 0) {
            this.priorityList = defaultPriorityList;
        }

        this.maxHintPlayerCount = await this.redis.getHintMaxPlayerCount() as number || defaultMaxHintPlayerCount;
        this.hintIntervalMillis = (await this.redis.getHintIntervalSeconds() as number || defaultHintIntervalSeconds) * 1000;
        this.hintList = new Map<EHintReason, Map<string, IHintMsg>>();
        this.lastHintTime = Date.now();
        this.rules = new Map<EHintReason, HintRule>();
    }

    private getRule(player: IHintMsg): HintRule | null {
        if (this.rules == null) {
            return null;
        }

        for (let priority of this.priorityList) {
            let rule = this.rules.get(priority);
            if (rule && rule.matched(player)) {
                return rule;
            }
        }

        return null;
    }
}
