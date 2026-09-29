// ============================================================
// ILuckyFruits 模块：LuckyFruits 客户端接口定义与工具函数
// 包含：
//   1. 全局常量 gConst（转盘倍率、游戏名）
//   2. 工具函数（奖励计算、筹码金额计算、数组求和）
//   3. 游戏数据结构接口（回合步骤、开奖结果、玩家信息等）
//   4. 客户端消息协议接口（IPlayer 入场/下注、ISceneListen 场景监听）
// 与服务端 LuckyFruits.lua 的协议保持一致
// ============================================================

import { EGameStatus, ETradeCode, IAccount } from "../../shared3/interface/IGame";

// 游戏固定有5个下注位置；每个位置的筹码档位由服务器动态配置（1～5档）。
export const BET_POSITION_COUNT = 5;
export const MAX_BET_GRADE_COUNT = 5;

// 网络下注明细：位置使用0-based索引，chipCount表示该面值筹码的数量。
export interface IBetData {
    betPosition: number;
    chipValue: number;
    chipCount: number;
}

/**
 * PureClient 对 Lua 空 table 会解码成 {}，部分非空数组也可能是数字键对象。
 * 网络协议数组在业务入口统一转成原生 number[]，避免直接使用 slice/length 出错。
 */
export function normalizeProtocolNumberArray(values: any): number[] {
    if (Array.isArray(values)) {
        return values.map(value => Number(value)).filter(value => Number.isFinite(value));
    }
    if (!values || typeof values !== "object") return [];

    return Object.keys(values)
        .filter(key => /^\d+$/.test(key))
        .sort((left, right) => Number(left) - Number(right))
        .map(key => Number(values[key]))
        .filter(value => Number.isFinite(value));
}

export function getBetGradeAmounts(): number[] {
    let betGrade = (<any>window).betGrade;
    if (!betGrade || typeof betGrade.getGradeAmounts !== "function") return [];
    let source = betGrade.getGradeAmounts();
    if (!Array.isArray(source) || source.length < 1) return [];
    let result: number[] = [];
    source.forEach((value: any) => {
        let amount = Number(value);
        if (Number.isSafeInteger(amount) && amount > 0
            && result.indexOf(amount) < 0 && result.length < MAX_BET_GRADE_COUNT) {
            result.push(amount);
        }
    });
    return result;
}

export function createEmptyBetPositions(): number[] {
    let result: number[] = [];
    for (let i = 0; i < BET_POSITION_COUNT; i++) result.push(0);
    return result;
}

export function createEmptyBetNum(): number[][] {
    let result: number[][] = [];
    let gradeCount = getBetGradeAmounts().length;
    for (let i = 0; i < BET_POSITION_COUNT; i++) {
        let row: number[] = [];
        for (let j = 0; j < gradeCount; j++) row.push(0);
        result.push(row);
    }
    return result;
}

// 全局常量：转盘倍率与游戏名
// wheelMulti 索引 0-8 对应开奖符号 0-8，值为其对应倍率
// 符号 0-3 对应下注位置 0-3；符号 4-8 对应下注位置 0-4（错位映射，与服务端 LFRevenue 一致）
export const gConst = {
    wheelMulti:[
        2,2,2,2,       // 符号 0-3：低倍率区（对应下注位置 0-3）
        3,6,8,12,30    // 符号 4-8：中高倍率区（对应下注位置 0-4）
    ],
    gameName: "LuckyFruits"
}

// 新版排行榜标记：用于控制排行榜UI是否刷新为新样式
export let gNewRank = false;

// 重置新版排行榜标记（注意：当前实现固定重置为false）
export function setNewRank(flag: boolean) {
    gNewRank = false;
}

// 计算下注奖励金额：根据开奖结果与服务端倍率规则计算玩家应得奖励
// 错位映射规则：符号 0-3 → betItems[symbol]；符号 4-8 → betItems[symbol-4]
// 与服务端 LFRevenue(bets, resultDetail) 逻辑完全对齐
export function calculateRevenue(betItems: number[], resultDetail: number[]): number {
    let sumRevenue = 0;
    if(!resultDetail) return 0;
    // 符号 13/14 为特殊无奖励结果（与服务端一致）
    if(resultDetail[0]==13||resultDetail[0]==14) return 0;
    
    for(let i = 0; i < resultDetail.length; i++){
        if(resultDetail[i] >= 0 && resultDetail[i] < 4){
            // 符号 0-3：倍率取 wheelMulti[symbol]，对应 betItems[symbol]
            sumRevenue += betItems[resultDetail[i]] * gConst.wheelMulti[resultDetail[i]];
        }
        else if(resultDetail[i] >= 4 && resultDetail[i] < 9){
            // 符号 4-8：倍率取 wheelMulti[symbol]，对应 betItems[symbol-4]（错位映射）
            sumRevenue += betItems[resultDetail[i] - 4] * gConst.wheelMulti[resultDetail[i]];
        }else{
            continue;
        }
    }
    return Math.floor(sumRevenue);
}

// 根据服务器当前筹码面额计算一行筹码数量对应的下注金额。
export function calNumber(betNum: number[]) {
    let num: number = 0;
    let gradeAmounts = getBetGradeAmounts();
    let row = betNum || [];
    for (let i = 0; i < gradeAmounts.length; i++) {
        let count = Number(row[i]);
        num += gradeAmounts[i] * (Number.isFinite(count) ? count : 0);
    }
    return num;
}

// 回合步骤：客户端同步服务器回合状态机
export interface IRoundStep {
    todayRound:number,          // 今日回合序号（每日从1开始递增）
    status: EGameStatus,        // 回合状态（bet/run/final）
    remainSecond: number,       // 当前阶段剩余秒数
    serverNowMs: number,        // 服务端生成快照时的时间戳（毫秒）
    phaseStartedAtMs: number,   // 当前阶段开始时间戳（毫秒）
    phaseEndsAtMs: number,      // 当前阶段结束时间戳（毫秒）
    timelineVersion: number,    // 开奖表现时间轴版本
    rollStartPos: number,       // 本局开奖起始格（上一局最终停止位置）
    winPos: number,             // 开奖结果符号（-1表示未开奖）
    resultDetail: number[],     // 开奖结果详情数组（苹果时间有多个符号）
    resultPos: number[]         // 本回合权威转盘落点（用于重连与多端同步）
}

// 开奖结果：服务器派牌时下发
export interface IRoundResult {
    todayRound:number,
    rollStartPos: number,
    winPos: number,
    resultDetail: number[],
    resultPos:number[]          // 服务器下发结果位置（用于客户端动画展示）
}

// 左右结果：用于双转盘动画
export interface results{
    leftResult:number,
    rightResult:number,
}

// 玩家操作接口：客户端调用发送至服务器
export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;           // 进入游戏场景
    bet(todayRound: number, betGradeArr: number[], betGradeNumArr: number[][]): Promise<IBetResp>;  // 下注
    //autoBet(todayRound: number, wheelAmount: number[]): Promise<IBetResp>;
    updateSettings(playerSettings: IPlayerSettings)  // 更新个人设置
    synchronize(): Promise<IEnterGameResp>;          // 同步场景状态
}

// 下注响应：服务器返回下注结果
export interface IBetResp {
    code: ETradeCode,           // 兼容旧客户端的稳定业务码
    rawTradeCode?: number,      // 平台原始交易码；前端优先使用，便于独立扩展错误提示
    accountDiamond: number,     // 玩家当前钻石余额
    betGradeNum: number[][]     // 本回合各位置各档筹码数量
}

// 全场景下注响应：广播全场景的下注聚合
export interface IAllBetResp {
    uid: string;
    wheelAmount: number[][];
}

/** Lua 列表既可能是数组，也可能是以 1 开始的数字键对象。 */
export function normalizeProtocolArray<T>(values: any): T[] {
    if (Array.isArray(values)) return values.slice();
    if (!values || typeof values !== "object") return [];
    return Object.keys(values).filter(key => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b)).map(key => values[key]);
}

/** 固定位置和档位的矩阵不能过滤/压缩空项，否则金额会移到其他下注位。 */
export function normalizeProtocolBetNum(values: any): number[][] {
    const read = (source: any, index: number) => {
        if (!source || typeof source !== "object") return undefined;
        const base = Array.isArray(source) || Object.prototype.hasOwnProperty.call(source, "0") ? 0 : 1;
        return source[index + base];
    };
    const result = createEmptyBetNum();
    for (let i = 0; i < result.length; i++) {
        const row = read(values, i);
        for (let j = 0; j < result[i].length; j++) {
            const count = Number(read(row, j));
            result[i][j] = Number.isSafeInteger(count) && count >= 0 ? count : 0;
        }
    }
    return result;
}

// 场景事件监听接口：服务器推送消息的回调签名
export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);              // 同步秒数和状态
    onResultHandler(roundResult: IRoundResult);      // 服务器下发派牌的结果
    onbatNoticeAll(resp:IAllBetResp);                // 有人下注派发
    onRewardHandler(roundResult:IRewardResp);        // 发奖，结果的挡位
    onbatListRound(data:IBatListResp);               // 服务器下发派奖的动画参数
    onPlayerUpdate(playerResult: ICountDownPlayerUpdate);  // 玩家账户更新
}

// 数组求和工具：用于下注金额累加
export function arraySum(arr: number[]): number {
    return arr.reduce((pre, cur) => { return pre + cur; });
}

// 奖励响应：开奖后下发结果详情
export interface IRewardResp {
    winCard: string,            // 中奖符号（字符串形式，用于客户端展示）
    resultDetail: number[]      // 开奖结果详情数组
}

// 下注动画参数：用于客户端播放下注飞行动画
export interface IBatListResp{
    uid:string,                // 下注玩家UID
    flyPlayerPos:number,       // 飞行动画起始位置
    batIndex:number[],         // 下注位置标志位数组
    num:number[][]             // 各位置各档筹码数量
}

// 游戏历史记录项：记录每回合开奖结果（不含下注明细）
export interface IHistoryItem {
    date: string,
    round: number,
    //betDatails: number[][], 
    roundResult: number
}

// 玩家个人历史记录项：包含下注明细与开奖结果
export interface IMyHistoryItem {
    date: string,
    round: number,
    betDatails: number[],      // 本回合下注金额数组
    roundResult: number,
    resultDetail: number[]     // 开奖结果详情
}

// 玩家下注列表项：用于展示其他玩家的下注
export interface IPlayerBetList {
    uid:string,
    betGradeArr: number[],     // 下注位置标志位数组
    betGradeNum: number[][],   // 各位置各档筹码数量
}

// 玩家账户更新：结算后推送玩家账户变更
export interface ICountDownPlayerUpdate {
    todayRound: number;
    diamond: number;           // 更新后的钻石余额
    itemAmount: number[];      // 玩家本回合下注金额数组
}

// 进入游戏响应：聚合场景信息与个人信息供客户端初始化
export interface IEnterGameResp {
    // 场景信息
    uid:string,
    roundStep: IRoundStep,
    //historyResults: number[],

    // 个人信息
    account: IAccount,
    todayRevenue: number,                  // 今日累计收益
    lastWheelAmount: number[][],           // 存在的上一局的下注信息
    curRoundWheelAmount: number[][],       // 当前局的下注信息
    curRoundAllWheelAmount: IPlayerBetList[], // 当前局所有人的下注信息
    curRoundTotalWheelAmount?: number[][], // 当前局全场累计筹码，进入/重连立即刷新总下注
    gameHistory: IHistoryItem[],           // 游戏历史记录（全服）
    myHistory: IMyHistoryItem[],           // 玩家个人历史记录
    playerSettings: IPlayerSettings        // 玩家个人设置
}

// 玩家个人设置：音量、上次选中的下注按钮
export interface IPlayerSettings {
    soundVol?: number;                    // 音量（0-1）
    lastBetAmountButton?: number;         // 上次选中的下注金额按钮索引
}


// 排行榜条目：展示玩家排名信息
export interface IRankListItem {
    uid:string,
    profile: string,    // 头像URL
    name: string,       // 玩家昵称
    revenue: number     // 玩家收益（用于排序）
}
