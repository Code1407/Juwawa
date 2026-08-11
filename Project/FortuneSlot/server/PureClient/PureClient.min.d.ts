
type EventCall = (...args: any) => void;
//网络配置
declare interface NetConfig {
    pingInterval?: number, //ping interval default 10s
    pingOut?: number, //ping out default 60s
    retryInterval?: number, //retry connect interval default 5s
    retryMaxCount?: number, //retry connect max count default 5
    compress?: boolean //msg compress or not default true
}

declare interface ClientCostConfig {
    name: string //名字
    coins: number //积分
    costUrl: string //档位图标
}

declare interface ClientConfig {
    costs: ClientCostConfig[] //档位配置
    coinUrl: string//货币图标
}

export class JsNet {
    //gameId 游戏id
    //platId 平台id
    //platKey 平台key
    //uId 用户id
    //reqTimeout 请求超时时间，毫秒
    constructor(gameId: number, platId: number, platKey: string, uId: string, reqTimeout: number);

    // 增加网络事件相关监听 `onConnect`,`onMsg`,`onPing`, `onRetry`, `onDisconnect`, `onError`
    addEvent(name: string, func: EventCall): boolean;

    // 连接服务器
    connect(url: string, cfg?: NetConfig): void;

    //获取网络延时
    getNetDelay(): number;

    //监听服务器消息
    listenMsg<T>(name: string, func: (msg: T) => void): boolean;

    //往服务器推送消息
    pushMsg(msgName: string, msg: {}): boolean;

    //异步请求服务器消息，会等待返回值
    reqMsg<T>(msgName: string, msg: {}): Promise<T>;

    //断开网络
    disconnect(): void;

    //获取剩下重连次数
    leftRetry(): number

    //开启或关闭重连
    enableRetry(enable: boolean): void;

    //获取远程客户端配置
    getClientConfig(): ClientConfig;
}

declare interface SdkNormalArg {
    platId: number | undefined
    platKey: string | undefined
    gameId: number | undefined

    uId: string | undefined
    token: string | undefined
    lang: string | undefined
    area: string | undefined
}

export class JsSdk {

    constructor();

    //初始化，返回是否成功
    //参数用于调试，指定sdk所需参数
    init(arg: SdkNormalArg | undefined): boolean
    //充值，返回是否成功
    recharge(): boolean
    //关闭游戏，返回是否成功
    quit(): boolean //关闭游戏

    //监听事件
    // `onQueryUser`：请求更新玩家sdk数据
    addEvent(name: string, func: EventCall): boolean;

    //派发事件
    //名字同addEvent参数
    dipatchEvent(name: string, ...args: any): void;

    //获取参数，一般是平台提供的参数
    getQuery(name: string): string | undefined

    //获取平台Id
    getPlatId(): number | undefined

    //获取平台key
    getPlatKey(): string | undefined

    //获取游戏Id
    getGameId(): number | undefined

    //获取玩家Uid
    getUid(): string | undefined

    //获取玩家token
    getToken(): string | undefined

    //获取用户语言
    getLang(): string | undefined

    //获取用户区域
    getArea(): string | undefined

    //获取扩展数据
    getExt(): string

}



