import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, SDK_trade, SDK_trade_pre } from "./SDKEntity";

export enum EGameType {
    normal = "normal",
    free = "free",
}

@Entity("PirateKing_round")
export class PirateKing_round {
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
    jackpot_pool: number;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("PirateKing_trade_pre")
export class PirateKing_trade_pre extends SDK_trade_pre  {}

@Entity("PirateKing_trade")
export class PirateKing_trade extends SDK_trade  {}

@Entity("PirateKing_trade_fail")
export class PirateKing_trade_fail extends PirateKing_trade {};

@Entity("PirateKing_trade_delay")
export class PirateKing_trade_delay  {
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
