import MessageRouter from "../../shared/MessageRouter";
import Game from "../Game";
import { gGameData } from "../GameData";
import { ISceneListen, IRankListItem, IRoundStep, IPlayerUpdate, IBetListResp, IAllBetResp, ICountDownPlayerUpdate } from "../interface/IBountyFootball";
import { EGameStatus } from "../../shared3/interface/IGame";
import MyHistoryView from "../view/MyHistoryView";
import RankListView from "../view/RankListView";
import Wheels from "../Wheels";

export default class ClientScene implements ISceneListen {

    constructor(private msgRouter: MessageRouter) {
    }

    initScene() {
        let __this = this;
        this.msgRouter.on('onRankListChange', function (data: any) {
            __this.onRankListChange(data?.rankList || data || []);
        });
        this.msgRouter.on('onPlayerUpdate', function (data) {
            __this.onPlayerUpdate(data);
        });
        this.msgRouter.on('onRoundStep', function (data) {
            __this.onRoundStep(data);
        });
        this.msgRouter.on('onBetListRound', function (data) {
            __this.onBetListRound(data);
        });
         this.msgRouter.on('onBetNoticeAll', function (data) {
            __this.onBetNoticeAll(data);
        });
        this.msgRouter.on('onNewDay', function (data) {
            __this.onNewDay();
        });
        this.msgRouter.on('onResultHandler', function (data: any) {
            Game.Instance.onResultHandler(data);
        });
        this.msgRouter.on('ScCoinsUpdatePush', function (data: any) {
            if (data?.coins >= 0) Game.Instance.player.setAccountDiamond(data.coins);
        });
        this.msgRouter.on('CsPlayerBaseDataResp', function (data: any) {
            __this.onPlayerBaseData(data?.pBaseData);
        });
        this.msgRouter.on('ScLoginSucPush', function (data: any) {
            __this.onPlayerBaseData(data?.pBaseData);
        });
        this.msgRouter.on('ScSdkStatePush', function (data: any) {
            if (data?.state != null) Game.Instance.player.setSdkState(data.state);
        });
    }

    onRankListChange(rankList: IRankListItem[]) {
        Game.Instance.poppusViewUI.rankListView.getComponent(RankListView).setRankListValues(rankList);
        if (rankList?.length >= 1) {
            Game.Instance.poppusViewUI.setRankListNo1Value(rankList[0]);
        }
    }

    onBetListRound(data: IBetListResp) {
        Game.Instance.onBetListRound(data);
    }
    onBetNoticeAll(data: IAllBetResp) {
        Game.Instance.onBetNoticeAll(data);
    }
    onPlayerUpdate(playerUpdate: ICountDownPlayerUpdate) {
        if (playerUpdate?.itemAmount?.length == 10 && playerUpdate?.diamond >= 0 && playerUpdate.todayRound == gGameData.roundStep.todayRound) {
            Game.Instance.player.setAccountDiamond(playerUpdate.diamond);
            Game.Instance.player.setWheelAmount(playerUpdate.itemAmount);
        }
    }

    onPlayerBaseData(data: any) {
        if (!data) return;
        let player = Game.Instance.player;
        if (!player || !player.account) return;
        let account: any = player.account;
        if (data.coins >= 0) player.setAccountDiamond(data.coins);
        if (data.playerUid != null) player.uid = data.playerUid.toString();
        // The current BountyFootball scene has no nickname label.
        // Update the nickname only when its Account component supports it.
        if (data.name != null && typeof account.setMyName === "function") {
            let name = data.name;
            try { name = decodeURI(name); }
            catch (_) { }
            account.setMyName(name);
        }
        if (data.avatarUrl != null && typeof account.setMyProfile === "function") {
            account.setMyProfile(data.avatarUrl);
        }
    }

    onRoundStep(roundStep: IRoundStep) {
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
