import MessageRouter from "../../shared/MessageRouter";
import { ISceneListen, IRoundStep, IRoundResult, IAllBetResp, IRewardResp, ICountDownPlayerUpdate } from "../interface/ILuckyFruits";
import Game from "../Game";
import { gGameData } from "../GameData";
import { EGameStatus } from "../../shared3/interface/IGame";

export default class ClientScene implements ISceneListen {

    constructor(private msgRouter: MessageRouter) {
    }

    initScene() {
        let __this = this;
        this.msgRouter.on('onRoundStep', function (data) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('onResultHandler', function (data) {
            __this.onResultHandler(data);
        });
        this.msgRouter.on('onbatNoticeAll', function (data) {
            __this.onbatNoticeAll(data);
        });
        this.msgRouter.on('onRewardHandler', function (data) {
            __this.onRewardHandler(data);
        });
        this.msgRouter.on('onbatListRound', function (data) {
            __this.onbatListRound(data);
        });
        this.msgRouter.on('onMaintenance', function (data) {
            __this.onMaintenance();
        });
        this.msgRouter.on('onPlayerUpdate', function (data) {
            __this.onPlayerUpdate(data);
        });
        this.msgRouter.on('ScCoinsUpdatePush', function (data: any) {
            __this.updateBalance(data?.coins);
        });
        this.msgRouter.on('CsPlayerBaseDataResp', function (data: any) {
            __this.updateBalance(data?.pBaseData?.coins);
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
    private updateBalance(value: any) {
        const coins = Number(value);
        if (Number.isFinite(coins) && coins >= 0 && Game.Instance?.player) {
            Game.Instance.player.setDiamon(coins);
        }
    }
    onMaintenance() {
        gGameData.roundStep.status = EGameStatus.stop;
        Game.Instance.player.toDayRevenue = 0;
    }
    onPlayerUpdate(playerUpdate: ICountDownPlayerUpdate) {
        if(playerUpdate.todayRound && playerUpdate.todayRound != gGameData.roundStep.todayRound) return;
        if (playerUpdate?.itemAmount?.length == 5 && playerUpdate?.diamond >= 0) {
            if((gGameData.roundStep.status == EGameStatus.run && gGameData.roundStep.remainSecond != -1) || (gGameData.roundStep.status == EGameStatus.final && gGameData.roundStep.remainSecond <= 0)){
                // console.log(gGameData.roundStep.status, gGameData.roundStep.remainSecond);
                Game.Instance.player.setDiamon(playerUpdate.diamond);
                Game.Instance.player.itemAmount = playerUpdate.itemAmount;
            }
        }
    }

    onRoundStep(roundStep: IRoundStep) {//同步秒数和状态
        if (!roundStep.todayRound) return;

        let game = Game.Instance;
        if (gGameData.roundStep.status != roundStep.status && roundStep.status == EGameStatus.bet) Game.Instance.EffRPS.Play();
        // let status = roundStep.status == EGameStatus.final && gGameData.status != EGameStatus.final ? EGameStatus.run2final : roundStep.status;
        game.changeGameStatus(roundStep);

        (<any>window).playerRoundId = roundStep.todayRound;
        Game.Instance.player.mergeTick(roundStep.todayRound, roundStep.status, roundStep.remainSecond);
        // this.heartbeatTimeout = this.timeoutDisconnect(5);
    }

    onResultHandler(roundResult: IRoundResult) {//服务器下发派牌的结果
        let game = Game.Instance;
        game.onResultHandler(roundResult);
    }
    onbatNoticeAll(resp: IAllBetResp) {//有人下注派发
        let game = Game.Instance;
        game.OnbatNoticeAll(resp);
    }
    onRewardHandler(roundResult: IRewardResp) {//发奖,结果的挡位
        let game = Game.Instance;
        game.OnRewardHandler(roundResult);
    }
    onbatListRound(data: any) {//服务器下发派奖的动画参数
        let game = Game.Instance;
        game.OnbatListRound(data);
    }
}
