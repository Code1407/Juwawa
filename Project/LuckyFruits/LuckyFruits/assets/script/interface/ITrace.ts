export interface IAction {
    gameName: string,
    round: number,
    uid: string,
    action: string,
    accountDiamond: number,
    actionTime: number
}

export interface IDalayMsg {
    gameName: string,
    round: number,
    uid: string,
    action: string,         // 调哪个接口延迟了
    queryTime: number,      // 时间戳
    responseTime: number,   // 时间戳
    extra: string           // 额外信息
}

export interface ITrace {
    userAction(msg: IAction);   // 记录影响数值的用户行为，例如：点击auto
    userDelay(msg: IDalayMsg);  // 记录接口调用延迟信息
}