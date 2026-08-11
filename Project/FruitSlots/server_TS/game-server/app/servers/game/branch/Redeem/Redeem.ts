import { Application, ChannelService } from "pinus";
import Redis from "../../database/db/redis";
import GameServer from "../../GameServer";
import { GamePlayerBase, IBaseEntityType } from "../../logic/GameBase/GamePlayerBase";
import { IAwardResp, IHistoryAwardResp, IRedeem, IRedeemResp } from "../../interface/IRedeem";
import { IOrderWithTime, ISdk, uuid } from "../../sdk/ISdk";
import { ETradeCode } from "../../interface/IGame";
import { ETradeType, SDK_trade, SDK_trade_pre } from "../../database/entity/RedeemEntity";
import SDK from "../../sdk/SDK";
import { GameSceneBase } from "../../logic/GameBase/GameSceneBase";

// 个人奖池金额<10000时，则在4000-6000金币奖励中随机
// 个人奖池金额>=10000时，则根据用户个人奖池金额随机奖励，大致如下：
// a)个人奖池在10000-100000时，在以下奖励中随机
// i.个人奖池*30%
// ii.个人奖池*25%+1个礼物753
// iii.个人奖池*20%+2个礼物753
// iv.个人奖池15%+1个礼物3560
// b)个人奖池在100001-1000000时，在以下奖励中随机
// i.个人奖池30%
// ii.个人奖池*28%+2个礼物753
// iii.个人奖池*26%+3个礼物753
// iv.个人奖池24%+1个礼物3560
// v.个人奖池22%+2个礼物3560
// c)个人奖池在1000001-5000000时，在以下奖励中随机
// i.个人奖池30%
// ii.个人奖池*28%+3个礼物753
// iii.个人奖池*26%+5个礼物753
// iv.个人奖池24%+2个礼物3560
// v.个人奖池22%+4个礼物3560
// d)个人奖池>5000000时，在以下奖励中随机
// i.个人奖池35%
// ii.个人奖池30%
// iii.个人奖池*28%+3个礼物753
// iv.个人奖池*26%+5个礼物753
// v.个人奖池24%+2个礼物3560
// vi.个人奖池22%+4个礼物3560

export function TotalJpToAwardValue(totalJP: number, random: number) {
    let awardValue = 0;
    if (totalJP < 10000) {
        awardValue = 4000 + Math.floor(random * 2000);
    } else if (totalJP < 100000) {
        if (random < 0.3) {
            awardValue = Math.floor(totalJP * 0.3);
        } else if (random < 0.55) {
            awardValue = Math.floor(totalJP * 0.25) + 753;
        } else if (random < 0.75) {
            awardValue = Math.floor(totalJP * 0.2) + 1506;
        } else if (random < 0.9) {
            awardValue = Math.floor(totalJP * 0.15) + 3560;
        } else {
            awardValue = Math.floor(totalJP * 0.12) + 7530;
        }
    } else if (totalJP < 1000000) {
        if (random < 0.3) {
            awardValue = Math.floor(totalJP * 0.3);
        } else if (random < 0.6) {
            awardValue = Math.floor(totalJP * 0.28) + 753;
        } else if (random < 0.8) {
            awardValue = Math.floor(totalJP * 0.26) + 1506;
        } else if (random < 0.94) {
            awardValue = Math.floor(totalJP * 0.24) + 3560;
        } else {
            awardValue = Math.floor(totalJP * 0.22) + 7530;
        }
    } else if (totalJP < 5000000) {
        if (random < 0.3) {
            awardValue = Math.floor(totalJP * 0.3);
        } else if (random < 0.84) {
            awardValue = Math.floor(totalJP * 0.28) + 753;
        } else if (random < 0.94) {
            awardValue = Math.floor(totalJP * 0.26) + 1506;
        } else if (random < 0.98) {
            awardValue = Math.floor(totalJP * 0.24) + 3560;
        } else {
            awardValue = Math.floor(totalJP * 0.22) + 7530;
        }
    } else {
        if (random < 0.35) {
            awardValue = Math.floor(totalJP * 0.35);
        } else if (random < 0.65) {
            awardValue = Math.floor(totalJP * 0.3);
        } else if (random < 0.85) {
            awardValue = Math.floor(totalJP * 0.28) + 753;
        } else if (random < 0.94) {
            awardValue = Math.floor(totalJP * 0.26) + 1506;
        } else if (random < 0.98) {
            awardValue = Math.floor(totalJP * 0.24) + 3560;
        } else {
            awardValue = Math.floor(totalJP * 0.22) + 7530;
        }
    }
    return awardValue;
}

export class CoolDown {
    cd: boolean = false;
    ms = 1000;
    callCount: number = 0;
    private cdTimeout: NodeJS.Timeout;

    IsCoolDown(): boolean {
        this.callCount++;
        if (this.cd) {
            return this.cd;
        }
        clearTimeout(this.cdTimeout);
        this.cd = true;
        this.cdTimeout = setTimeout(() => {
            this.cd = false;
        }, this.ms);
        return false;
    }
}

const dayX5 = 1000 * 60 * 60 * 24 * 5;

export class Redeem implements IRedeem {
    redis: Redis

    sdk: SDK;

    private channelService: ChannelService;

    totalBetLevel: { [gameName: string]: number[] } = {};

    heartbeatIdMap: { [uid: string]: NodeJS.Timeout } = {};

    heartbeatInterval: number = 3000;

    constructor(private app: Application, private gameServer: GameServer, private sdkName: string) {
        this.channelService = this.app.get('channelService');
        this.redis = new Redis(app, sdkName, "noName");
        this.sdk = this.gameServer.sdk;
        this.init();
    }
    init() {

    }
    getRedeemEntity(uid: string, gameName: string) {
        const player = this.gameServer.getScene(gameName)?.getPlayer(uid) as any;
        const userEntity = player?.userEntity as IBaseEntityType;
        if (!userEntity) {
            return null;
        }
        if (!userEntity.redeem) {
            userEntity.redeem = {};
        }
        const redeemEntity = userEntity.redeem;
        if (!redeemEntity[gameName]) {
            redeemEntity[gameName] = {
                roundId: 0,
                startTime: Date.now(),
                totalBet: 0,
                totalJP: 0,
                historyGet: [],
            };
        }
        return redeemEntity[gameName];
    }
    cd_GetBetLevel: { [gameName: string]: CoolDown } = {};
    async GetBetLevel(gameName: string) {
        if (!this.cd_GetBetLevel[gameName]) {
            this.cd_GetBetLevel[gameName] = new CoolDown();
        }
        if (!this.totalBetLevel[gameName] || !this.cd_GetBetLevel[gameName].IsCoolDown()) {
            this.totalBetLevel[gameName] = await this.redis.getRedeemBetLevel(gameName);
        }
        return this.totalBetLevel[gameName];
    }
    CalcAwardValue(uid: string, gameName: string) {
        const redeemEntity = this.getRedeemEntity(uid, gameName);
        if (!redeemEntity) {
            return 0;
        }
        let totalJP = redeemEntity.totalJP;
        let random = Math.random();
        let awardValue = TotalJpToAwardValue(totalJP, random);
        return awardValue;
    }

    protected async winOrderBase(
        uid: string,
        gameName: string,
        boxIndex: number,
        roundId: number,
        orderId: string,
        winAmount: number,
        orderDetail?: string): Promise<IOrderWithTime> {
        winAmount = Math.floor(winAmount);

        let order: IOrderWithTime = { code: ETradeCode.unknow, orderId: "", diamond: 0, saveTime: null };
        if (winAmount <= 0) {
            order.code = ETradeCode.nothing;
            return order;
        }

        let tradePre = new SDK_trade_pre;
        let scene = this.gameServer.getScene(gameName) as GameSceneBase;
        tradePre.day = scene.today;
        tradePre.box_index = boxIndex;
        tradePre.round = roundId;
        tradePre.uid = uid;
        tradePre.order_type = ETradeType.tradeOff;
        tradePre.order_id = orderId;
        tradePre.diamond = winAmount;
        tradePre.save_time = new Date;

        let trade = new SDK_trade;
        let tradeCopy = trade as any;
        for (let prop in tradePre) if (tradePre[prop]) tradeCopy[prop] = tradePre[prop];
        trade.response_id = "";
        let player = scene.getPlayer(uid) as GamePlayerBase<IBaseEntityType>;
        trade.account_diamond = player.accountDiamond();

        let tradeFail = new SDK_trade;
        for (let prop in trade) tradeFail[prop] = trade[prop];

        if (orderDetail) tradePre.extra = orderDetail;
        order = await player.redeemAward(winAmount, roundId, orderId)

        if (order.code == ETradeCode.success) {
            trade.response_id = order.orderId;
            trade.save_time = order.saveTime ? order.saveTime : new Date;
            trade.account_diamond = Math.round(order.diamond);
            ;
            await scene.mysql.insert(trade);
            await scene.incrTodayRevenue(winAmount);
        } else {
            tradeFail.response_id = order.orderId;
            tradeFail.save_time = order.saveTime ? order.saveTime : new Date;
            await scene.mysql.insert(tradeFail);
        }
        return order;
    }

    async send2Player(gameName: string, routerName: string, uid: string, msg: any) {
        let serverID = this.app.getServerId();
        let channel = this.channelService.channels[`${this.sdkName}.${gameName}`];
        let uids = channel.groups[serverID];
        if (uids && uids.length && uids.includes(uid)) {
            let sid = channel.getMember(uid)['sid'];
            // console.log(`send`, routerName, `to`, uid);
            this.channelService.pushMessageByUids(routerName, msg, [{
                uid: uid,
                sid: sid
            }]);
        }
    }
    checkEnd(uid: string, gameName: string) {
        const redeemEntity = this.getRedeemEntity(uid, gameName);
        if (Date.now() - redeemEntity.startTime >= dayX5 || redeemEntity.historyGet.length >= this.totalBetLevel[gameName].length) {
            let redeemEndResp: IHistoryAwardResp = {
                historyGet: [...redeemEntity.historyGet],
            };
            this.onRedeemEnd(uid, gameName, redeemEndResp);
            redeemEntity.roundId++;
            redeemEntity.startTime = Date.now();
            redeemEntity.totalBet = 0;
            redeemEntity.totalJP = 0;
            redeemEntity.historyGet.splice(0);
        }
    }
    async userLogin(uid: string, gameName: string) {
        const redeemEntity = this.getRedeemEntity(uid, gameName);
        if (!redeemEntity) {
            return false;
        }
        await this.tryOpenAward(uid, gameName);
        this.checkEnd(uid, gameName);
        let redeemResp: IRedeemResp = {
            startTime: redeemEntity.startTime,
            totalBet: redeemEntity.totalBet,
            endTime: redeemEntity.startTime + dayX5,
            timestamp: Date.now(),
            timezone: this.gameServer.sdkConfig.timezone,
            got: redeemEntity.historyGet.length,
            betLevel: await this.GetBetLevel(gameName)
        };
        this.onUserLogin(uid, gameName, redeemResp);
        clearInterval(this.heartbeatIdMap[uid]);
        this.heartbeatIdMap[uid] = setInterval(async () => {
            if (!this.gameServer.getScene(gameName)?.getPlayer(uid)) {
                clearInterval(this.heartbeatIdMap[uid]);
                return;
            }
            redeemResp = {
                startTime: redeemEntity.startTime,
                totalBet: redeemEntity.totalBet,
                endTime: redeemEntity.startTime + dayX5,
                timestamp: Date.now(),
                timezone: this.gameServer.sdkConfig.timezone,
                got: redeemEntity.historyGet.length,
                betLevel: await this.GetBetLevel(gameName)
            };
            this.onBetUpdate(uid, gameName, redeemResp);
            this.checkEnd(uid, gameName);
        }, this.heartbeatInterval);
    }

    async tryOpenAward(uid: string, gameName: string) {
        const redeemEntity = this.getRedeemEntity(uid, gameName);
        if (!redeemEntity) {
            return false;
        }
        let betLevel = await this.GetBetLevel(gameName);
        let totalBet = redeemEntity.totalBet;
        for (let i = redeemEntity.historyGet.length; totalBet >= betLevel[i]; i++) {
            let awardValue = this.CalcAwardValue(uid, gameName);
            let orderId = uuid.v1();
            let order = await this.winOrderBase(uid, gameName, i, redeemEntity.roundId, orderId, awardValue);
            if (!order) {
                console.warn(`tryOpenAward Trade failed`, uid, gameName);
                return false;
            }
            const awardResp: IAwardResp = {
                code: order.code,
                award: awardValue,
                levelIndex: redeemEntity.historyGet.length
            };
            redeemEntity.historyGet.push(awardValue);
            this.onOpenAward(uid, gameName, awardResp);
        }
    }
    onUserLogin(uid: string, gameName: string, resp: IRedeemResp) {
        this.send2Player(gameName, this.onUserLogin.name, uid, resp);
    }
    onOpenAward(uid: string, gameName: string, resp: IAwardResp) {
        this.send2Player(gameName, this.onOpenAward.name, uid, resp);
    }
    onBetUpdate(uid: string, gameName: string, resp: IRedeemResp) {
        this.send2Player(gameName, this.onBetUpdate.name, uid, resp);
    }
    onRedeemEnd(uid: string, gameName: string, resp: IHistoryAwardResp) {
        this.send2Player(gameName, this.onRedeemEnd.name, uid, resp);
    }
}