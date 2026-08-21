import { ETradeCode } from "./IGame";

export interface IRedeem {
    userLogin(uid: string, gameName: string);
    tryOpenAward(uid: string, gameName: string);
    onUserLogin(resp: IRedeemResp);
    onBetUpdate(resp: IRedeemResp);
    onOpenAward(resp: IAwardResp);
    onRedeemEnd(resp: IHistoryAwardResp);
}

export interface IRedeemResp {
    startTime: number;
    endTime: number;
    timestamp: number;
    timezone: string;
    totalBet: number;
    got: number;
    betLevel: number[];
}

export interface IAwardResp {
    code: ETradeCode;
    levelIndex: number;
    award: number;
}

export interface IHistoryAwardResp {
    historyGet: number[];
}

// 客户需求，核心需求：
// 基于蓝⾊宝箱的**“五⽇惊喜成⻓”**逻辑旨在平衡“低⻔槛参与感”与“⾼净值⽤户激励”。
// 我们将这 5 个宝箱（20M, 50M, 100M, 200M, 500M）定义为周期性累积任务，核⼼逻辑如下：
// ⼀、 核⼼逻辑：五⽇累积循环
// 每 5 天为⼀个活动周期（滚动 5 天，每个⽤户都不⼀样）。
// 宝箱下⽅的数值代表该周期内的累计投注额（Wager）。每个游戏的统计逻辑都是独⽴的；
// ⽤户每达到⼀个阈值，即可点击开启⼀个宝箱。奖励领取游戏⽅不进⾏奖池（个⼈和⼤盘）扣除，只需通知平台
// ⽅该⽤户开启宝箱任务；（平台⽅提供开奖接⼝ /coopgame/box/open 具体参数待定）
// 宝箱数值、周期可进⾏配置下发；（配置调整会影响原有⽤户数据，数值定义和调整需慎重）；
// 宝箱不应是静⽌的。当进度接近时，宝箱应产⽣抖动、发光效果，提示⽤户“惊喜即将来临”。
// 每个周期结束时，通过精美动画展示本周成就单，然后重置进度，开启新⼀轮期待。

// 公司需求：
// 3、幸运宝箱开启后，用户首次登录时开启，每期活动120小时，开启时累计下注金额
// 4、用户在线时，时间到了，则结束本期活动
// 5、时间到了，用户不在线时，用户下次登录时，则结束本期活动
// 6、进度栏显示本期活动剩余时间
// 7、宝箱即将达到开启条件时，显示惊喜即将到来提示并有动画显示
// 8、每局游戏开奖结束后，如果用户进度条达到宝箱开启条件，会自动领取宝箱奖励

// 疑问：
// 宝箱是否必须要给到用户？（是）
// 宝箱是自动开启还是需要用户点击开启？（自动开启）
// 用户在开奖前退出游戏，那宝箱要怎么给到用户？（下次用户登录时给）
// 当用户下次的登录时，活动已经结束了，要弹出成就单，那么是否先给用户宝箱奖励然后再弹出成就单？（是）

// 整理：
// 1、宝箱的领取时机：1开奖时给，2登录时给