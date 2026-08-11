import { getLogger } from 'pinus-logger';
import { Application } from 'pinus';
import IGameScene from "../GameScene";
import BeeSlotPlayer from "./BeeSlotPlayer";
import GameServer from "../../GameServer";
import { EGameStatus } from "../../interface/IGame";
import { gConst, IBetResp, IHoneyJarItem, IRoundStep, ISceneListen } from '../../interface/IBeeSlot';
import { defaultGameRate, IGameRate } from './BeeSlotMachine';
import { SceneShiftBase } from '../GameBase/ShiftGame/SceneShiftBase';
let logger = getLogger(gConst.gameName, __filename);

export default class BeeSlotScene
    extends SceneShiftBase<BeeSlotPlayer, IGameRate>
    implements IGameScene, ISceneListen {
    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }

    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }
    onDestroy() { }
    async onSceneInit() {

    }
    onHeartbeat() {
        this.onRoundStep({ status: EGameStatus.heartbeat });
    }
    // }}

    onRoundStep(roundStep: IRoundStep) {
        for (let uid in this.playerList) {
            this.send2Player("onRoundStep", uid, roundStep);
        }
    }

    async onResultHandler(uid: string, resp: IBetResp) {
        this.send2Player("onResultHandler", uid, resp);
    }

    onAccountDiamondUpdate(uid: string, amount: { value: number; offset?: number; }) {
        this.send2Player("onAccountDiamondUpdate", uid, amount);
    }

    onHandselHoneyJar(uid: string, honeyJarDataByBet: IHoneyJarItem[]) {
        this.send2Player("onHandselHoneyJar", uid, honeyJarDataByBet);
    }

}