
type EventCall = (...args: any) => void;
//网络配置
declare interface NetConfig {
    pingInterval?: number, //ping interval default 10s
    pingOut?: number, //ping out default 60s
    retryInterval?: number, //retry connect interval default 5s
    retryMaxCount?: number, //retry connect max count default 5
    compress?: boolean //msg compress or not default true
}

declare interface GameCommonCost {
    coins: number //积分
    costUrl: string //档位图标
}

declare interface GameCommonConfig {
    costs: GameCommonCost[] //档位配置
    custom: object
}

declare interface GameClientConfig {
    coinUrl: string//货币图标
    custom: object
}

declare class JsNet {
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

    //获取远程公共配置
    getCommonConfig(): GameCommonConfig;

    //获取远程客户端配置
    getClientConfig(): GameClientConfig;

    //推送跟踪日志
    clientError(message: string | object): void

    //推送统计数据
    clientStatis(statisId: number, data: object): void
}

declare class JsSdk {
    //充值，返回是否成功
    recharge(): boolean
    //关闭游戏，返回是否成功
    quit(): boolean //关闭游戏

    //监听事件
    // `onQueryUser`：请求更新玩家sdk数据
    // `onGameBgHide`：请求隐藏背景图，参数为是否隐藏
    // `onGameView`: 请求适配游戏尺寸，三个参数，分别是屏幕大小，游戏区域大小，游戏区域偏移
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

export class PureClient {
    constructor();

    //初始化，返回是否成功，注意是异步的，请用await
    //参数1，reqTimeout 请求超时时间，毫秒
    //参数2，sdkCfg 指定sdk所需默认参数
    init(reqTimeout: number, sdkCfg: any): Promise<boolean>

    //获取Sdk，当没有初始化时返回undefined
    getSdk(): JsSdk | undefined

    //获取Net，当没有初始化时返回undefined
    getNet(): JsNet | undefined
}

