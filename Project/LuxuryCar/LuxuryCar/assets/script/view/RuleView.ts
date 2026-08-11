// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class RuleView extends cc.Component {

    @property(cc.Label)
    contentLabel: cc.Label = null;

    start() {
        if ((<any>window).showGameVersion) {
            this.contentLabel.string += `\n${(<any>window).gameVersion}`;
        }
    }
}
