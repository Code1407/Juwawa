import { arraySum, IBetResp, IEnterGameResp, gConst } from "./interface/ILuxuryCar";
import ClientPlayer from "./client/ClientPlayer";
import FerrisWheelScene from "./client/ClientScene";
import Account from "./Account";
import { coolDownTime, gGameData } from "./GameData";
import Game from "./Game";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import MessageRouter from "../shared/MessageRouter";
import { checkTradeCode, setDisconnectView2, setRechargeView } from "../shared2/GlobalViewsLoader";

function cloneChipAmount(value: number[][]): number[][] {
    if (!Array.isArray(value)) return [];
    return value.map((row) => Array.isArray(row) ? row.slice() : []);
}

function cloneAmount(value: number[]): number[] {
    return Array.isArray(value) ? value.slice() : [];
}

function chipAmountSum(value: number[][]): number {
    if (!Array.isArray(value)) return 0;
    let total = 0;
    for (let i = 0; i < value.length; i++) {
        total += arraySum(value[i]);
    }
    return total;
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
    /** 当前下注数据所属的回合，用来区分“刷新恢复本局”和“真正进入新一局”。 */
    private currentRound: number = 0;
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

    newRound(todayRound: number) {
        gGameData.roundBetCount = 0;
        // 刷新/重连后，enterGame 已恢复本局下注。随后收到同一回合的 bet 状态推送时
        // 不能再次清空，否则点击 Auto 会误判为本局尚未下注并重复下注。
        if (this.currentRound == todayRound) {
            return;
        }
        this.currentRound = todayRound;
        this.currentRoundChipAmount = [];
        this.wheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.Instance.bettingBox.updateBetAmount();

    }

    onResult() {
        this.wheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        gGameData.totalWheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.Instance.bettingBox.updateBetAmount();
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

    addTodayRevenue(earnings: number): number {
        this.toDayRevenue += earnings;
        this.account.setTodayRevenue(this.toDayRevenue);

        return this.toDayRevenue;
    }

    async enterGame(): Promise<IEnterGameResp> {
        let enterGameResp = await super.enterGame();
        if (!enterGameResp?.account) {
            console.error("enterGame failed:", enterGameResp);
            setDisconnectView2(true);
            return enterGameResp;
        }
        enterGameResp.account.nickname = decodeURI(enterGameResp.account.nickname);
        return this.initPlayerAccount(enterGameResp);
    }

    async bet(todayRound: number, betGradeIndex: number[], betGradeNum: number[][]): Promise<IBetResp> {
        if ((<any>window).breakRoundStep || gGameData.roundStep.remainSecond <= 3) {
            return null;
        }
        //this.notedWheel[which] += amount;
        let betGrade = (<any>window).betGrade;
        let needDiamon: number = 0;
        let gradeDiamon: number = 0;
        let betDiamonList: number[] = [];
        for (let i = 0; i < betGradeNum.length; i++) {
            gradeDiamon = 0;
            for (let j = 0; j < betGradeNum[i].length; j++) {
                if (betGradeNum[i][j] > 0) {
                    let gradeAmount = betGrade && typeof betGrade.getGradeAmount === "function" ? betGrade.getGradeAmount(j) : 0;
                    gradeDiamon += gradeAmount * betGradeNum[i][j]
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
        checkTradeCode(betResp?.code);
        if (betResp == null) {
            return betResp;
        } else if (todayRound != gGameData.roundStep.todayRound) {
            return null;
        } else if (betResp.code == ETradeCode.missTime) {
            return null;
        }
        // 余额统一由 ScCoinsUpdatePush / 玩家基础数据同步更新。
        // subCoins 可能先推送最新余额，随后下注响应才到达；这里再次使用
        // betResp.accountDiamond 会用较旧的响应覆盖最新余额，造成显示少一次下注额。
        //this.setWheelAmount(betResp.wheelAmount);
        //this.lastWheelAmountNotEmpty = this.wheelAmount;
        if (betResp.code == ETradeCode.success) {
            let respWheelAmount = cloneAmount(betResp.wheelAmount);
            this.wheelAmount = arraySum(respWheelAmount) >= arraySum(requestWheelAmount) ? respWheelAmount : requestWheelAmount;
            let respWheelChipAmount = cloneChipAmount(betResp.wheelChipAmount);
            let requestCurrentRoundChipAmount = mergeChipAmount(this.currentRoundChipAmount, requestWheelChipAmount);
            this.currentRoundChipAmount = chipAmountSum(respWheelChipAmount) >= chipAmountSum(requestCurrentRoundChipAmount)
                ? respWheelChipAmount
                : requestCurrentRoundChipAmount;
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
        if (!enterGameResp?.account) {
            console.error("synchronize failed:", enterGameResp);
            setDisconnectView2(true);
            return enterGameResp;
        }
        enterGameResp.account.nickname = decodeURI(enterGameResp.account.nickname);
        return this.initPlayerAccount(enterGameResp);
    }

    initPlayerAccount(enterGameResp: IEnterGameResp): IEnterGameResp {
        this.accountDiamond = enterGameResp.account.diamond;
        this.toDayRevenue = enterGameResp.todayRevenue;
        this.currentRound = Number(enterGameResp.roundStep?.todayRound) || 0;
        this.wheelAmount = cloneAmount(enterGameResp.wheelAmount);
        const sceneChipAmount = cloneChipAmount(enterGameResp.wheelChipAmount);
        const hasOwnSceneBet = arraySum(this.wheelAmount) > 0 && chipAmountSum(sceneChipAmount) > 0;
        this.currentRoundChipAmount = hasOwnSceneBet ? sceneChipAmount : [];
        // 服务端当局有下注时，以它作为最新 Auto 快照；没有下注时只清空当局状态，
        // 不覆盖客户端当前会话中已有的最后一条有效下注记录。
        if (hasOwnSceneBet) {
            this.lastWheelChipAmount = cloneChipAmount(sceneChipAmount);
        }
        //if (enterGameResp.roundStep.status == EGameStatus.bet) this.enterGameWheelAmount = enterGameResp.wheelAmount;
      
        this.account.setAccountDiamond(this.accountDiamond);
        this.account.setTodayRevenue(this.toDayRevenue);
        //this.account.setMyName(enterGameResp.account.nickname);
        this.account.setMyProfile(enterGameResp.account.avatar);
        this.uid = enterGameResp.uid;
        if (enterGameResp == null) {
            console.warn("enterGameResp", enterGameResp);
            setDisconnectView2(true);
        }
        return enterGameResp;
    }

    getAutoBetAmount(): number[][] {//获得上一轮投注记录
        return this.lastWheelChipAmount;
    }
}
