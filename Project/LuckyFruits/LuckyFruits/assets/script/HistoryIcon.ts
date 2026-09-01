// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import ImageCache from "./image/ImageCache";
import { IHistoryItem } from "./interface/ILuckyFruits";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Historyicon extends cc.Component {

    @property(cc.SpriteFrame)
    icon: Array<cc.SpriteFrame> = [];

    // @property(cc.Node)
    // icon: Array<cc.Node> = [];

    @property(cc.Node)
    items: cc.Node = null;

    @property(cc.Sprite)
    goods: Array<cc.Sprite> = []

    static get Instance() {
        return cc.find("Canvas/Game/HistoryBtn").getComponent(Historyicon);
    }

    setIcon(itemValues: IHistoryItem[]) {
        let historyList = itemValues.concat();
        historyList = historyList.reverse();
        historyList.splice(6)


        for (let i = 0; i < historyList.length; i++) {
            this.goods[i + 1].node.active = true;
            this.goods[i + 1].getComponent(cc.Sprite).spriteFrame = this.icon[historyList[i].roundResult];
        }
    }

    addIcon(itemValues: IHistoryItem[]) {
        let historyList = itemValues.concat();
        historyList = historyList.reverse();
        historyList.splice(6)

        for (let i = 0; i < historyList.length; i++) {
            this.goods[i].getComponent(cc.Sprite).spriteFrame = this.icon[historyList[i].roundResult];
        }
        this.items.children[0].opacity = 0;
        let pos = this.items.position.clone();
        cc.tween(this.items)
            .to(0.5, { position: this.items.position.add(cc.v3(106, 0, 0)) }, cc.easeBackOut())
            .call(() => {
                cc.tween(this.items.children[0])
                    .to(0.3, { opacity: 255 })
                    .call(() => {
                        this.setIcon(itemValues)
                        this.items.position = pos;
                        this.items.children[0].opacity = 0;
                    })
                    .start();
            })

            .start();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    // start () {}

    // update (dt) {}
}
