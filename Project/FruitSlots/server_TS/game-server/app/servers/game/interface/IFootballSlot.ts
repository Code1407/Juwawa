import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";

export const gConst = {
    gameName: "FootballSlot"
}

export interface IRankHint {
    uid: string;
    betResp: IResults;
}

export interface ITopUser {
    uid: string;
    userName: string;
    avatar: string;
}

export interface IRoundStep {
    runningRoundID: number;
    status: EGameStatus;
    accountDiamond: number;
    results: IResults;
}

export interface ILineSame {
    lineNum: number;
    target: number;
    count: number;
}

export interface IResults {
    wildOfFree: number;
    betAmount: number;
    results: number[];
    lineSames: ILineSame[];
    multiple: number;
    multiples: number[]; // 策划想看的信息
    shootGame: number[];
    shootGameChance: number;
    freeCount: number;
    roundId: number;
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    betAmountIndex: number;
    playerSettings: IPlayerSettings;
    lastResult: IResults;
}

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface IBetResp {
    code: ETradeCode;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betFree(): Promise<IBetResp>;
    betNormal(betAmount: number): Promise<IBetResp>;
    shootBall();
    setBetAmountButton(betAmountButtonIndex: number);
    stopRound(roundId: number): Promise<IRoundResultResp>;
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onAccountDiamondUpdate(uid: string, amount: number);
    onResultHandler(uid: string, result: IResults);
    onTopUserChange(topUsers: ITopUser[]);
    onWinHint(hints: IRankHint[]);
    onKeepConnection();
    onMaintenance();
}