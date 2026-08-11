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
    @property(cc.Label)
    log: cc.Label = null;
    static realTime: number = 0;
    /**单位 秒*/
    static runTime: number = 0;
    static offset: number = 0;
    protected start(): void {
        // let xhr = new XMLHttpRequest();
        // xhr.onreadystatechange = () => {
        //     if (xhr.readyState == XMLHttpRequest.DONE) {
        //         console.log(JSON.parse(xhr.response)[`unixtime`]);
        //         console.log(`resive`, Date.now());
        //     }
        // }
        // let calibration = () => {
        //     console.log(`send`, Date.now());
        //     xhr.open(`GET`, `http://worldtimeapi.org/api/timezone/utc`);
        //     xhr.send();
        // }
        // calibration();
        // setInterval(() => {
        //     calibration();
        // }, 5000)
        // console.error(`gettime`, new Date().getTime(), `now`, Date.now());
        if (this.log != null) {
            cc.tween(this.node).repeatForever(cc.tween(this.node).delay(0.1).call(() => {
                this.log.string = (CCDate.realTime / 1000).toFixed().toString();
            })).start();
        }
    }
    update(dt: number) {
        window[`realTime`] = CCDate.realTime = Date.now() + (speed - 1) * CCDate.runTime * 1000 + CCDate.offset;
        window[`runTime`] = CCDate.runTime += dt * speed;
        // if (this.log) {
        //     this.log.string = CCDate.offset.toString();
        // }
    }
}