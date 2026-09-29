import MessageRouter from "../shared/MessageRouter";
//import { ISceneListen, gConst } from "./interface/IFriedGoldenFlower";
import ClientPlayer from "./client/ClientPlayer";
import FriedGoldenFlowerScene from "./client/ClientScene";
import Account from "./Account";
import { arraySum, IBetResp, ISceneListen, IEnterGameResp, gConst, IHistoryItem, IPlayerBetList, IMyHistoryItem, calculateRevenue, calNumber, createEmptyBetNum, getBetGradeAmounts } from "./interface/ILuckyFruits";
import Game from "./Game";
import { gGameData } from "./GameData";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import { checkTradeCode, setMaintenanceView, setRechargeView } from "../shared2/GlobalViewsLoader";
import Historyicon from "./HistoryIcon";
import MyHistoryView from "./view/MyHistoryView";

export default class PlayerAccount extends ClientPlayer {

    toDayRevenue = 0;
    accountDiamond = 0;
    wheelAmount: number[][];
    curBetLimit: number[] = [0, 0, 0, 0, 0];
    lastWheelAmount: number[][] = [];
    curRoundWheelAmount: number[][]; // 当前局的下注信息
    curRoundAllWheelAmount: IPlayerBetList[]; // 当前局所有人的下注信息
    gameHistory: IHistoryItem[];
    itemAmount: number[]

    private mergeSecond: number = 0;
    private mergeTickCount: number = 0;
    private mergeGradeNum: number[][] = createEmptyBetNum();

    uid = "0";

    private constructor(msgRouter: MessageRouter, private scene: ISceneListen, private account: Account) {
        super(msgRouter);
    }
    async enterGame(): Promise<IEnterGameResp> {
        let enterGameResp = await super.enterGame();
        this.mergeSecond = (<any>window).config?.appExtra?.mergeSecond > 0 ? (<any>window).config.appExtra.mergeSecond : 0;
        return this.initPlayerAccount(enterGameResp);
    }
    mergeTick(todayRound: number, status: EGameStatus, remainSecond: number) {
        if (status == EGameStatus.bet) {
            if (++this.mergeTickCount >= this.mergeSecond || remainSecond == 0) {
                let betGradeNum = this.mergeGradeNum;
                this.mergeGradeNum = createEmptyBetNum();
                this.mergeBet(todayRound, status, betGradeNum);
                this.mergeTickCount = 0;
            }
        } else {
            this.mergeGradeNum = createEmptyBetNum();
        }
    }

    async mergeBet(todayRound: number, status: EGameStatus, betGradeNum: number[][]): Promise<IBetResp> {
        if (status == EGameStatus.bet) {
            let betAmount = 0;
            for (let i = 0; i < betGradeNum.length; i++) {
                let mergeItem = betGradeNum[i];
                betAmount += arraySum(mergeItem);
            }
            if (betAmount > 0) {
                return this.bet(todayRound, null, betGradeNum);
            }
        }
        return null;
    }

    async onceBet(todayRound: number, betGradeGame: number[], betGradeNum: number[][]): Promise<IBetResp> {
        let openMerge = false; // 等完成
        if (this.mergeSecond > 0 && gGameData.roundStep.remainSecond >= 1 && openMerge) {
            let needDiamon: number = 0;
            let wheelAmount: number[][] = this.wheelAmount.concat();
            for (let i = 0; i < betGradeNum.length; i++) {
                let gradeDiamon: number = 0;
                for (let j = 0; j < betGradeNum[i].length; j++) {
                    if (betGradeNum[i][j] > 0) {
                        wheelAmount[i][j] += betGradeNum[i][j];
                    }
                }
                needDiamon += gradeDiamon;
            }

            let accountDiamond = this.accountDiamond - needDiamon;
            this.setAccountDiamond(accountDiamond);
            this.setWheelAmount(wheelAmount);

            // todo 等完成以下，打开 openMerge
            // Cards.Instance.setAllBatNum(需要合并现有);
            // Cards.Instance.setMyBatNum(需要合并现有);

            for (let i = 0; i < this.mergeGradeNum.length; i++) {
                let mergeItem = this.mergeGradeNum[i];
                let betGradeNumItem = betGradeNum[i];
                for (let j = 0; j < mergeItem.length; j++) {
                    if (betGradeNum[i][j] > 0) {
                        mergeItem[j] += betGradeNumItem[j];
                    }
                }
            }

            let code = ETradeCode.success;
            let resp: IBetResp = { code, accountDiamond, betGradeNum: wheelAmount };
            return resp;
        } else {
            return this.bet(todayRound, betGradeGame, betGradeNum);
        }
    }
    static async createPlayer(account: Account): Promise<PlayerAccount> {
        let msgRouter = new MessageRouter();
        await msgRouter.init(gConst.gameName);
        (<any>window).msgRouter = msgRouter;
        let scene = new FriedGoldenFlowerScene(msgRouter);
        scene.initScene();
        let player = new PlayerAccount(msgRouter, scene, account);
        return player;
    }
    setAccountDiamond(value: number) {
        (<any>window).playerAccountDiamond = this.accountDiamond; // todo，查一下，这个有什么用的？如果没有，就删了
        this.accountDiamond = value;
        this.account.setMyDiamon(this.accountDiamond);
    }

    setWheelAmount(values: number[][]) {
        this.wheelAmount = values;
    }
    async synchronize(): Promise<IEnterGameResp> {
        let enterGameResp = await super.synchronize();
        return this.initPlayerAccount(enterGameResp);
    }
    async bet(todayRound: number, betGradeGame: number[], betGradeNum: number[][]): Promise<IBetResp> {
        if ((<any>window).breakRoundStep || gGameData.roundStep.remainSecond <= 3) {
            return null;
        }
        let betResp = await super.bet(todayRound, betGradeGame, betGradeNum);
        if (betResp == null) {
            return null;
        }
        checkTradeCode(betResp.rawTradeCode ?? betResp.code);  // 弹窗
        if (todayRound != gGameData.roundStep.todayRound) {
            return null;
        } else if (betResp.code == ETradeCode.missTime) {
            return null;
        } else if (betResp.code == ETradeCode.insufficient) {
            setRechargeView(true);
        }
        // 更新账号与下注信息，以服务器的为准
        this.setAccountDiamond(betResp.accountDiamond);
        this.setWheelAmount(betResp.betGradeNum);

        return betResp;
    }
    // async autoBet(uid:string,todayRound: number, wheelAmount: number[]): Promise<IBetResp> {
    //     //this.wheelAmount = wheelAmount;
    //     //this.lastWheelAmountNotEmpty = this.wheelAmount;
    //     //this.accountDiamond -= arraySum(wheelAmount);
    //     //this.account.setAccountDiamond(this.accountDiamond);

    //     let betResp = await super.autoBet(uid,todayRound, wheelAmount);
    //     if (betResp == null) {
    //         //Game.Instance.poppusViewUI.maintenanceView.active = true;
    //     }
    //     // 更新账号与下注信息，以服务器的为准
    //     if ([-2, -1, 0].includes(betResp.code)) {
    //         this.accountDiamond = betResp.accountDiamond;
    //         this.wheelAmount = betResp.wheelAmount;
    //     }
    //     return betResp;
    // }

    private initPlayerAccount(enterGameResp: IEnterGameResp): IEnterGameResp {
        if (enterGameResp == null) {
            setMaintenanceView(true);
            return null;
        }
        this.accountDiamond = enterGameResp.account.diamond;
        this.toDayRevenue = enterGameResp.todayRevenue;
        this.gameHistory = enterGameResp.gameHistory;
        //this.lastWheelAmount = enterGameResp.lastWheelAmount
        // 下注快照由 Game 校验回合后统一恢复，避免较晚返回的同步响应
        // 在状态机检查前就覆盖当前局已经确认的下注。
        this.account.setMyDiamon(this.accountDiamond);
        //this.account.setMyProfile(enterGameResp.account.avatar);
     
        return enterGameResp;
    }
    async AddDiamon(num: number) {
        this.accountDiamond += num;
        this.account.setMyDiamon(this.accountDiamond);
    }
    async setDiamon(num: number) {
        this.accountDiamond = num;
        this.account.setMyDiamon(this.accountDiamond);
    }
    async setMyBatNum(num: number[][]) {
        this.wheelAmount = num;
    }
    setHistoryData(item: IHistoryItem) {
        this.gameHistory.push(item);
        if (this.gameHistory.length > 20) this.gameHistory.shift();
    }
    getHistory(): IHistoryItem[] {
        return this.gameHistory;
    }
    OnRewardHandler(roundResult: number, resultDetail: number[]) {
        if (this.wheelAmount == null) {
            return;
        }
        let sumRevenue = 0;
        let sumRevenueArr = [0, 0, 0, 0, 0];
        let isbet = 0;
        let gradeAmounts: number[] = getBetGradeAmounts();
        for (let i = 0; i < 5; i++) {
            let row = this.wheelAmount[i] || [];
            for (let j = 0; j < gradeAmounts.length; j++) {
                let count = Number(row[j]);
                let amount = Number(gradeAmounts[j]);
                if (Number.isFinite(count) && count > 0) {
                    isbet = 1;
                    //betAmount[i] = this.playerList[uid].roundBatList[i];
                    sumRevenueArr[i] += count * (Number.isFinite(amount) ? amount : 0);//计算下注额
                }
            }
        }
        if(this.itemAmount &&this.itemAmount.length > 0){
            sumRevenue = calculateRevenue(this.itemAmount , resultDetail);
        }else{
            sumRevenue = calculateRevenue(sumRevenueArr , resultDetail);
        }
        // console.log(this.wheelAmount);
        //console.log("gGameData.WinCardLevel==="+gGameData.WinCardLevel);
        //console.log("sumRevenue==="+sumRevenue);
        if (sumRevenue > 0) {
            let diamond = this.accountDiamond + sumRevenue;
            Game.Instance.roundFinal.LongRank(sumRevenue);
            Game.Instance.PrepareMindRewardCount(sumRevenue, () => {
                this.setDiamon(diamond);
            });
            setTimeout(() => {
                Game.Instance.ShowResult(sumRevenue)
            }, 4000)
        }
        if (isbet == 1) {
            this.lastWheelAmount = this.wheelAmount;
        }
        let today = new Date();
        let dateStr = today.toLocaleDateString();
        let historyItem: IHistoryItem = {
            date: dateStr,
            round: gGameData.roundStep.todayRound,
            //betDatails: this.wheelAmount,
            roundResult: roundResult
        }
        let myHistoryItem: IMyHistoryItem = {
            date: dateStr,
            round: gGameData.roundStep.todayRound,
            betDatails: sumRevenueArr,
            roundResult: roundResult,
            resultDetail: resultDetail
        }

        this.setHistoryData(historyItem);
        if (isbet > 0) MyHistoryView.Instance.addHistoryItem(myHistoryItem);
        Historyicon.Instance.addIcon(this.gameHistory);
    }
    autoRecordBetSum(): number {//历史上一轮投注所需砖石数量
        let sumAutoBetAmount = 0;
        let list = this.getAutoBetAmount();
        if (list) {
            for (let i = 0; i < list.length; i++) {
                sumAutoBetAmount += calNumber(list[i]);
            }
        }
        return sumAutoBetAmount;
    }
    getAutoBetAmount(): number[][] {//获得上一轮投注记录
        return this.lastWheelAmount;
    }

    // getNotedBat():boolean{//当前轮是否已经有操作下注
    //     let batCount = 0;
    //     let list = this.curBetLimit;
    //     if(list){
    //         batCount = arraySum(list);
    //     }
    //     return batCount > 0;
    // }
    getNotedBatCount(): number[] {//当前轮已投注信息
        let batCount: number[] = [0, 0, 0, 0, 0];
        let list = this.curBetLimit;
        if (list) {
            for (let i = 0; i < list.length; i++) {
                batCount[i] = list[i] > 0 ? 1 : 0;
            }
        }
        return batCount;
    }
    setNotedBatCount(list: number[]) {//更新当前轮已投注信息
        for (let index = 0; index < this.curBetLimit.length; index++) {
            this.curBetLimit[index] += list[index];
        }
    }

    getNotedBat(): boolean {//当前轮是否已经有操作下注
        let batCount = arraySum(this.curBetLimit);
        return batCount > 0;
    }

    setNotedBetCount(list: number[]) {//更新当前轮已投注信息
        for (let index = 0; index < this.curBetLimit.length; index++) {
            this.curBetLimit[index] += list[index];
        }
    }
}
window["gGameAccount"] = PlayerAccount;
