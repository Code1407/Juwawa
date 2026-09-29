import MessageRouter from "../../shared/MessageRouter";
import Game from "../Game";
import { gGameData } from "../GameData";
import { ISceneListen, IRoundStep, IBetListResp, IAllBetResp, ICountDownPlayerUpdate } from "../interface/ILuxuryCar";
import { EGameStatus } from "../../shared3/interface/IGame";
import MyHistoryView from "../view/MyHistoryView";
import Wheels from "../Wheels";

export default class ClientScene implements ISceneListen {

    constructor(private msgRouter: MessageRouter) {
    }

    initScene() {
        let __this = this;
        this.msgRouter.on('onPlayerUpdate', function (data: any ) {
            __this.onPlayerUpdate(data);
        });
        this.msgRouter.on('onRoundStep', function (data: any) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('onBetListRound', function (data: any ) {
            __this.onBetListRound(data);
        });
        this.msgRouter.on('onBetNoticeAll', function (data: any) {
            __this.onBetNoticeAll(data);
        });
        this.msgRouter.on('onNewDay', function (data: any   ) {
            __this.onNewDay();
        });
        this.msgRouter.on('onResultHandler', function (data: any) {
            Game.Instance.onResultHandler(data);
        });
        // 基础 Player 推送，与 Seven7 的 PlayerSystem 行为对齐。
        this.msgRouter.on('ScCoinsUpdatePush', function (data: any) {
            console.log('[BalanceTrace] LuxuryCar ScCoinsUpdatePush recv', {
                localUid: Game.Instance.player?.uid,
                coins: data?.coins,
                round: gGameData.roundStep?.todayRound,
                status: gGameData.roundStep?.status,
            });
            if (data?.coins >= 0) {
                Game.Instance.player.setAccountDiamond(data.coins);
            }
        });
        this.msgRouter.on('CsPlayerBaseDataResp', function (data: any) {
            __this.onPlayerBaseData(data?.pBaseData);
        });
        this.msgRouter.on('ScLoginSucPush', function (data: any) {
            __this.onPlayerBaseData(data?.pBaseData);
        });
        this.msgRouter.on('ScSdkStatePush', function (data: any) {
            if (data?.state != null) {
                Game.Instance.player.setSdkState(data.state);
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

    onBetListRound(data: IBetListResp) {
        Game.Instance.onBetListRound(data);
    }
    onBetNoticeAll(data: IAllBetResp) {
        Game.Instance.onBetNoticeAll(data);
    }
    onPlayerUpdate(playerUpdate: ICountDownPlayerUpdate) {
        // 防止其他玩家的结算消息覆盖本机余额和个人下注。
        if (playerUpdate?.uid == null || Game.Instance.player?.uid == null ||
            String(playerUpdate.uid) !== String(Game.Instance.player.uid)) return;
        if (playerUpdate?.itemAmount?.length == 10 && playerUpdate?.diamond >= 0 && playerUpdate.todayRound == gGameData.roundStep.todayRound) {
            Game.Instance.player.setWheelAmount(playerUpdate.itemAmount);
        }
    }

    onPlayerBaseData(data: any) {
        if (!data) return;
        let player = Game.Instance.player;
        if (data.coins >= 0) player.setAccountDiamond(data.coins);
        if (data.playerUid != null) player.uid = data.playerUid.toString();
        if (data.name != null) {
            try {
                player.account.setMyName(decodeURI(data.name));
            } catch (_) {
                player.account.setMyName(data.name);
            }
        }
        if (data.avatarUrl != null) player.account.setMyProfile(data.avatarUrl);
    }

    onRoundStep(roundStep: any) {
        if ((<any>window).breakRoundStep) return;
        if (!roundStep.todayRound) return;

        let game = Game.Instance;
        // Wheels.Instance.assignHot(roundStep.hot);
        gGameData.roundStep = roundStep;

        // 可能会有延迟，以下代码为了兼容
        if (roundStep.status == EGameStatus.bet) {
            if (roundStep.remainSecond == 0) {
                roundStep.status = EGameStatus.run;
                roundStep.remainSecond = 5 + 1;
            } else {
                roundStep.remainSecond;
            }
        }

        game.changeGameStatus(roundStep.status);
    }

    onNewDay() {
        Game.Instance.player.toDayRevenue = 0;
    }

    onMaintenance() {
        Game.Instance.player.toDayRevenue = 0;
    }
}
