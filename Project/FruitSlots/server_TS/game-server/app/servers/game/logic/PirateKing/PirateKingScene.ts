import { getLogger } from 'pinus-logger';
import { Application } from 'pinus';
import IGameScene from "../GameScene";
import GameServer from "../../GameServer";
import { gConst, IBetResp, IRankHint, IResults, IRoundStep, ISceneListen, ITopUser,IHistoryItem } from '../../interface/IPirateKing';
import { SceneShiftBase } from '../GameBase/ShiftGame/SceneShiftBase';
import { defaultGameRate, IGameRate } from './PirateKingMachine';
import { EGameStatus, IAccount } from '../../interface/IGame';
import PirateKingPlayer from './PirateKingPlayer';
let logger = getLogger(gConst.gameName, __filename);

export default class PirateKingScene
    extends SceneShiftBase<PirateKingPlayer, IGameRate>
    implements IGameScene, ISceneListen {
    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }
    totalHints: IRankHint[] = [];
    topUserUids: string[] = [];

    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }
    onDestroy() { }
    onSceneInit() { }
    onHeartbeat() {
        this.onRoundStep({ runningRoundID: 0, status: EGameStatus.heartbeat, accountDiamond: 0, results: null });
        let topUsers: ITopUser[] = [];
        this.topUserUids = Object.keys(this.playerList);
        this.topUserUids.sort((a, b) => {//返回1则交换a、b的位置
            if (this.playerList[a] == null)
                return 1;
            if (this.playerList[b] == null)
                return -1;
            return this.playerList[b].totalBet - this.playerList[a].totalBet
        })
        if (this.topUserUids.length > 20) {
            this.topUserUids.splice(20);
        }
        for (let i in this.topUserUids) {
            let player = this.playerList[this.topUserUids[i]];
            topUsers.push({
                uid: this.topUserUids[i],
                userName: player.accountName(),
                avatar: player.accountAvator()
            })
        }
        this.onTopUserChange(topUsers);
        if (this.totalHints.length > 0) {
            this.onWinHint(this.totalHints);
            this.totalHints = [];
        }
    }
    // }}

    onResultHandler(uid: string, resp: IBetResp) {
        this.send2Player("onResultHandler", uid, resp);
    }

    onAccountDiamondUpdate(uid: string, amount: { value: number; offset?: number; }) {
        this.send2Player("onAccountDiamondUpdate", uid, amount);
    }

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            roundStep.runningRoundID = player.runningRoundID;
            roundStep.results = player.runningResults;
            roundStep.status = player.machineStatus;
            roundStep.accountDiamond = player.Diamond;
            this.send2Player("onRoundStep", uid, roundStep);
        }
    }

    onRoundStep2Player(uid: string, runningRoundID: number, status: EGameStatus, accountDiamond: number, results: IResults) {
        if (Object.keys(this.playerList).includes(uid)) {
            this.send2Player("onRoundStep", uid, {
                runningRoundID: runningRoundID,
                status: status,
                accountDiamond: accountDiamond,
                results: results
            });
        }
    }

    onTopUserChange(topUsers: ITopUser[]) {
        this.broadcast("onTopUserChange", topUsers);
    }

    onWinHint(hints: IRankHint[]) {
        this.broadcast("onWinHint", hints);
    }

    onHistoryUpdate(historyList: IHistoryItem, uid: string) {
        this.send2Player("onHistoryUpdate", uid, historyList);
    }
}