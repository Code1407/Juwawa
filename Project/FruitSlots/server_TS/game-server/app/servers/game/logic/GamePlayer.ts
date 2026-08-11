import { IOrderWithTime } from "../sdk/ISdk";

export interface IPlayerstatus {
    uid: string;
    betAmount: number;
}

export default interface IGamePlayer {
    save();
    status(): IPlayerstatus;
    rankAward(amount: number, orderId: string): Promise<IOrderWithTime>;
    redeemAward?(amount: number, roundId: number, orderId: string): Promise<IOrderWithTime>;
}