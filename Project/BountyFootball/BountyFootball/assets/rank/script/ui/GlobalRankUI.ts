import MessageRouter from "../../../shared/MessageRouter";
import { RankRouter } from "../RankRouter";
import RankStart from "../RankStart";
import { DateTimeFormat, GetTimeZoneTicks, get_time_str } from "../function_rank";
import { DateTimeFormatOptions, ETradeCode, IRankAwardMsg, IRankAwardResp, IRankRealTimeMsg, gNewRank, initGNewRank, normalizeRankServerTimezone } from "../interface/IBranch_Rank";
import { openUI } from "../utl/ActiveCtrl_Rank";
import GlobalRankAwardView from "../view/GlobalRankAwardView";
import GlobalRankView from "../view/GlobalRankView";

export let hourTicks = 60 * 60 * 1000;
export let dayTicks = 24 * 60 * 60 * 1000;
export let timezoneFromServer: number = 8;
export let timestampFromServer = Date.now();

let offset = 0;
let timezoneTicks = GetTimeZoneTicks("+08:00");
export function UpdateOffset(timestamp: number, newTimezone: number, caller = ``) {
    // const tzKey = normalizeRankServerTimezone(newTimezone);
    // if (tzKey) {
    //     timezoneFromServer = tzKey;
    //     timezoneTicks = GetTimeZoneTicks(tzKey);
    //     if ((<any>window).rankTimer)
    //         console.log(`update timezone`, tzKey, `caller`, caller);
    // }
    // if (timestamp) {
    //     timestampFromServer = timestamp;
    //     offset = timestamp - Date.now();
    //     if ((<any>window).rankTimer)
    //         console.log(`update offset`, offset, `caller`, caller);
    // }
    
    if(timestamp){
        timestampFromServer = timestamp;
    }
    if(newTimezone){
        timezoneFromServer = newTimezone;
    }
}
export function DateNow() {
    //return Date.now() + offset + timezoneTicks;
    return timestampFromServer;
}
export function DateNowUTC() {
    return Date.now() + offset;
}
export async function delay(ms: number) {
    await new Promise((res) => {
        setTimeout(() => {
            res(0)
        }, ms);
    })
}

export class brachData {
    static dayRankAward: IRankAwardMsg;
    static weekRankAward: IRankAwardMsg;
    static realTimeRank: IRankRealTimeMsg;
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class GlobalRankUI extends cc.Component {
    static Instance: GlobalRankUI;
    rankAward: RankRouter;
    /** `RankView` 上的 `GlobalRankView`，在 `start` 里网络就绪后挂载，供 `RankRouter` 转发榜下行。 */
    rankView: GlobalRankView | null = null;
    @property(cc.Node)
    rankButton: cc.Node = null;
    @property(cc.Node)
    awardButton: cc.Node = null;
    @property(cc.Node)
    closeRankButton: cc.Node = null;
    @property(cc.Label)
    rankTimer: cc.Label = null;
    @property(cc.Label)
    awardTimer: cc.Label = null;
    @property(cc.Label)
    txRank: cc.Label = null;
    @property(sp.Skeleton)
    boxAnim: sp.Skeleton = null;
    @property(GlobalRankAwardView)
    rankAwardView: GlobalRankAwardView = null;
    @property(cc.Node)
    coinFxPrefab: cc.Node = null;

    timerInterval = 0;
    ChangeToAwardButton() {
        if (!gNewRank) {
            this.awardButton.active = false;
            this.rankButton.active = false;
            return;
        }
        this.rankButton.active = false;
        this.awardButton.active = true;
        this.boxAnim.setAnimation(0, "animation", true);
    }

    ChangeToRankButton(rank: number) {
        if (!gNewRank) {
            this.awardButton.active = false;
            this.rankButton.active = false;
            return;
        }
        this.awardButton.active = false;
        this.rankButton.active = true;
        this.txRank.string = rank != null ? rank.toString() : ``;
    }

    initUserRank() {
        if (!gNewRank) {
            console.log("[LuxuryCarRank] initUserRank skipped, gNewRank false");
            return;
        }
        console.log("[LuxuryCarRank] initUserRank request start", {
            hasRankAward: !!this.rankAward
        });
        if (!this.rankAward) {
            console.warn("[LuxuryCarRank] initUserRank skipped, rankAward is nil");
            return;
        }
        this.rankAward.csGetTodayRealTimeRankReq();
        this.rankAward.csDayRankAwardReq();
        this.rankAward.csWeekRankAwardReq();
    }

    async initRankUI(msgRouter: MessageRouter) {
        console.log("[LuxuryCarRank] GlobalRankUI.initRankUI start", {
            hasMsgRouter: !!msgRouter,
            windowEnableRank: (<any>window).enableRank,
            hasRankStart: !!RankStart.Instance
        });
        initGNewRank()
        console.log("[LuxuryCarRank] GlobalRankUI.initRankUI after initGNewRank", {
            gNewRank: gNewRank
        });
        RankStart.Instance.LoadRank();
        GlobalRankUI.Instance = this;
        (<any>window).globalRankUI = this;
        (<any>window).rankButton = this.rankButton;
        this.awardButton.active = false;
        this.rankButton.active = false;
        if (!gNewRank) {
            console.log("[LuxuryCarRank] GlobalRankUI.initRankUI stop, gNewRank false");
            return;
        }
        cc.game.on(cc.game.EVENT_SHOW, () => {
            this.initUserRank();
        });
        this.timerInterval = setInterval(() => {
            if (!this.node.isValid) {
                clearInterval(this.timerInterval);
                return;
            }
            this.updateTimer();
        }, 200);
        this.rankAward = new RankRouter(msgRouter);
        console.log("[LuxuryCarRank] RankRouter created", {
            hasRankAward: !!this.rankAward
        });
        //this.rankAward.csIsNetworkReadyReq();
        this.node.setParent((<any>window).rankViewPos);
        this.node.position = cc.Vec3.ZERO;
        this.awardButton.setParent((<any>window).rankButtonPos);
        this.awardButton.position = cc.Vec3.ZERO;
        this.rankButton.setParent((<any>window).rankButtonPos);
        this.rankButton.position = cc.Vec3.ZERO;
        this.rankAwardView.node.opacity = 255;
        // while (!isNetworkReady) {
        //     await delay(1000);
        // }
        this.initUserRank();
        const rankViewRoot = this.node.getChildByName('RankView');
        this.rankView = (rankViewRoot && rankViewRoot.getComponent(GlobalRankView)) || null;
        console.log("[LuxuryCarRank] rank view lookup", {
            hasRankViewRoot: !!rankViewRoot,
            hasRankView: !!this.rankView
        });
        if (this.rankView) this.rankView.initGlobalRankView();
        this.awardButton.on(cc.Node.EventType.TOUCH_START, async () => {
            console.log("GlobalRankUI TOUCH_START");
            let dayRankAward = brachData.dayRankAward;
            let weekRankAward = brachData.weekRankAward;
            if (this.IsAwardable(dayRankAward)) {
                this.rankAward.csReceiveDayAwardReq();
            } else if (this.IsAwardable(weekRankAward)) {
                this.rankAward.csReceiveWeekAwardReq();
            }
            console.log("GlobalRankUI TOUCH_START End");
        });

        (<any>window).rankTimer = false;
        (<any>window).testGlobalRankAwardView = () => {
            this.rankAwardView.node.active = true;
            this.rankAwardView.Display({
                uid: "101",
                rank: 0,
                bonus: 0,
                score: 0,
                rankUsers: [{
                    uid: "101",
                    avator: "",
                    rank: 1,
                    name: "AXDFGGDTDHHY",
                    bonus: 2220,
                    score: 2220,
                    get: false,
                }, {
                    uid: "102",
                    avator: "",
                    rank: 2,
                    name: "AABBCCDDEEFFGGHHIIJJ",
                    bonus: 1310,
                    score: 11510,
                    get: false,
                }, {
                    uid: "103",
                    avator: "",
                    rank: 3,
                    name: "AABBCCDDEEFFGGHHIIJJ",
                    bonus: 1610,
                    score: 1610,
                    get: false,
                }]
            });
        }
    }
    updateTimer() {
        // let nowTick = DateNow();

        // let nextDayTick = (Math.floor(nowTick / dayTicks) + 1) * dayTicks;
        // let offset = nextDayTick - nowTick;

        // let options: DateTimeFormatOptions = {
        //     timeZone: `UTC`,
        //     hour: true,
        //     minute: true,
        //     char: ":",
        // };
        // if (offset < hourTicks) {
        //     options = {
        //         timeZone: "UTC",
        //         minute: true,
        //         second: true,
        //         char: ":",
        //     };
        // }
        // this.awardTimer.string = this.rankTimer.string = DateTimeFormat(offset, options)
        // if ((<any>window).rankTimer) {
        //     console.log(`timezoneTicks`, timezoneTicks);
        // }

        let daySec = 24 * 60 * 60;
        let timestamp = Math.ceil(timestampFromServer/1000);
        let passSec = Math.ceil(timestamp % daySec);
        let offset = daySec - passSec;
        let options: DateTimeFormatOptions = {
            timeZone: `UTC`,
            hour: true,
            minute: true,
            char: ":",
        };
        if (offset < hourTicks) {
            options = {
                timeZone: "UTC",
                minute: true,
                second: true,
                char: ":",
            };
        }
        this.awardTimer.string = this.rankTimer.string = get_time_str(offset); //DateTimeFormat(offset, options)
    }

    async WaitFor(check: () => boolean, intarval: number) {
        while (!check()) {
            await new Promise((x) => {
                setTimeout(() => {
                    x(0);
                }, intarval);
            })
        }
    }

    IsAwardable(msg: IRankAwardMsg): boolean {
        return msg != null && msg.bonus > 0
    }

    CoinSound1() {
        //开始时播放
    }
    CoinSound2() {
        //金币撞到货币栏时播放
    }
    CoinSound3() {
        //结束时播放
    }

    async PlayCoinFx() {
        this.CoinSound1();
        let endPos = this.coinFxPrefab.parent.convertToNodeSpaceAR((<any>window).coinFxEndPos?.convertToWorldSpaceAR(cc.Vec3.ZERO) || cc.Vec3.ZERO);
        for (let i = 0; i < 20; i++) {
            await delay(20);
            let coinFx = cc.instantiate(this.coinFxPrefab);
            coinFx.setParent(this.coinFxPrefab.parent);
            coinFx.position = cc.v3(-100 + Math.random() * 200, -200 + Math.random() * 200, 0);
            coinFx.opacity = 0;
            coinFx.active = true;
            cc.tween(coinFx).to(0.1, { opacity: 255 }).start();
            cc.tween(coinFx).to(0.4, { position: endPos }, { easing: "cubicIn" }).call(() => {
                this.CoinSound2();
                coinFx.destroy();
            }).start();
        }
        await delay(1000);
        this.CoinSound3();
    }

    csGetTodayRealTimeRankResp(msg: IRankRealTimeMsg) {
        if (msg) {
            brachData.realTimeRank = msg
            console.log("[LuxuryCarRank] GlobalRankUI realtime rank resp", brachData.realTimeRank);
            if (brachData.realTimeRank && brachData.realTimeRank.rank) {
                this.txRank.string = brachData.realTimeRank.rank.toString();
            } else {
                this.txRank.string = "";
            }
            if (!this.awardButton.active) this.rankButton.active = true;
            // this.timezone = "-01:00";
            UpdateOffset(brachData.realTimeRank.timestamp, brachData.realTimeRank.timezone, `initUserRank`);
        }
    }

    async csReceiveDayAwardResp(msg: IRankAwardResp) {
        if (msg) {
            console.log("[LuxuryCarRank] receive day award resp", msg);
            if (msg.code == ETradeCode.success && msg.accountDiamond) {
                // todo: 客户端余额 = resp.accountDiamond
                openUI(this.rankAwardView.node, true, true);
                this.ChangeToRankButton(null);
                let dayRankAward = brachData.dayRankAward;
                this.rankAwardView.Display(dayRankAward);
                this.initUserRank();
                await this.PlayCoinFx();
                (<any>window).onRankAwardFinish?.(msg.accountDiamond);
                await this.WaitFor(() => !this.rankAwardView.node.active, 100);
                dayRankAward.bonus = 0;
            }
            else {
                this.ChangeToRankButton(null);
                console.error(JSON.stringify(msg));
            }
        }
    }

    async csReceiveWeekAwardResp(msg: IRankAwardResp) {
        if (msg) {
            console.log("[LuxuryCarRank] receive week award resp", msg);
            if (msg.code == ETradeCode.success && msg.accountDiamond) {
                // todo: 客户端余额 = resp.accountDiamond
                openUI(this.rankAwardView.node, true, true);
                this.ChangeToRankButton(null);
                let weekRankAward = brachData.weekRankAward;
                this.rankAwardView.Display(weekRankAward);
                this.initUserRank();
                await this.PlayCoinFx();
                (<any>window).onRankAwardFinish?.(msg.accountDiamond);
                await this.WaitFor(() => !this.rankAwardView.node.active, 100);
                weekRankAward.bonus = 0;
            } else {
                this.ChangeToRankButton(null);
                console.error(JSON.stringify(msg));
            }
        }
    }

    update(dt: number):void{
        if(timestampFromServer <= 0){
            return;
        }
        timestampFromServer += dt * 1000;
    }
}
