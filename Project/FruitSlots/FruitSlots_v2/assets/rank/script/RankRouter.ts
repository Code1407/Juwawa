import { IRankAward, IRankAwardListen, IRankAwardMsg, IRankListByDateStrMsg, IRankRealTimeMsg, gNewRank } from "./interface/IBranch_Rank";
import GlobalRankUI, { UpdateOffset, brachData, delay } from "./ui/GlobalRankUI";

export let myUID = () => (<any>window).user?.uid;
export let gameName = () => (<any>window).gameName;
export let serverConfig = () => (<any>window).serverConfig;
//export let isNetworkReady = false;

export class RankRouter implements IRankAward, IRankAwardListen {
    coolDown = false;
    constructor(private jsNet: any) {
        let _this = this;

        // this.on('CsIsNetworkReadyResp', function (data) {
        //     isNetworkReady = true;
        // });

        this.on('ScTodayRealTimeRankPush', function (data) {
            _this.csTodayRealTimeRankResp(data);
        });
        this.on('CsGetTodayRealTimeRankResp', function (data) {
            GlobalRankUI.Instance.csGetTodayRealTimeRankResp(data);
        });

        this.on('ScDayRankAwardPush', function (data) {
            _this.csDayRankAwardResp(data);
        });
        this.on('ScWeekRankAwardPush', function (data) {
            _this.csWeekRankAwardResp(data);
        });
        this.on('CsReceiveDayAwardResp', function (data) {
            GlobalRankUI.Instance.csReceiveDayAwardResp(data);
        });
        this.on('CsReceiveWeekAwardResp', function (data) {
            GlobalRankUI.Instance.csReceiveWeekAwardResp(data);
        });
        this.on('CsGetRankListByDateStrResp', function (data: IRankListByDateStrMsg) {
            _this.csGetRankListByDateStrResp(data);
        });
    }

    async reqMsg(routerName: string, msg: any): Promise<any> {
        return this.jsNet.reqMsg(routerName, msg);
    }

    async push(routerName: string, msg: any) {
        this.jsNet.pushMsg(routerName, msg);
    }

    on(routerName: string, cb: any) {
        if (!this.jsNet) {
            return;
        }
        this.jsNet.listenMsg(routerName, (data: any) => {
            cb(data);
        });
    }

    csDayRankAwardResp(msg: IRankAwardMsg) {
        if (!gNewRank) return;
        if (msg.bonus) msg.bonus = Math.floor(msg.bonus);
        brachData.dayRankAward = msg;
        // 如果bonus不为0，则显示领奖图标
        console.log("onDayRankAward", msg.bonus);
        if (msg.bonus > 0 || GlobalRankUI.Instance.IsAwardable(brachData.weekRankAward)) {
            GlobalRankUI.Instance.ChangeToAwardButton();
        } 
        // else {
        //     GlobalRankUI.Instance.ChangeToRankButton(msg.rank);
        // }
    }

    csWeekRankAwardResp(msg: IRankAwardMsg) {
        if (!gNewRank) return;
        if (msg.bonus) msg.bonus = Math.floor(msg.bonus);
        brachData.weekRankAward = msg;

        // 如果bonus不为0，则显示领奖图标
        console.log("onWeekRankAward", msg.bonus);
        if (msg.bonus > 0 || GlobalRankUI.Instance.IsAwardable(brachData.dayRankAward)) {
            GlobalRankUI.Instance.ChangeToAwardButton();
        } 
        // else {
        //     GlobalRankUI.Instance.ChangeToRankButton(msg.rank);
        // }
    }

    // async csIsNetworkReadyReq() {
    //     while (!isNetworkReady) {
    //         this.push("CsIsNetworkReadyReq", {});
    //         await delay(1000);
    //     }
    // }

    csTodayRealTimeRankResp(msg: IRankRealTimeMsg) {
        if (!gNewRank) return;
        GlobalRankUI.Instance.txRank.string = msg.rank ? msg.rank.toString() : "";
        UpdateOffset(msg.timestamp, msg.timezone, `onTodayRealTimeRank`);
    }

    async csReceiveDayAwardReq() {
        if (this.coolDown) return
        this.coolDown = true;
        setTimeout(() => {
            this.coolDown = false;
        }, 1000);
        this.push("CsReceiveDayAwardReq", {});
    }

    async csReceiveWeekAwardReq() {
        if (this.coolDown) return
        this.coolDown = true;
        setTimeout(() => {
            this.coolDown = false;
        }, 1000);
        this.push("CsReceiveWeekAwardReq", {});
    }

    async csGetTodayRealTimeRankReq() {
        this.push("CsGetTodayRealTimeRankReq", {});
    }

    csDayRankAwardReq() {
        if (!gNewRank) return;
        this.push("CsDayRankAwardReq", {});
    }

    csWeekRankAwardReq() {
        if (!gNewRank) return;
        this.push("CsWeekRankAwardReq", {});
    }

    /** 按日期串拉榜上行：`rankQuery` 为 `today?`、`thisweek?` 或 `YYYY-MM-DD`。 */
    csGetRankListByDateStrReq(dateStr: string) {
        if (!gNewRank) return;
        this.push("CsGetRankListByDateStrReq", { dateStr: dateStr });
    }

    csGetRankListByDateStrResp(msg: IRankListByDateStrMsg) {
        if (!gNewRank) return;
        let view = GlobalRankUI.Instance?.rankView;
        if (view) view.onRankListByDateStrMsg(msg);
        console.log("csGetRankListByDateStrResp", msg); 
    }

    csRankTestReq(score: number) {
        this.push("CsRankTestReq", { score: score });
    }
}
