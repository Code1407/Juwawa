import { Application, getLogger } from "pinus";
import Redis from "../../database/db/redis";
import GameServer from "../../GameServer";
import IGameScene from "../GameScene";
import { arraySum, EGameStatus } from "../../interface/IGame";
import { gConst, IHint, IJackpotAmountPool, IJackpotResp, IMergeShootResp, IMotionPoint, IRoomResp, IRoundStep, ISceneListen, IShootResp, ISlotResult, IVec } from "../../interface/IPirateFishingMulti";
import { defaultGameRate, IGameRate, PirateFishingMultiMachine, RandomFloat } from "./PirateFishingMultiMachine";
import { betToJackpotPool, rateBetToJackpotPool, WheelData } from "./PirateFishingMultiConfig";
import { PirateFishingMultiRoom } from "./PirateFishingMultiRoom";
import { SceneShiftBase } from "../GameBase/ShiftGame/SceneShiftBase";
import { PirateFishingMultiPlayer } from "./PirateFishingMultiPlayer";

let logger = getLogger(gConst.gameName, __filename);

interface IBalanceSubRate {
    [id: string]: number[];
}

export interface IBalanceRate {
    capture_rate: number;
    oil_max: number;
    target_weight: IBalanceSubRate;
    wheelDatas: { [index: number]: WheelData };
}

class RoomList { [roomType: string]: PirateFishingMultiRoom[] }
class JackpotAmountPool {
    private jackpotAmountPool: IJackpotAmountPool = {
        [0]: 0,
        [1]: 0,
        [2]: 0,
    };

    constructor(private redis: Redis) { }

    async initJackpotPool() {
        //return;
        let jackpotAmountPoolStr = await this.redis.getJackpotPool();
        if (jackpotAmountPoolStr?.length > 0) {
            let jackpotAmountPool = JSON.parse(jackpotAmountPoolStr);
            this.jackpotAmountPool = jackpotAmountPool;
        }
    }

    async saveJackpotPool() {
        //return;
        await this.redis.setJackpotPool(JSON.stringify(this.jackpotAmountPool));
    }

    getAllPool(): IJackpotAmountPool {
        return this.jackpotAmountPool;
    }

    getPoolAmount(poolIndex: number): number {
        //return 0;
        if (!this.jackpotAmountPool[poolIndex]) this.jackpotAmountPool[poolIndex] = 0;
        let jackpotAmount = this.jackpotAmountPool[poolIndex];
        return jackpotAmount;
    }

    increasePoolAmount(poolIndex: number, amount: number) {
        //return;

        let incr = amount;

        this.jackpotAmountPool[poolIndex] += incr;
    }

    decreasePoolAmount(poolIndex: number, amount: number) {
        //return;

        if (!this.jackpotAmountPool[poolIndex]) this.jackpotAmountPool[poolIndex] = 0;
        this.jackpotAmountPool[poolIndex] -= amount;
    }
}

export default class PirateFishingMultiScene
    extends SceneShiftBase<PirateFishingMultiPlayer, IGameRate>
    implements IGameScene, ISceneListen {
    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        super(gameServer, gConst.gameName, logger);
    }

    screenToRoomList = new RoomList;
    roomMaxPeople: number = 3;
    playerCountLimit = 200;
    jackpotAmountPool: JackpotAmountPool;
    totalHints: IHint[] = [];

    // {{ 继承 SceneShiftBase 基类需要实现的抽象接口
    getDefaultGameRate(): IGameRate {
        return defaultGameRate();
    }

    async onSceneInit() {
        this.jackpotAmountPool = new JackpotAmountPool(this.redis)
        await this.jackpotAmountPool.initJackpotPool();
    }
    async onDestroy() {
        await this.jackpotAmountPool.saveJackpotPool();
    }

    onHeartbeat() {
        this.onRoundStep({
            gameStatus: EGameStatus.heartbeat,
            jackpotPool: this.jackpotAmountPool.getAllPool(),
            serverTime: new Date().getTime(),
        });

        if (this.totalHints.length > 0) {
            this.totalHints.sort((a, b) => b.amount - a.amount);
            let hintsCount = Math.min(3, this.totalHints.length);
            let hints: IHint[] = [];
            for (let i = 0; i < hintsCount; i++) {
                hints.push(this.totalHints[i]);
            }
            this.onJackpotHint(hints);
            this.totalHints = [];
        }
    }
    // }}

    increasePoolAmount(amount: number) {
        let rateSum = arraySum(rateBetToJackpotPool)
        this.jackpotAmountPool.increasePoolAmount(0, amount * (rateBetToJackpotPool[0] / rateSum) * betToJackpotPool);
        this.jackpotAmountPool.increasePoolAmount(1, amount * (rateBetToJackpotPool[1] / rateSum) * betToJackpotPool);
        this.jackpotAmountPool.increasePoolAmount(2, amount * (rateBetToJackpotPool[2] / rateSum) * betToJackpotPool);
        this.jackpotAmountPool.saveJackpotPool();
    }
    decreasePoolAmount(amount: number) {
        let rateSum = arraySum(rateBetToJackpotPool)
        this.jackpotAmountPool.decreasePoolAmount(0, amount * (rateBetToJackpotPool[0] / rateSum));
        this.jackpotAmountPool.decreasePoolAmount(1, amount * (rateBetToJackpotPool[1] / rateSum));
        this.jackpotAmountPool.decreasePoolAmount(2, amount * (rateBetToJackpotPool[2] / rateSum));
        this.jackpotAmountPool.saveJackpotPool();
    }
    EnterRoom_new(uid: string, player: PirateFishingMultiPlayer, screen: IVec, machineDuration: number) {
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
            for (let j = uids.length - 1; j > -1; j--) {
                if (this.playerList[uids[j]] == null) {
                    logger.error(`${uid}加入房间失败`, `房间中的uids[${j}]=${uids[j]}不在playerList中`);
                    uids.splice(j, 1);
                    isErrorRoom = true;
                }
            }
            if (isErrorRoom)
                continue;

            if (room.playerBlackList.indexOf(uid) > -1)//被踢过，不能进
                continue;

            for (let j = 0; j < this.roomMaxPeople; j++) {
                if (!uids[j]) {

                    for (let k = 0; k < uids.length; k++) {
                        if (!player.roomMates.includes(uids[k]))
                            player.roomMates.push(uids[k]);
                        let otherRoomMates = this.playerList[uids[k]]?.roomMates;
                        if (!otherRoomMates.includes(uid))
                            otherRoomMates.push(uid);
                    }

                    uids[j] = uid;
                    isPlayerAwait = false;
                    player.gunPos = { pos: { x: room.xy(RandomFloat(-0.5, 0.5), 0).x }, ang: 90 };
                    player.room = room;
                    player.machine = new PirateFishingMultiMachine(this, player, room);
                    break;
                }
            }
        }
        if (isPlayerAwait) {
            let room = new PirateFishingMultiRoom(this, screen, machineDuration);
            roomList.push(room);
            room.uids.push(uid);
            player.gunPos = { pos: { x: room.xy(RandomFloat(-0.5, 0.5), 0).x }, ang: 90 };
            room.initMachine_new();
            player.room = room;
            player.machine = new PirateFishingMultiMachine(this, player, room);
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
    onJackpotChanged() {
        this.onRoundStep({
            gameStatus: EGameStatus.final,
            jackpotPool: this.jackpotAmountPool.getAllPool(),
            serverTime: new Date().getTime(),
        });
    }
    async onEnterRoomResp(uids: string[], resp: IRoomResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onEnterRoomResp", uid, resp);
        });
    }
    async onLeaveRoomResp(uids: string[], uidOther: string) {
        if (uids == null)
            return;
        uids.forEach(uid => {
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
            this.send2Player("onGunPosUpdate", uid, pos);
        });
    }
    async onSetBetAmountIndexUpdate(uids: string[], betAmountIndex: { uid: string; value: number; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onSetBetAmountIndexUpdate", uid, betAmountIndex);
        });
    }
    async onClickHook(uids: string[], use: { uid: string; value: boolean; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onClickHook", uid, use);
        });
    }
    async onClickLaser(uids: string[], use: { uid: string; value: boolean; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onClickLaser", uid, use);
        });
    }
    async onRoundStep(roundStep: IRoundStep) {
        this.broadcast("onRoundStep", roundStep);
    }
    async onMachineInit_new(uids: string[], roomResp: IRoomResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onMachineInit_new", uid, roomResp);
        });
    }
    async onAutoShootToTarget(uids: string[], targetId: { uid: string; value: number; }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onAutoShootToTarget", uid, targetId);
        });
    }
    async onFreeShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onFreeShootResp", uid, shootResp);
        });
    }
    async onNormalShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onNormalShootResp", uid, shootResp);
        });
    }
    async onHookShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onHookShootResp", uid, shootResp);
        });
    }
    async onLaserShootResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onLaserShootResp", uid, shootResp);
        });
    }
    async onKnifeFishAttackResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onKnifeFishAttackResp", uid, shootResp);
        });
    }
    async onPropUseResp(uids: string[], shootResp: IShootResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
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
    async onSlotResult(uids: string[], slotResult: ISlotResult) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onSlotResult", uid, slotResult);
        });
    }
    async onJackpotResp(uids: string[], jackpotResp: IJackpotResp) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onJackpotResp", uid, jackpotResp);
        });
    }
    async onJackpotHint(hints: IHint[]) {
        this.broadcast("onJackpotHint", hints);
    }
    async onAccountDiamondUpdate(uids: string[], amount: { uid: string, value: number, offset?: number }) {
        if (uids == null)
            return;
        uids.forEach(uid => {
            this.send2Player("onAccountDiamondUpdate", uid, amount);
        });
    }
}
