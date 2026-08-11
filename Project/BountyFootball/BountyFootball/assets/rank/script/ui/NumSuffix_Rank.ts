const { ccclass, property } = cc._decorator;

@ccclass
export default class NumSuffix extends cc.Component {

    @property(cc.Label)
    numText: cc.Label = null;

    @property(cc.Label)
    suffix: cc.Label = null;

    protected start(): void {
        cc.tween(this.node).repeatForever(cc.tween(this.node).delay(0).call(() => {
            this.suffix.string = NumSuffix.GetSuffix(this.numText.string);
        })).start();
    }
    static GetSuffix(num: string): string {
        switch (num) {
            case "": return "";
            case "0": return "";
            case "1": return "st";
            case "2": return "nd";
            case "3": return "rd";
            default: return "th";
        }
    }
}
