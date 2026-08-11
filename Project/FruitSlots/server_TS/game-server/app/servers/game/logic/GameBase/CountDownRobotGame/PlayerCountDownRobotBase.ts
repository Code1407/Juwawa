import { EGameClass, fromHistoryBalance, IUserBalanceCoundDown, UserBetDetail } from '../../../database/entity/BalanceEntity';
import { arraySum, EGameStatus, ETradeCode, getRandomNumInt, IPlayerSettings } from '../../../interface/IGame';
import { GamePlayerBase, IBaseEntityType } from '../GamePlayerBase';
import { IRoundStepCountDownRobot, MachineCountDownRobotBase } from './MachineCountDownRobotBase';
import { IPlayerstatus } from '../../GamePlayer';
import { IOrderWithTime, uuid } from '../../../sdk/ISdk';
import { SceneCountDownRobotBase } from './SceneCountDownRobotBase';

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
}

export const roundBetCountMax = 100;

type CountDownRobotPlayerType = PlayerCountDownRobotBase<CoundDownEntity>;
type CountDownRobotMachineType = MachineCountDownRobotBase<IRoundStepCountDownRobot>;
type CountDownRobotSceneType = SceneCountDownRobotBase<CountDownRobotPlayerType, CountDownRobotMachineType>;

export abstract class PlayerCountDownRobotBase<UserEntityType extends CoundDownEntity> 
    extends GamePlayerBase<UserEntityType> 
{
    abstract getItemAmount(): number[];
    // abstract calculateRevenue(betItems: number[], result: number[]): number;
    abstract onNewDay();
    abstract onNewRound();

    protected abstract scene: CountDownRobotSceneType;
    protected coolDown: boolean = false;
    protected roundBetCount: number = 0;

    protected isRobot = false;
    protected isRobotNum = 0;//进入房间可以下注的次数
    protected isRobotBet = false;//机器人是否已经下注完成
    protected robotBetInteval = [100,1000];//个人下注筹码之间间隔时间（毫秒区间浮动）
    protected robotBetTime = [500,17000];//个人下注时间起点


    // 历史问题兼容，3个月后可以删除
    fromHistoryBalance(historyBalance: any): IUserBalanceCoundDown  {
        return fromHistoryBalance(historyBalance, EGameClass.countDown) as IUserBalanceCoundDown;
    }

    newRound() {
        this.roundBetCount = 0;
        this.onNewRound();
        if(this.isRobot == true && this.isRobotNum <= 0){
            this.scene.removeRobot(this.account.nickname);
            return;
        }
    }

    status(): IPlayerstatus {
        return { uid: this.uid, betAmount: arraySum(this.getItemAmount()) };
    }
    
    protected isBetTime<RoundStep extends IRoundStepCountDownRobot>(todayRound: number, roundStep: RoundStep): boolean {
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

    protected async betOrder(roundId: number, betAmount: number, itemAmount: number[]): Promise<ETradeCode>{
        if(this.isRobot){
            return ETradeCode.success;
        }

        let order: IOrderWithTime = {code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null};

        let orderId = uuid.v1();
        let roundStep: IRoundStepCountDownRobot = JSON.parse(JSON.stringify(this.scene.machine.getRoundStep()));
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
        if(this.isRobot){
            return ETradeCode.success;
        }

        let orderId = uuid.v1();
        if (winAmount > 0) {
            let order = await this.winOrderBase(roundId, orderId, winAmount, orderDetail);
            return order.code;
        } else {
            this.tradeNothing(roundId, orderId);
            return ETradeCode.nothing;
        }
    }
    userName() {
        return this.account.nickname;
    }
    setRobot(name:string,avatar:string){
    }
    protected getBetRam(st:string): number{
        let arr =  st.split(",");
        let first:number = Number.parseInt(arr[0]);
        let target:number = 0;
        if(first == 0){
            let rate = getRandomNumInt(0,100);
            if(rate <= 90){
                return target;
            }
        }
        target = getRandomNumInt(Number.parseInt(arr[0]) ,Number.parseInt(arr[1]));
        return target;
    }
    onRobotHandler(setTime:number = 0){
        this.onRobotHandler(setTime);
    }

}
