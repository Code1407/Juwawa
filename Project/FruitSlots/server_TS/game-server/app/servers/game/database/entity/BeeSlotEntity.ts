import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, SDK_trade, SDK_trade_pre } from "./SDKEntity";

export enum EGameType {
    normal = "normal",
    free = "free",
}

@Entity("BeeSlot_round")
export class BeeSlot_round {
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
    jp: number;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("BeeSlot_trade_pre")
export class BeeSlot_trade_pre extends SDK_trade_pre  {}

@Entity("BeeSlot_trade")
export class BeeSlot_trade extends SDK_trade  {}

@Entity("BeeSlot_trade_fail")
export class BeeSlot_trade_fail extends BeeSlot_trade {};

@Entity("BeeSlot_trade_delay")
export class BeeSlot_trade_delay  {
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
