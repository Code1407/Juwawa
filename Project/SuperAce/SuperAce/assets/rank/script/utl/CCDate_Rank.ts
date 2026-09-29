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