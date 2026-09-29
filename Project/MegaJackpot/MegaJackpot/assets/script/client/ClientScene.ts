import MessageRouter from "../../shared/MessageRouter";
import { EGameStatus } from "../../shared3/interface/IGame";
import { Effect } from "../effect/BaseEffect";
import Game from "../Game";
import { gBetAmounts, gGameData, setBonusWheelSegmentMultipliers } from "../GameData";
import { IBetResp, IHint, IRoundStep, ISceneListen } from "../interface/IMageJackpot";
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
            __this.onWinHint(data, true);
        });
        this.msgRouter.on('onWinHint', function (data) {
            __this.onWinHint(data, false);
        });
        this.msgRouter.on('onResultHandler', function (data) {
            __this.onResultHandler(data);
        });
        this.msgRouter.on('ScLoginSucPush', function (data: any) {
            if (!setBonusWheelSegmentMultipliers(data?.bonusWheelSegmentMultipliers)) {
                console.warn("Invalid bonus-wheel segment layout from login; using the built-in 12-segment fallback.");
            }
        });
        // 账户余额只接受服务端的统一推送，避免下注和派彩在客户端重复计算。
        this.msgRouter.on('ScCoinsUpdatePush', function (data: any) {
            const coins = Number(data?.coins);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.syncAccountDiamond(coins);
            }
        });
        // 游戏服会同时携带余额变化量推送该消息；与通用金币推送统一走
        // 同一套时序控制，重复的相同余额不会产生额外累加。
        this.msgRouter.on('onAccountDiamondUpdate', function (data: any) {
            const coins = Number(data?.value);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.syncAccountDiamond(coins);
            }
        });
        // SDK 充值完成后，CsPlayerBaseDataReq 会触发 refreshSdk，并通过该消息返回最新余额。
        this.msgRouter.on('CsPlayerBaseDataResp', function (data: any) {
            const coins = Number(data?.pBaseData?.coins);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.syncAccountDiamond(coins);
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

    onWinHint(hint: IHint, isJackpot: boolean) {
        // 跑马灯保留完整的服务端获奖资料；UI 可直接使用 avatarUrl、playerUid、
        // userName、winTime 和 amount 渲染头像、玩家信息及获奖时间。

        console.log("跑马灯   onWinHint", hint);
        const marqueeData = {
            avatarUrl: hint.avatarUrl || "",
            playerUid: hint.playerUid || "",
            userName: this.decodeUserName(hint.userName),
            winTime: Number(hint.winTime) || Date.now(),
            amount: Number(hint.amount) || 0,
            isJackpot: isJackpot,
        };
        const prizeType = isJackpot ? " jackpot" : "";
        const hintMsg = `🎉 ${marqueeData.userName} won <color=#FEEC51>${marqueeData.amount}</color>${prizeType} !🎉`;

        //延时3秒调用showHint，避免与onResultHandler同时调用
        cc.director.getScheduler().schedule(()=>{
            // 供跑马灯组件读取；文字队列仍保留，兼容现有 Effect.showHint() 展示。
            gGameData.jackpotMarqueeQueue.push(marqueeData);
            gGameData.hints.push(hintMsg);
            Effect.showHint();
        }, this, 3, 0, 0, false);
    }

    private decodeUserName(userName: string): string {
        try {
            return decodeURI(userName || "");
        } catch (_) {
            return userName || "";
        }
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
