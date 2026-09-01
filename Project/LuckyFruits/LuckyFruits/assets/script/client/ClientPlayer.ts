import MessageRouter from "../../shared/MessageRouter";
import { gConst, IPlayer, IBetData, IBetResp, IEnterGameResp, IPlayerSettings, createEmptyBetPositions, getBetGradeAmounts } from "../interface/ILuckyFruits";
import Game from "../Game";
import { IAction, IDalayMsg, ITrace } from "../interface/ITrace";
import { gGameData } from "../GameData";

interface IPendingBet {
    msg: any;
    resolve: (resp: IBetResp) => void;
    reject: (error: Error) => void;
    queryTime: number;
    extra: string;
}

export default class ClientPlayer implements IPlayer, ITrace {

    uid: string = null;
    accountDiamond = 0;
    traceTime: number = new Date().getTime() - 10000;
    private activeBet: IPendingBet = null;
    private betQueue: IPendingBet[] = [];

    constructor(protected msgRouter: MessageRouter) {
        this.msgRouter.on("betResp", (resp: IBetResp) => this.onBetResp(resp));
    }

    private onBetResp(resp: IBetResp) {
        let pending = this.activeBet;
        this.activeBet = null;
        if (pending) {
            this.delayRecord("bet", pending.queryTime, pending.extra);
            pending.resolve(resp);
        } else {
            console.warn("unmatched betResp", resp);
        }
        if (resp) Game.Instance.Onbat(resp);
        this.sendNextBet();
    }

    private sendNextBet() {
        if (this.activeBet || this.betQueue.length == 0) return;
        let pending = this.betQueue.shift();
        this.activeBet = pending;
        this.msgRouter.push("bet", pending.msg).catch((error) => {
            if (this.activeBet !== pending) return;
            this.activeBet = null;
            pending.reject(error instanceof Error ? error : new Error(String(error)));
            this.sendNextBet();
        });
    }

    private delayRecord(action: string, queryTime: number, extra: string) {
        let responseTime = new Date().getTime();
        if (responseTime - queryTime > 1000 * 2) { // 超过2秒的为延迟
            if (responseTime - this.traceTime > 1000 * 10) { // 10秒cd，有附近时间的数据即可，不用每条延迟都记录。
                this.traceTime = responseTime;
                let dalayMsg: IDalayMsg = {
                    gameName: gConst.gameName,
                    round: gGameData.roundStep.todayRound,
                    uid: this.uid,
                    action: action,
                    queryTime: queryTime,
                    responseTime: responseTime,
                    extra: extra
                }
    
                this.userDelay(dalayMsg);
            }
        }
    }

    actionRecord(action: string) {
        let msg: IAction = {
            gameName: gConst.gameName,
            round: gGameData.roundStep.todayRound,
            uid: this.uid,
            action: action,
            accountDiamond: this.accountDiamond, // 如果该变量之前是放在子类，则把accountDiamond移到基类
            actionTime: new Date().getTime()
        }
        this.userAction(msg);
    }
    async enterGame(): Promise<IEnterGameResp> {  
        let user = (<any>window).user;
        if (!user) return;
        
        let timeQuery = new Date().getTime();
        let resp = await this.msgRouter.request("enterGame", user);
        this.delayRecord("enterGame", timeQuery, navigator.userAgent);
        return resp;
    }
    // UI内部仍使用档位数量矩阵；网络边界转换成明确的“位置+面值+数量”明细。
    async bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][]): Promise<IBetResp> {
        // 所有入口统一按服务器下发的筹码档数构造 5 个下注位，修正旧UI中
        // 混用4/5档数组以及3/8位选择数组的问题。
        let gradeAmounts: number[] = getBetGradeAmounts();
        if (gradeAmounts.length == 0) {
            throw new Error("invalid server bet grade config: expected 1 to 5 grades");
        }
        let gradeCount = gradeAmounts.length;
        let normalizedGrades: number[] = createEmptyBetPositions();
        let normalizedCounts: number[][] = [];
        let normalizedAmounts: number[] = createEmptyBetPositions();
        let betList: IBetData[] = [];
        for (let betIndex = 0; betIndex < 5; betIndex++) {
            let sourceRow = betGradeNumArr && betGradeNumArr[betIndex] || [];
            let row: number[] = [];
            for (let gradeIndex = 0; gradeIndex < gradeCount; gradeIndex++) {
                let count = Number(sourceRow[gradeIndex] || 0);
                if (!Number.isInteger(count) || count < 0) {
                    throw new Error(`invalid chip count: position=${betIndex}, grade=${gradeIndex}, count=${count}`);
                }
                row[gradeIndex] = count;
                normalizedAmounts[betIndex] += gradeAmounts[gradeIndex] * count;
                if (count > 0) {
                    betList.push({
                        betPosition: betIndex,
                        chipValue: gradeAmounts[gradeIndex],
                        chipCount: count,
                    });
                }
            }
            normalizedCounts[betIndex] = row;
            normalizedGrades[betIndex] = normalizedAmounts[betIndex] > 0 ? 1 : 0;
        }
        if (betList.length == 0) {
            throw new Error("empty bet list");
        }
        betGradeArr = normalizedGrades;
        betGradeNumArr = normalizedCounts;
        let betDiamonList = normalizedAmounts;
        let queryTime = new Date().getTime();
        // 旧字段保留一个发布周期，便于新客户端兼容尚未升级的旧服务。
        let msg = {todayRound, betList, betGradeArr, betGradeNumArr, betDiamonList};
        let extra = JSON.stringify({betList});

        return new Promise<IBetResp>((resolve, reject) => {
            this.betQueue.push({msg, resolve, reject, queryTime, extra});
            this.sendNextBet();
        });
    }
    // async autoBet(uid:string,todayRound: number, amount: number[]): Promise<IBetResp> {
    //     return await this.msgRouter.request("autoBet", {uid:uid,todayRound: todayRound, amount: amount});
    // }
    async updateSettings(playerSettings: IPlayerSettings){
        this.msgRouter.request("updateSettings", {config: playerSettings});
    }
    async synchronize(): Promise<IEnterGameResp> {
        return await this.msgRouter.request("synchronize", {});
    }
    async userAction(msg: IAction) {
        // Lua/PureClient 架构没有旧TS服的Trace分支，避免把统计消息误发到游戏服。
    }

    async userDelay(msg: IDalayMsg) {
        // 同上；需要恢复统计时应接入独立Trace服务，而不是注册游戏协议空处理。
    }
}
