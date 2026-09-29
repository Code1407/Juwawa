// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { LocalizedSprite } from "../../lang/LocalizedSprite";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RuleView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
        });

        this.setRuleLabel();
    }

    protected onEnable(): void {
        this.node.parent.zIndex = this.node.parent.children.length+100;
    }


    // 需要实现国际化支持   

    //国际化节点
    @property({type: cc.Sprite, displayName: "规则节点"})
    lage_6: cc.Sprite = null;

    // 根据当前语言加载 NewPng/Language/<语言>/lage_6，并在缺失时回退英文。
    setRuleLabel(): void {
        LocalizedSprite.refreshSprite(this.lage_6);
    }


}
