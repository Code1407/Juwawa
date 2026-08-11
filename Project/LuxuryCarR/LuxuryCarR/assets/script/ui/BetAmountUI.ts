// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import Audio from "../Audio";
import { gGameData } from "../GameData";
import { EGameStatus } from "../../shared3/interface/IGame";


const { ccclass } = cc._decorator;

@ccclass
export default class BetAmountUI extends cc.Component {

    buttonIndex: number = 0;
    items: Array<cc.Node> = null;
    isChecked: boolean[] = []; // 用于记录每个按钮是否被选中过

    onClick(e: cc.Event) {
        if ([EGameStatus.final, EGameStatus.stop].includes(gGameData.status)) return;

        Audio.Instance.playchangebet();
        const previousIndex = gGameData.betAmountIndex; // 获取当前选中的按钮索引
        gGameData.betAmountIndex = this.buttonIndex;
        Game.Instance.player.setBetAmountButton(gGameData.betAmountIndex);
        for (let i = 0; i < this.items.length; ++i) {

            this.items[i].stopAllActions();

            // 更新UI状态
            const isActive = gGameData.betAmountIndex === i;
            cc.find("BetAmount/bg2", this.items[i]).active = isActive;

            // 只有在按钮状态改变时才执行动画
            if (isActive && previousIndex !== i) { // 状态从非选中变为选中
                let moveAction = cc.moveTo(0.3, 0, 2);
                this.items[i].runAction(moveAction);
            } else if (!isActive && previousIndex === i) { // 状态从选中变为非选中
                let moveAction02 = cc.moveTo(0.3, 0, -38);
                this.items[i].runAction(moveAction02);
            }
        }
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            if (gGameData.status in [EGameStatus.bet, EGameStatus.run, EGameStatus.run2final])
                this.node.scaleX = this.node.scaleY = 1.1; // this.dark(); 
        });
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
    }

    // update (dt) {}
}
