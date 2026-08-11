import { EGameClass, fromHistoryBalance, IUserBalanceShift, UserBetDetail } from '../../../database/entity/BalanceEntity';
import { GamePlayerBase, IAntiAddictionEntity, IBaseEntityType } from '../GamePlayerBase';
import { IPlayerstatus } from '../../GamePlayer';
import { ETradeCode, IPlayerSettings } from '../../../interface/IGame';
import { IOrderWithTime, uuid } from '../../../sdk/ISdk';
import { newUserRoundDefault } from './ConfigShiftDefault';

interface IRunningRounds<roundResultType> {
    [roundId: number]: roundResultType;
}

export class ShiftEntity<roundResultType> implements IBaseEntityType {
    saveDate: string = (new Date).toLocaleDateString();
    balance: IUserBalanceShift = {
        betDetail: {},
    };
    runningRounds: IRunningRounds<roundResultType> = {};
    playerSettings: IPlayerSettings = { soundVol: 1, lastBetAmountButton: 0 };
    antiAddiction: IAntiAddictionEntity = {
        inLock: false,
        todayDate: `0`,
        todayIgnore: false,
        todayRound: 0,
        todayWin: 0,
        todayBet: 0,
    };
}

export abstract class PlayerShiftBase<UserEntityType extends ShiftEntity<roundResultType>, roundResultType = void>
    extends GamePlayerBase<UserEntityType>
{
    abstract settleResult(roundId: number);
    abstract quitGame();

    isSettling: boolean = false;
    settletime: number = 3;
    
    getProgressRevenue(betAmount: number): number {
        return 0;
    }

    // 历史问题兼容，3个月后可以删除
    fromHistoryBalance(historyBalance: any): IUserBalanceShift {
        return fromHistoryBalance(historyBalance, EGameClass.shift) as IUserBalanceShift;
    }

    status(): IPlayerstatus {
        return { uid: this.uid, betAmount: 0 };
    }

    protected incrBetCount(button: number, betAmount: number, revenue: number): UserBetDetail {
        if (!this.userEntity.balance) {
            this.userEntity.balance = {
                betDetail: {},
            };
        }
        if (!this.userEntity.balance.betDetail[button]) {
            this.userEntity.balance.betDetail[button] = new UserBetDetail;
        }
        this.userEntity.balance.betDetail[button].betCount++;
        this.userEntity.balance.betDetail[button].betTotal += betAmount;
        this.userEntity.balance.betDetail[button].revenueTotal += revenue;
        this.save();
        return this.getBetDetail(button);
    }

    isRealNewUser(betAmount: number): boolean {
        if (this.getBetDetail(betAmount).betCount > newUserRoundDefault) return false;
        return true;
    }

    getBetDetail(button: number): UserBetDetail {
        if (!this.userEntity.balance) {
            this.userEntity.balance = {
                betDetail: {},
            };
        }
        if (!this.userEntity.balance.betDetail[button]) {
            this.userEntity.balance.betDetail[button] = new UserBetDetail;
        }
        return this.userEntity.balance.betDetail[button];
    }

    protected isBetTime(): boolean {
        return !this.scene.isStop() && !this.coolDown;
    }

    protected async betOrder(roundId: number, betAmount: number, orderDetail?: string): Promise<ETradeCode> {
        let order: IOrderWithTime = { code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null };
        let orderId = uuid.v1();
        if (this.isBetTime()) {
            order = await this.betOrderBase(roundId, orderId, betAmount, orderDetail);
            this.userEntity.antiAddiction.todayBet += betAmount;
        } else {
            return ETradeCode.missTime;
        }
        return order.code;
    }

    protected async winOrder(roundId: number, winAmount: number, orderDetail?: string): Promise<ETradeCode> {
        let orderId = uuid.v1();
        if (winAmount > 0) {
            let order = await this.winOrderBase(roundId, orderId, winAmount, orderDetail);
            this.userEntity.antiAddiction.todayWin += winAmount;
            return order.code;
        } else {
            this.tradeNothing(roundId, orderId);
            return ETradeCode.nothing;
        }
    }

    protected setRoundResult(roundId: number, roundResult: roundResultType) {
        if (!this.userEntity.runningRounds) this.userEntity.runningRounds = {};
        this.userEntity.runningRounds[roundId] = roundResult;
        this.save();
    }

    protected endRound(roundId: number): roundResultType {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        if (roundId == 0) {
            // 客户端点击事件可能绕过cd，产生了多次点击
            return null;
        }

        let roundIds = Object.keys(this.userEntity.runningRounds);
        if (!roundIds.includes(roundId.toString())) {
            this.logger.warn("stopRound !roundIds.includes(roundId.toString())", this.uid, JSON.stringify(this.userEntity.runningRounds), roundId);
            return null;
        }

        let roundCurrent = this.userEntity.runningRounds[roundId];
        delete this.userEntity.runningRounds[roundId];

        this.isSettling = true;
        let __this = this;
        setTimeout(() => {
            __this.isSettling = false;
        }, 3000);

        this.updateAddiction();

        return roundCurrent;
    }

    protected startRound(roundId: number, runningRound: roundResultType) {
        if (!this.userEntity.runningRounds) this.userEntity.runningRounds = {};
        this.userEntity.runningRounds[roundId] = runningRound;
    }

    async waitSettle(): Promise<void> {
        let i = 0;
        while (this.isSettling && i++ < this.settletime) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return;
    }

    async stopRunningRound() {
        if (this.userEntity?.runningRounds) {
            let keys = Object.keys(this.userEntity.runningRounds);
            if (keys.length > 0) {
                console.warn(JSON.stringify(keys));
            }
            for (let roundId in this.userEntity.runningRounds) {
                if (keys.includes(roundId)) { // 担心有并发行为
                    await this.settleResult(Number(roundId));
                }
            }
        }
    }

    async quitGameBase() {
        await this.waitSettle();
        await this.quitGame();
    }
}
