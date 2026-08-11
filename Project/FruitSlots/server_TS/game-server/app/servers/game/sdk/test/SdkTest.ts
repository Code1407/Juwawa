import { createHash, randomInt } from "crypto";

import { ISdk, ISdkConfig, IUserConfig, IOrderWithTime } from "../ISdk";
import { ETradeCode, IAccount } from '../../interface/IGame';
import { IHintMsg } from "../../hint/IHintPlayer";
import GameServer from '../../GameServer';
import { delay } from "bluebird";

export default class SdkTestLocal implements ISdk {
    private gameId: string = null;
    private appId: string = null;
    private defaultUserData: { [uid: string]: IAccount } = {
        "5723178": {
            uid: "5723178",
            diamond: 10000000,
            avatar: "",
            nickname: "Hellkitty",
            level: 1
        },
        "6283849": {
            uid: "6283849",
            diamond: 10000000,
            avatar: "",
            nickname: "Hellkitty",
            level: 1
        },
        "6284852": {
            uid: "6284852",
            diamond: 10000000,
            avatar: "",
            nickname: "Hellkitty",
            level: 1
        },
    }
        ;

    constructor(private sdkConfig: ISdkConfig, private gameServer: GameServer, private gameName: string) {
        this.gameId = this.sdkConfig.gameId[gameName];
        this.appId = this.sdkConfig.appId;
    }

    async hint?<T extends IHintMsg>(players: T[]): Promise<void> {
        console.log("hint: ", players);
    }

    queryAccount(uid: string, token: string, extra: any): Promise<IAccount> {
        if (uid && this.defaultUserData[uid] == null) {
            this.defaultUserData[uid] = {
                uid: uid,
                diamond: Number(uid),
                avatar: iconUrls[randomInt(0, iconUrls.length)],
                nickname: uid,
                level: 1
            }
        }
        if (!uid)
            console.error("uid null or empty");
        return new Promise(res => res(this.defaultUserData[uid]));
    }

    async tradeIn(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        let tradeResp: IOrderWithTime
        let element = this.defaultUserData[uid];
        if (element != null) {
            // element.money -= amount * 1000;
            // element.money = Math.max(element.money, 0);
            if (element.diamond >= amount) {
                element.diamond -= amount;
                tradeResp = {
                    code: ETradeCode.success,
                    orderId: "0",
                    diamond: Number(element.diamond),
                    saveTime: new Date()
                }
            }
            else {
                tradeResp = {
                    code: ETradeCode.insufficient,
                    orderId: "0",
                    diamond: Number(element.diamond),
                    saveTime: new Date()
                }
            }
            return tradeResp;
        }
        tradeResp = {
            code: ETradeCode.unknow,
            orderId: "0",
            diamond: 0,
            saveTime: new Date()
        }
        return tradeResp;
    }

    async tradeOff(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {
        //await delay(30000)
        let tradeResp: IOrderWithTime
        let element = this.defaultUserData[uid];
        if (element != null) {
            element.diamond += amount;
            tradeResp = {
                code: ETradeCode.success,
                orderId: "0",
                diamond: Number(element.diamond),
                saveTime: new Date()
            }
            return tradeResp;
        }
        tradeResp = {
            code: ETradeCode.unknow,
            orderId: "0",
            diamond: 0,
            saveTime: new Date()
        }
        return tradeResp;
    }
    async tradeNothing(roundId: number, uid: string, token: string, orderId: string, amount: number, extra: any): Promise<IOrderWithTime> {

        return;
    }
    private calcSign(data, appkey) {
        var keyArr = [];
        var secret = appkey;
        for (var key in data) {
            keyArr.push(key);
        }
        keyArr = keyArr.sort();
        var originalString = "";
        for (var idx = 0; idx < keyArr.length; idx++) {
            originalString += keyArr[idx] + "=" + data[keyArr[idx]];
            originalString += "&";
        }
        originalString += "company_key=" + secret;
        var hash = createHash("sha256");
        return hash.update(originalString).digest("hex");
    };
}
let iconUrls = [
    "https://c-ssl.dtstatic.com/uploads/item/201806/19/20180619182220_KLEPM.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/29/20180629110754_KHawy.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/04/20180604174931_4sKYz.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/21/20180621181320_zXad3.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/19/20180619150001_cdwFj.png",
    "https://c-ssl.dtstatic.com/uploads/people/202005/19/20200519175915_QSjEv.png",
    "https://c-ssl.dtstatic.com/uploads/people/202005/19/20200519180347_yHwtX.png",
    "https://c-ssl.dtstatic.com/uploads/avatar/202407/26/OoSQL7yAs6MDWzW.thumb.100_100_c.png",
    "https://c-ssl.dtstatic.com/uploads/avatar/202011/20/20201120160120_6afb2.thumb.100_100_c.jpg",
    "https://c-ssl.dtstatic.com/uploads/item/201805/11/20180511104226_xfXsH.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202312/19/oVSe2723tg4nye2.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/aLS3nZn6u0BJq6n.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/OoSb3v3jh6Wn4eD.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/2YSpOwOqS6g4Dq3.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/5zSy4L4qUO27a1z.png",
    "https://castatic.fengkongcloud.cn/crb/slide-atlas-default-without-logo-20230423/v4/75f120bb9151ea6194e6d939b62061a4_fg.png",
    "https://castatic.fengkongcloud.cn/crb/slide-atlas-default-without-logo-20230423/v4/75f120bb9151ea6194e6d939b62061a4_bg.jpg",
    "https://c-ssl.dtstatic.com/uploads/item/201806/25/20180625104425_8dRUx.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/19/20180619182220_KLEPM.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/29/20180629110754_KHawy.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/04/20180604174931_4sKYz.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/21/20180621181320_zXad3.png",
    "https://c-ssl.dtstatic.com/uploads/item/201806/19/20180619150001_cdwFj.png",
    "https://c-ssl.dtstatic.com/uploads/people/202005/19/20200519175915_QSjEv.png",
    "https://c-ssl.dtstatic.com/uploads/people/202005/19/20200519180347_yHwtX.png",
    "https://c-ssl.dtstatic.com/uploads/avatar/202407/26/OoSQL7yAs6MDWzW.thumb.100_100_c.png",
    "https://c-ssl.dtstatic.com/uploads/avatar/202011/20/20201120160120_6afb2.thumb.100_100_c.jpg",
    "https://c-ssl.dtstatic.com/uploads/item/201805/11/20180511104226_xfXsH.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202312/19/oVSe2723tg4nye2.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/aLS3nZn6u0BJq6n.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/OoSb3v3jh6Wn4eD.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/2YSpOwOqS6g4Dq3.png",
    "https://c-ssl.dtstatic.com/uploads/ops/202401/30/5zSy4L4qUO27a1z.png",
    "https://castatic.fengkongcloud.cn/crb/slide-atlas-default-without-logo-20230423/v4/75f120bb9151ea6194e6d939b62061a4_fg.png",
    "https://castatic.fengkongcloud.cn/crb/slide-atlas-default-without-logo-20230423/v4/75f120bb9151ea6194e6d939b62061a4_bg.jpg",
    "https://c-ssl.dtstatic.com/uploads/item/201806/25/20180625104425_8dRUx.png",
]