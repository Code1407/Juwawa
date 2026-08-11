import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";

export const gConst = {
    gameName: "GoldFishing"
}
/**1小型鱼、2中型鱼、3大型鱼、4boss、5特殊*/
export enum EEntityType {
    fish101,//0
    fish102,//1
    fish103,//2
    fish104,//3
    fish105,//4
    fish106,//5
    fish107,//6
    fish108,//7
    fish109,//8
    fish110,//9
    fish111,//10
    fish112,//11
    fish113,//12
    fish114,//13
    fish115,//14
    fish201,//15
    fish202,//16
    fish203,//17
    fish204,//18
    fish205,//19
    fish206,//20
    fish207,//21
    fish208,//22
    fish209,//23
    fish301,//24
    fish302,//25
    fish303,//26
    fish304,//27
    fish305,//28
    fish401,//29
    fish402,//30
    fish403,//31
    fish404,//32
    fish405,//33
    fish501,//34
    fish502,//35
    fish503,//36
    fish504,//37
    fish505,//38
    fish506,//39
}
export enum EAwardType {
    skill_drill = `skill_drill`,//钻头鱼
    skill_laser = `skill_laser`,//激光鱼
    skill_bomb = `skill_bomb`,//炸弹鱼
    skill_blackhole = `skill_blackhole`,//黑洞鱼
    skill_thunder = `skill_thunder`,//闪电鱼
    skill_wheel = `skill_wheel`,//转盘鱼
    boss_401 = `boss_401`,//boss全屏技
    boss_402 = `boss_402`,//boss全屏技
    boss_403 = `boss_403`,//boss全屏技
}
export enum EWeaponType {
    normal,
    laser,
}
export enum EPropType {
    skill_drill,//钻头鱼501
    skill_laser,//激光鱼502
    skill_bomb,//炸弹鱼503
    skill_blackhole,//黑洞鱼504
    skill_thunder,//闪电鱼505
    boss_401,//boss全屏技
    boss_402,//boss全屏技
    boss_403,//boss全屏技
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
    useLaser: boolean;
    lockTargetId: number;
}
export interface IEnterGameResp {
    account: IAccount;
    betAmountIndex: number;
    playerSettings: IPlayerSettings;
    roomResp: IRoomResp;
    timeEnterGame: number;
}
export interface IRoundStep {
    gameStatus: EGameStatus;
    serverTime: number;
}
export interface IEntityInfo {
    type: EEntityType;//实体类型
    InsId?: number;//实例id
    timeBorn?: number;//出现时间
    status?: number;//阶段或状态或形态
    path?: IMotionPath;
}
export interface IEntityKilledInfo {
    betAmount: number;//击杀这条鱼所使用的档位
    entity: IEntityInfo;
}
export interface IShootInfo {
    time: number;//时间戳
    fromRound: number;
    propType?: EPropType;
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
    bulletId: number;
    shootInfo?: IShootInfo;
    propType?: EPropType;
    specailFishKey?: number;//随机种子
    shootResults: IShootResult[];
    comboHit: number;
    totalRevenue: number;
    ingoreInsId: boolean;
}
export interface IMergeShootResp {
    shootResps: { [weapon: number]: IShootResp[] }
}
export interface IShootResult {
    entity: IEntityInfo;
    killEntity: boolean;
    rewardMulti: number;
    revenue: number;
    freeBullet: number;
}
export interface IRoomResp {
    overflowed: boolean;
    timeMachineInit: number;
    allPlayers?: IUserInfo[];
    randomKey: number;
    idKilled: { [id: number]: IEntityKilledInfo };
    roomRound: number;
}
export interface IHint {
    uid: string;
    userName: string;
    avatar: string;
    amount: number;
}
export interface IPlayer {
    enterGame(screen: IVec, machineDuration: number): Promise<IEnterGameResp>;//不同屏幕分辨率不能进入相同房间
    autoQuit();
    setBetAmountIndex(betAmountIndex: number);
    updateSettings(config: IPlayerSettings);
    clickLaser(use: boolean);
    autoShootToTarget(targetId: number);//自动射击时，每当切换目标就通知
    normalShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//普通子弹
    laserShoot(amount: number, targetId: number, bulletId: number, shootInfo: IShootInfo);//激光
    mergeShoot(amount: number, betAmountIndex: number, weaponType: EWeaponType, mergeData: IShootData[]);
    skillAttack(fishIdArray: number[], propId: number, shootInfo: IShootInfo);//技能
    synchronize(): Promise<IEnterGameResp>;
}
export interface ISceneListen {
    onEnterRoomResp(uids: string[], roomResp: IRoomResp);//有玩家进入房间
    onLeaveRoomResp(uids: string[], uidOther: string);//有玩家离开房间
    onAutoQuit(uid: string);
    onSetBetAmountIndexUpdate(uids: string[], betAmountIndex: { uid: string, value: number });//有玩家改变档位
    onClickLaser(uids: string[], use: { uid: string, value: boolean });
    onAutoShootToTarget(uids: string[], targetId: { uid: string, value: number });
    onRoundStep(roundStep: IRoundStep);
    onMachineInit(uids: string[], roomResp: IRoomResp);//新循环的开始
    onNormalShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onLaserShootResp(uids: string[], shootResp: IShootResp);//有玩家射击实体
    onMergeShootResp(uids: string[], mergeResp: IMergeShootResp);
    onFishSkillAttack(uids: string[], shootResp: IShootResp);//技能鱼回馈
    onAccountDiamondUpdate(uids: string[], amount: { uid: string, value: number, offset?: number });//amount要包装成对象，否则当余额为0时会抛出异常
    onMaintenance();
}