import { simplifyNumber } from "../../shared/Common";
import { IsRedeemOpenable, RedeemData, RedeemOpenAward } from "../../shared2/GlobalViewsLoader";
import { DateTimeFormat } from "../function";

const { ccclass, property } = cc._decorator;

const timeDay = 24 * 60 * 60 * 1000;
const timeHour = 60 * 60 * 1000;

@ccclass
export default class RedeemView extends cc.Component {
    @property(cc.Node)
    redeemRule: cc.Node = null;
    @property(cc.Label)
    timeLeftLabel: cc.Label = null;
    @property(cc.Label)
    betLevelsLabel: cc.Label[] = [];
    @property(cc.ProgressBar)
    totalBetProgressBars: cc.ProgressBar[] = [];
    @property(sp.Skeleton)
    boxAnims: sp.Skeleton[] = [];
    @property(cc.Button)
    btnsOpenRedeem: cc.Button[] = [];
    protected start(): void {
        // window["boxAnim"] = this.boxAnims[0];
        for (let i = 0; i < this.totalBetProgressBars.length; i++) {
            let progressBar = this.totalBetProgressBars[i];
            progressBar.progress = 0;
        }
        for (let i = 0; i < this.betLevelsLabel.length; i++) {
            this.betLevelsLabel[i].string = "";
        }
        let blockedInterval = false;
        for (let i = 0; i < this.btnsOpenRedeem.length; i++) {
            let index = i;
            this.btnsOpenRedeem[i].node.on(cc.Node.EventType.TOUCH_END, () => {
                if (IsRedeemOpenable()) {
                    RedeemOpenAward();
                    blockedInterval = true;
                    cc.Tween.stopAllByTarget(this.boxAnims[index]);
                    cc.tween(this.boxAnims[index]).delay(3).call(() => {
                        blockedInterval = false;
                    }).start();
                    this.PlayBoxAnim(this.boxAnims[index], index, 4, false);
                }
                else {
                    cc.Tween.stopAllByTarget(this.redeemRule);
                    this.redeemRule.active = true;
                    this.redeemRule.opacity = 255;
                    cc.tween(this.redeemRule).delay(3).to(0.5, { opacity: 0 }).call(() => {
                        this.redeemRule.active = false;
                    }).start();
                }
            })
        }
        let redeemData = RedeemData();
        let timeLeftServer = 0;
        let offsetTime = 0;
        let lastTimeStamp = 0;
        setInterval(() => {
            redeemData = RedeemData();
            if (redeemData && !blockedInterval) {
                if (lastTimeStamp != redeemData.timestamp) {
                    lastTimeStamp = redeemData.timestamp;
                    offsetTime = Date.now() - redeemData.timestamp;
                }
                timeLeftServer = redeemData.endTime - (Date.now() - offsetTime);
                if (timeLeftServer > timeDay) {
                    this.timeLeftLabel.string = DateTimeFormat(timeLeftServer, { day: true, hour: true, char: "-" }, true);
                }
                else if (timeLeftServer > timeHour) {
                    this.timeLeftLabel.string = DateTimeFormat(timeLeftServer, { hour: true, minute: true, char: ":" });
                }
                else {
                    this.timeLeftLabel.string = DateTimeFormat(timeLeftServer, { minute: true, second: true, char: ":" });
                }
                for (let i = 0; i < this.betLevelsLabel.length; i++) {
                    this.betLevelsLabel[i].string = simplifyNumber(redeemData.betLevel[i]);
                }
                let rate = 0;
                for (let i = 0; i < this.totalBetProgressBars.length; i++) {
                    let progressBar = this.totalBetProgressBars[i];
                    if (redeemData.got == i) {
                        if (redeemData.totalBet < redeemData.betLevel[i]) {
                            let max = redeemData.betLevel[i] - (redeemData.betLevel[i - 1] || 0);
                            let cur = redeemData.totalBet % max;
                            cc.tween(progressBar)
                                .to(0.5, { progress: cur / max })
                                .start();
                            rate = cur / max;
                        }
                        else {
                            cc.tween(progressBar)
                                .to(0.5, { progress: 1 })
                                .start();
                            rate = 1;
                        }
                    }
                    else if (redeemData.got < i) {
                        progressBar.progress = 0;
                    }
                    else {
                        progressBar.progress = 1;
                    }
                }
                for (let i = 0; i < this.boxAnims.length; i++) {
                    let box = this.boxAnims[i];
                    box.node.color = cc.Color.WHITE;
                    if (redeemData.got == i) {
                        this.UpdateBoxStatus(box, i, rate);
                    }
                    else {
                        this.UpdateBoxStatus(box, i, 0);
                        if (redeemData.got > i)
                            box.node.color = cc.Color.GRAY;
                    }
                }
            }
        }, 200);
    }

    UpdateBoxStatus(box: sp.Skeleton, boxIndex: number, rate: number) {
        let curAnim = box.animation;
        // 一共5个箱子，每个箱子6个动画，比如，index=0-5是第一个箱子，index=6-11是第二个箱子
        // 再举例第一个箱子的动画，index=0-3抖动，index=4打开，index=5静止，那么第二个箱子的动画就是index=6-9抖动，index=10打开，index=11静止
        // 接下来就是计算某个箱子的某个动画的index
        let animIndex = (Math.floor(rate * 4) + 5) % 6;
        let targetAnim = Object.keys(box.skeletonData.skeletonJson.animations)[animIndex + boxIndex * 6];
        box.timeScale = 1 + rate;
        if (curAnim == targetAnim)
            return;
        this.PlayBoxAnim(box, boxIndex, animIndex, true);
        console.log("UpdateBoxStatus", boxIndex, rate, targetAnim);
    }

    PlayBoxAnim(box: sp.Skeleton, boxIndex: number, animIndex: number, loop: boolean) {
        let curAnim = box.animation;
        let targetAnim = Object.keys(box.skeletonData.skeletonJson.animations)[animIndex + boxIndex * 6];
        if (curAnim == targetAnim)
            return;
        box.setAnimation(0, targetAnim, loop);
    }
}
