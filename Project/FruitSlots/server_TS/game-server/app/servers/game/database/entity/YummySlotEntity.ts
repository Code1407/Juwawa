import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, SDK_trade, SDK_trade_pre } from "./SDKEntity";

export enum EGameType {
    normal = "normal",
    free = "free",
}

@Entity("YummySlot_round")
export class YummySlot_round {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    uid: string;
    @Column()
    game_type: string;
    @Column()
    rate_type: ERateType;
    @Column()
    result: string;
    @Column()
    line_revenue: string;
    @Column()
    jackpot: number;
    @Column()
    jackpot_pool: number;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("YummySlot_trade_pre")
export class YummySlot_trade_pre extends SDK_trade_pre { }

@Entity("YummySlot_trade")
export class YummySlot_trade extends SDK_trade { }

@Entity("YummySlot_trade_fail")
export class YummySlot_trade_fail extends YummySlot_trade { };

@Entity("YummySlot_trade_delay")
export class YummySlot_trade_delay {
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
