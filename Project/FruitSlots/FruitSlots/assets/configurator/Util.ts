export let gameDebug = false

export let gameName = () => (<any>window).gameName;
export let serverConfig = () => (<any>window).serverConfig;
export let pinus = () => (<any>window).pinus
export async function pinusRequest(routerName: string, msg: any): Promise<any> {
    let router = `${serverConfig().routerPath}.${gameName()}.${routerName}`;
    return new Promise(resolve => {
        pinus().request(router, msg, (data) => {
            resolve(data);
        });
    });
}

export function pinusResp(routerName: string, cb: any) {
    pinus().on(routerName, cb);
}

export async function pinusRequestBranch(gameBranch: string, routerName: string, msg: any): Promise<any> {
    let router = `${serverConfig().routerPath}.${gameBranch}.${routerName}`;
    return new Promise(resolve => {
        pinus().request(router, msg, (data) => {
            resolve(data);
        });
    });
}
export let isNetworkReady = () => (<any>window).isNetworkReady;

export async function delay(ms: number) {
    await new Promise((res) => {
        setTimeout(() => {
            res(0)
        }, ms);
    })
}

export function setGameCoin(gameCoin: cc.SpriteFrame, ...sprites: cc.Sprite[]) {
    if (gameCoin && sprites && sprites.length > 0) {
        sprites.forEach(sprite => {
            if (sprite) sprite.spriteFrame = gameCoin
        });
    }
}

export function setDebug(debug: boolean) {
    gameDebug = debug;
}

export function debugPrint(...data: any[]) {
    gameDebug && console.log(...data);
}
if ((<any>window).CustomSafeArea == null)
    (<any>window).CustomSafeArea = () => cc.sys.getSafeAreaRect();
export interface IAction {
    gameName: string,
    round: number,
    uid: string,
    action: string,
    accountDiamond: number,
    actionTime: number
}
export interface IDelayMsg {
    gameName: string,
    round: number,
    uid: string,
    action: string,         // 调哪个接口延迟了
    queryTime: number,      // 时间戳
    responseTime: number,   // 时间戳
    extra: string           // 额外信息
}
const routeTrace = "Trace";
let traceTime: number = new Date().getTime() - 10000;
export function delayRecord(action: string, queryTime: number, extra: string) {
    let responseTime = new Date().getTime();
    if (responseTime - queryTime > 1000 * 2) { // 超过2秒的为延迟
        if (responseTime - traceTime > 1000 * 10) { // 10秒cd，有附近时间的数据即可，不用每条延迟都记录。
            traceTime = responseTime;
            let delayMsg: IDelayMsg = {
                gameName: (<any>window).gameName,
                round: (<any>window).playerRoundId,
                uid: (<any>window).user?.uid,
                action: action,
                queryTime: queryTime,
                responseTime: responseTime,
                extra: extra
            };
            console.log("delayRecord", action);
            pinusRequestBranch(routeTrace, "userDelay", delayMsg);
        }
    }
}

export async function actionRecord(action: string) {
    let msg: IAction = {
        gameName: (<any>window).gameName,
        round: (<any>window).playerRoundId,
        uid: (<any>window).user?.uid,
        action: action,
        accountDiamond: (<any>window).playerAccountDiamond,
        actionTime: new Date().getTime(),
    }
    console.log("userAction", msg.action, msg);
    while (!isNetworkReady()) {
        console.warn("call actionRecord but Network not ready");
        await delay(1000);
    }
    pinusRequestBranch(routeTrace, "userAction", msg);
}
(<any>window).delayRecord = delayRecord;
(<any>window).actionRecord = actionRecord;