import MessageRouter from "../../shared/MessageRouter";
import { gGameData } from "../GameData";
import { IEnterGameResp, IPlayer, IBetResp, gConst, IPlayerSettings } from "../interface/ILuxuryCarR";
import { IAction, IDalayMsg } from "../interface/ITrace";


const routeBranch = "Branch";
const routeTrace = "Trace";

export default class ClientPlayer implements IPlayer {
    
    uid: string = null;
    accountDiamond = 0;
    traceTime: number = new Date().getTime() - 10000;
    private betRequestSeq = 0;
    private pendingBets: Map<number, { resolve: (resp: IBetResp) => void, timer: any }> = new Map();
    
    constructor(protected msgRouter: MessageRouter) {
        this.msgRouter.on("betResp", (resp: IBetResp) => this.finishPendingBet(resp?.requestId, resp));
    }
    private finishPendingBet(requestId: number, resp: IBetResp) {
        const pending = this.pendingBets.get(requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pendingBets.delete(requestId);
        pending.resolve(resp);
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
        if (!user) {
            return;
        }

        this.uid = user.uid;

        console.log("sending enterGame request:", JSON.stringify(user));
        let timeQuery = new Date().getTime();
        let resp = await this.msgRouter.request("enterGame", user);
        if (resp?.account) {
            this.delayRecord("enterGame", timeQuery, navigator.userAgent);
        }

        console.log("enterGame resp: ", resp);
        
        return resp;
    }

    async bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][],betDiamonList:number[]): Promise<IBetResp> {
        this.betRequestSeq = this.betRequestSeq % 2147483646 + 1;
        const requestId = this.betRequestSeq;
        return new Promise<IBetResp>(async resolve => {
            const timer = setTimeout(() => this.finishPendingBet(requestId, null), 10000);
            this.pendingBets.set(requestId, { resolve, timer });
            try {
                const accepted = await this.msgRouter.request("bet", { todayRound, betGradeArr, betGradeNumArr, betDiamonList, requestId });
                if (!accepted || accepted.code !== 0) this.finishPendingBet(requestId, accepted);
            } catch (_) {
                this.finishPendingBet(requestId, null);
            }
        });
    }

    async setBetAmountButton(betAmountButtonIndex: number) {
        this.msgRouter.request("setBetAmountButton", {betAmountButtonIndex: betAmountButtonIndex});
    }

    async synchronize(): Promise<IEnterGameResp> {
        return this.msgRouter.request("synchronize", {});
    }

    async userAction(msg: IAction) {
        this.msgRouter.requestBranch(routeTrace, "userAction", msg);
    }

    async userDelay(msg: IDalayMsg) {
        this.msgRouter.requestBranch(routeTrace, "userDelay", msg);
    }
    async updateSettings(playerSettings: IPlayerSettings) {
        this.msgRouter.request("updateSettings", { config: playerSettings });
    }
}
