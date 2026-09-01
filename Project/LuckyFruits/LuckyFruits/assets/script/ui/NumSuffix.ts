// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NumSuffix extends cc.Component {

    @property(cc.Label)
    numText: cc.Label = null;

    @property(cc.Label)
    suffix: cc.Label = null;

    protected start(): void {
        setInterval(() => {
            switch (this.numText.string) {
                case "1": this.suffix.string = "st"; break;
                case "2": this.suffix.string = "nd"; break;
                case "3": this.suffix.string = "rd"; break;
                default: this.suffix.string = "th"; break;
            }
        }, 500);
    }

}
