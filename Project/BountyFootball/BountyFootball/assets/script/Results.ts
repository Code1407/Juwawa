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
        let startIndex = this.items.length - latestValues.length;

        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];
            let spriteComponent = item.getComponent(cc.Sprite);
            item.scaleX = 0.28;
            item.scaleY = 0.28;

            // The server may return fewer history records than there are display
            // slots. Keep those records right-aligned and clear the empty slots.
            let valueIndex = i - startIndex;
            if (valueIndex < 0) {
                spriteComponent.spriteFrame = null;
                continue;
            }

            let result = latestValues[valueIndex];
            let sprite = goods[result];
            if (result == null || !sprite) {
                cc.warn("[BountyFootball Results] invalid history result", { index: i, result, values });
                spriteComponent.spriteFrame = null;
                continue;
            }
            spriteComponent.spriteFrame = sprite;
        }
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.node.addComponent(ColorChange);
    }

    // start() {}

    // update (dt) {}
}
