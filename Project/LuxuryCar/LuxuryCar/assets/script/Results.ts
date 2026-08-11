// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ImageCache from "./image/ImageCache";
import { gGameData } from "./GameData";
import ColorChange from "./effect/ColorChange";
import { EGameStatus } from "../shared3/interface/IGame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Results extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];
    inFinal: Boolean = false;
    changeGameStatus(status: EGameStatus) {
        switch (status) {
            case EGameStatus.bet:
                this.enterBet();
                this.inFinal = false;
                break;
            case EGameStatus.final:
                this.enterFinal();
                break;
            default:
                this.inFinal = false;
        }
    }

    enterBet() {
        this.node.getComponent(ColorChange).recover();
    }

    enterFinal() {
        if (!this.inFinal) {
            let result = gGameData.roundStep.result;
            gGameData.historyResults.push(result);
            while (gGameData.historyResults.length > 20) {
                gGameData.historyResults.shift();
            }
        }
        this.inFinal = true;

        this.node.getComponent(ColorChange).dark();
        this.assignValue(gGameData.historyResults);
    }

    assignValue(values: number[]) {
        let goods = ImageCache.Instance.goods;
        let latestValues = (values || []).slice(-this.items.length);

        for (let i = 0; i < this.items.length; ++i) {
            let visualIndexFromLeft = this.items.length - 1 - i;
            let result = latestValues[latestValues.length - 1 - visualIndexFromLeft];
            let sprite = goods[result];
            if (result == null || !sprite) {
                cc.warn("[LuxuryCar Results] invalid history result", { index: i, result, values });
                continue;
            }
            this.items[i].getComponent(cc.Sprite).spriteFrame = sprite;
        }
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.node.addComponent(ColorChange);
    }

    // start() {}

    // update (dt) {}
}
