// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { timeToAutoQuit } from "../AutoQuit";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TimerToQuit_EX extends cc.Component {

    @property(cc.Label)
    timer: cc.Label
    protected update(dt: number): void {
        this.timer.string = Math.round((timeToAutoQuit - new Date().getTime()) / 1000).toString();
    }
}
