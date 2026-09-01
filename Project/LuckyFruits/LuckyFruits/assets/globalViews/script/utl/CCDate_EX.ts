// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
const { ccclass, property } = cc._decorator;
let speed = 1;
@ccclass()
export default class CCDate extends cc.Component {
    static realTime: number = 0;
    /**单位 秒*/
    static runTime: number = 0;
    update(dt: number) {
        CCDate.realTime = Date.now() + (speed - 1) * CCDate.runTime * 1000;
        CCDate.runTime += dt * speed;
    }
}