import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { EGameStatus, IAccount } from "../../interface/IGame";

export enum ETradeType {
    tradeIn = "tradeIn",
    tradeOff = "tradeOff",
}

export class TodayProfitThreshold {
    warn: number;
    stop: number;
}

export interface IUserSDKEntiry {
    account: IAccount;
    token: string;
    game: {[gameName: string] : any};
}

export class SDK_trade_pre {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    box_index: number;
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

export class SDK_trade {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    box_index: number;
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

@Entity("user_login")
export class SDK_UserLogin {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    uid: string;
    @Column()
    game_name: string;
    @Column()
    level: number;
    @Column()
    account_diamond: number;
    @Column()
    ua: string;
    @Column()
    save_time: Date;
}

@Entity("user_delay")
export class SDK_UserDelay {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    uid: string;
    @Column()
    game_name: string;
    @Column()
    round: number;
    @Column()
    time_query: number;
    @Column()
    time_response: number;
    @Column()
    extra: string;
    @Column()
    save_time: Date;
}

@Entity("api_delay")
export class SDK_ApiDelay {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    uid: string;
    @Column()
    game_name: string;
    @Column()
    round: number;
    @Column()
    action: string;
    @Column()
    order_id: string;
    @Column()
    amount: number;
    @Column()
    response_id: string;
    @Column()
    time_query: number;
    @Column()
    time_response: number;
    @Column()
    save_time: Date;
}

export class Sdk_trade_delay extends SDK_trade {}