import { Application, getLogger } from "pinus";
import IGameScene from "../GameScene";
import { IRankHint, IResults, IRoundStep, ISceneListen, ITopUser, gConst } from "../../interface/IFootballSlot";
import { FootballSlotPlayer } from "./FootballSlotPlayer";
import { EGameStatus } from "../../interface/IGame";
import GameServer from "../../GameServer";
import { SceneShiftBase } from "../GameBase/ShiftGame/SceneShiftBase";
import { defaultGameRate, IGameRate } from "./FootballSlotMachine";
let logger = getLogger(gConst.gameName, __filename);

export class FootballSlotScene
    extends SceneShiftBase<FootballSlotPlayer, IGameRate>
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
        this.onKeepConnection();
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

    onKeepConnection() {
        if (!this.channel) return;

        this.channel.pushMessage("onKeepConnection", {}, {}, err => {
            if (err) logger.error(err);
        });
    }

    onAccountDiamondUpdate(uid: string, amount: number) {
        this.sendToPlayer("onAccountDiamondUpdate", uid, amount);
    }

    onRoundStepToPlayer(uid: string, runningRoundID: number, status: EGameStatus, accountDiamond: number, results: IResults) {
        if (Object.keys(this.playerList).includes(uid)) {
            this.sendToPlayer("onRoundStep", uid, {
                runningRoundID: runningRoundID,
                status: status,
                accountDiamond: accountDiamond,
                results: results
            });
        }
    }

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            let player = this.playerList[uid] as FootballSlotPlayer;
            roundStep.runningRoundID = player.runningRoundID;
            roundStep.results = player.runningResults;
            roundStep.status = player.machineStatus;
            roundStep.accountDiamond = player.accountDiamond();
            this.sendToPlayer("onRoundStep", uid, roundStep);
        }
    }

    onResultHandler(uid: string, result: IResults) {
        this.sendToPlayer("onResultHandler", uid, result);
    }

    onTopUserChange(topUsers: ITopUser[]) {
        this.broadcast("onTopUserChange", topUsers);
    }

    onWinHint(hints: IRankHint[]) {
        this.broadcast("onWinHint", hints);
    }
}