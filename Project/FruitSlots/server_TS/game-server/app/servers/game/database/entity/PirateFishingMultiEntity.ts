import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { ERateType, ETradeType, } from "./SDKEntity";
import { EEntityType } from "../../interface/IPirateFishingMulti";

export enum ERoundType {
    bullet = "bullet",
    hook = "hook",
    laser = "laser",
    drum = "drum",
    slot = "slot",
    wheel = "wheel",
    merge = "merge",
}

@Entity("PirateFishingMulti_round")
export class PirateFishingMulti_round {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    uid: string;
    @Column()
    which: EEntityType;
    @Column()
    rate_type: ERateType;
    @Column()
    round_type: ERoundType;
    @Column()
    slot_count: number;
    @Column()
    result: string;
    @Column()
    bet: number;
    @Column()
    revenue: number;
    @Column()
    save_time: Date;
}

@Entity("PirateFishingMulti_trade_pre")
export class PirateFishingMulti_trade_pre {
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

@Entity("PirateFishingMulti_trade")
export class PirateFishingMulti_trade {
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

@Entity("PirateFishingMulti_trade_fail")
export class PirateFishingMulti_trade_fail extends PirateFishingMulti_trade { };

@Entity("PirateFishingMulti_trade_delay")
export class PirateFishingMulti_trade_delay {
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