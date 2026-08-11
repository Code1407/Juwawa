import MailModel from "../../mail/script/MailModel";
import MessageRouter from "../../shared/MessageRouter";
import { setMaintenanceView } from "../../shared2/GlobalViewsLoader";
import { EGameStatus } from "../../shared3/interface/IGame";
import { Effect } from "../effect/BaseEffect";
import Game from "../Game";
import { gGameData } from "../GameData";
import { IBetResp, IHint, IRoundResultResp, IRoundStep, ISceneListen } from "../interface/IFruitSlots";
import SlotsFortuneSlot from "../Slot_FortuneSlot";
import HistoryView from "../view/HistoryView";
import Views from "../Views";


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
        this.msgRouter.on('onMaintenance', function (data) {
            __this.onMaintenance();
        });
        this.msgRouter.on('onRoundStep', function (data) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('ScLoginSucPush', () => {
            (<any>window).enterGame?.();
            MailModel.getInstance().mail_system_init((<any>window).jsnet);
        });
        this.msgRouter.on('CsPlayerBaseDataResp', function (data) {
            __this.onPlayerBaseDataResp(data);
        });
        this.msgRouter.on('ScCoinsUpdatePush', function (data) {
            __this.onCoinsUpdate(data);
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
        this.msgRouter.on('onStopRound', function (data) {
            __this.onStopRound(data);
        });
        this.msgRouter.on('onAccountDiamondUpdate', function (data) {
            __this.onAccountDiamondUpdate(data);
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
        Game.Instance.player.roundId = roundStep.runningRoundID;
        // if (roundStep.status == EGameStatus.bet && ![EGameStatus.bet, EGameStatus.coolDown].includes(gGameData.status)) Game.Instance.player.setAccountDiamond(roundStep.accountDiamond);

        if (!(gGameData.status == EGameStatus.final && roundStep.status == EGameStatus.run)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.final)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.bet)
            && !(gGameData.status == EGameStatus.coolDown && roundStep.status == EGameStatus.bet)) {
            Game.Instance.changeGameStatus(roundStep.status);
        }
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
        // console.log("onStopRound====",JSON.stringify(msg));
        //Game.Instance.player.setAccountDiamond(msg.accountDiamond);
        Views.Instance.historyView.getComponent(HistoryView).history = msg.history;
        SlotsFortuneSlot.Instance.stopRound();
    }

    onAccountDiamondUpdate(amount:{ value: number, offset?: number }){
        //let accountDiamond = amount.value;
        // if (amount.offset) {
        //     accountDiamond += amount.offset;
        // }
        // console.log("onAccountDiamondUpdate====",accountDiamond);
        //Game.Instance.player.setAccountDiamond(accountDiamond);
    }

    onPlayerBaseDataResp(resp: any) {
        Game.Instance.onPlayerBaseDataResp(resp);
    }

    onCoinsUpdate(resp: any) {
        Game.Instance.onCoinsUpdate(resp);
    }

    
}
