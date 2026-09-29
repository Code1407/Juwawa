import { gameName, pinusResp, pinusRequestBranch, setActive } from "./GlobalModules";
import { IAntiAddiction, eventId, freezeTime } from "./interface/IAntiAddiction";
import { GameDelay } from "./utl/CCAsync_EX";
import FreezingTimerHawa from "./view/FreezingTimerHawa";

const { ccclass, property } = cc._decorator;

let ignore = false;

let getuid = () => (<any>window).user?.uid;

@ccclass
export default class AntiAddiction extends cc.Component implements IAntiAddiction {
    @property(cc.Node)
    enterGameHawa: cc.Node;
    @property(cc.Node)
    gameWarningHawa: cc.Node;
    @property(cc.Node)
    askFreezeHawa: cc.Node;
    @property(cc.Node)
    btnIgnore1: cc.Node
    @property(cc.Node)
    btnIgnore2: cc.Node
    @property(cc.Node)
    btnLockUser: cc.Node
    @property(FreezingTimerHawa)
    freezeTimerHawa: FreezingTimerHawa;

    @property(cc.Node)
    btn_warning_close: cc.Node;
    @property(cc.Node)
    btn_warning2_enter: cc.Node;
    @property(cc.Node)
    btn_warning2_close: cc.Node;
    async start() {

        await GameDelay(this.node, 0.1);
        while ((<any>window).config == null) {
            await GameDelay(this.node, 0.5);
        }
        if ((<any>window).config?.appExtra?.antiAddiction) {
            (<any>window).checkAddiction = () => this.checkAddiction((<any>window).user.uid);
            this.checkAddiction(getuid());
            pinusResp("onFreezeTime", (data) => {
                this.onFreezeTime(data.sec)
            });
            pinusResp("onAddictionDataResp", (data) => {
                this.onAddictionDataResp(data)
            });
        }
        else {
            (<any>window).checkAddiction = () => { }
        }

        this.btn_warning_close?.on(cc.Node.EventType.TOUCH_END, () => {
            this.eventTracking(getuid(), eventId[eventId.warning_close]);
        });

        this.btn_warning2_enter?.on(cc.Node.EventType.TOUCH_END, () => {
            this.eventTracking(getuid(), eventId[eventId.warning2_enter]);
        });

        this.btn_warning2_close?.on(cc.Node.EventType.TOUCH_END, () => {
            this.eventTracking(getuid(), eventId[eventId.warning2_close]);
        });

        this.btnIgnore1?.on(cc.Node.EventType.TOUCH_END, () => {
            this.ignoreAddiction(getuid())
        });

        this.btnIgnore2?.on(cc.Node.EventType.TOUCH_END, () => {
            this.ignoreAddiction(getuid())
        });

        this.btnLockUser?.on(cc.Node.EventType.TOUCH_END, () => {
            console.log(`touch lockUser button`);
            this.lockUser(getuid(), freezeTime);
            this.onFreezeTime(freezeTime);
        });

        (<any>window).AddictionWarning = () => {
            setActive(this.enterGameHawa, false);
            if ((<any>window).config?.appExtra?.antiAddiction) {
                setActive(this.enterGameHawa, false);
                if (!this.askFreezeHawa.active && !this.freezeTimerHawa.node.active) {
                    if (!this.gameWarningHawa.active)
                        this.eventTracking(getuid(), eventId[eventId.warning_open]);
                    setActive(this.gameWarningHawa, true);
                }
            }
        }
        if ((<any>window).config?.appExtra?.antiAddiction) {
            setActive(this.enterGameHawa, true);
        }
    }
    checkAddiction(uid: string) {
        pinusRequestBranch("AntiAddiction", "checkAddiction", { uid, gameName: gameName() });
    }
    lockUser(uid: string, sec: number) {
        (<any>window).addiction = false;
        pinusRequestBranch("AntiAddiction", "lockUser", { uid, gameName: gameName(), sec });
    }
    ignoreAddiction(uid: string) {
        ignore = true;
        (<any>window).addiction = false;
        pinusRequestBranch("AntiAddiction", "ignoreAddiction", { uid, gameName: gameName() });
    }
    eventTracking(uid: string, eventId: string) {
        pinusRequestBranch("AntiAddiction", "eventTracking", { uid, eventId });
    }
    onFreezeTime(sec: number) {
        if ((<any>window).config?.appExtra?.antiAddiction) {
            setActive(this.enterGameHawa, false);
            if (!this.freezeTimerHawa.node.active)
                this.eventTracking(getuid(), eventId[eventId.freezing_open]);
            this.freezeTimerHawa.SetTimer(sec * 1000);
        }
    }
    onAddictionDataResp(data: { todayWin: number; todayBet: number; todayRound: number; }) {
        console.log(data);
        let flag1 = data.todayWin - data.todayBet <= -1000000 && data.todayRound >= 5;
        let flag2 = data.todayBet > 100000 && data.todayWin / data.todayBet <= 20 / 100 && data.todayRound >= 5;
        // flag1 = data.todayRound >= 5;
        // flag2 = data.todayRound >= 5;
        if (flag1 || flag2) {
            if (!ignore) {
                (<any>window).addiction = true;
            }
        }
    }

}
//三个动作
//第一个动作，我们通知玩家，onWarning
//第二个动作，玩家决定冻结自己，lockUser
//第三个动作，我们给玩家设定倒计时，onFreezeTime