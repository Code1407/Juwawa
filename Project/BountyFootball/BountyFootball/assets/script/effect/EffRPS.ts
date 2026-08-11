// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:

import Game from "../Game";
import Audio from "../Audio";

//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
const { ccclass, property } = cc._decorator;

@ccclass
export default class EffRPS extends cc.Component {

    @property(sp.Skeleton)
    footballTX: sp.Skeleton = null;  //足球射门

    Play() {
        this.node.active = true;

        setTimeout(() => {
            this.footballTX.node.active = true;
            this.footballTX.setAnimation(1, "animation", false);
            Audio.Instance.StartSelect();

            setTimeout(() => {
                this.node.active = false;
                this.footballTX.node.active = false;

            }, 1000)

        }, 1500)


    }

}
