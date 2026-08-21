// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { setActive } from "../GlobalModules";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TradeError extends cc.Component {

    @property(cc.Label)
    code: cc.Label

    Open(info: string) {
        setActive(this.node, true);
        this.code.string = info;
    }
}
