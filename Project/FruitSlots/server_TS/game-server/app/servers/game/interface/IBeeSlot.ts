import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";

export const gConst = {
    gameName: "BeeSlot"
}

export interface IRoundStep {
    status: EGameStatus;
}

export interface IJackpotAmountPool {
    [key: string]: number[];
}

export interface ILineSame {
    lineNum: number;
    target: number;
    count: number;
}

export interface IHoneyJarData {
    [betAmount: number]: IHoneyJarItem[];
}

export interface IHoneyJarItem {
    id: number;
    awardAmount: number;
    jackpotPoolIndex: number;
}

export interface IResults {
    betAmount: number;
    results: number[];
    lineSames: ILineSame[];
    multiple: number;
    multiples: number[]; // 策划想看的信息
    freeCount: number;
    freeTotalCount: number;
    freeWinAmount: number;
    freeGameWildMultiple: number;
    jackpotAmount: number;
    honeyJarDataByBet: IHoneyJarItem[];
    honeyJarRunItems: IHoneyJarItem[];
    honeyJarArrayLine: IHoneyJarItem[];
    wheelJackpotPoolIndex: number;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    betAmountIndex: number;
    lastResult: IResults;
    honeyJarData: IHoneyJarData;
    playerSettings: IPlayerSettings;
    historyItems: IHistoryItem[];
}

export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
}

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface IHistoryItem {
    time: Date;
    round: number;
    cost: number;
    win: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number): Promise<IBetResp>;
    betFree(): Promise<IBetResp>;
    stopRound(roundId: number): Promise<IRoundResultResp>;
    setBetAmountButton(betAmountButtonIndex: number, betAmount: number);
    synchronize(): Promise<IEnterGameResp>;
    updateSettings(config: IPlayerSettings);
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onMaintenance();
    onResultHandler(uid: string, resp: IBetResp);
    onAccountDiamondUpdate(uid: string, amount: { value: number, offset?: number });
    onHandselHoneyJar(uid: string, honeyJarDataByBet: IHoneyJarItem[])
}