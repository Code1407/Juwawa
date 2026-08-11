import { arraySum, IBetResp, IEnterGameResp, gConst } from "./interface/ILuxuryCarR";
import ClientPlayer from "./client/ClientPlayer";
import FerrisWheelScene from "./client/ClientScene";
import Account from "./Account";
import { coolDownTime, gGameData } from "./GameData";
import Game from "./Game";
import { ETradeCode } from "../shared3/interface/IGame";
import MessageRouter from "../shared/MessageRouter";
import { checkTradeCode, setDisconnectView2, setRechargeView } from "../shared2/GlobalViewsLoader";

function cloneChipAmount(value: number[][]): number[][] {
    if (!Array.isArray(value)) return [];
    return value.map(row => Array.isArray(row) ? row.slice() : []);
}

function cloneAmount(value: number[]): number[] {
    return Array.isArray(value) ? value.slice() : [];
}

function chipAmountSum(value: number[][]): number {
    if (!Array.isArray(value)) return 0;
    return value.reduce((total, row) => total + arraySum(row), 0);
}

function mergeChipAmount(base: number[][], delta: number[][]): number[][] {
    let result = cloneChipAmount(base);
    let length = Math.max(result.length, Array.isArray(delta) ? delta.length : 0);
    for (let i = 0; i < length; i++) {
        if (!Array.isArray(result[i])) result[i] = [];
        let deltaRow = Array.isArray(delta && delta[i]) ? delta[i] : [];
        let rowLength = Math.max(result[i].length, deltaRow.length);
        for (let j = 0; j < rowLength; j++) {
            result[i][j] = (Number(result[i][j]) || 0) + (Number(deltaRow[j]) || 0);
        }
    }
    return result;
}

function mergeAmount(base: number[], delta: number[]): number[] {
    let result = cloneAmount(base);
    let length = Math.max(result.length, Array.isArray(delta) ? delta.length : 0);
    for (let i = 0; i < length; i++) {
        result[i] = (Number(result[i]) || 0) + (Number(delta && delta[i]) || 0);
    }
    return result;
}

export default class PlayerAccount extends ClientPlayer {

    toDayRevenue = 0;
    sdkState = 0;
    lastWheelChipAmount: number[][] = [];
    private currentRoundChipAmount: number[][] = [];
    private wheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];     // 每个轮子有多少，用于计算结果。服务器确认后才会更。
    // enterGameWheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];    // (重新)进入游戏时从服务器返回的 每轮子有多少
    // lastWheelAmountNotEmpty = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 上一局的 每个轮子有多少
    // notedWheel = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];              // 每轮子标识，用于防止超过6个。客户点击立刻更新。
    private static instance: PlayerAccount;

    private constructor(msgRouter: MessageRouter, public account: Account) {
        super(msgRouter);
    }

    static async createPlayer(account: Account): Promise<PlayerAccount> {
        let msgRouter = new MessageRouter();
        await msgRouter.init(gConst.gameName);
        (<any>window).msgRouter = msgRouter;
        let scene = new FerrisWheelScene(msgRouter);
        scene.initScene();
        this.instance = new PlayerAccount(msgRouter, account);
        return this.instance;
    }

    static get Instance() {
        return this.instance;
    }

    newRound() {
        gGameData.roundBetCount = 0;
        this.currentRoundChipAmount = [];
        this.wheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.Instance.bettingBox.updateBetAmount();
    }

    onResult() {
        this.wheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        gGameData.totalWheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.Instance.bettingBox.updateBetAmount();
        
        setTimeout(()=>{
            for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
                Game.Instance.bettingBox.myBetNum[i].active = false;
            }
        },2500)
    }
    
    getWheelAmount(): number[] {
        return this.wheelAmount;
    }
    getHasBet(): boolean {
        return arraySum(this.wheelAmount) > 0;
    }
    hasLastWheel(): boolean {
        if (this.lastWheelChipAmount) {
            for (let index = 0; index < this.lastWheelChipAmount.length; index++) {
                let list = this.lastWheelChipAmount[index];
                if (arraySum(list) > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    getAccountDiamond(): number {
        return this.accountDiamond;
    }
    setWheelAmount(values: number[]) {
        this.wheelAmount = values;
        Game.Instance.bettingBox.updateBetAmount();
    }
    setAccountDiamond(value: number) {
        this.accountDiamond = value;
        this.account.setAccountDiamond(this.accountDiamond);
    }

    setSdkState(value: number) {
        this.sdkState = value;
    }

    addTodayRevenue(earnings: number, nowAccount: number, roundEarnings: number): number {
        this.toDayRevenue = earnings;
        this.accountDiamond = nowAccount;
        let split = 10;
        let sumEarningsSplit = roundEarnings / split;
        for (let i = 0; i < split; i++) {
            setTimeout(() => {
                this.account.setTodayRevenue((earnings - roundEarnings) + (i + 1) * sumEarningsSplit);
                this.account.setAccountDiamond((nowAccount - roundEarnings) + (i + 1) * sumEarningsSplit);
            }, 500 + 200 * i);
        }
        return this.toDayRevenue;
    }

    async enterGame(): Promise<IEnterGameResp> {
        let enterGameResp = await super.enterGame();
        enterGameResp.account.nickname = decodeURI(enterGameResp.account.nickname);
        return this.initPlayerAccount(enterGameResp);
    }

    async bet(todayRound: number, betGradeIndex: number[], betGradeNum: number[][]): Promise<IBetResp> {
        //this.notedWheel[which] += amount;
        let betGrade = (<any>window).betGrade;
        let needDiamon: number = 0;
        let gradeDiamon: number = 0;
        let betDiamonList: number[] = [];
        for (let i = 0; i < betGradeNum.length; i++) {
            gradeDiamon = 0;
            for (let j = 0; j < betGradeNum[i].length; j++) {
                if (betGradeNum[i][j] > 0) {
                    gradeDiamon += betGrade.getGradeAmount(j) * betGradeNum[i][j]
                }
            }
            needDiamon += gradeDiamon;
            betDiamonList[i] = gradeDiamon;
        }
        if (!(<any>window).enoughMoney(needDiamon)) {//余额不足，尝试同步信息
            let enterGameResp = await super.synchronize();
            if (enterGameResp?.account) {
                this.initPlayerAccount(enterGameResp);
            }
        }
        if (!(<any>window).enoughMoney(needDiamon)) {
            setRechargeView(true);
            checkTradeCode(ETradeCode.insufficient);
            return null;
        }
        // this.wheelAmount = betDiamonList;//先存一下数据。等返回，再更新正确的。

        let requestWheelAmount = mergeAmount(this.wheelAmount, betDiamonList);
        let requestWheelChipAmount = cloneChipAmount(betGradeNum);
        let betResp = await super.bet(todayRound, betGradeIndex, betGradeNum, betDiamonList);

        if(betResp)checkTradeCode(betResp?.code);   //添加了判断if，如果存在betResp,才进行code检查
        if (betResp == null) {
            return betResp;
        } else if (todayRound != gGameData.roundStep.todayRound) {
            return null;
        } else if (betResp.code == ETradeCode.missTime) {
            return null;
        }
        // Balance is updated by ScCoinsUpdatePush. A delayed bet response can
        // otherwise overwrite the newer server balance with stale data.
        if (betResp.code == ETradeCode.success) {
            let respWheelAmount = cloneAmount(betResp.wheelAmount);
            this.wheelAmount = arraySum(respWheelAmount) >= arraySum(requestWheelAmount)
                ? respWheelAmount : requestWheelAmount;
            let respWheelChipAmount = cloneChipAmount(betResp.wheelChipAmount);
            let requestedChipAmount = mergeChipAmount(this.currentRoundChipAmount, requestWheelChipAmount);
            this.currentRoundChipAmount = chipAmountSum(respWheelChipAmount) >= chipAmountSum(requestedChipAmount)
                ? respWheelChipAmount : requestedChipAmount;
            this.lastWheelChipAmount = cloneChipAmount(this.currentRoundChipAmount);
            Game.Instance.bettingBox.updateBetAmount();
        } else {
            this.wheelAmount = cloneAmount(betResp.wheelAmount);
        }
        return betResp;
    }

    // async autoBet(todayRound: number, wheelAmount: number[]): Promise<IBetResp> {
    //     this.notedWheel = JSON.parse(JSON.stringify(wheelAmount));

    //     this.accountDiamond -= arraySum(wheelAmount);
    //     this.account.setAccountDiamond(this.accountDiamond);

    //     let betResp = await super.autoBet(todayRound, wheelAmount);
    //     if (betResp == null) {
    //         Game.Instance.poppusViewUI.maintenanceView.active = true;
    //         return betResp;
    //     } else if (todayRound != gGameData.roundStep.todayRound){
    //         return null;
    //     } else if (betResp.code == ETradeCode.missTime){
    //         return null;
    //     } else if (betResp.code == ETradeCode.insufficient){
    //         Game.Instance.poppusViewUI.rechargeView.active = true;
    //     }
    //     // 更新账号与下注信息，以服务器的为准
    //     this.accountDiamond = betResp.accountDiamond;
    //     this.account.setAccountDiamond(this.accountDiamond);
    //     this.setWheelAmount(betResp.wheelAmount);
    //     this.lastWheelAmountNotEmpty = this.wheelAmount;

    //     return betResp;
    // }

    async synchronize(): Promise<IEnterGameResp> {
        let enterGameResp = await super.synchronize();
        enterGameResp.account.nickname = decodeURI(enterGameResp.account.nickname);
        return this.initPlayerAccount(enterGameResp);
    }

    initPlayerAccount(enterGameResp: IEnterGameResp): IEnterGameResp {
        this.accountDiamond = enterGameResp.account.diamond;
        this.toDayRevenue = enterGameResp.todayRevenue;
        // enterGame/synchronize always returns the bet amount for the current
        // round. Restore it in every round status so reconnecting during the
        // result phase does not leave the client showing its stale local value.
        this.wheelAmount = cloneAmount(enterGameResp.wheelAmount);
        const sceneChipAmount = cloneChipAmount(enterGameResp.wheelChipAmount);
        const hasOwnSceneBet = arraySum(this.wheelAmount) > 0 && chipAmountSum(sceneChipAmount) > 0;
        this.currentRoundChipAmount = hasOwnSceneBet ? sceneChipAmount : [];
        // 非空服务端下注覆盖本地 Auto 快照；空数据不覆盖已有的临时快照。
        if (hasOwnSceneBet) {
            this.lastWheelChipAmount = cloneChipAmount(sceneChipAmount);
        }
        this.account.setAccountDiamond(this.accountDiamond);
        this.account.setTodayRevenue(this.toDayRevenue);
        //this.account.setMyName(enterGameResp.account.nickname);
        this.account.setMyProfile(enterGameResp.account.avatar);
        this.uid = enterGameResp.uid;
        if (enterGameResp == null) {
            setDisconnectView2(true)
        }
        return enterGameResp;
    }

    getAutoBetAmount(): number[][] {//获得上一轮投注记录
        return this.lastWheelChipAmount;
    }
}
