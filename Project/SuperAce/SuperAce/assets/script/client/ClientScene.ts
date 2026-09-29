import MessageRouter from "../../shared/MessageRouter";
import { checkTradeCode, setMaintenanceView } from "../../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import { Effect } from "../effect/BaseEffect";
import Game from "../Game";
import { gGameData } from "../GameData";
import { IBetResp, IHint, IRoundResultResp, IRoundStep, ISceneListen } from "../interface/ISuperAce";
import SlotSuperAce from "../Slot_SuperAce";


export default class ClientScene implements ISceneListen {

    heartbeatTimeout: number = null;
    connectState:boolean = false;
    connectEffTimeId;
    disconnectDelay = 0;
    defaultConnectTime = 8;

    constructor(private msgRouter: MessageRouter) {
    }

    initScene() {
        let __this = this;
        // 框架在开始关服时推送 50 秒倒计时，业务结算完成后再推送 5 秒。
        // 视图可能尚未加载，因此同时保留 pending 标记。
        this.msgRouter.on('SvrNotifyMsg', function () {
            (<any>window).pendingCloseServerView = true;
            const closeServerView = (<any>window).closeServerView as cc.Node;
            if (closeServerView && closeServerView.isValid) {
                closeServerView.active = true;
            }
        });
        this.msgRouter.on('onMaintenance', function (data) {
            __this.onMaintenance();
        });
        this.msgRouter.on('onRoundStep', function (data) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('ScSuperAceRoundStepPush', function (data) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('onJackpotHint', function (data) {
            __this.onJackpotHint(data);
        });
        this.msgRouter.on('close', function (data) {
            __this.onClose(data);
        });
        this.msgRouter.on('onResultHandler', function (data) {
            __this.onResultHandler(data);
        });
        this.msgRouter.on('CsSuperAceBetNormalResp', function (data) {
            __this.onResultHandler(data);
        });
        this.msgRouter.on('CsSuperAceBetFreeResp', function (data) {
            __this.onResultHandler(data);
        });
        this.msgRouter.on('onStopRound', function (data) {
            __this.onStopRound(data);
        });
        this.msgRouter.on('CsSuperAceStopRoundResp', function (data) {
            __this.onStopRound(data);
        });
        this.msgRouter.on('onAccountDiamondUpdate', function (data) {
            __this.onAccountDiamondUpdate(data);
        });
        this.msgRouter.on('ScSuperAceAccountUpdatePush', function (data) {
            __this.onAccountDiamondUpdate(data);
        });
        this.msgRouter.on('CsPlayerBaseDataResp', function (data) {
            __this.onPlayerBaseDataResp(data);
        });
        this.msgRouter.on('ScCoinsUpdatePush', function (data) {
            __this.onCoinsUpdate(data);
        });
        this.msgRouter.on('onBetWrong', function (data) {
            checkTradeCode(data.code);
            SlotSuperAce.Instance.IsRunning = false;
        });
    }

    timeoutDisconnect(second: number) {
        return setTimeout(() => {
            console.log("ondisconnectView====");
            if ((<any>window).maintenanceView.active == true) return;
            if ((<any>window).disconnectView.active == true) return;
            this.disconnectDelay = second;
            gGameData.status = EGameStatus.stop;
            this.connectEffTimeId = setInterval(() => {
                (<any>window).disconnectRollView.active = true;
                if(this.disconnectDelay >= 22){
                    (<any>window).disconnectView2.active = true;
                    clearInterval(this.connectEffTimeId);
                }
                this.disconnectDelay++;
            }, 1000);
            //this.connectGame();
        }, second * 1000);
       
    }

    onJackpotHint(hint: IHint) {
        gGameData.hints.push(`🎉${decodeURI(hint.userName)} won <color=#FEEC51>${hint.amount}</color> jackpot !🎉`);
        Effect.showHint();
    }

    async onMaintenance() {
        gGameData.status = EGameStatus.stop;
        setMaintenanceView(true)
    }

    onRoundStep(roundStep: IRoundStep){
        const runningRoundId = (<any>roundStep).runningRoundId != null
            ? (<any>roundStep).runningRoundId
            : roundStep.runningRoundID;
        Game.Instance.player.roundId = runningRoundId;
        // if (roundStep.status == EGameStatus.bet && ![EGameStatus.bet, EGameStatus.coolDown].includes(gGameData.status)) Game.Instance.player.setAccountDiamond(roundStep.accountDiamond);
        Game.Instance.changeGameStatus(roundStep.status);
    }

    onClose(msg: any) {
        gGameData.status = EGameStatus.stop;
        if ((<any>window).maintenanceView.active || (<any>window).disconnectView.active) {
            return;
        }
    }

    onResultHandler(msg: IBetResp){
        // console.log("onResultHandler====",JSON.stringify(msg));
        Game.Instance.onResultHandler(msg);
    }

    onStopRound(msg: IRoundResultResp) {
        if ((<any>msg).code != null && (<any>msg).code != 0) {
            checkTradeCode((<any>msg).code);
            // 重连收尾期间的 RepeatOrder 需要由恢复流程继续 synchronize 对账；
            // 不能提前解锁转轴，否则用户可在服务端仍为 Run 时再次下注。
            if ((<any>msg).code == ETradeCode.repeatOrder && Game.Instance.isRecoveringRound()) return;
            SlotSuperAce.Instance.IsRunning = false;
            return;
        }
        // console.log("onStopRound====",JSON.stringify(msg));
        Game.Instance.player.setAccountDiamond(msg.accountDiamond);
        SlotSuperAce.Instance.stopRound();
    }

    onAccountDiamondUpdate(amount:{ value: number, offset?: number }){
        let accountDiamond = amount.value;
        // if (amount.offset) {
        //     accountDiamond += amount.offset;
        // }
        Game.Instance.player.setAccountDiamond(accountDiamond);
    }

    onPlayerBaseDataResp(resp: any) {
        const coins = resp?.pBaseData?.coins;
        if (coins != null) {
            Game.Instance.player.setAccountDiamond(coins);
        }
    }

    onCoinsUpdate(resp: any) {
        if (resp?.coins != null) {
            Game.Instance.player.setAccountDiamond(resp.coins);
        }
    }

    
}
