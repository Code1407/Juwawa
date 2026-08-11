import { getLogger } from "pinus";
import { arraySum, ETradeCode, IPlayerSettings } from "../../interface/IGame";
import IGamePlayer from "../GamePlayer";
import { ERateType } from "../../database/entity/SDKEntity";
import { IEnterGameResp, IOilDrumData, IPlayer, IShootResp, IVec, IUserInfo, IShootInfo, EPropType, IMotionPoint, EEntityType, ISlotInfo, IWheelResult, IShootData, IMergeShootResp, EWeaponType, IShootResult } from "../../interface/IPirateFishingMulti";
import { gConst } from "../../interface/IPirateFishingMulti";
import { ERoundType, PirateFishingMulti_round } from "../../database/entity/PirateFishingMultiEntity";
import { bulletOfOil, Game4Player, IHookShootResult, ILaserShootResult, INormalShootResult, PirateFishingMultiMachine, WeightToIndex } from "./PirateFishingMultiMachine";
import PirateFishingMultiScene from "./PirateFishingMultiScene";
import { delay } from "bluebird";
import { entityDatas, EntityDelayTime, jackpotDelayTime } from "./PirateFishingMultiConfig";
import { PirateFishingMultiRoom } from "./PirateFishingMultiRoom";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
let logger = getLogger(gConst.gameName, __filename);

interface IShootResultEx {
    slotGet: number,
    shootResult?: IShootResult,
    shootResults?: IShootResult[],
    wheelResult?: IWheelResult,
    realComboCount?: number,
}

interface IResultSave {
    m: number;
    t?: EEntityType[];
    c?: number[];
    revenue?: number[];
    slotGet?: number[];
    jp?: IWheelResult;
}

const wheelRoundWhich = 1000000000;

export enum ECoolDown {
    setGunPos,
    setBetAmountIndex,
    clickHook,
    clickLaser,
    autoShootToTarget,
    normalShoot,
    hookShoot,
    laserShoot,
    propUse,
    mergeShoot,
    runSlot,
    runWheel,
}

export class CoolDown {
    cd: boolean = false;
    ms = 100;
    callCount: number = 0;
    private cdTimeout: NodeJS.Timeout;

    IsCoolDown(): boolean {
        this.callCount++;
        if (this.cd) {
            return this.cd;
        }
        clearTimeout(this.cdTimeout);
        this.cd = true;
        this.cdTimeout = setTimeout(() => {
            this.cd = false;
        }, this.ms);
        return false;
    }
}

interface IRoundResult {
    revenue: number;
    comboBackAmount: number;
};

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    myHistory: any[] = [];
    lastBetAmountButton: number = 0;
    oilDrum: IOilDrumData = {};
    freeBulletData: { [betAmount: number]: number } = {};
    //在客户端堆叠积累起来的老虎机，如果用户退出，就把没转完的保存起来，下次进游戏继续转
    saveSlot: ISlotInfo[] = [];
}

export class PirateFishingMultiPlayer
    extends PlayerShiftBase<DataEntity, IRoundResult>
    implements IPlayer, IGamePlayer {
    userEntity: DataEntity;
    /**当前展示的金额 */
    isReset: boolean = false;
    machine: PirateFishingMultiMachine;
    room: PirateFishingMultiRoom;
    freeChance: number = 0;
    betAmount: number = 0;
    roomMates: string[] = [];
    useHook: boolean;
    useLaser: boolean;
    lockTargetId: number = -1;
    gunPos: IMotionPoint;

    constructor(protected scene: PirateFishingMultiScene) {
        super(logger);
    }

    get Diamond(): number {
        return this.account.diamond;
    }

    // {{ 照抄就好，不放在基类是方便每个游戏各自调试自己的入口
    async enterGame(screen: IVec, machineDuration: number): Promise<IEnterGameResp> {
        if (!this.userEntity) await this.initPlayer();
        return this.getClientResp(screen, machineDuration, true);
    }

    async synchronize(): Promise<IEnterGameResp> {
        if (this.room == null)
            return null;
        let account = await this.queryUserAccount();
        if (account) this.account = account;
        if (!this.userEntity) await this.initPlayer();
        return this.getClientResp(this.room.Screen(), this.room.MachineDuration(), false);
    }

    async initPlayer() {
        let userEntity = await this.getUserEntity(this.uid);
        this.userEntity = userEntity ? userEntity : new DataEntity;
        if (this.userEntity.runningRounds == null) {
            this.userEntity.runningRounds = {};
        }
    }
    // }}

    // 老是不动的玩家影响别人游戏体验。拉入房间黑名单，避免又进去影响同一个人。
    override onAutoQuit(): void {
        if (this.room != null) {
            this.room.playerBlackList.push(this.uid);
        }
    }
    // {{ 继承 PlayerShiftBase 基类需要实现的抽象接口
    async quitGame() {
        this.RoomRemovePlayer(this.uid);
    }
    RoomRemovePlayer(uid: string) {
        let room = this.room;
        this.room = null;
        if (room) {
            let roomType = `${room.Screen().x}_${room.Screen().y}`;
            let roomList = this.scene.screenToRoomList[roomType];
            let uids = room.uids;
            //let indexOf = uids.indexOf(uid);
            if (uids.indexOf(uid) > -1) uids.splice(uids.indexOf(uid), 1);
            for (let i = uids.length - 1; i > -1; i--) {
                let otherUid = uids[i];
                let roomMates = this.scene.getPlayer(otherUid)?.roomMates;
                if (roomMates != null) {
                    if (roomMates.indexOf(uid) > -1) roomMates.splice(roomMates.indexOf(uid), 1);
                }
                else {
                    logger.error(`把${uid}移出房间, 发现uids[${i}]=${otherUid}不在playerList中`);
                    uids.splice(i, 1);
                }
            }
            this.scene.onLeaveRoomResp(uids, uid);
            if (uids.length < 1) {
                roomList.splice(roomList.indexOf(room), 1);
            }
        }
    }

    async settleResult(roundId: number) {
        let result = this.endRound(roundId);
        if (!result) return;

        let amount = result.revenue + result.comboBackAmount;
        await this.winOrder(roundId, amount);
        if (this.room?.uids?.length) this.scene.onAccountDiamondUpdate(this.room.uids, { uid: this.uid, value: this.Diamond, offset: amount });
    }
    // }}

    getClientResp(screen: IVec, machineDuration: number, isNewEnter: boolean): IEnterGameResp {
        let gameId = this.scene.gameServer.sdkConfig.gameId[this.scene.gameName()];

        let resp: IEnterGameResp = {
            account: this.account,
            betAmountIndex: this.userEntity.lastBetAmountButton,
            playerSettings: this.userEntity.playerSettings,
            freeBulletData: this.userEntity.freeBulletData,
            oilDrumData: this.userEntity.oilDrum,
            timeEnterGame: new Date().getTime(),
            roomResp: {
                overflowed: false,
                timeMachineInit: 0,
                allPlayers: [],
                entityRandomKey: {
                    typeKey: 0,
                    pathKey: 0
                },
                randomKey: null,
                idKilled: {},
                roomRound: 0
            },
            gameId: gameId
        };
        if (screen == null) {
            return resp;
        }
        if (isNewEnter && this.scene.isPlayerOverflowed()) {
            this.scene.onEnterRoomResp([this.uid], {
                overflowed: true,
                timeMachineInit: 0,
                roomRound: this.room.round,
                randomKey: 0
            })
        }
        else {
            if (!isNewEnter)
                return resp;
            this.roomMates = [];
            this.scene.EnterRoom_new(this.uid, this, screen, machineDuration);
            let uids = this.room.uids;
            let allPlayer: IUserInfo[] = [];
            uids.forEach(uid => {
                try {
                    if (uid != null) {
                        let player = this.scene.getPlayer(uid);
                        let { account: { diamond, nickname, avatar }, userEntity: { lastBetAmountButton, saveSlot } } = player;
                        allPlayer.push({
                            diamond: diamond,
                            avatar: avatar,
                            nickname: nickname,
                            multiple: lastBetAmountButton,
                            uid: uid,
                            gunPoint: player.gunPos,
                            useLaser: player.useLaser,
                            lockTargetId: player.lockTargetId,
                            slotSave: saveSlot,
                            useHook: false
                        })
                    }
                }
                catch (e) {
                    logger.error(e);
                }
            });
            //this.test();
            resp.roomResp = {
                overflowed: false,
                timeMachineInit: this.room.timeMachineInit,
                allPlayers: allPlayer,
                randomKey: this.room.randomKey,
                idKilled: this.room.idKilled,
                roomRound: this.room.round,
            };
            this.scene.onEnterRoomResp(this.roomMates, resp.roomResp);
        }
        return resp;
    }

    async enterRoom_new(screen: IVec, machineDuration: number) {
        this.updateAutoQuit();
        if (this.scene.isPlayerOverflowed()) {
            this.scene.onEnterRoomResp([this.uid], {
                overflowed: true,
                timeMachineInit: 0,
                roomRound: this.room.round,
                randomKey: 0
            })
        }
        else {
            this.scene.EnterRoom_new(this.uid, this, screen, machineDuration);
            let uids = this.room.uids;
            let allPlayer: IUserInfo[] = [];
            uids.forEach(uid => {
                try {
                    let player = this.scene.getPlayer(uid);
                    let { account: { diamond, nickname, avatar }, userEntity: { lastBetAmountButton, saveSlot } } = player;
                    allPlayer.push({
                        diamond: diamond,
                        avatar: avatar,
                        nickname: nickname,
                        multiple: lastBetAmountButton,
                        uid: uid,
                        gunPoint: player.gunPos,
                        slotSave: saveSlot,
                        useHook: player.useHook,
                        useLaser: player.useLaser,
                        lockTargetId: player.lockTargetId,
                    })
                }
                catch (e) {
                    logger.error(e.toString());
                }
            });
            //this.test();
            this.scene.onEnterRoomResp(uids, {
                overflowed: false,
                timeMachineInit: this.room.timeMachineInit,
                allPlayers: allPlayer,
                entityRandomKey: this.room.entityRandomKeyBase,
                idKilled: this.room.idKilled,
                roomRound: this.room.round,
                randomKey: 0
            })
        }
    }
    async test() {
        if (this.scene.getEnv() != "development") return;
        let amount = 10;
        let targetId = 0;
        let type = EEntityType.fish0;
        let bulletId = 0;
        let shootInfo: IShootInfo = { time: 0, targetPosOffset: { x: 120, y: 120 }, combo: 1 };

        await delay(1000);

        setInterval(() => {
            if (type > EEntityType.bossPirateKing)
                type = EEntityType.fish0;
            this.normalShoot(amount, targetId * 1000 + type, bulletId, shootInfo);
            let touchPos = { x: 200, y: 200 };
            let gunPoint = { pos: { x: 20 + targetId * 23, y: 20 }, ang: 90 };
            this.setGunPos(gunPoint, touchPos);
            targetId++;
            type++;
        }, 200);
    }

    allCoolDown: Map<ECoolDown, CoolDown> = new Map();
    CheckCoolDown(method: ECoolDown): boolean {
        if (this.allCoolDown.get(method) == null)
            this.allCoolDown.set(method, new CoolDown());
        let coolDown = this.allCoolDown.get(method)
        if (coolDown.IsCoolDown()) {
            //logger.warn(method, "冷却中", "uid", this.uid);
            return true;
        }
        if (coolDown.callCount > 100) {//调用频率很高打印警告
            logger.warn(ECoolDown[method], "每秒调用次数", coolDown.callCount * 10, "uid", this.uid);
        }
        coolDown.callCount = 0;
        return false;
    }

    async setGunPos(gunPoint: IMotionPoint, touchPos: IVec) {
        this.CheckCoolDown(ECoolDown.setGunPos)

        this.gunPos = gunPoint;
        this.scene.onGunPosUpdate(this.roomMates, { uid: this.uid, gunPoint: gunPoint, touchPos: touchPos });
    }

    async setBetAmountIndex(betAmountIndex: number) {
        this.CheckCoolDown(ECoolDown.setBetAmountIndex)

        this.userEntity.lastBetAmountButton = betAmountIndex;
        this.scene.onSetBetAmountIndexUpdate(this.roomMates, { uid: this.uid, value: betAmountIndex });
    }
    async updateSettings(config: IPlayerSettings) {
        this.userEntity.playerSettings = config;
    }
    async clickHook(use: boolean) {
        this.CheckCoolDown(ECoolDown.clickHook)
        this.useHook = use;
        this.scene.onClickHook(this.roomMates, { uid: this.uid, value: use });
    }
    async clickLaser(use: boolean) {
        this.CheckCoolDown(ECoolDown.clickLaser)
        this.useLaser = use;
        this.scene.onClickLaser(this.roomMates, { uid: this.uid, value: use });
    }

    inTest: boolean = true;

    async shootTest(testIndex: number): Promise<number> {
        let diamond = 0;
        let betAmount = 1;
        let all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19];

        return diamond;
    }
    async autoShootToTarget(targetId: number) {
        this.CheckCoolDown(ECoolDown.autoShootToTarget)
        this.lockTargetId = targetId;
        this.scene.onAutoShootToTarget(this.roomMates, { uid: this.uid, value: targetId });
    }

    async freeShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo) {

    }

    async normalShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo) {
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: bulletId,
            shootInfo: shootInfo,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            freeBulletData: this.userEntity.freeBulletData,
            oilDrumData: this.userEntity.oilDrum,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 1,
        }
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.normalShoot)) {
            return;
        }

        let roundId = await this.scene.incrTodayRoundID();
        let which = Math.floor(targetId % 1000);
        let result = this.machine.NormalShootEntity(this.userEntity.lastBetAmountButton, amount, targetId);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResult != null) {
            let wheelResult: IWheelResult = null;

            res.roundId = roundId;
            res.code = await this.betOrder(roundId, amount);
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            if (res.code == ETradeCode.success) {
                res.shootResults = [result.shootResult];
                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                    if (element.slotInfo != null) {
                        this.userEntity.saveSlot.push(element.slotInfo);
                    }
                    if (element.wheelResult != null) {
                        wheelResult = element.wheelResult;
                        //res.totalRevenue += element.wheelResult.revenue;
                    }
                    this.machine.IncrFreeBullet(this.betAmount, element.freeChance, this.userEntity.freeBulletData)
                });

                let resultSave = {};
                resultSave["t"] = result.shootResult.entity.type;
                if (result.slotGet > 0) resultSave["slot"] = result.slotGet;
                if (result.wheelResult) resultSave["wheelResult"] = result.wheelResult;
                this.runRound(roundId, amount, amount, amount, res.totalRevenue, 0, rateType, ERoundType.bullet, JSON.stringify(resultSave));

                let delayToStop = (shootInfo.time - (new Date()).getTime()) / 1000;

                if (res.totalRevenue > 0) {
                    delayToStop += EntityDelayTime[which];
                }

                this.delayStopRound(delayToStop, roundId);

                if (wheelResult != null)
                    this.runWheel(shootInfo.time, wheelResult, wheelRoundWhich + roundId);

                this.machine.IncrOil(amount, 1, this.userEntity.oilDrum);

                this.scene.increasePoolAmount(amount);
                this.save();
            }

            this.scene.onNormalShootResp([this.uid], res);
            if (res.totalRevenue > 0 || result.slotGet > 0 || wheelResult != null)
                this.scene.onNormalShootResp(this.roomMates, res);
        }
    }
    async hookShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo) {
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: bulletId,
            shootInfo: shootInfo,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            freeBulletData: this.userEntity.freeBulletData,
            oilDrumData: this.userEntity.oilDrum,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 1
        }
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.hookShoot)) {
            return;
        }

        let roundId = await this.scene.incrTodayRoundID();
        let which = Math.floor(targetId % 1000);
        let result = this.machine.HookShootEntity(this.userEntity.lastBetAmountButton, amount, targetId);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResult != null) {
            let wheelResult: IWheelResult = null;

            let amountToTrade = Game4Player.HookCombo * amount;
            let comboBack = Game4Player.HookCombo - result.realComboCount;
            res.roundId = roundId;
            res.code = await this.betOrder(roundId, amountToTrade);
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            if (res.code == ETradeCode.success) {
                res.comboHit = result.realComboCount;
                res.shootResults = [result.shootResult];

                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                    if (element.slotInfo != null) {
                        this.userEntity.saveSlot.push(element.slotInfo);
                    }
                    if (element.wheelResult != null) {
                        wheelResult = element.wheelResult;
                        //res.totalRevenue += element.wheelResult.revenue;
                    }
                    this.machine.IncrFreeBullet(this.betAmount, element.freeChance, this.userEntity.freeBulletData)
                });

                let resultSave = {};
                resultSave["t"] = result.shootResult.entity.type;
                resultSave["realComboCount"] = result.realComboCount;
                if (result.slotGet > 0) resultSave["slot"] = result.slotGet;
                if (result.wheelResult) resultSave["wheelResult"] = result.wheelResult;
                this.runRound(roundId, amount, amount, amountToTrade, res.totalRevenue, comboBack, rateType, ERoundType.hook, JSON.stringify(resultSave));
                let delayToStop = (shootInfo.time - (new Date()).getTime()) / 1000;
                if (res.totalRevenue > 0) {
                    delayToStop += EntityDelayTime[which];
                }
                this.delayStopRound(delayToStop, roundId);

                if (wheelResult != null)
                    this.runWheel(shootInfo.time, wheelResult, wheelRoundWhich + roundId);

                this.machine.IncrOil(amount, result.realComboCount, this.userEntity.oilDrum);
                this.scene.increasePoolAmount(amountToTrade);
                this.save();
            }

            this.scene.onHookShootResp([this.uid], res);
            if (res.totalRevenue > 0 || result.slotGet > 0 || wheelResult != null)
                this.scene.onHookShootResp(this.roomMates, res);
        }
    }
    async laserShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo) {
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: bulletId,
            shootInfo: shootInfo,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            freeBulletData: this.userEntity.freeBulletData,
            oilDrumData: this.userEntity.oilDrum,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 0
        }
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.laserShoot)) {
            return;
        }

        let LaserComboCount = Math.random() < Game4Player.LaserComboPro ? Game4Player.LaserComboCount[WeightToIndex(Game4Player.LaserComboWeight)] : 1;
        if (LaserComboCount * amount > this.accountDiamond()) LaserComboCount = 1;
        if (shootInfo.combo != null) LaserComboCount = shootInfo.combo;

        let roundId = await this.scene.incrTodayRoundID();
        let which = Math.floor(targetId % 1000);
        let result = this.machine.LaserShootEntity(this.userEntity.lastBetAmountButton, amount, targetId, LaserComboCount);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResults.length > 0) {
            let wheelResult: IWheelResult = null;

            let amountToTrade = LaserComboCount * amount;
            let comboBack = LaserComboCount - result.realComboCount;

            res.roundId = roundId;
            res.code = await this.betOrder(roundId, amountToTrade);
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            if (res.code == ETradeCode.success) {
                res.comboHit = result.realComboCount;
                res.shootResults = result.shootResults;

                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                    if (element.slotInfo != null) {
                        this.userEntity.saveSlot.push(element.slotInfo);
                    }
                    if (element.wheelResult != null) {
                        wheelResult = element.wheelResult;
                        //res.totalRevenue += element.wheelResult.revenue;
                    }
                    this.machine.IncrFreeBullet(this.betAmount, element.freeChance, this.userEntity.freeBulletData)
                });

                let resultSave = {};
                let target: EEntityType[] = [];
                result.shootResults.forEach(shootResult => {
                    target.push(shootResult.entity.type);
                });
                resultSave["t"] = target;
                resultSave["realComboCount"] = result.realComboCount;
                if (result.slotGet) resultSave["slot"] = result.slotGet;
                if (result.wheelResult) resultSave["wheelResult"] = result.wheelResult;
                this.runRound(roundId, amount, amount, amountToTrade, res.totalRevenue, comboBack, rateType, ERoundType.laser, JSON.stringify(resultSave));
                let delayToStop = (shootInfo.time - (new Date()).getTime()) / 1000;
                if (res.totalRevenue > 0) {
                    delayToStop += EntityDelayTime[which];
                }
                this.delayStopRound(delayToStop, roundId);

                if (wheelResult != null)
                    this.runWheel(shootInfo.time, wheelResult, wheelRoundWhich + roundId);

                this.machine.IncrOil(amount, result.realComboCount, this.userEntity.oilDrum);
                this.scene.increasePoolAmount(amountToTrade);
                this.save();
            }

            this.scene.onLaserShootResp([this.uid], res);
            if (res.totalRevenue > 0 || result.slotGet > 0 || result.realComboCount > 1 || wheelResult != null)
                this.scene.onLaserShootResp(this.roomMates, res);
        }
    }
    async knifeFishAttack(knifeFishId: number, fishIdArray: number[]) {

    }
    async propUse(amount: number, fishIdArray: number[], propId: number, shootInfo: IShootInfo, propType: EPropType) {
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: propId,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            freeBulletData: this.userEntity.freeBulletData,
            oilDrumData: this.userEntity.oilDrum,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 1
        }
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.propUse)) {
            return;
        }

        let roundId = await this.scene.incrTodayRoundID();

        let result = this.machine.OilDrumShootEntity(this.userEntity.lastBetAmountButton, amount, fishIdArray);
        let rateType = this.machine.getLastRoundRateType();
        if (result.shootResults.length > 0) {
            res.roundId = roundId;
            res.code = this.machine.TryUseOilDrum(amount, this.userEntity.oilDrum);
            if (res.code == ETradeCode.success) {
                res.shootResults = result.shootResults;
                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                    if (element.slotInfo != null) {
                        this.userEntity.saveSlot.push(element.slotInfo);
                    }
                    this.machine.IncrFreeBullet(this.betAmount, element.freeChance, this.userEntity.freeBulletData)
                });

                this.runRound(roundId, amount, amount, 0, res.totalRevenue, 0, rateType, ERoundType.drum, JSON.stringify(result));
                let delayToStop = (shootInfo.time - (new Date()).getTime()) / 1000;
                if (res.totalRevenue > 0) {
                    delayToStop += 3;
                }
                this.delayStopRound(delayToStop, roundId);
                this.save();
            }
            this.scene.onPropUseResp(this.room.uids, res);
        }
    }

    async mergeShoot(amount: number, betAmountIndex: number, weaponType: EWeaponType, mergeData: IShootData[]) {
        let res: IMergeShootResp = {
            shootResps: { [weaponType]: [] }
        }
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.mergeShoot)) {
            return;
        }
        let which = 0;
        let totalBet = 0;
        let normalShootResult: INormalShootResult;
        let hookShootResult: IHookShootResult;
        let laserShootResult: ILaserShootResult;
        let mergeShootResult: IShootResultEx[] = [];
        let comboBack = 0;
        let delayToStop = 0;
        let roundType: ERoundType;
        for (let i = 0; i < mergeData.length; i++) {
            let shoot = mergeData[i];
            which = Math.floor(shoot.targetId[0] % 1000);
            let comboHit = 1;
            let shootResults: IShootResult[] = [];
            let totalRevenue = 0;
            if (weaponType == EWeaponType.normal) {
                roundType = ERoundType.bullet;
                normalShootResult = this.machine.NormalShootEntity(betAmountIndex, amount, shoot.targetId[0]);
                if (normalShootResult.shootResult != null) {
                    totalBet += amount;
                    shootResults = [normalShootResult.shootResult];
                    mergeShootResult.push(normalShootResult);
                }
            }
            if (weaponType == EWeaponType.hook) {
                roundType = ERoundType.hook;
                hookShootResult = this.machine.HookShootEntity(betAmountIndex, amount, shoot.targetId[0]);
                if (hookShootResult.shootResult != null) {
                    let amountToTrade = Game4Player.HookCombo * amount
                    comboBack += Game4Player.HookCombo - hookShootResult.realComboCount;
                    totalBet += amountToTrade;
                    comboHit = hookShootResult.realComboCount;
                    shootResults = [hookShootResult.shootResult];
                    mergeShootResult.push(hookShootResult);
                }
            }
            if (weaponType == EWeaponType.laser) {
                roundType = ERoundType.laser;
                let LaserComboCount = Math.random() < Game4Player.LaserComboPro ? Game4Player.LaserComboCount[WeightToIndex(Game4Player.LaserComboWeight)] : 1;
                if (LaserComboCount * amount > this.accountDiamond()) LaserComboCount = 1;
                if (shoot.shootInfo.combo != null) LaserComboCount = shoot.shootInfo.combo;

                laserShootResult = this.machine.LaserShootEntity(betAmountIndex, amount, shoot.targetId[0], LaserComboCount);
                if (laserShootResult.shootResults.length > 0) {
                    let amountToTrade = amount * LaserComboCount;
                    comboBack = LaserComboCount - laserShootResult.realComboCount
                    totalBet += amountToTrade;
                    comboHit = laserShootResult.realComboCount;
                    shootResults = laserShootResult.shootResults;
                    mergeShootResult.push(laserShootResult);
                }
            }
            if (shootResults.length > 0) {
                shootResults.forEach(element => {
                    totalRevenue += element.revenue;
                    this.machine.IncrFreeBullet(this.betAmount, element.freeChance, this.userEntity.freeBulletData)
                });
                if (totalRevenue > 0) {
                    let delayToStop2 = (shoot.shootInfo.time - new Date().getTime()) / 1000;
                    delayToStop2 += EntityDelayTime[which] + 0.5;
                    if (delayToStop < delayToStop2) {
                        delayToStop = delayToStop2;
                    }
                }
                let resp: IShootResp = {
                    code: ETradeCode.unknow,
                    uid: this.uid,
                    bulletId: shoot.bulletId,
                    shootInfo: shoot.shootInfo,
                    shootResults: shootResults,
                    totalRevenue: totalRevenue,
                    roundId: 0,
                    freeBulletData: this.userEntity.freeBulletData,
                    oilDrumData: this.userEntity.oilDrum,
                    ingoreInsId: false,
                    betAmount: amount,
                    comboHit: comboHit
                }
                res.shootResps[weaponType].push(resp);
            }
        }
        if (Object.keys(res.shootResps).length > 0) {
            let wheelResult: IWheelResult = null;
            let wheelTime = 0;
            let totalRevenue = 0;
            let slotGet = 0;
            let laserCritical = false;
            let roundId = await this.scene.incrTodayRoundID();
            let code = await this.betOrder(roundId, totalBet);
            let rateType = this.machine.getLastRoundRateType();
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            for (let k in res.shootResps) {
                for (let resp of res.shootResps[k]) {
                    resp.roundId = roundId;
                    resp.code = code;
                    if (weaponType == EWeaponType.laser && resp.comboHit > 1) {
                        laserCritical = true
                    }
                }
            }
            if (code == ETradeCode.success) {
                for (let k in res.shootResps) {
                    for (let resp of res.shootResps[k]) {
                        totalRevenue += resp.totalRevenue;
                        for (let shootResult of resp.shootResults) {
                            if (shootResult.wheelResult != null) {
                                wheelResult = shootResult.wheelResult;
                                wheelTime = resp.shootInfo.time;
                            }
                            if (shootResult.slotInfo != null) {
                                slotGet++;
                                this.userEntity.saveSlot.push(shootResult.slotInfo);
                            }
                        }
                        this.machine.IncrOil(resp.betAmount, resp.comboHit, this.userEntity.oilDrum);
                    }
                }
                this.scene.increasePoolAmount(totalBet);
                this.save();

                let resultSave: IResultSave = { m: mergeShootResult.length };

                let result_t: EEntityType[] = [];
                let result_revenue: number[] = [];
                let result_slotGet: number[] = [];
                let result_combo: number[] = [];
                mergeShootResult.forEach(result => {
                    let result_t_item: EEntityType = null;
                    let result_revenue_item: number = 0;
                    let result_slotGet_item: number = 0;
                    let result_combo_item: number = 0;

                    if (result.shootResult) {
                        result_t_item = result.shootResult.entity.type;
                        result_revenue_item = result.shootResult.revenue;
                    } else if (result.shootResults?.length > 0) {
                        result_t_item = result.shootResults[0].entity.type;
                        result_revenue_item = 0;
                        result.shootResults.forEach(shootResult => {
                            if (shootResult.revenue) result_revenue_item += shootResult.revenue;
                        });
                    };
                    result_slotGet_item = result.slotGet;
                    result_combo_item = result.realComboCount;
                    if (!result_t.includes(result_t_item)) result_t.push(result_t_item);
                    if (result_revenue_item > 0) result_revenue.push(result_revenue_item);
                    if (result_slotGet_item > 0) result_slotGet.push(result_slotGet_item);
                    if (result_combo_item > 0) result_combo.push(result_combo_item);
                    if (result.wheelResult) resultSave.jp = result.wheelResult;
                });
                if (result_t.length > 0) resultSave.t = result_t;
                if (result_revenue.length > 0) resultSave.t = result_t;
                if (arraySum(result_revenue) > 0) resultSave.revenue = result_revenue;
                if (arraySum(result_slotGet) > 0) resultSave.slotGet = result_slotGet;
                if (result_combo.length > 0) resultSave.c = result_combo;

                this.runRound(roundId, amount, amount, totalBet, totalRevenue, comboBack, rateType, roundType, JSON.stringify(resultSave));
                //sconsole.log(JSON.stringify(resultSave));
                this.delayStopRound(delayToStop, roundId);

                if (wheelResult != null)
                    this.runWheel(wheelTime, wheelResult, wheelRoundWhich + roundId);
            }
            this.scene.onMergeShootResp([this.uid], res);
            if (totalRevenue > 0 || slotGet > 0 || laserCritical || wheelResult != null)
                this.scene.onMergeShootResp(this.roomMates, res);
        }
    }

    async runSlot(time: number, stackCount: number) {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.runSlot)) {
            return;
        }

        let slotInfo = this.userEntity.saveSlot.shift();
        this.save();

        if (slotInfo != null) {
            let roundId = await this.scene.incrTodayRoundID();
            let slotResult = this.machine.GetSlotResult(slotInfo);
            let rateType = this.machine.getLastRoundRateType();
            slotResult.uid = this.uid;
            slotResult.stackCount = stackCount;

            let resultSave = {};
            resultSave["t"] = slotResult.slotType;
            resultSave["b"] = slotResult.betAmount;
            resultSave["s"] = slotResult.slot;
            this.runRound(roundId, slotInfo.betAmount, slotInfo.betAmount, 0, slotResult.revenue, 0, rateType, ERoundType.slot, JSON.stringify(resultSave));
            let delayToStop = (time - (new Date()).getTime()) / 1000;
            delayToStop += EntityDelayTime[slotInfo.slotType];
            this.delayStopRound(delayToStop, roundId);

            this.scene.onSlotResult(this.room.uids, slotResult);
        }
        else {
            logger.warn("no slot");
        }
    }

    async runWheel(time: number, wheelResult: IWheelResult, which: number) {
        //return;

        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.runWheel)) {
            return;
        }

        let delayToStop = (time - (new Date()).getTime()) / 1000;
        delayToStop += jackpotDelayTime;
        await delay(delayToStop * 1000);

        let roundId = await this.scene.incrTodayRoundID();
        let revenue = Math.floor(this.scene.jackpotAmountPool.getPoolAmount(wheelResult.betAmountIndex - 1) * wheelResult.rewardMulti);
        this.runRound(
            roundId,
            wheelResult.betAmount,
            which,
            0,
            revenue,
            0,
            ERateType.normal,
            ERoundType.wheel,
            JSON.stringify({ jpPool: this.scene.jackpotAmountPool.getAllPool(), wheelResult })
        );
        this.stopRound(roundId);
        this.scene.onJackpotResp([this.uid], {
            uid: this.uid,
            value: revenue,
            betAmountIndex: wheelResult.betAmountIndex,
            jackpotAmountPool: this.scene.jackpotAmountPool.getAllPool()
        });
        this.scene.onJackpotResp(this.roomMates, {
            uid: this.uid,
            value: revenue,
            betAmountIndex: wheelResult.betAmountIndex,
            jackpotAmountPool: this.scene.jackpotAmountPool.getAllPool()
        });
        this.scene.decreasePoolAmount(revenue);
        this.scene.onJackpotChanged();
        this.scene.totalHints.push({
            uid: this.uid,
            userName: this.account.nickname,
            avatar: this.account.avatar,
            amount: revenue
        })
    }

    // {{ 记账，每个游戏不同。
    // runRound 里面的内容如果不理解，可以不填。但先尝试尽量去理解。
    private runRound(roundId: number, amountButton: number, which: EEntityType, amount: number, revenue: number, comboBack: number, rateType: ERateType, roundType: ERoundType, result: string) {
        let comboBackAmount: number = amountButton * comboBack;
        let runningRound: IRoundResult = { revenue, comboBackAmount };
        this.startRound(roundId, runningRound);

        let now = new Date;
        let round = new PirateFishingMulti_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid;
        round.which = which;
        round.rate_type = rateType;
        round.round_type = roundType;
        round.result = result;
        round.slot_count = this.userEntity.saveSlot.length;
        round.bet = amount + comboBackAmount;
        round.revenue = revenue + comboBackAmount;
        round.save_time = now;
        this.scene.mysql.insertRound(round);

        this.incrBetCount(amountButton, round.bet, round.revenue);
    }
    // }}

    async stopRound(roundId: number) {
        this.settleResult(roundId);
        return ETradeCode.success;
    }

    async delayStopRound(sec: number, roundId: number) {
        await delay(Math.max(0, sec) * 1000);
        this.stopRound(roundId);
    }
}
