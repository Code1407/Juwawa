import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";

export const gConst = {
    gameName: "YummySlot"
}
export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
}

export interface IGameSettings extends IPlayerSettings {
    lineCount: number
}

export interface IEnterGameResp {
    account: IAccount,
    playerSettings: IGameSettings,
    lastResult: IResults,
    normalHistory: IResultHistoryItem[],
    specailHistory: IResultHistoryItem[],
    connectMultiples: number[][],
    bonusGameMultiples: number[],
    timezone: string,
}
export interface IRoundStep {
    gameStatus: EGameStatus,
    results: IResults,
    jackpot: number
}
export interface IResultHistoryItem {
    timestamp: number,
    results: number[],
    roundId: number,
    bonusIndexs?: number[],
    betAmount: number,
    lineCount: number,
    lineSames: ILineSame[],
    freeWinAmount?: number; //累计的免费局收入
    freeFromRound?: number;
    jackpotAmount?: number; //从池子里拿出了多少
}
export interface IResults {
    results: number[],
    roundId: number,
    bonus: number[],
    bonusIndexs: number[],
    betAmount: number,
    lineCount: number,
    targets: number[],
    lineSames: ILineSame[],
    multiples: number[];
    multiple: number;
    isFreeRound: boolean; //是否免费局
    freeWinAmount: number; //累计的免费局收入
    freeCount: number; //剩余免费次数
    freeFromRound?: number;
    jackpotPoolValue: number, //在取jackpot之前池子里有多少奖金，用于在客户端向用户演示一个变化：你从原本多少的池子里拿出了多少然后池子里还剩多少
    jackpotAmount: number; //从池子里拿出了多少
    bonusAmount: number;
    stopRound: boolean;
    timestamp: number;
}

export interface ILineSame {
    lineNum: number;
    target: number;
    count: number;
}
export interface IJackpotHint {
    nickname: string,
    jackpotAmount: number,
    avatar: string
}
export interface IWinHint {
    nickname: string,
    winAmount: number,
    targets: number[],
    avatar: string
}

export interface IPlayer {
    enterGame(maxBetAmount: number): Promise<IEnterGameResp>,
    synchronize(): Promise<IEnterGameResp>,
    betNormal(amount: number, lineCount: number,);
    betFree();
    stopRound(roundId: number);
    updateSettings(config: IGameSettings);
}
export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep),
    onAccountDiamondUpdate(uid: string, amount: { value: number, offset?: number });
    onResultHandler(uid: string, resp: IBetResp);
    /**jp中奖提示 */
    onJackpotHint(resp: IJackpotHint[]): void,
    /**普通开奖提示 */
    onWinHint(resp: IWinHint[]): void
    onMaintenance(): void,
}
