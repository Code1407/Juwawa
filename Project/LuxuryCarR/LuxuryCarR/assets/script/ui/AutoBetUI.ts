// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import Audio from "../Audio";
import { Effect } from "../effect/FlyDiamond";
import Game from "../Game";
import { coolDownTime, gGameData, roundBetCountMax } from "../GameData";
import { arraySum } from "../interface/ILuxuryCarR";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import PlayerAccount from "../PlayerAccount";
import ChipMoveNodeUI from "./ChipMoveNodeUI";

const { ccclass , property} = cc._decorator;

@ccclass
export default class AutoBetUI extends cc.Component {

    @property(cc.Node)
    AutoBg2: cc.Node = null;

    private autoBet: boolean = false;
    private autoBetting: boolean = false;
    private lastClickTime: number = 0;
    /** 当前局未下注时立即执行；当前局已有下注时从下一局执行。 */
    private autoBetStartRound: number = 0;

    private setCoolDown() {
        gGameData.roundBetCount++;
        gGameData.coolDown = true;
        setTimeout(() => {
            gGameData.coolDown = false;
        }, coolDownTime);
    }
    async onClick(e?: cc.Event) {
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        const now = Date.now();
        if (now - this.lastClickTime < 80) return;
        this.lastClickTime = now;
        (<any>window).updateAutoQuit?.();

        if ([EGameStatus.stop].includes(gGameData.status)) return;
        if (gGameData.coolDown || gGameData.roundBetCount > roundBetCountMax) return;

        let player = PlayerAccount.Instance;
        if (!player) return;
        if (!this.autoBet && !player.hasLastWheel()) return;

        this.setCoolDown();
        this.autoBet = !this.autoBet
        const shouldBetCurrentRound = this.autoBet && !player.getHasBet();
        this.autoBetStartRound = this.autoBet
            ? gGameData.roundStep.todayRound + (shouldBetCurrentRound ? 0 : 1)
            : 0;
        this.switchButton();

        if (shouldBetCurrentRound) await this.tryAutoBetNow();
    }

    async tryAutoBetNow() {
        if (!this.autoBet || this.autoBetting) return;
        if (gGameData.status != EGameStatus.bet) return;
        if (gGameData.roundStep.remainSecond <= 3) return;
        if (gGameData.roundStep.todayRound < this.autoBetStartRound) return;

        let player = PlayerAccount.Instance;
        if (!player || !player.hasLastWheel() || player.getHasBet()) return;

        let moreChip: number = 0;
        let wheelAmount = player.lastWheelChipAmount.map(row => row.slice());
            let gradeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (let index = 0; index < wheelAmount.length; index++) {
                gradeList[index] = arraySum(wheelAmount[index]) > 0 ? 1 : 0;
            }
        this.autoBetting = true;
        let betResp;
        try {
            betResp = await player.bet(gGameData.roundStep.todayRound, gradeList, wheelAmount);
        } catch (error) {
            console.warn("auto bet failed", error);
        } finally {
            this.autoBetting = false;
        }
            if (!betResp || betResp.code !== ETradeCode.success) {
                this.setAutoBet(false);
                return;
            }
            for (let index = 0; index < wheelAmount.length; index++) {
                const element = wheelAmount[index];
                for (let j = 0; j < element.length; j++) {
                    let flyNum = element[j];
                    if (flyNum > 10) {
                        flyNum = 10;
                    }
                    moreChip += flyNum;
                    if (betResp.code == ETradeCode.success) {
                        for (let k = 0; k < flyNum; k++) {
                            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode, ChipMoveNodeUI.Instance.items[index], j, index, true, 2000);

                            if (Game.Instance.player.accountDiamond >= Game.Instance.balanceNum) {
                                for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
                                    Game.Instance.bettingBox.myBetNum[index].active = true;
                                }
                            }
                        }
                    }
                }
            }
            if (moreChip > 1) {
                Audio.Instance.playfly();
            }
            else {
                Audio.Instance.playsendBet();
            }
    }

    getAutoBet() {
        return this.autoBet;
    }

    setAutoBet(autoBet: boolean) {
        this.autoBet = autoBet;
        this.autoBetStartRound = autoBet ? gGameData.roundStep.todayRound + 1 : 0;
        this.switchButton();
    }

    switchButton() {
       // 自动下注期间由游戏持续代替玩家操作，不应被全局挂机检测判定为未操作。
       // 关闭 Auto 后不主动刷新倒计时，沿用最后一次真实/自动操作的时间。
       (<any>window).isAutoBetActive = this.autoBet;
       this.AutoBg2.active = this.autoBet;
    }

    onDestroy() {
        (<any>window).isAutoBetActive = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.switchButton();

        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.coolDown == true) return;
            // this.node.scaleX = this.node.scaleY = 1.2;
        });
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
        cc.find("Button", this.node).on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
    }

    // update (dt) {}
}
