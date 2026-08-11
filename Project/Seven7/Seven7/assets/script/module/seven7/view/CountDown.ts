import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CountDown')
export class CountDown extends Component {
    @property(Label)
    timeLabel: Label;

    /** 每秒触发事件 */
    onSecond: Function = null!;
    /** 倒计时完成事件 */
    onComplete: Function = null!;

    private countDown: number = 0;
    private endTime: number = 0;
    private lastSecond: number = -1;
    private getNow: Function = null!;

    public clear() {
        this.onSecond = null;
        this.onComplete = null;
        this.countDown = 0;
        this.endTime = 0;
        this.lastSecond = -1;
        this.getNow = null!;
        this.stopCountdown();
    }

    public stopCountdown() {
        this.timingEnd();
        this.timeLabel.string = "0";
    }

    public setTime(second: number) {
        if (second <= 0) {
            return;
        }
        this.endTime = 0;
        this.getNow = null!;
        this.lastSecond = -1;
        this.countDown = second;
        this.timingEnd();
        this.timingStart();
        this.refreshLabel();
    }

    public setEndTime(endTime: number, getNow: Function) {
        this.endTime = endTime;
        this.getNow = getNow;
        this.lastSecond = -1;
        this.timingEnd();
        this.refreshByEndTime();
        this.schedule(this.refreshByEndTime, 0.2);
    }

    private refreshLabel() {
        this.timeLabel.string = this.countDown.toString();
    }

    private onScheduleSecond() {
        this.countDown--;
        this.refreshLabel();
        if (this.onSecond) this.onSecond(this.node, this.countDown);

        if (this.countDown == 0) {
            this.onScheduleComplete();
        }
    }

    private onScheduleComplete() {
        this.timingEnd();
        this.refreshLabel();
        if (this.onComplete) this.onComplete(this.node);
    }

    private refreshByEndTime() {
        if (this.endTime <= 0 || !this.getNow) {
            this.timingEnd();
            return;
        }

        let nowTime = this.getNow();
        let second = Math.max(0, Math.ceil(this.endTime - nowTime));
        this.countDown = second;
        this.refreshLabel();

        if (second != this.lastSecond) {
            this.lastSecond = second;
            if (this.onSecond) this.onSecond(this.node, second);
        }

        if (second <= 0) {
            this.onScheduleComplete();
        }
    }

    private timingStart() {
        this.schedule(this.onScheduleSecond, 1);
    }

    private timingEnd() {
        this.unscheduleAllCallbacks();
    }

}




