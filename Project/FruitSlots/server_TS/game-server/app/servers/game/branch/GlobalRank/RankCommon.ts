import Redis from "../../database/db/redis";
import { IRankUserInfo } from "../../interface/IBranch";

export const dayBonusRate = 0.0012;
export const weekBonusRate = 0.0018;
export const awardCount = 10;
export const awardCountShow = 5;

export const gRankAwarkRoundId = 999999;

const awardRate = [45, 20, 13, 8, 5, 3, 2, 2, 1, 1];

export class IScoreFactor {
    [gameName: string]: number;
}

let scoreFactor: IScoreFactor = {
    FerrisWheel: 1,
    FruitSlots: 1,
    TeenPatti: 0,
    FruitMachine: 1,
    Racing: 1,
    Box: 1,
    PirateKing: 1,
    FishLord: 1,
    DragonTiger: 1,
    Wheel77: 1,
    Crash: 1,
    HiLo: 1,
    BoxingDragonTiger: 0,
    Roshambo: 1,
    FootballSlot: 1,
    Rocket: 1,
}

export let gRankData = {
    scoreFactor: scoreFactor,
    isCloseServer: false
}

interface IPropObj { [propName: string]: string };

export async function getRankUserInfo(redis: Redis, rankList: IPropObj, bonusTotal: number): Promise<IRankUserInfo[]>  {
    let rankkUsers: IRankUserInfo[] = [];
    for (let uid in rankList) {
        let item: IRankUserInfo = {uid: uid, avator: "", name: "", rank: 0, bonus: 0, score: 0};
        item.score = Number(rankList[uid]); 
        rankkUsers.push(item);
    }
    if (rankkUsers.length == 0) return;
    rankkUsers.sort((a, b) => {return b.score - a.score;});

    for (let i = 0; i < rankkUsers.length; i++) {
        let item = rankkUsers[i];
        item.rank = i + 1;
        if (i < awardRate.length) item.bonus = Math.floor(bonusTotal * (awardRate[i] / 100));
    }

    let awardUids: string[] = [];
    for (let i = 0; i < Math.min(rankkUsers.length, awardCount); i++) {
        awardUids.push(rankkUsers[i].uid);
    }
    let awardUsers = await redis.getSDKUsers(awardUids);
    for (let i = 0; i < awardUsers.length; i++) {
        try {
            let userStr = awardUsers[i];
            let user = JSON.parse(userStr);
            let rankUser = rankkUsers.find(rankUser=>rankUser.uid == awardUids[i]);
            if (rankUser && user) {
                rankUser.name = user.account.nickname;
                rankUser.avator = user.account.avatar;
            }
        } catch(e) {
            console.error(e);
        }
    }

    return rankkUsers.slice(0, 99);
}

export interface IMaxBonus {
    [gameName: string]: number
}


export function getBonusTotal(rankList: IPropObj, sdkName: string, isWeek: boolean): number {
    let scoreTotal = 0;
    for (let uid in rankList) {
        scoreTotal += Number(rankList[uid]);
    }
    let bonusRate = isWeek ? weekBonusRate : dayBonusRate;
    let bonusTotal = scoreTotal * bonusRate;
    return bonusTotal;
}
