import { EGameClass, fromHistoryBalance, IUserBalanceCoundDown, UserBetDetail } from '../../../database/entity/BalanceEntity';
import { arraySum, EGameStatus, ETradeCode, IPlayerSettings } from '../../../interface/IGame';
import { GamePlayerBase, IAntiAddictionEntity, IBaseEntityType } from '../GamePlayerBase';
import { IRoundStepCountDown, MachineCountDownBase } from './MachineCountDownBase';
import { IPlayerstatus } from '../../GamePlayer';
import { IOrderWithTime, uuid } from '../../../sdk/ISdk';
import { SceneCountDownBase } from './SceneCountDownBase';

export class CoundDownEntity implements IBaseEntityType {
    saveDate: string = (new Date).toLocaleDateString();
    balance: IUserBalanceCoundDown = {
        betDetail: {
            betCount: 0,
            betTotal: 0,
            revenueTotal: 0,
        }
    };
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

const roundBetCountMax = 100;

type CountDownPlayerType = PlayerCountDownBase<CoundDownEntity>;
type CountDownMachineType = MachineCountDownBase<IRoundStepCountDown>;
type CountDownSceneType = SceneCountDownBase<CountDownPlayerType, CountDownMachineType>;

export abstract class PlayerCountDownBase<UserEntityType extends CoundDownEntity>
    extends GamePlayerBase<UserEntityType>
{
    abstract getItemAmount(): number[];
    // abstract calculateRevenue(betItems: number[], result: number[]): number;
    abstract onNewDay();
    abstract onNewRound();

    protected abstract scene: CountDownSceneType;
    protected coolDown: boolean = false;
    protected roundBetCount: number = 0;

    // 历史问题兼容，3个月后可以删除
    fromHistoryBalance(historyBalance: any): IUserBalanceCoundDown {
        return fromHistoryBalance(historyBalance, EGameClass.countDown) as IUserBalanceCoundDown;
    }

    newRound() {
        this.roundBetCount = 0;
        this.onNewRound();
    }

    status(): IPlayerstatus {
        return { uid: this.uid, betAmount: arraySum(this.getItemAmount()) };
    }

    protected isBetTime<RoundStep extends IRoundStepCountDown>(todayRound: number, roundStep: RoundStep): boolean {
        return !this.scene.isStop() && todayRound == roundStep.todayRound && roundStep.status == EGameStatus.bet && !this.coolDown && this.roundBetCount++ < roundBetCountMax;
    }

    protected incrBetCount(betAmount: number, revenue: number) {
        if (!this.userEntity.balance) {
            this.userEntity.balance = {
                betDetail: new UserBetDetail,
            }
        }
        this.userEntity.balance.betDetail.betTotal += betAmount;
        this.userEntity.balance.betDetail.revenueTotal += revenue;
        this.userEntity.balance.betDetail.betCount++;
    }

    async quitGameBase() {
    }

    async stopRunningRound() {
    }

    protected async betOrder(roundId: number, betAmount: number, itemAmount: number[]): Promise<ETradeCode> {
        let order: IOrderWithTime = { code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null };

        let orderId = uuid.v1();
        let roundStep: IRoundStepCountDown = JSON.parse(JSON.stringify(this.scene.machine.getRoundStep()));
        if (betAmount > 0 && this.account.diamond >= betAmount) {
            if (this.isBetTime(roundId, roundStep)) {
                let orderDetail = JSON.stringify(itemAmount);
                order = await this.betOrderBase(roundId, orderId, betAmount, orderDetail);
                return order.code;
            } else {
                return ETradeCode.missTime;
            }
        } else {
            return ETradeCode.insufficient;
        }
    }

    protected async winOrder(roundId: number, winAmount: number, orderDetail?: string): Promise<ETradeCode> {
        this.updateAddiction();
        let orderId = uuid.v1();
        if (winAmount > 0) {
            let order = await this.winOrderBase(roundId, orderId, winAmount, orderDetail);
            return order.code;
        } else {
            this.tradeNothing(roundId, orderId);
            return ETradeCode.nothing;
        }
    }
}
