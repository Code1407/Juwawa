import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, } from "./SDKEntity";
import { EEntityType } from "../../interface/IGoldFishing";

export enum ERoundType {
    bullet = "bullet",
    laser = "laser",
    skill_drill = "skill_drill",
    skill_laser = "skill_laser",
    skill_bomb = "skill_bomb",
    skill_blackhole = "skill_blackhole",
    skill_thunder = "skill_thunder",
    boss_401 = "boss_401",
    boss_402 = "boss_402",
    boss_403 = "boss_403",
}

@Entity("GoldFishing_round")
export class GoldFishing_round {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    fromRound: number;
    @Column()
    uid: string;
    @Column()
    which: EEntityType;
    @Column()
    rate_type: ERateType;
    @Column()
    round_type: ERoundType;
    @Column()
    result: string;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("GoldFishing_trade_pre")
export class GoldFishing_trade_pre {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
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
    extra: string;
    @Column()
    save_time: Date;
}

@Entity("GoldFishing_trade")
export class GoldFishing_trade {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
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
    save_time: Date;
}

@Entity("GoldFishing_trade_fail")
export class GoldFishing_trade_fail extends GoldFishing_trade { };

@Entity("GoldFishing_trade_delay")
export class GoldFishing_trade_delay {
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
    which: number;
    @Column()
    round: number;
    @Column()
    time_query: Date;
    @Column()
    time_response: Date;
    @Column()
    extra: string;
}