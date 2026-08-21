// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { sdk } from "../shared/Common";

export let gameExtra = () => (<any>window).config?.gameExtra;

const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfigShow extends cc.Component {
    @property(cc.Node)
    rateContent: cc.Node = null;
    async start() {
        await sdk.init();
        this.rateContent.active = gameExtra()?.publicGameRate as boolean;
    }
}
