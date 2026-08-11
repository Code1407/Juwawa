import { EGameStatus, ETradeCode, IAccount, IPlayerSettings } from "./IGame";
export const gConst = {
    gameName: "FightSlot"
}

export interface IRoundStep {
    runningRoundID: number;
    status: EGameStatus;
    accountDiamond: number;
    jackpotPool: IJackpotAmountPool;
    results: IResults;
}

export interface IJackpotAmountPool {
    [betAmount: number]: number[]
};

export interface IRoundResultResp {
    accountDiamond: number;
}

export interface ISuperResults {
    lockIds: { [index: number]: number };
    results: number[]; //图标信息
    lineSames: ILineSame[]; //中了哪些路线
    multiples: number[]; //所有路线的倍数情况
}

export interface IResults {
    betAmount: number; //押注
    results: number[]; //图标信息
    lineSames: ILineSame[]; //中了哪些路线
    multiples: number[]; //所有路线的倍数情况
    superResults: ISuperResults[];
    multiple: number; //倍数总和
    isFreeRound: boolean; //是否免费局
    isSuperRound: boolean; //是否super game
    freeWinAmount: number; //累计的免费局收入
    freeCount: number; //剩余免费次数
    freeCountMax: number; //累计免费次数
    progressOfFree: number; //免费游戏中的铃铛收集进度
    progressOfJackpot: IJackpotProgress; //顶部bonus字母收集进度（对应档位）
    jackpotAmount: number; //bonus赢得了多少奖金
    jackpotWinIndex: number; //bonus中的奖金来自哪个奖金池
}

export interface ILineSame {
    lineNum: number; //几号线
    target: number; //几号图标
    count: number; //连上了多少个图标
}

export interface IJackpotProgress {
    [amount: number]: number //对应档位的进度
}

export interface IEnterGameResp {
    // 场景信息

    // 个人信息
    account: IAccount;
    playerSettings: IPlayerSettings;
    lastResult: IResults;
}

export interface IBetResp {
    code: ETradeCode;
    result: IResults;
    roundId: number;
}

export interface IPlayer {
    enterGame(): Promise<IEnterGameResp>;
    betNormal(betAmount: number);
    betFree();
    betSuper();
    stopRound(roundId: number);
    setBetAmountButton(betAmountButtonIndex: number);
    updateSettings(config: IPlayerSettings);
    synchronize(): Promise<IEnterGameResp>;
}

export interface ISceneListen {
    onRoundStep(roundStep: IRoundStep);
    onAccountDiamondUpdate(uid: string, amount: { value: number, offset?: number });
    onResultHandler(uid: string, resp: IBetResp);
    onMaintenance();
}