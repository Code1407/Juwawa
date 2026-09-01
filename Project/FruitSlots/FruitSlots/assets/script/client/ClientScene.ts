import MessageRouter from "../../shared/MessageRouter";
import { EGameStatus } from "../../shared3/interface/IGame";
import { Effect } from "../effect/BaseEffect";
import Game from "../Game";
import { gBetAmounts, gGameData } from "../GameData";
import { IBetResp, IHint, IRoundStep, ISceneListen } from "../interface/IFruitSlots";
import Jackpot from "../Jackpot";

export default class ClientScene implements ISceneListen {

    constructor(private msgRouter: MessageRouter) {
    }

    initScene() {
        let __this = this;
        this.msgRouter.on('onRoundStep', function (data) {
            __this.onRoundStep(data).catch(error => console.error("onRoundStep failed", error));
        });
        this.msgRouter.on('onJackpotHint', function (data) {
            __this.onJackpotHint(data);
        });
        this.msgRouter.on('onResultHandler', function (data) {
            __this.onResultHandler(data);
        });
        // 账户余额只接受服务端的统一推送，避免下注和派彩在客户端重复计算。
        this.msgRouter.on('ScCoinsUpdatePush', function (data: any) {
            const coins = Number(data?.coins);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.setAccountDiamond(coins);
            }
        });
        // SDK 充值完成后，CsPlayerBaseDataReq 会触发 refreshSdk，并通过该消息返回最新余额。
        this.msgRouter.on('CsPlayerBaseDataResp', function (data: any) {
            const coins = Number(data?.pBaseData?.coins);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.setAccountDiamond(coins);
            }
        });
        // 服务器关服消息由游戏场景消费，通用网络层只负责分发。
        this.msgRouter.on('SvrNotifyMsg', function () {
            (<any>window).pendingCloseServerView = true;
            const closeServerView = (<any>window).closeServerView as cc.Node;
            if (closeServerView && closeServerView.isValid) {
                closeServerView.active = true;
            }
        });
    }

    onJackpotHint(hint: IHint) {
        gGameData.hints.push(`🎉${decodeURI(hint.userName)} won <color=#FEEC51>${hint.amount}</color> jackpot !🎉`);
        Effect.showHint();
    }

    onResultHandler(msg: IBetResp) {
        Game.Instance.onResultHandler(msg);
    }

    async onRoundStep(roundStep: IRoundStep, restoreStatus: boolean = true): Promise<void> {
        /*
        if (roundStep.status == EGameStatus.stop) gGameData.status = roundStep.status;

        if (roundStep.status == EGameStatus.heartbeat) {
            let betAmount = gBetAmounts[gGameData.betAmountIndex];
            let jackpotAmountBefor = Math.round(gGameData.jackpotAmountPool[betAmount]);
            gGameData.jackpotAmountPool = roundStep.jackpotPool;
            let jackpotAmountCurrent = Math.round(gGameData.jackpotAmountPool[betAmount]);
            Jackpot.Instance.incrAmount(jackpotAmountBefor, jackpotAmountCurrent);
        }
        */

        //console.log("onRoundStep", roundStep);

        (<any>window).playerAccountDiamond = roundStep.accountDiamond;
        (<any>window).playerRoundId = roundStep.runningRoundID;

        if (!roundStep.jackpotPool) return;

        let betAmount = gBetAmounts[gGameData.betAmountIndex];
        let jackpotAmountBefor = Math.round(gGameData.jackpotAmountPool[betAmount]);
        gGameData.jackpotAmountPool = roundStep.jackpotPool;
        let jackpotAmountCurrent = Math.round(gGameData.jackpotAmountPool[betAmount]);
        if (jackpotAmountCurrent - jackpotAmountBefor != 0) {
            Jackpot.Instance.incrAmount(jackpotAmountBefor, jackpotAmountCurrent);
        }

        Game.Instance.player.roundId = roundStep.runningRoundID;
        if (roundStep.results && roundStep.runningRoundID) {
            Game.Instance.setRoundResult(roundStep.results);
        }
        // roundStep.accountDiamond 可能是结算前的预测值或较旧快照，不能覆盖
        // ScCoinsUpdatePush 下发的实际账户余额。

        if (!restoreStatus) return;

        if (!(gGameData.status == EGameStatus.final && roundStep.status == EGameStatus.run)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.final)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.bet)
            && !(gGameData.status == EGameStatus.coolDown && roundStep.status == EGameStatus.bet)) {
            await Game.Instance.changeGameStatus(roundStep.status);
        }

    }
    onMaintenance() {

    }
}
