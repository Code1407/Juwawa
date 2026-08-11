// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Wheels from "../Wheels";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ReadyView extends cc.Component {
    @property(cc.Node)
    onNode2: cc.Node = null;
    @property(cc.Node)
    onNode3: cc.Node = null;

    @property(sp.Skeleton)
    Stop: sp.Skeleton = null;  //球门特效
    @property(sp.Skeleton)
    ReadyGo: sp.Skeleton = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }
    updateTime(second: number) {
        if (second <= 3) {
            this.node.active = true;
            this.node.opacity = 255;
            switch (second) {
                case 3:
                    this.Stop.node.active = true;
                    this.Stop.setAnimation(1, "animation", false);
                    Audio.Instance.CountDown();
                    Audio.Instance.playstop_selection();
                    this.onNode2.active = false;
                    // this.onNode3.active = false;
                    Wheels.Instance.startADD();
                    break;
                case 2:
                    this.Stop.node.active = false;
                    this.onNode2.active = true;
                    Audio.Instance.CountDown();
                    this.ReadyGo.setAnimation(1, "animation", false);
                    Audio.Instance.ready();
                    // this.onNode3.active = false;
                    break;
                case 1:
                    this.Stop.node.active = false;
                    // this.onNode3.active = true;
                    Audio.Instance.CountDownEnd();
                    // Audio.Instance.go();
                    cc.tween(this.node).delay(1).to(1, { opacity: 0 }).call(() => {
                        this.node.active = false;
                        this.onNode2.active = false;
                    }).start();
                    break;
                default:

                    break;
            }
        }
    }

    // update (dt) {}
}
