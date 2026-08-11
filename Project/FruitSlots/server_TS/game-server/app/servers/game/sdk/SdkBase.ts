import {IOrderWithTime, ISdk} from "./ISdk";
import {ETradeCode, IAccount} from "../interface/IGame";
import MessageSender from "./common/MessageSender";
import DebugLogger from "./common/DebugLogger";
import ResponseBase from "./common/ResponseBase";

const debug = true;

export default abstract class SdkBase<T extends ResponseBase> implements ISdk {
    private sender: MessageSender<T>
    private dLogger: DebugLogger = new DebugLogger(debug);

    constructor(protected gameId: string, protected response: T) {
        this.sender = new MessageSender<T>(this.dLogger, response);
    }

    abstract tradeOff(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime>;

    abstract queryAccount(uid: string, token: string, extra: any): Promise<IAccount>;

    abstract tradeIn(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime>;

    tradeNothing(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        return;
    }

    private send(signSrc: string, method: string, url: string, body?: any, headers?: HeadersInit, kick?: ()=>void): Promise<T> {
        if (!headers) headers = {};
        if (method == "POST" && !headers["Content-Type"]) headers["Content-Type"] = "application/json;charset=UTF-8";

        return this.sender.sendNReceive(signSrc, method, url, headers, body, kick);
    }

    async getAccount(signSrc: string, method: string, url: string, body?: any, headers?: HeadersInit): Promise<IAccount> {
        let account: IAccount = {nickname: null, avatar: null, diamond: null, level: null};

        const response = await this.send(signSrc, method, url, body, headers);

        if (response && response.success()) {
            account.nickname = response.getNickname();
            account.avatar = response.getAvatar();
            account.diamond = response.getBalance();
            account.level = response.getLevel();

            this.dLogger.print("return account: " + JSON.stringify(account));
            return account;
        }

        return null;
    }

    async toTrade(signSrc: string, method: string, url: string, body?: any, headers?: HeadersInit, kick?: ()=>void): Promise<IOrderWithTime> {
        const order: IOrderWithTime = {code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null}; // 服务器返回的订单信息，包含订单id和金币数量，用于后面的查询order

        const response = await this.send(signSrc, method, url, body, headers, kick);
        if (!response) {
            return order;
        }

        if (response.success()) {
            order.code = ETradeCode.success;
            order.orderId = response.getOrderId();
            order.diamond = response.getBalance();
        } else {
            order.code = response.tokenInvalid() ? ETradeCode.tokenInvalid :
                response.insufficientBalance() ? ETradeCode.insufficient : ETradeCode.unknow;
            order.orderId = response.tokenInvalid() || response.insufficientBalance() ?
                response.getOrderId() : JSON.stringify(response);
        }
        order.saveTime = response.getTime();

        this.dLogger.print("return order: " + JSON.stringify(order));
        return order;
    }
}
