
export interface IAntiAddiction {
    checkAddiction(uid: string, gameName: string);
    lockUser(uid: string, gameName: string, sec: number);
    ignoreAddiction(uid: string, gameName: string);
    eventTracking(uid: string, eventId: string);
    onFreezeTime(uid: string, gameName: string, sec: number);
    onAddictionDataResp(uid: string, gameName: string, data: { todayWin: number, todayBet: number, todayRound: number });
}