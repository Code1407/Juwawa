// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { LocalizedSprite } from "../../lang/LocalizedSprite";

const {ccclass, property} = cc._decorator;


//RuleContent 需要实现国际化支持
// 根据当前语言加载 NewPng/Language/<语言>/lage_6，并在缺失时回退英文。

@ccclass
export default class RuleContent extends cc.Component {

    @property({type: cc.Sprite, displayName: "lage_14"})
    lage_14: cc.Sprite = null;


    @property({type: cc.Sprite, displayName: "lage_10"})
    lage_10: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_11"})
    lage_11: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_12"})
    lage_12: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_13"})        
    lage_13: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_7"})
    lage_7: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_8"})
    lage_8: cc.Sprite = null;

    @property({type: cc.Sprite, displayName: "lage_9"})
    lage_9: cc.Sprite = null;



    start () {
        this.setRuleLabel();
    }

    // 根据当前语言加载 NewPng/Language/<语言>/lage_6，并在缺失时回退英文。
    setRuleLabel(): void {
        LocalizedSprite.refreshSprite(this.lage_14);
        LocalizedSprite.refreshSprite(this.lage_10);
        LocalizedSprite.refreshSprite(this.lage_11);
        LocalizedSprite.refreshSprite(this.lage_12);
        LocalizedSprite.refreshSprite(this.lage_13);
        LocalizedSprite.refreshSprite(this.lage_7);
        LocalizedSprite.refreshSprite(this.lage_8);
        LocalizedSprite.refreshSprite(this.lage_9);
    }

    // update (dt) {}
}
