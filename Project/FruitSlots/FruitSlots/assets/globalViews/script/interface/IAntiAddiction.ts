
export interface IAntiAddiction {
    checkAddiction(uid: string);
    lockUser(uid: string, sec: number);
    ignoreAddiction(uid: string);
    eventTracking(uid: string, eventId: string);
    onFreezeTime(sec: number);
    onAddictionDataResp(data: { todayWin: number, todayBet: number, todayRound: number });
}

export enum eventId {
    enterGame_quit,
    enterGame_close,

    warning_open,
    warning_enter,
    warning_close,

    warning2_open,
    warning2_enter,
    warning2_close,

    freezing_open,
}

export const freezeTime = 24 * 60 * 60;