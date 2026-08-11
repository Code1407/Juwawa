import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, SDK_trade, SDK_trade_pre } from "./SDKEntity";

export enum EGameType {
    normal = "normal",
    free = "free",
    super_free = "super_free",
}

@Entity("FightSlot_round")
export class FightSlot_round {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    uid: string;
    @Column()
    game_type: EGameType;
    @Column()
    rate_type: ERateType;
    @Column()
    result: string;
    @Column()
    line_revenue: string;
    @Column()
    jackpot: number;
    @Column()
    jackpot_pool: number[];
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
    jp: number;
    jp_index: number;
    jp_pool: null;
}

@Entity("FightSlot_trade_pre")
export class FightSlot_trade_pre extends SDK_trade_pre  {}

@Entity("FightSlot_trade")
export class FightSlot_trade extends SDK_trade  {}

@Entity("FightSlot_trade_fail")
export class FightSlot_trade_fail extends FightSlot_trade {};

@Entity("FightSlot_trade_delay")
export class FightSlot_trade_delay  {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    uid: string;
    @Column()
    token: string;
    @Column()
    order_type: ETradeType;
    @Column()
    order_id: string;
    @Column()
    diamond: number;
    @Column()
    response_id: string;
    @Column()
    account_diamond: number;
    @Column()
    round: number;
    @Column()
    time_query: Date;
    @Column()
    time_response: Date;
    @Column()
    extra: string;
}
