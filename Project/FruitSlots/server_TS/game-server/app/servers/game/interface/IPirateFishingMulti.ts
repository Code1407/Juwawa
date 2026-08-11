import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";
export const gConst = {
    gameName: "PirateFishingMulti"
}
export enum EEntityType {
    fish0,
    fish1,
    fish2,
    fish3,
    fish4,
    fish5,
    fish6,
    fish7,
    fish8,
    fish9,
    fish10,
    turtle,
    monkey,
    bulletCrab,
    KnifeFish,
    slotCrab0,
    slotCrab1,
    slotCrab2,
    bossGhostShip,
    bossPirateKing,
    bossTiger,
}
export enum EAwardType {
    OilDrum = `OilDrum`,//油桶
    Wheel = `Wheel`,//彩金
}
export enum EWeaponType {
    normal,
    hook,
    laser,
    oilDrum,
}
export enum EPropType {
    oilDrum,//油桶
    nuclearBomb,//核弹
}
export enum EMotionPathType {
    point,
    liner,
    curve,
    bezier,
}
export interface IVec {
    x?: number;
    y?: number;
}

export const VecZero = { x: 0, y: 0 };
export const VecOne = { x: 1, y: 1 };
export const VecUp = { x: 0, y: 1 };
export const VecRight = { x: 1, y: 0 };

export function VecAdd(v1: IVec, v2: IVec): IVec {
    return { x: v1.x + v2.x, y: v1.y + v2.y }
}
export function VecSub(v1: IVec, v2: IVec): IVec {
    return { x: v1.x - v2.x, y: v1.y - v2.y }
}
export function VecMul(v1: IVec, n: number): IVec {
    return { x: v1.x * n, y: v1.y * n }
}
export function VecDiv(v1: IVec, n: number): IVec {
    return { x: v1.x / n, y: v1.y / n }
}
export function VecGetLen(vec: IVec): number {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}
export function VecSetLen(vec: IVec, len: number): IVec {
    let curLen = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return { x: vec.x * (len / curLen), y: vec.y * (len / curLen) };
}
export function AngToDir(ang: number): IVec {
    return { x: Math.cos(ang / 180 * Math.PI), y: Math.sin(ang / 180 * Math.PI) };
}
export function DirToAng(dir: IVec): number {
    return Math.atan2(dir.y, dir.x) * 180 / Math.PI;
}
export interface IMotionPoint {
    pos?: IVec;
    ang?: number;
    scale?: IVec;
    callback?: (() => void)[];
}
export interface IMotionPath {
    pathType: EMotionPathType;
    duration: number;
    points: IMotionPoint[];
}
export interface IUserInfo {
    diamond: number;
    avatar: string;
    nickname: string;
    multiple: number;
    uid: string;
    gunPoint: IMotionPoint;
    slotSave: ISlotInfo[];
    useHook: boolean;
    useLaser: boolean;
    lockTargetId: number;
}
export interface IEnterGameResp {
    account: IAccount;
    betAmountIndex: number;
    playerSettings: IPlayerSettings;
    freeBulletData: IFreeBulletData;
    oilDrumData: IOilDrumData;
    timeEnterGame: number;
    roomResp: IRoomResp;
    gameId: any;
}
export interface IRoundStep {
    gameStatus: EGameStatus;
    jackpotPool: IJackpotAmountPool;
    serverTime: number;
}
export interface IFreeBulletData {
    [betAmount: number]: number
}
export interface IOilDrumData {
    [betAmount: number]: {
        oilMaxFill: number;
        oilCurFill: number;
        drumCount: number;
    }
}
export interface IEntityInfo {
    type: EEntityType;//实体类型
    InsId?: number;//实例id
    timeBorn?: number;//出现时间
    status?: number;//阶段或状态或形态
    //path?: IMotionPath;
}
export interface IEntityKilledInfo {
    betAmount: number;//击杀这条鱼所使用的档位
    entity: IEntityInfo;
}
export interface IEntityRandomKey {
    typeKey: number;//实体类型计算
    pathKey: number;//移动路径计算
}
export interface IShootInfo {
    time: number;//时间戳
    targetPosOffset: IVec;//瞄准点的偏移量
    combo: number;
}
export interface IShootData {
    targetId: number[],
    bulletId: number,
    shootInfo: IShootInfo
}
export interface IShootResp {
    code: ETradeCode;
    uid: string;
    betAmount: number;
    roundId: number;
    //roundIdResultId: string;
    bulletId: number;
    shootInfo?: IShootInfo;
    shootResults: IShootResult[];
    comboHit: number;
    totalRevenue: number;
    freeBulletData: IFreeBulletData;
    oilDrumData: IOilDrumData;
    ingoreInsId: boolean;
}
export interface IMergeShootResp {
    shootResps: { [weapon: number]: IShootResp[] }
}
export interface ISlotInfo {
    betAmount: number;
    slotType: EEntityType;
}
export interface ISlotResult {
    uid: string;
    slotType: EEntityType;
    betAmount: number;
    rewardMulti: number;
    revenue: number;
    slot: number[];
    stackCount: number;
}
export interface IWheelResult {
    wheelType: EEntityType;
    betAmount: number;
    betAmountIndex: number;
    winIndex: number;
    rewardMulti: number;
}
export interface IJackpotResp {
    uid: string;
    value: number;
    betAmountIndex: number;
    jackpotAmountPool: IJackpotAmountPool;
}
export interface IJackpotAmountPool {
    [betAmount: number]: number;
};
export interface IShootResult {
    entity: IEntityInfo;
    wheelResult?: IWheelResult;
    killEntity: boolean;
    rewardMulti: number;
    slotInfo: ISlotInfo;
    revenue: number;
    freeChance: number;
}
export interface IRoomResp {
    overflowed: boolean;
    timeMachineInit: number;
    allPlayers?: IUserInfo[];
    entityRandomKey?: IEntityRandomKey;//待删除
    randomKey: number;
    idKilled?: { [id: number]: IEntityKilledInfo };
    roomRound: number;
}
export interface IHint {
    uid: string;
    userName: string;
    avatar: string;
    amount: number;
}
export interface IPlayer {
    enterGame(screen: IVec, machineDuration: number): Promise<IEnterGameResp>;
    enterRoom_new(screen: IVec, machineDuration: number);//待删除
    autoQuit();
    setGunPos(gunPoint: IMotionPoint, touchPos: IVec);//玩家可以移动炮台位置
    setBetAmountIndex(betAmountIndex: number);
    updateSettings(config: IPlayerSettings);
    clickHook(use: boolean);
    clickLaser(use: boolean);
    autoShootToTarget(targetId: number);//自动射击时，每当切换目标就通知
    freeShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//免费子弹
    normalShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//普通子弹
    hookShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//虎克弹
    laserShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//激光
    knifeFishAttack(knifeFishId: number, fishIdArray: number[]);//刀鱼攻击
    propUse(amount: number, fishIdArray: number[], propId: number, shootInfo: IShootInfo, propType: EPropType);//油桶
    mergeShoot(amount: number, betAmountIndex: number, weaponType: EWeaponType, mergeData: IShootData[]);
    runSlot(time: number, stackCount: number);
    stopRound(roundId: number);
    synchronize(): Promise<IEnterGameResp>;
}
export interface ISceneListen {
    onEnterRoomResp(uids: string[], resp: IRoomResp);//有玩家进入房间
    onLeaveRoomResp(uids: string[], uidOther: string);//有玩家离开房间
    onAutoQuit(uid: string);
    onGunPosUpdate(uids: string[], pos: { uid: string, gunPoint: IMotionPoint, touchPos: IVec });//有玩家移动炮台位置
    onSetBetAmountIndexUpdate(uids: string[], betAmountIndex: { uid: string, value: number });//有玩家改变档位
    onClickHook(uids: string[], use: { uid: string, value: boolean });
    onClickLaser(uids: string[], use: { uid: string, value: boolean });
    onAutoShootToTarget(uids: string[], targetId: { uid: string, value: number });
    onRoundStep(roundStep: IRoundStep);
    onMachineInit_new(uids: string[], roomResp: IRoomResp);//新循环的开始
    onFreeShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onNormalShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onHookShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onLaserShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onKnifeFishAttackResp(uids: string[], shootResp: IShootResp);//刀鱼攻击
    onPropUseResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onMergeShootResp(uids: string[], mergeResp: IMergeShootResp);
    onSlotResult(uids: string[], slotResult: ISlotResult);//有玩家转动slot
    onJackpotResp(uids: string[], jackpotResp: IJackpotResp);//有玩家获得jackpot
    onJackpotHint(hints: IHint[]);//jackpot全服广播
    onAccountDiamondUpdate(uids: string[], amount: { uid: string, value: number, offset?: number });//amount要包装成对象，否则当余额为0时会抛出异常
    onMaintenance();
}