// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { sdk }  from "../../shared/Common";

const {ccclass} = cc._decorator;

@ccclass
export default class AccountUI extends cc.Component {

    onClick(e: cc.Event) {   
        sdk.recharge()
        return;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // update (dt) {}
}
