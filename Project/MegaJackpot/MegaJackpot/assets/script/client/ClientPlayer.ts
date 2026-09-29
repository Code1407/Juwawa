import MessageRouter from "../../shared/MessageRouter";
import { gBetAmounts, setBetAmounts } from "../GameData";
import { IEnterGameResp, IPlayer, IBetResp, EBetAmountIndex, IRoundResultResp, gConst, IBetAmountsResp } from "../interface/IMageJackpot";

const branchRank = "Branch";

export default class ClientPlayer implements IPlayer {

    uid: string;
    constructor(protected msgRouter: MessageRouter) {
    }

    async enterGame(): Promise<IEnterGameResp> {
        const user = (<any>window).user;
        if (!user) {
            console.error("enterGame failed: window.user is undefined");
            return null;
        }

        const req = {
            uid: String(user.uid || user.uId || ""),
            token: String(user.token || ""),
            lang: String(user.lang || ""),
            ua: String(
                user.ua ||
                (user.extra && user.extra.ua) ||
                (typeof navigator !== "undefined" ? navigator.userAgent : "") ||
                ""
            )
        };

        this.uid = req.uid;

        console.log("sending enterGame request:", JSON.stringify(req));
        const resp = await this.msgRouter.request("enterGame", req);

        console.log("enterGame resp: ", resp);
        return resp || null;
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
        return this.msgRouter.request("betNormal", { betAmount: betAmount });
    }

    async betFree(): Promise<IBetResp> {
        return this.msgRouter.request("betFree", {});
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        return this.msgRouter.request("stopRound", { roundId: roundId });
    }

    async setBetAmountButton(betAmountButtonIndex: EBetAmountIndex) {
        this.msgRouter.request("setBetAmountButton", { betAmountButtonIndex: betAmountButtonIndex });
    }

    async synchronize(): Promise<IEnterGameResp> {
        return this.msgRouter.request("synchronize", {});
    }

    async sendBetAmounts(): Promise<IBetAmountsResp> {
        const resp: IBetAmountsResp = await this.msgRouter.request("sendBetAmounts", {
            betAmounts: gBetAmounts.slice()
        });
        if (!resp || !setBetAmounts(resp.betAmounts)) {
            throw new Error("server returned invalid bet amounts");
        }
        if (resp.code !== 0) {
            console.warn("local bet amounts differed from server; authoritative amounts applied", resp.betAmounts);
        }
        return resp;
    }


}
