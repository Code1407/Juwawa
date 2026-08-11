import MessageRouter from "../../shared/MessageRouter";
import { gGameData } from "../GameData";
import { IEnterGameResp, IPlayer, IBetResp, gConst, IPlayerSettings } from "../interface/IBountyFootball";
import { IAction, IDalayMsg } from "../interface/ITrace";


const routeBranch = "Branch";
const routeTrace = "Trace";

export default class ClientPlayer implements IPlayer {
    
    uid: string = null;
    accountDiamond = 0;
    traceTime: number = new Date().getTime() - 10000;
    
    constructor(protected msgRouter: MessageRouter) {
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

        // console.log("sending enterGame request:", JSON.stringify(user));
        let timeQuery = new Date().getTime();
        let resp = await this.msgRouter.request("enterGame", user);
        this.delayRecord("enterGame", timeQuery, navigator.userAgent);

        console.log("enterGame resp: ", resp);
        
        return resp;
    }

    async bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][],betDiamonList:number[]): Promise<IBetResp> {
        return this.msgRouter.request("bet",{todayRound: todayRound, betGradeArr: betGradeArr, betGradeNumArr: betGradeNumArr,betDiamonList:betDiamonList});
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
    async updateSettings(playerSettings: IPlayerSettings){
        this.msgRouter.request("updateSettings", {config: playerSettings});
    }
}