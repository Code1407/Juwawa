export interface IHintPlayer {
    addHint(roundId: number, bet: number, reward: number, orderId: string, result: any): void;
}

export interface IHintMsg {
    uid: string;
    token: string;
    orderId: string;
    roundId: number;
    betAmount: number;
    rewardAmount: number;
    multiple?: number;
    jackpotRound?: boolean;
    extra: any;
}
