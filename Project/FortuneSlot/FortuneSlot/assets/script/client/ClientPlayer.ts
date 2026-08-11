import MessageRouter from "../../shared/MessageRouter";
import { IEnterGameResp, IPlayer, IBetResp, EBetAmountIndex, IRoundResultResp, gConst, IPlayerSettings } from "../interface/IFruitSlots";

const branchRank = "Branch";

export default class ClientPlayer implements IPlayer {

    uid: string;
    constructor(protected msgRouter: MessageRouter) {
    }

    async enterGame(): Promise<IEnterGameResp> {
        let user = (<any>window).user;
        if (!user) {
            return;
        }

        this.uid = user.uid;

        console.log("sending enterGame request:", JSON.stringify(user));
        let resp = await this.msgRouter.request("enterGame", user)

        console.log("enterGame resp: ", resp);
        return resp;
    }

    async betNormal(betAmount: number, calculateAmount: number, isExtra: boolean): Promise<IBetResp> {
        return this.msgRouter.request("betNormal", { betAmount: betAmount, calculateAmount: calculateAmount ,isExtra: isExtra });
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

    async updateSettings(playerSettings: IPlayerSettings){
        this.msgRouter.request("updateSettings", {config:playerSettings});
    }

    async synchronize(): Promise<IEnterGameResp> {
        return this.msgRouter.request("synchronize", {});
    }

    async refreshPlayerBaseData(): Promise<any> {
        return this.msgRouter.request("CsPlayerBaseDataReq", {});
    }

    async test(betAmount:number, calculateAmount:number, isExtra:boolean){
        this.msgRouter.request("test", {betAmount: betAmount, calculateAmount: calculateAmount,isExtra:isExtra});
    }
}
