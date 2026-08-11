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
            __this.onRoundStep(data);
        });
        this.msgRouter.on('onJackpotHint', function (data) {
            __this.onJackpotHint(data);
        });
        this.msgRouter.on('onResultHandler', function (data) {
            __this.onResultHandler(data);
        });
    }

    onJackpotHint(hint: IHint) {
        gGameData.hints.push(`🎉${decodeURI(hint.userName)} won <color=#FEEC51>${hint.amount}</color> jackpot !🎉`);
        Effect.showHint();
    }

    onResultHandler(msg: IBetResp) {
        Game.Instance.onResultHandler(msg);
    }

    onRoundStep(roundStep: IRoundStep) {
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
        if (roundStep.status == EGameStatus.bet && ![EGameStatus.bet, EGameStatus.coolDown].includes(gGameData.status)) Game.Instance.player.setAccountDiamond(roundStep.accountDiamond);

        if (!(gGameData.status == EGameStatus.final && roundStep.status == EGameStatus.run)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.final)
            && !(gGameData.status == EGameStatus.run && roundStep.status == EGameStatus.bet)
            && !(gGameData.status == EGameStatus.coolDown && roundStep.status == EGameStatus.bet)) {
            Game.Instance.changeGameStatus(roundStep.status);
        }

    }
    onMaintenance() {

    }
}
