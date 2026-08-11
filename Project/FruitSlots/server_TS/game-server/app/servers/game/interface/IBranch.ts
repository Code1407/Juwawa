import { ETradeCode } from "./IGame";

export interface IRankUserInfo {
    uid: string;
    avator: string; 
    name: string;   
    rank: number;   // 排名
    bonus: number;  // 奖金
    score: number;  // 总分，在服务器用，客户端不用
}

export interface IRankAwardMsg {
    uid: string;
    rank: number;   // 排名
    bonus: number;  // 奖金
    score: number;  // 总分，在服务器用，客户端不用
    rankUsers: IRankUserInfo[];
}

export interface IRankRealTimeMsg {
    uid: string;
    rank: number;   // 排名
}

export interface IRankAwardResp {
    code: ETradeCode;
    accountDiamond: number;
}

export interface IRankAward {
    receiveDayAward(): Promise<IRankAwardResp>;
    receiveWeekAward(): Promise<IRankAwardResp>;
    getTodayRealTimeRank(uid: string): Promise<IRankRealTimeMsg>;
}

export interface IRankAwardListen {
    onDayRankAward(msg: IRankAwardMsg);
    onWeekRankAward(msg: IRankAwardMsg);
}