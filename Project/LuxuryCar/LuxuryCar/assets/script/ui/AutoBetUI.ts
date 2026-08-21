// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import Audio from "../Audio";
import { Effect } from "../effect/FlyDiamond";
import { coolDownTime, gGameData, roundBetCountMax } from "../GameData";
import { arraySum } from "../interface/ILuxuryCar";
import { EGameStatus, ETradeCode } from "../../shared3/interface/IGame";
import PlayerAccount from "../PlayerAccount";
import ChipMoveNodeUI from "./ChipMoveNodeUI";
import { updateAutoQuit } from "../../shared2/GlobalViewsLoader";

const {ccclass} = cc._decorator;

@ccclass
export default class AutoBetUI extends cc.Component {

    private autoBet: boolean = false;
    /** 只防止同一时间重复发起请求；失败不会关闭自动下注。 */
    private autoBetting: boolean = false;
    private lastClickTime: number = 0;
    /** Auto 最早允许执行的回合：当前局未下注时为当前局，否则为下一局。 */
    private autoBetStartRound: number = 0;
    

    private setCoolDown() {
        gGameData.roundBetCount++;
        gGameData.coolDown = true;
        setTimeout(()=>{
            gGameData.coolDown = false;
        }, coolDownTime);
    }
    async onClick(e?: cc.Event) {
        if (e && typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
        const now = Date.now();
        if (now - this.lastClickTime < 80) {
            return;
        }
        this.lastClickTime = now;

        if ([EGameStatus.stop].includes(gGameData.status)) return;
        if (gGameData.coolDown || gGameData.roundBetCount > roundBetCountMax) return;

        
        let player = PlayerAccount.Instance;
        if (!player) return;

        // Auto requires a reusable bet snapshot. A manual bet creates it locally;
        // enterGame/synchronize can also restore it from this scene's own bet data.
        // Without either source, keep the touch animation but do not enable Auto.
        if (!this.autoBet && !player.hasLastWheel()) {
            updateAutoQuit();
            return;
        }

        this.setCoolDown();
        this.autoBet = !this.autoBet
        const shouldBetCurrentRound = this.autoBet && !player.getHasBet();
        this.autoBetStartRound = this.autoBet
            ? gGameData.roundStep.todayRound + (shouldBetCurrentRound ? 0 : 1)
            : 0;
        this.switchButton();
        updateAutoQuit();

        if (shouldBetCurrentRound) {
            await this.tryAutoBetNow();
        }
    }

    async tryAutoBetNow() {
        if (!this.autoBet || this.autoBetting) return;
        if (gGameData.status != EGameStatus.bet) return;
        if (gGameData.roundStep.remainSecond <= 3) return;
        if (gGameData.roundStep.todayRound < this.autoBetStartRound) return;

        let player = PlayerAccount.Instance;
        if (!player || !player.hasLastWheel() || player.getHasBet()) return;

        // 请求期间保留快照，避免下注记录更新影响当前请求和动画。
        let wheelAmount = player.lastWheelChipAmount.map((amount) => amount.slice());
        let gradeList = [0,0,0,0,0,0,0,0,0,0];
        for (let index = 0; index < wheelAmount.length; index++) {
            gradeList[index] = arraySum(wheelAmount[index])>0?1:0;
        }

        const requestRound = gGameData.roundStep.todayRound;
        this.autoBetting = true;
        let betResp;
        try {
            betResp = await player.bet(requestRound,gradeList,wheelAmount);
        } catch (error) {
            console.warn("auto bet failed; automatic betting will stop", error);
        } finally {
            this.autoBetting = false;
        }
        if (!betResp || betResp.code != ETradeCode.success) {
            this.setAutoBet(false);
            return;
        }
        updateAutoQuit();

        let moreChip:number = 0;
        for (let index = 0; index < wheelAmount.length; index++) {
            const element = wheelAmount[index];
            for (let j = 0; j <element.length; j++) {
                let flyNum = element[j];
                if(flyNum > 10){
                    flyNum = 10;
                }
                moreChip += flyNum;
                for (let k = 0; k < flyNum; k++) {
                    Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode, ChipMoveNodeUI.Instance.items[index],j,index,true,2000);
                }
            }
        }
        if(moreChip > 1){
            Audio.Instance.playfly();
        }
        else if(moreChip > 0){
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
        (<any>window).isAutoBetActive = this.autoBet;
        cc.find("Button/bg1", this.node).active = !this.autoBet;
        cc.find("Button/bg2", this.node).active = this.autoBet;
    }

    onDestroy() {
        (<any>window).isAutoBetActive = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.switchButton();
        const button = cc.find("Button", this.node);
        const bg1 = cc.find("Button/bg1", this.node);
        const bg2 = cc.find("Button/bg2", this.node);

        // if (button && bg1) {
        //     button.setContentSize(Math.max(button.width, bg1.width), Math.max(button.height, bg1.height));
        // }

        const bindClick = (node: cc.Node) => {
            if (!node) return;
            node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                this.node.scaleX = this.node.scaleY = 1;
                this.onClick(event);
            }, this);
        };

        bindClick(button);
        // bindClick(bg1);
        // bindClick(bg2);

        if (button) {
            button.on(cc.Node.EventType.TOUCH_START, () => {
                if (gGameData.coolDown == true) return;
                this.node.scaleX = this.node.scaleY = 1.2;
            });
            button.on(cc.Node.EventType.TOUCH_END, () => {
                this.node.scaleX = this.node.scaleY = 1; // this.recover();
            });
            button.on(cc.Node.EventType.TOUCH_CANCEL, () => {
                this.node.scaleX = this.node.scaleY = 1; // this.recover();
            });
        }
    }

    // update (dt) {}
}
