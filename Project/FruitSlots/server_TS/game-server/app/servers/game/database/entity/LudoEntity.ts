import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { EGameStatus } from "../../interface/IGame";
import { ETradeType, SDK_trade, SDK_trade_pre } from "./SDKEntity";

@Entity("Ludo_round")
export class Ludo_round {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    uid: string;
    @Column()
    round: number;
    @Column()
    winer1: string;
    @Column()
    winer2: string;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("Ludo_trade_pre")
export class Ludo_trade_pre extends SDK_trade_pre  {}

@Entity("Ludo_trade")
export class Ludo_trade extends SDK_trade  {}

@Entity("Ludo_trade_fail")
export class Ludo_trade_fail extends Ludo_trade {};

@Entity("Ludo_balance")
export class Ludo_balance {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    item_amount: string;
    @Column()
    bet: number;
    @Column()
    result_original: number;
    @Column()
    revenue_original: number;
    @Column()
    result_balance: number;
    @Column()
    revenue_balance: number;
    @Column()
    reason: string;
    @Column()
    save_time: Date;
}

@Entity("Ludo_trade_delay")
export class Ludo_trade_delay {
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
    item_amount: string;
    @Column()
    round_query: number;
    @Column()
    game_status_query: EGameStatus;
    @Column()
    round_response: number;
    @Column()
    game_status_response: EGameStatus;
    @Column()
    time_query: Date;
    @Column()
    time_response: Date;
    @Column()
    extra: string;
}