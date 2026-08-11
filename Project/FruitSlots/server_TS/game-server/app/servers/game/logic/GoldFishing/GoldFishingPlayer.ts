import { getLogger } from "pinus";
import { ETradeCode, IPlayerSettings, arraySum } from "../../interface/IGame";
import IGamePlayer from "../GamePlayer";
import { ERateType } from "../../database/entity/SDKEntity";
import { IEnterGameResp, IPlayer, IShootResp, IVec, IUserInfo, IShootInfo, EPropType, IMotionPoint, EEntityType, EWeaponType, IShootData, IMergeShootResp, IShootResult } from "../../interface/IGoldFishing";
import { gConst } from "../../interface/IGoldFishing";
import { ERoundType, GoldFishing_round } from "../../database/entity/GoldFishingEntity";
import { Game4Player, GoldFishingMachine, ILaserShootResult, INormalShootResult } from "./GoldFishingMachine";
import GoldFishingScene from "./GoldFishingScene";
import { delay } from "bluebird";
import { EntityDelayTime, propTypeToRoundType } from "./GoldFishingConfig";
import { GoldFishingRoom } from "./GoldFishingRoom";
import { ShiftEntity, PlayerShiftBase } from "../GameBase/ShiftGame/PlayerShiftBase";
let logger = getLogger(gConst.gameName, __filename);

interface IShootResultEx {
    shootResult?: IShootResult,
}

interface IResultSave {
    m: number;
    t?: EEntityType[];
    c?: number[];
    revenue?: number[];
    slotGet?: number[];
    freeBullet?: number[],
}

export enum ECoolDown {
    setGunPos,
    setBetAmountIndex,
    clickHook,
    clickLaser,
    autoShootToTarget,
    normalShoot,
    hookShoot,
    laserShoot,
    mergeShoot,
    skill_drill,
    skill_laser,
    skill_bomb,
    skill_blackhole,
    skill_thunder,
    boss_401,
    boss_402,
    boss_403,
}

let propTypeToCoolDown = {
    [EPropType.skill_drill]: ECoolDown.skill_drill,
    [EPropType.skill_laser]: ECoolDown.skill_laser,
    [EPropType.skill_bomb]: ECoolDown.skill_bomb,
    [EPropType.skill_blackhole]: ECoolDown.skill_blackhole,
    [EPropType.skill_thunder]: ECoolDown.skill_thunder,
    [EPropType.boss_401]: ECoolDown.boss_401,
    [EPropType.boss_402]: ECoolDown.boss_402,
    [EPropType.boss_403]: ECoolDown.boss_403,
}

export class CoolDown {
    cd: boolean = false;
    ms = 100;
    callCount: number = 0;
    IsCoolDown(): boolean {
        this.callCount++;
        if (this.cd) {
            return this.cd;
        }
        this.cd = true;
        setTimeout(() => {
            this.cd = false;
        }, this.ms);
        return false;
    }
}

type IRoundResult = number;

// 要填默认值
class DataEntity extends ShiftEntity<IRoundResult> {
    myHistory: any[] = [];
    lastBetAmountButton: number = 0;
}

export class GoldFishingPlayer
    extends PlayerShiftBase<DataEntity, IRoundResult>
    implements IPlayer, IGamePlayer {
    userEntity: DataEntity;
    /**当前展示的金额 */
    isReset: boolean = false;
    machine: GoldFishingMachine;
    room: GoldFishingRoom;
    freeChance: number = 0;
    roomMates: string[] = [];
    useLaser: boolean;
    lockTargetId: number = -1;
    gunPos: IMotionPoint;

    constructor(protected scene: GoldFishingScene) {
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
        let account = await this.queryUserAccount();
        if (account) this.account = account;
        if (!this.userEntity) await this.initPlayer();
        if (this.room == null)
            return null;
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
            if (uids.indexOf(uid) > -1)
                uids[uids.indexOf(uid)] = null;
            else {
                console.error(`${uid}要退出房间，发现自己不在房间中`)
            }
            for (let i = 0; i < uids.length; i++) {
                let otherUid = uids[i];
                if (otherUid != null) {
                    let roomMates = this.scene.getPlayer(otherUid)?.roomMates;
                    if (roomMates != null) {
                        if (roomMates.indexOf(uid) > -1)
                            roomMates.splice(roomMates.indexOf(uid), 1);
                    }
                    else {
                        logger.error(`把${uid}移出房间, 发现uids[${i}]=${otherUid}不在playerList中`);
                    }
                }
            }
            this.scene.onLeaveRoomResp(uids, uid);
            if (uids.findIndex(uid => uid != null) < 0) {
                roomList.splice(roomList.indexOf(room), 1);
            }
        }
    }

    async settleResult(roundId: number) {
        let revenue = this.endRound(roundId);
        if (!revenue)
            return;

        await this.winOrder(roundId, revenue);
        if (this.room?.uids != null)
            this.scene.onAccountDiamondUpdate(this.room.uids, { uid: this.uid, value: this.Diamond, offset: revenue });
    }
    // }}

    getClientResp(screen: IVec, machineDuration: number, isNewEnter: boolean): IEnterGameResp {
        let resp: IEnterGameResp = {
            account: this.account,
            betAmountIndex: this.userEntity.lastBetAmountButton,
            playerSettings: this.userEntity.playerSettings,
            timeEnterGame: new Date().getTime(),
            roomResp: {
                overflowed: true,
                timeMachineInit: 0,
                randomKey: undefined,
                idKilled: {},
                roomRound: -1,
            }
        };
        if (this.scene.isPlayerOverflowed()) {

        }
        else {
            if (!isNewEnter)
                return resp;
            this.roomMates = [];
            this.scene.EnterRoom(this.uid, this, screen, machineDuration);
            let uids = this.room.uids;
            let allPlayer: IUserInfo[] = [];
            uids.forEach(uid => {
                try {
                    if (uid != null) {
                        let player = this.scene.getPlayer(uid);
                        let { account: { diamond, nickname, avatar }, userEntity: { lastBetAmountButton, } } = player;
                        allPlayer.push({
                            diamond: diamond,
                            avatar: avatar,
                            nickname: nickname,
                            multiple: lastBetAmountButton,
                            uid: uid,
                            gunPoint: player.gunPos,
                            useLaser: player.useLaser,
                            lockTargetId: player.lockTargetId,
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

    override onAutoQuit(): void {
        this.room.playerBlackList.push(this.uid);
    }
    // async test() {
    //     if (this.scene.getEnv() != "development") return;
    //     let amount = 10;
    //     let targetId = 0;
    //     let type = EEntityType.fish101;
    //     let bulletId = 0;
    //     let shootInfo: IShootInfo = { time: 0, fromRound: null };

    //     await delay(1000);

    //     setInterval(() => {
    //         if (type > EEntityType.fish506)
    //             type = EEntityType.fish101;
    //         this.normalShoot(amount, targetId * 1000 + type, bulletId, shootInfo);
    //         let touchPos = { x: 200, y: 200 };
    //         let gunPoint = { pos: { x: 20 + targetId * 23, y: 20 }, ang: 90 };
    //         this.setGunPos(gunPoint, touchPos);
    //         targetId++;
    //         type++;
    //     }, 200);
    // }

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
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.normalShoot)) {
            return;
        }
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: bulletId,
            shootInfo: shootInfo,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 1,
        }

        let which = Math.floor(targetId % 1000);
        let result = this.machine.NormalShootEntity(amount, targetId);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResult != null) {

            let roundId = await this.scene.incrTodayRoundID();
            res.roundId = roundId;
            res.code = await this.betOrder(roundId, amount);
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            if (res.code == ETradeCode.success) {
                res.shootResults = [result.shootResult];
                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                });

                let resultSave = {};
                resultSave["t"] = result.shootResult.entity.type;
                if (result.shootResult.freeBullet > 0)
                    resultSave["freeBullet"] = result.shootResult.freeBullet;
                this.runRound(roundId, null, amount, which, amount, res.totalRevenue, rateType, ERoundType.bullet, JSON.stringify(resultSave));

                let delayToStop = (shootInfo.time - new Date().getTime()) / 1000;

                if (res.totalRevenue > 0) {
                    this.machine.TrySetSkill(amount, roundId, which, res.shootResults[0].freeBullet);
                    if (which == EEntityType.fish501)
                        res.specailFishKey = Math.random();
                    delayToStop += EntityDelayTime[which];
                }

                this.delayStopRound(delayToStop, roundId);
            }

            this.scene.onNormalShootResp([this.uid], res);
            if (res.totalRevenue > 0)
                this.scene.onNormalShootResp(this.roomMates, res);
        }
    }
    async laserShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo) {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        if (this.CheckCoolDown(ECoolDown.laserShoot)) {
            return;
        }
        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: bulletId,
            shootInfo: shootInfo,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            ingoreInsId: false,
            betAmount: amount,
            comboHit: 1,
        }

        let which = Math.floor(targetId % 1000);
        let result = this.machine.LaserShootEntity(amount, targetId);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResult != null) {

            let roundId = await this.scene.incrTodayRoundID();
            res.roundId = roundId;
            res.code = await this.betOrder(roundId, amount);
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            if (res.code == ETradeCode.success) {
                res.shootResults = [result.shootResult];
                res.shootResults.forEach(element => {
                    res.totalRevenue += element.revenue;
                });

                let resultSave = {};
                resultSave["t"] = result.shootResult.entity.type;
                if (result.shootResult.freeBullet > 0)
                    resultSave["freeBullet"] = result.shootResult.freeBullet;
                this.runRound(roundId, null, amount, which, amount, res.totalRevenue, rateType, ERoundType.laser, JSON.stringify(resultSave));

                let delayToStop = (shootInfo.time - new Date().getTime()) / 1000;

                if (res.totalRevenue > 0) {
                    this.machine.TrySetSkill(amount, roundId, which, res.shootResults[0].freeBullet);
                    if (which == EEntityType.fish501)
                        res.specailFishKey = Math.random();
                    delayToStop += EntityDelayTime[which];
                }

                this.delayStopRound(delayToStop, roundId);
            }

            this.scene.onLaserShootResp([this.uid], res);
            if (res.totalRevenue > 0)
                this.scene.onLaserShootResp(this.roomMates, res);
        }
    }
    async skillAttack(fishIdArray: number[], propId: number, shootInfo: IShootInfo) {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return;
        }
        let propType = shootInfo.propType;
        if (propType == null) {
            return;
        }
        if (this.CheckCoolDown(propTypeToCoolDown[propType])) {
            return;
        }
        if (this.machine.fishSkillInfo[propType][shootInfo.fromRound] == null)
            return;

        let betAmount = this.machine.fishSkillInfo[propType][shootInfo.fromRound].betAmount

        let endTime = this.machine.fishSkillInfo[propType][shootInfo.fromRound].endTime

        //let curTime = Date.now();

        let res: IShootResp = {
            code: ETradeCode.unknow,
            uid: this.uid,
            bulletId: propId,
            shootInfo: shootInfo,
            propType: propType,
            shootResults: [],
            totalRevenue: 0,
            roundId: 0,
            ingoreInsId: false,
            betAmount: betAmount,
            comboHit: 1
        }

        let result = this.machine.FishSkillAttackEntity(propType, shootInfo.fromRound, fishIdArray);
        let rateType = this.machine.getLastRoundRateType();

        if (result.shootResults.length > 0) {
            res.code = ETradeCode.success;
            let roundId = await this.scene.incrTodayRoundID();
            res.roundId = roundId;
            res.shootResults = result.shootResults;
            res.shootResults.forEach(element => {
                res.totalRevenue += element.revenue;
            });

            let resultSave = {};
            let target: EEntityType[] = [];
            result.shootResults.forEach(shootResult => {
                target.push(shootResult.entity.type);
            });
            resultSave["t"] = target
            this.runRound(roundId, shootInfo.fromRound, betAmount, null, 0, res.totalRevenue, rateType, propTypeToRoundType[propType], JSON.stringify(resultSave));
            let delayToStop = 0
            if (res.totalRevenue > 0) {
                delayToStop += 3 + (endTime - shootInfo.time) / 1000;
            }
            this.delayStopRound(delayToStop, roundId);
            this.scene.onFishSkillAttack(this.room.uids, res);
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
        let laserShootResult: ILaserShootResult;
        let mergeShootResult: IShootResultEx[] = [];
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
                normalShootResult = this.machine.NormalShootEntity(amount, shoot.targetId[0]);
                if (normalShootResult.shootResult != null) {
                    totalBet += amount;
                    shootResults = [normalShootResult.shootResult];
                    mergeShootResult.push(normalShootResult);
                }
            }
            if (weaponType == EWeaponType.laser) {
                roundType = ERoundType.laser;
                laserShootResult = this.machine.LaserShootEntity(amount, shoot.targetId[0]);
                if (laserShootResult.shootResult != null) {
                    totalBet += amount;
                    shootResults = [laserShootResult.shootResult];
                    mergeShootResult.push(laserShootResult);
                }
            }
            if (shootResults.length > 0) {
                shootResults.forEach(element => {
                    totalRevenue += element.revenue;
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
                    ingoreInsId: false,
                    betAmount: amount,
                    comboHit: comboHit
                }
                res.shootResps[weaponType].push(resp);
            }
        }
        if (Object.keys(res.shootResps).length > 0) {
            let totalRevenue = 0;
            let roundId = await this.scene.incrTodayRoundID();
            let code = await this.betOrder(roundId, totalBet);
            let rateType = this.machine.getLastRoundRateType();
            this.scene.onAccountDiamondUpdate([this.uid], { uid: this.uid, value: this.Diamond });
            for (let k in res.shootResps) {
                for (let resp of res.shootResps[k]) {
                    resp.roundId = roundId;
                    resp.code = code;
                }
            }
            if (code == ETradeCode.success) {
                for (let k in res.shootResps) {
                    for (let resp of res.shootResps[k]) {
                        if (resp.totalRevenue > 0) {
                            totalRevenue += resp.totalRevenue;
                            this.machine.TrySetSkill(amount, roundId, resp.shootResults[0].entity.type, resp.shootResults[0].freeBullet);
                            if (resp.shootResults[0].entity.type == EEntityType.fish501)
                                resp.specailFishKey = Math.random();
                        }
                    }
                }
                this.save();

                let resultSave: IResultSave = { m: mergeShootResult.length };

                let result_t: EEntityType[] = [];
                let result_revenue: number[] = [];
                let result_slotGet: number[] = [];
                let result_freeBullet: number[] = [];
                let result_combo: number[] = [];
                mergeShootResult.forEach(result => {
                    let result_t_item: EEntityType = null;
                    let result_revenue_item: number = 0;
                    let result_freeBullet_item: number = 0;

                    if (result.shootResult) {
                        result_t_item = result.shootResult.entity.type;
                        result_revenue_item = result.shootResult.revenue;
                        result_freeBullet_item = result.shootResult.freeBullet;
                    }
                    if (!result_t.includes(result_t_item)) result_t.push(result_t_item);
                    if (result_revenue_item > 0) result_revenue.push(result_revenue_item);
                    if (result_freeBullet_item > 0 && result_revenue_item > 0) result_freeBullet.push(result_freeBullet_item);
                });
                if (result_t.length > 0) resultSave.t = result_t;
                if (result_revenue.length > 0) resultSave.t = result_t;
                if (arraySum(result_revenue) > 0) resultSave.revenue = result_revenue;
                if (arraySum(result_slotGet) > 0) resultSave.slotGet = result_slotGet;
                if (arraySum(result_freeBullet) > 0) resultSave.freeBullet = result_freeBullet;
                if (result_combo.length > 0) resultSave.c = result_combo;

                this.runRound(roundId, null, amount, amount, totalBet, totalRevenue, rateType, roundType, JSON.stringify(resultSave));
                //console.log(JSON.stringify(resultSave));
                this.delayStopRound(delayToStop, roundId);
            }
            this.scene.onMergeShootResp([this.uid], res);
            if (totalRevenue > 0)
                this.scene.onMergeShootResp(this.roomMates, res);
        }
    }


    // {{ 记账，每个游戏不同。
    // runRound 里面的内容如果不理解，可以不填。但先尝试尽量去理解。
    private runRound(roundId: number, fromRound: number, amountButton: number, which: EEntityType, amount: number, revenue: number, rateType: ERateType, roundType: ERoundType, result: string) {
        this.startRound(roundId, revenue);

        let now = new Date;
        let round = new GoldFishing_round;
        round.day = now;
        round.round = roundId;
        round.uid = this.uid;
        round.which = which;
        round.rate_type = rateType;
        round.round_type = roundType;
        round.result = result;
        round.bet = amount;
        round.revenue = revenue;
        round.save_time = now;
        round.fromRound = fromRound
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
