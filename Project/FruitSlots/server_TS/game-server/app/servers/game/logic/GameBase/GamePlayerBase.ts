import { IUserBalanceCoundDown, IUserBalanceShift } from '../../database/entity/BalanceEntity';
import { ETradeCode, getTimezoneOptionDate, IAccount, IPlayerSettings } from '../../interface/IGame';
import { ETradeType, IUserSDKEntiry, SDK_trade, SDK_trade_pre, SDK_UserLogin } from '../../database/entity/SDKEntity';
import IGamePlayer, { IPlayerstatus } from '../GamePlayer';
import { IOrderWithTime, ISdk } from '../../sdk/ISdk';
import { gRankAwarkRoundId, gRankData } from '../../branch/GlobalRank/RankCommon';
import { GameSceneBase } from './GameSceneBase';
import { Logger } from 'pinus';

export class IAntiAddictionEntity {
    inLock: boolean;
    todayDate: string;
    todayIgnore: boolean;
    todayRound: number;
    todayWin: number;
    todayBet: number;
}

export class IRedeemEntity {
    [gameName: string]: {
        roundId: number;
        startTime: number;
        totalBet: number;
        totalJP: number;
        historyGet: number[];
    };
}

export interface IBaseEntityType {
    balance: IUserBalanceShift | IUserBalanceCoundDown;
    saveDate: string;
    playerSettings: IPlayerSettings;
    antiAddiction?: IAntiAddictionEntity;
    redeem?: IRedeemEntity;
}

const coolDownTime = 100;

export abstract class GamePlayerBase<UserEntityType extends IBaseEntityType> implements IGamePlayer {
    constructor(protected logger: Logger) {
    }

    abstract status(): IPlayerstatus;
    abstract quitGameBase();
    abstract stopRunningRound();
    // 历史问题兼容，3个月后可以删除
    abstract fromHistoryBalance(historyBalance: any): IUserBalanceCoundDown | IUserBalanceShift;

    protected account: IAccount;
    public uid: string;
    protected token: string;
    protected extra: any;
    protected ua: string;
    protected sdk: ISdk;
    protected abstract userEntity: UserEntityType;
    protected abstract scene: GameSceneBase;
    protected coolDown: boolean = false;

    private timeoutRemovePlayer: NodeJS.Timeout;

    getEntityIns(): UserEntityType {
        return this.userEntity;
    }

    setAccont(account: IAccount, uid: string, token: string, extra: any, ua: string, sdk: ISdk) {
        this.account = account;
        this.uid = uid;
        this.token = token;
        this.extra = extra || {};
        this.extra.ua = ua;
        this.sdk = sdk;
        this.ua = this.extra;
        this.updateAutoQuit();
    }

    async quit(action: string): Promise<void> {
        clearTimeout(this.timeoutRemovePlayer);
        try {
            await this.quitGameBase();
            await this.save();
            await this.loginInfo(action);
        } catch (e) {
            this.logger.error(e.message);
        }
    }

    autoQuit() {
        this.onAutoQuit()
        this.scene.onAutoQuit(this.uid);
        this.scene.removePlayer(this.uid);
    }

    onAutoQuit() {

    }

    updateAutoQuit() {
        clearTimeout(this.timeoutRemovePlayer);
        this.timeoutRemovePlayer = setTimeout(() => {
            this.autoQuit();
        }, 10 * 60 * 1000);
    }

    vipLevel(): number {
        return this.account.vipLevel;
    }

    accountDiamond(): number {
        return this.account.diamond;
    }
    accountName(): string {
        return this.account.nickname;
    }

    accountAvator(): string {
        return this.account.avatar;
    }

    async queryUserAccount(): Promise<IAccount> {
        return this.scene.queryUserAccount(this.uid, this.token, this.extra);
    }

    encodeAccount(account: IAccount): IAccount {
        account.nickname = encodeURI(account.nickname);
        try {
            let lastSlashIndex = account.avatar.lastIndexOf('/') + 1;
            let url1 = account.avatar.substring(0, lastSlashIndex);
            let url2 = account.avatar.substring(lastSlashIndex);
            url2 = encodeURI(url2);
            account.avatar = url1 + url2;
        } catch (e) {
            this.logger.error(e);
        }
        return account;
    }

    async synchronizeBase(): Promise<IAccount> {
        let sdk = this.scene.gameServer.sdk[this.scene.gameName()];
        try {
            let account = await sdk.synchronize(this.uid, this.token, this.extra);
            if (account) {
                this.account.diamond = account.diamond >= 0 ? account.diamond : this.account.diamond;
                return this.account;
            } else {
                return null;
            }
        } catch (e) {
            this.logger.error(e.toString(), this.scene.gameName(), this.uid, this.token, this.extra);
        }
        return null;
    }

    async forceSaveUserEntity() {
        let userSDK: IUserSDKEntiry;
        userSDK = await this.getUserSDK(this.uid);
        if (!userSDK) userSDK = { account: null, token: null, game: {} };
        userSDK.account = this.account;
        userSDK.token = this.token;
        userSDK.game[this.scene.gameName()] = this.userEntity;
        let now = new Date();
        this.userEntity.saveDate = now.toLocaleDateString();
        await this.scene.redis.setSDKUser(this.uid, JSON.stringify(userSDK));
    }

    async saveUserEntity() {
        if (!this.userEntity.balance) return;
        if (!this.userEntity.balance.betDetail) return;

        let userSDK: IUserSDKEntiry;
        if (this.userEntity.balance.betDetail.betTotal || Object.keys(this.userEntity.balance.betDetail).length > 0) {
            userSDK = await this.getUserSDK(this.uid);
            if (!userSDK) userSDK = { account: null, token: null, game: {} };
            userSDK.account = this.account;
            userSDK.token = this.token;
            userSDK.game[this.scene.gameName()] = this.userEntity;
            let now = new Date();
            this.userEntity.saveDate = now.toLocaleDateString();
            await this.scene.redis.setSDKUser(this.uid, JSON.stringify(userSDK));
        }
    }

    async getUserEntity(uid: string): Promise<UserEntityType | null> {
        let userSDK: IUserSDKEntiry; userSDK = await this.getUserSDK(uid);
        let gameName = this.scene.gameName();
        if (userSDK && userSDK.game && userSDK.game[gameName]) {
            let userEntity = userSDK.game[gameName];
            if (userEntity) {
                if (userEntity.runningRounds) {
                    this.stopRunningRound();
                }
                let historyBalance = userEntity.buttonBalance ? userEntity.buttonBalance : userEntity.balance;
                userEntity.balance = this.fromHistoryBalance(historyBalance);
                delete userEntity.buttonBalance;
                if (userEntity.todayRevenue && userEntity.saveDate != this.scene.today.toLocaleDateString()) {
                    userEntity.todayRevenue = 0;
                }
                const sdkConfig = this.scene.gameServer.sdkConfig;
                const { local, options } = getTimezoneOptionDate(sdkConfig.timezone);
                let now = new Date();
                let todayDate = now.toLocaleDateString(local, options);
                if (userEntity.antiAddiction == null || userEntity.antiAddiction.todayDate != todayDate) {
                    let newData: IAntiAddictionEntity = {
                        inLock: false,
                        todayDate: todayDate,
                        todayIgnore: false,
                        todayRound: 0,
                        todayWin: 0,
                        todayBet: 0,
                    }
                    userEntity.antiAddiction = newData
                }
            }
            return userEntity;
        } else {
            return null;
        }
    }

    protected setCoolDown() {
        if (this.scene.isStop()) {
            this.coolDown = true;
            this.scene.forceRemovePlayer(this.uid);
        }
        this.coolDown = true;
        const __this = this;
        setTimeout(() => {
            __this.coolDown = false;
        }, coolDownTime);
    }


    protected async betOrderBase(
        roundId: number, orderId: string, betAmount: number,
        orderDetail?: string): Promise<IOrderWithTime> {
        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        let order: IOrderWithTime = { code: ETradeCode.unknow, orderId: "", diamond: this.account.diamond, saveTime: null };
        if (betAmount <= 0) {
            order.code = ETradeCode.nothing;
            return order;
        }

        if (this.account.diamond < betAmount) {
            order.code = ETradeCode.insufficient;
            return order;
        }

        this.setCoolDown();
        this.updateAutoQuit();

        let tradePre = new SDK_trade_pre;
        tradePre.day = this.scene.today;
        tradePre.round = roundId;
        tradePre.uid = this.uid;
        tradePre.token = (this.token && this.token.substring(this.token.length - 8)) || "empty";
        tradePre.order_type = ETradeType.tradeIn;
        tradePre.order_id = orderId;
        tradePre.diamond = betAmount;
        tradePre.save_time = new Date;

        let trade = new SDK_trade;
        let tradeCopy = trade as any;
        for (let prop in tradePre) if (tradePre[prop]) tradeCopy[prop] = tradePre[prop];
        trade.response_id = "";
        trade.account_diamond = this.account.diamond;

        let tradeFail = new SDK_trade;
        for (let prop in trade) tradeFail[prop] = trade[prop];

        if (orderDetail) tradePre.extra = orderDetail;
        order = await this.sdk.tradeIn(roundId, this.uid, this.token, orderId, betAmount, this.extra);
        if (order?.token) {
            this.token = order.token;
            this.scene.onChangeToken(this.uid, this.token);
        }
        await this.save();
        if (order.code == ETradeCode.success) {
            trade.account_diamond = Math.round(order.diamond);
            trade.response_id = order.orderId;
            trade.save_time = order.saveTime ? order.saveTime : new Date;
            this.account.diamond = order.diamond;
            this.incrAddictionBet(betAmount);
            this.incrRedeemBet(betAmount);
            await this.scene.mysql.insert(trade);
            await this.scene.incrTodayBet(betAmount);
        } else {
            if (order.code == ETradeCode.insufficient) {
                let account = await this.sdk.queryAccount(this.uid, this.token, this.extra);
                this.account.diamond = account.diamond;
            }
            tradeFail.response_id = order.orderId;
            tradeFail.save_time = order.saveTime ? order.saveTime : new Date;
            await this.scene.mysql.insert(tradeFail);
        }
        return order;
    }

    protected async winOrderBase(
        roundId: number, orderId: string, winAmount: number,
        orderDetail?: string): Promise<IOrderWithTime> {
        winAmount = Math.floor(winAmount);

        if (this.scene.isStop()) {
            this.scene.forceRemovePlayer(this.uid);
            return null;
        }

        let order: IOrderWithTime = { code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null };
        if (winAmount <= 0) {
            order.code = ETradeCode.nothing;
            return order;
        }

        let tradePre = new SDK_trade_pre;
        tradePre.day = this.scene.today;
        tradePre.round = roundId;
        tradePre.uid = this.uid;
        tradePre.token = (this.token && this.token.substring(this.token.length - 8)) || "empty";
        tradePre.order_type = ETradeType.tradeOff;
        tradePre.order_id = orderId;
        tradePre.diamond = winAmount;
        tradePre.save_time = new Date;

        let trade = new SDK_trade;
        let tradeCopy = trade as any;
        for (let prop in tradePre) if (tradePre[prop]) tradeCopy[prop] = tradePre[prop];
        trade.response_id = "";
        trade.account_diamond = this.account.diamond;

        let tradeFail = new SDK_trade;
        for (let prop in trade) tradeFail[prop] = trade[prop];

        await this.updateRankList(this.scene.today, this.uid, winAmount);

        if (orderDetail) tradePre.extra = orderDetail;
        order = await this.sdk.tradeOff(roundId, this.uid, this.token, orderId, winAmount, this.extra);

        await this.save();
        if (order.code == ETradeCode.success) {
            trade.response_id = order.orderId;
            trade.save_time = order.saveTime ? order.saveTime : new Date;
            trade.account_diamond = Math.round(order.diamond);
            this.account.diamond = order.diamond;
            this.incrAddictionWin(winAmount);
            await this.scene.mysql.insert(trade);
            await this.scene.incrTodayRevenue(winAmount);
        } else {
            tradeFail.response_id = order.orderId;
            tradeFail.save_time = order.saveTime ? order.saveTime : new Date;
            await this.scene.mysql.insert(tradeFail);
        }
        return order;
    }

    async updateRankList(date: Date, uid: string, increment: number) {
        let factor = gRankData.scoreFactor[this.scene.gameName()];
        if (factor) {
            await this.scene.redis.incrSDKRankListDay(date, uid, increment * factor);
            await this.scene.redis.incrSDKRankListWeek(date, uid, increment * factor);
        }
        await this.scene.redis.incrRankList(date, uid, increment);
    }

    async getUserSDK(uid: string): Promise<IUserSDKEntiry | null> {
        let user: IUserSDKEntiry = null;
        let users = await this.scene.redis.getSDKUsers([uid]);
        for (let i in users) {
            let userString = users[i];
            if (userString) {
                try {
                    user = JSON.parse(users[i]);
                    user.account.nickname = user.account.nickname;
                } catch (e) {
                    this.logger.error(e);
                    this.logger.error(users[i]);
                }
            }
        }
        return user;
    }

    async tradeNothing(roundId: number, orderId: string) {
        this.sdk.tradeNothing(roundId, this.uid, this.token, orderId, 0, this.extra);
    }

    async save() {
        await this.saveUserEntity();
    }

    async loginInfo(ua: string) {
        let now = new Date;
        let login = new SDK_UserLogin();
        login.day = now;
        login.uid = this.uid;
        login.game_name = this.scene.gameName();
        login.account_diamond = this.account.diamond;
        login.save_time = now;
        if (this.account.level) login.level = this.account.level;
        login.ua = ua;
        await this.scene.mysql.insert(login);
    }

    rankAward(amount: number, orderId: string): Promise<IOrderWithTime> {
        return this.sdk.tradeOff(gRankAwarkRoundId, this.uid, this.token, orderId, amount, this.extra);
    }

    redeemAward(amount: number, roundId: number, orderId: string): Promise<IOrderWithTime> {
        return this.sdk.tradeOff(roundId, this.uid, this.token, orderId, amount, this.extra);
    }

    async updateSettings(config: IPlayerSettings) {
        this.userEntity.playerSettings = config;
    }

    async getSettings(): Promise<IPlayerSettings> {
        return this.userEntity.playerSettings;
    }

    incrAddictionBet(amount: number) {
        this.userEntity.antiAddiction.todayBet += amount;
    }

    incrAddictionWin(amount: number) {
        this.userEntity.antiAddiction.todayWin += amount;
    }

    incrRedeemBet(amount: number) {
        if (!this.userEntity.redeem?.[this.scene.gameName()])
            return;
        this.userEntity.redeem[this.scene.gameName()].totalBet += amount;
    }

    incrRedeemJP(amount: number) {
        let gameName = this.scene.gameName();
        let redeemEntity = this.userEntity.redeem?.[gameName];
        if (!redeemEntity)
            return;
        redeemEntity.totalJP += amount;
    }

    updateAddiction() {
        this.userEntity.antiAddiction.todayRound++;
        const sdkConfig = this.scene.gameServer.sdkConfig;
        const { local, options } = getTimezoneOptionDate(sdkConfig.timezone);

        let now = new Date();
        let todayDate = now.toLocaleDateString(local, options);
        if (this.userEntity.antiAddiction.todayDate != todayDate) {
            this.userEntity.antiAddiction = {
                inLock: false,
                todayDate: todayDate,
                todayIgnore: false,
                todayRound: 0,
                todayWin: 0,
                todayBet: 0,
            }
        }
    }
    dbmHeartbeat() {
    }
}
