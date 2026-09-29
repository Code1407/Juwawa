// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { setActive } from "../GlobalModules";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FreezingTimerHawa extends cc.Component {

    @property(cc.RichText)
    timer: cc.RichText

    timeForUnlock: number = 0;

    format: Intl.DateTimeFormatOptions = {
        timeZone: `UTC`,
        hour: `2-digit`,
        minute: `2-digit`,
        second: `2-digit`,
        hour12: false,
    }

    SetTimer(timestamp: number) {
        if (timestamp > 0) {
            setActive(this.node, true);
            this.timeForUnlock = Date.now() + timestamp;
        }
    }
    protected update(dt: number): void {
        if (Date.now() > this.timeForUnlock) {
            setActive(this.node, false);
        }
        this.timer.string = Intl.DateTimeFormat('en-US', this.format).format(this.timeForUnlock - Date.now())
    }
}
