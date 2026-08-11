import { Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, SDK_trade_pre } from "./SDKEntity";
import { Entity } from "typeorm";
import { SDK_trade } from "./SDKEntity";
export class FootballSlot_trade extends SDK_trade { }

export enum EGameType {
    normal = "normal",
    free = "free",
}

@Entity("FootballSlot_round")
export class FootballSlot_round {
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

@Entity("FootballSlot_trade_pre")
export class FootballSlot_trade_pre extends SDK_trade_pre { }

@Entity("FootballSlot_trade_fail")
export class FootballSlot_trade_fail extends FootballSlot_trade { };

@Entity("FootballSlot_trade_delay")
export class FootballSlot_trade_delay {
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
