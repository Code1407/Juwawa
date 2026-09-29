import MessageRouter from "../../shared/MessageRouter";
import { gGameData } from "../GameData";
import {
    IEnterGameResp,
    IPlayer,
    IBetResp,
    EBetAmountIndex,
    IRoundResultResp,
    IPlayerSettings
} from "../interface/ISuperAce";

interface IPendingResponse {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
    timer: any;
}

export default class ClientPlayer implements IPlayer {

    uid: string;
    private pendingResponses: {[routeName: string]: IPendingResponse[]} = {};

    constructor(protected msgRouter: MessageRouter) {
        [
            "CsSuperAceEnterResp",
            "CsSuperAceBetNormalResp",
            "CsSuperAceBetFreeResp",
            "CsSuperAceStopRoundResp",
            "CsSuperAceSynchronizeResp",
            "CsSuperAceUpdateSettingsResp"
        ].forEach(routeName => {
            this.pendingResponses[routeName] = [];
            this.msgRouter.on(routeName, data => this.resolveResponse(routeName, data));
        });
    }

    private resolveResponse(routeName: string, data: any) {
        const queue = this.pendingResponses[routeName];
        const pending = queue && queue.shift();
        if (!pending) return;
        clearTimeout(pending.timer);
        pending.resolve(data);
    }

    // Lua 框架的异步扣款/派彩使用 pushMsg + 独立 Resp 消息；不能使用
    // reqMsg 等待 Lua 回调，否则处理函数没有同步 return 时请求会提前结束。
    private pushAndWait<T>(requestRoute: string, responseRoute: string, msg: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const queue = this.pendingResponses[responseRoute];
            const pending: IPendingResponse = {
                resolve: data => resolve(data as T),
                reject,
                timer: null
            };
            pending.timer = setTimeout(() => {
                const index = queue.indexOf(pending);
                if (index >= 0) queue.splice(index, 1);
                reject(new Error(`${responseRoute} timeout`));
            }, 15000);
            queue.push(pending);
            this.msgRouter.push(requestRoute, msg || {}).catch(error => {
                clearTimeout(pending.timer);
                const index = queue.indexOf(pending);
                if (index >= 0) queue.splice(index, 1);
                reject(error instanceof Error ? error : new Error(String(error)));
            });
        });
    }

    async enterGame(): Promise<IEnterGameResp> {
        const user = (<any>window).user;
        if (!user) return;
        this.uid = user.uid;
        return this.pushAndWait<IEnterGameResp>(
            "CsSuperAceEnterReq", "CsSuperAceEnterResp", {}
        );
    }

    async betNormal(betAmount: number, calculateAmount: number): Promise<IBetResp> {
        return this.pushAndWait<IBetResp>(
            "CsSuperAceBetNormalReq",
            "CsSuperAceBetNormalResp",
            {betAmount, calculateAmount}
        );
    }

    async betFree(): Promise<IBetResp> {
        return this.pushAndWait<IBetResp>(
            "CsSuperAceBetFreeReq", "CsSuperAceBetFreeResp", {}
        );
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        return this.pushAndWait<IRoundResultResp>(
            "CsSuperAceStopRoundReq", "CsSuperAceStopRoundResp", {roundId}
        );
    }

    async setBetAmountButton(betAmountButtonIndex: EBetAmountIndex) {
        return this.updateSettings({lastBetAmountButton: betAmountButtonIndex});
    }

    async updateSettings(playerSettings: IPlayerSettings) {
        // 服务端协议校验要求 playerSettings 必须携带合法的 soundVol 与
        // lastBetAmountButton，缺字段会被整包丢弃且不回包，客户端会一直
        // 等到超时（并阻塞同队列后续请求的响应匹配），因此发送前必须补全。
        const settings: IPlayerSettings = {};
        const soundVol = playerSettings.soundVol !== undefined
            ? playerSettings.soundVol
            : gGameData.soundVol;
        settings.soundVol = Math.max(0, Math.min(1, Number(soundVol) || 0));
        const betIndex = playerSettings.lastBetAmountButton !== undefined
            ? playerSettings.lastBetAmountButton
            : gGameData.betAmountIndex;
        settings.lastBetAmountButton = Math.max(0, Math.floor(Number(betIndex) || 0));
        if (playerSettings.isSpeed !== undefined) {
            settings.isSpeed = playerSettings.isSpeed;
        }
        return this.pushAndWait<any>(
            "CsSuperAceUpdateSettingsReq",
            "CsSuperAceUpdateSettingsResp",
            {playerSettings: settings}
        );
    }

    async refreshPlayerBaseData(): Promise<any> {
        return this.msgRouter.request("CsPlayerBaseDataReq", {});
    }

    async synchronize(): Promise<IEnterGameResp> {
        const resp = await this.pushAndWait<any>(
            "CsSuperAceSynchronizeReq", "CsSuperAceSynchronizeResp", {}
        );
        return resp && resp.data;
    }

    async test(betAmount: number, calculateAmount: number) {
        console.warn(
            "SuperAce test route is not exposed by the Lua production server",
            betAmount,
            calculateAmount
        );
    }
}
