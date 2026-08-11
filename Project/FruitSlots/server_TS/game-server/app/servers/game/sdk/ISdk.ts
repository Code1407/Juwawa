import {IAccount} from "../interface/IGame";
import {IHintMsg} from "../hint/IHintPlayer";

export interface IOrder {
    code: number,
    orderId: string,
    diamond: number
}

export interface IUnfinishOrder {
    tradeIn: IOrder[],
    tradeOff: IOrder[]
}

export interface ISdkConfig {
    url: string;
    appKey: string;
    appId: string;
    timezone: string;
    gameId: {[game: string]: any};
    jwk: any;
    appKeys: {[game: string]: string}; // 用于每个游戏有独立的appKey的情况，如：kafu
}

export interface IUserConfig {
    uid: string;
    money:number;
    icon: string;
    user_name: string;
    nickname?: string;
    level: number;
}

export interface IOrderWithTime extends IOrder {
    saveTime: Date;
    token?: string;
}

export interface ISdk {
    queryAccount(uid: string, token: string, extra: any): Promise<IAccount>;
    synchronize?(uid: string, token: string, extra: any): Promise<IAccount>;
    tradeIn( roundId:number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime>;
    tradeOff( roundId:number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime>;
    tradeNothing(roundId:number, uid: string, token: string, orderId: string, amount: number, extra: any):Promise<IOrderWithTime>;
    hint?(msgs: IHintMsg[]): Promise<void>;
}

let _uuid = require("uuid");

export class uuid {
    static N: number = 0;
    static v1(): string {
        return _uuid.v1();
    }
}