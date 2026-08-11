import { Application, getLogger } from "pinus";
import Redis from "../../database/db/redis";
import GameServer from "../../GameServer";
import IGameScene from "../GameScene";
import { arraySum, EGameStatus } from "../../interface/IGame";
import { gConst, IHint, IMergeShootResp, IMotionPoint, IRoomResp, IRoundStep, ISceneListen, IShootResp, IVec } from "../../interface/IGoldFishing";
import { defaultGameRate, IGameRate, GoldFishingMachine, RandomFloat } from "./GoldFishingMachine";
import { GoldFishingRoom } from "./GoldFishingRoom";
import { SceneShiftBase } from "../GameBase/ShiftGame/SceneShiftBase";
import { GoldFishingPlayer } from "./GoldFishingPlayer";

let logger = getLogger(gConst.gameName, __filename);

interface IBalanceSubRate {
    [id: string]: number[];
}

export interface IBalanceRate {
    capture_rate: number;
    oil_max: number;
    target_weight: IBalanceSubRate;
}

class RoomList { [roomType: string]: GoldFishingRoom[] }

export default class GoldFishingScene
    extends SceneShiftBase<GoldFishingPlayer, IGameRate>
    implements IGameScene, ISceneListen {
    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }

    screenToRoomList = new RoomList;
    playerCountLimit = 200;
    totalHints: IHint[] = [];

    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }

    async onSceneInit() {

    }
    async onDestroy() {

    }

    onHeartbeat() {
        this.onRoundStep({
            gameStatus: EGameStatus.heartbeat,
            serverTime: new Date().getTime(),
        });

        if (this.totalHints.length > 0) {
            this.totalHints.sort((a, b) => b.amount - a.amount);
            let hintsCount = Math.min(3, this.totalHints.length);
            let hints: IHint[] = [];
            for (let i = 0; i < hintsCount; i++) {
                hints.push(this.totalHints[i]);
            }
            this.totalHints = [];
        }
    }
    // }}

    EnterRoom(uid: string, player: GoldFishingPlayer, screen: IVec, machineDuration: number) {
        if (this.isStop()) this.removePlayer(uid);

        let roomType = `${screen.x}_${screen.y}`;
        if (!Object.keys(this.screenToRoomList).includes(roomType)) {
            this.screenToRoomList[roomType] = [];
        }
        let isPlayerAwait = true;
        let roomList = this.screenToRoomList[roomType];
        for (let i = 0; i < roomList.length && isPlayerAwait; i++) {
            let room = roomList[i];
            let uids = room.uids;

            //判断房间是否正常
            let isErrorRoom = false;
            for (let j = 0; j < uids.length; j++) {
                if (uids[j] != null && this.playerList[uids[j]] == null) {
                    logger.error(`${uid}加入房间失败`, `房间中的uids[${j}]=${uids[j]}不在playerList中`);
                    isErrorRoom = true;
                }
            }
            if (isErrorRoom)
                continue;

            if (room.playerBlackList.indexOf(uid) > -1)//被踢过，不能进
                continue;

            for (let j = 0; j < 4; j++) {
                if (!uids[j]) {
                    console.log(`${uid} Join room`, JSON.stringify(uids));

                    for (let k = 0; k < uids.length; k++) {
                        if (uids[k] != null) {
                            if (!player.roomMates.includes(uids[k]))
                                player.roomMates.push(uids[k]);
                            let otherRoomMates = this.playerList[uids[k]]?.roomMates;
                            if (!otherRoomMates.includes(uid))
                                otherRoomMates.push(uid);
                        }
                    }

                    uids[j] = uid;
                    isPlayerAwait = false;
                    player.gunPos = { pos: { x: room.xy(RandomFloat(-0.5, 0.5), 0).x }, ang: 0 };
                    player.room = room;
                    player.machine = new GoldFishingMachine(this, player, room);
                    break;
                }
            }
        }
        if (isPlayerAwait) {
            console.log(`${uid} Create new room`);
            let room = new GoldFishingRoom(this, screen, machineDuration);
            roomList.push(room);
            room.uids[0] = uid;
            player.gunPos = { pos: { x: room.xy(RandomFloat(-0.5, 0.5), 0).x }, ang: 0 };
            room.initMachine_new();
            player.room = room;
            player.machine = new GoldFishingMachine(this, player, room);
        }
    }
    isPlayerOverflowed(): boolean {
        let curPlayerCount = 0;
        for (let uid in this.playerList) {
            let player = this.playerList[uid];
            if (player.room != null) {
                curPlayerCount++;
            }
        }
        return curPlayerCount >= this.playerCountLimit;
    }

    async onEnterRoomResp(uids: string[], roomResp: IRoomResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onEnterRoomResp", uid, roomResp);
        });
    }
    async onLeaveRoomResp(uids: string[], uidOther: string) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onLeaveRoomResp", uid, uidOther);
        });
    }
    onAutoQuit(uid: string) {
        this.send2Player("onAutoQuit", uid, {});
    }
    async onGunPosUpdate(uids: string[], pos: { uid: string; gunPoint: IMotionPoint, touchPos: IVec }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onGunPosUpdate", uid, pos);
        });
    }
    async onSetBetAmountIndexUpdate(uids: string[], betAmountIndex: { uid: string; value: number; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onSetBetAmountIndexUpdate", uid, betAmountIndex);
        });
    }
    async onClickLaser(uids: string[], use: { uid: string; value: boolean; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onClickLaser", uid, use);
        });
    }
    async onRoundStep(roundStep: IRoundStep) {
        this.broadcast("onRoundStep", roundStep);
    }
    async onMachineInit(uids: string[], roomResp: IRoomResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onMachineInit", uid, roomResp);
        });
    }
    async onAutoShootToTarget(uids: string[], targetId: { uid: string; value: number; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onAutoShootToTarget", uid, targetId);
        });
    }
    async onFreeShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onFreeShootResp", uid, shootResp);
        });
    }
    async onNormalShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onNormalShootResp", uid, shootResp);
        });
    }
    async onLaserShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onLaserShootResp", uid, shootResp);
        });
    }
    async onFishSkillAttack(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onFishSkillAttack", uid, shootResp);
        });
    }
    async onPropUseResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onPropUseResp", uid, shootResp);
        });
    }
    async onMergeShootResp(uids: string[], mergeResp: IMergeShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onMergeShootResp", uid, mergeResp);
        });
    }
    async onAccountDiamondUpdate(uids: string[], amount: { uid: string, value: number, offset?: number }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            if (uid != null)
                this.send2Player("onAccountDiamondUpdate", uid, amount);
        });
    }
}
