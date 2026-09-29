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

    public clear() {
        this.onSecond = null;
        this.onComplete = null;
        this.countDown = 0;
        this.timingEnd();
        this.timeLabel.string = "0";
    }

    public stopCountdown() {
        this.timingEnd();
        this.timeLabel.string = "0";
    }

    public setTime(second: number) {
        if (second <= 0) {
            return;
        }
        this.countDown = second;
        this.timingEnd();
        this.timingStart();
        this.refreshLabel();
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

    private timingStart() {
        this.schedule(this.onScheduleSecond, 1);
    }

    private timingEnd() {
        this.unscheduleAllCallbacks();
    }

}




