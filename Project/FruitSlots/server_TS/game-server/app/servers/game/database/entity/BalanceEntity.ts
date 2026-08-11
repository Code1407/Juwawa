import { getLogger } from 'pinus-logger';
let logger = getLogger("balance", __filename);

export enum EGameClass {
    countDown = 0,
    shift = 1,
}

export interface IUserBalanceCoundDown {
    betDetail: UserBetDetail;
}

export interface IUserBalanceShift {
    betDetail: {[buttonIndex: string]: UserBetDetail};
}

export class spDetail {
    nBigwin: number = 0;
    nFree: number = 0;
    nJackpot: number = 0;
}

export class UserBetDetail {
    betCount: number = 0;
    betTotal: number = 0;
    revenueTotal: number = 0;
    sp?: spDetail;
}


// {{ 历史兼容 --- 上线3个月后可以删掉这段代码。
interface IHistoryBalanceCountDown {
    uid: string;
    betTotal: number;
    revenueTotal: number;
    waterCount: number;
    harvestPow: number;
    wheelAmount: number[];  // 每个游戏特有
}

class ButtonBetDetail {
    nBet: number = 0;
    nFree: number = 0;
    nJackpot: number = 0;
    nBigwin: number = 0;
};

interface IHistoryBalanceShift {
    [button: string]: {
        uid: string;
        buttonBetTotal: number;
        buttonRevenueTotal: number;
        buttonBetDetail: ButtonBetDetail;
    }
}

export function fromHistoryBalance(historyBalance: any, gameType: EGameClass): IUserBalanceCoundDown | IUserBalanceShift {
    let userBalance: IUserBalanceCoundDown | IUserBalanceShift;

    userBalance = historyBalance;

    // 倒计时游戏
    if (gameType == EGameClass.countDown) {
        userBalance = {
            betDetail: new UserBetDetail,
        };
        if (historyBalance) {
            if (historyBalance && historyBalance.betDetail) {
                userBalance = historyBalance;
            } else if (historyBalance && historyBalance.uid) {
                let history = historyBalance as IHistoryBalanceCountDown;
                try {
                    userBalance.betDetail.betCount = 0;
                    userBalance.betDetail.betTotal = history.betTotal;
                    userBalance.betDetail.revenueTotal = history.revenueTotal;
                } catch(e) {
                    logger.error(e.message);
                }
            }
        }
    }

    // 单人游戏
    if (gameType == EGameClass.shift) {
        userBalance = {
            betDetail: {},
        };
        if (historyBalance) {
            if (historyBalance.betDetail) {
                userBalance = historyBalance;
            } else {
                let keys = Object.keys(historyBalance);
                if (keys.length > 0 && Number(keys[0])) {
                    let history = historyBalance as IHistoryBalanceShift;
                    if (history[keys[0]].uid) {
                        try {
                            let betDetail: {[buttonIndex: string]: UserBetDetail} = {};
                            for (let key in history) {
                                betDetail[key] = new UserBetDetail;
                                betDetail[key].betCount = history[key].buttonBetDetail.nBet;
                                betDetail[key].betTotal = history[key].buttonBetTotal;
                                betDetail[key].revenueTotal = history[key].buttonRevenueTotal;
                                if (history[key].buttonBetDetail.nBigwin || history[key].buttonBetDetail.nFree || history[key].buttonBetDetail.nJackpot) {
                                    betDetail[key].sp = new spDetail;
                                    betDetail[key].sp.nBigwin = history[key].buttonBetDetail.nBigwin ? history[key].buttonBetDetail.nBigwin : 0;
                                    betDetail[key].sp.nFree = history[key].buttonBetDetail.nFree ? history[key].buttonBetDetail.nFree: 0;
                                    betDetail[key].sp.nJackpot = history[key].buttonBetDetail.nJackpot ? history[key].buttonBetDetail.nJackpot: 0;
                                }
                            }
                            userBalance.betDetail = betDetail;
                        } catch(e) {
                            logger.error(e.message);
                        }
                    }
                }
            }
        }
    }

    return userBalance;
}
// }}