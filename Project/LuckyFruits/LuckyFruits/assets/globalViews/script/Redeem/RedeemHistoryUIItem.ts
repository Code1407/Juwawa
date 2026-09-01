import UIIcon from "../ui/UIIcon";

const { ccclass, property } = cc._decorator;
@ccclass
export class RedeemHistoryUIItem extends cc.Component {
    @property(cc.Node)
    boxFx: cc.Node = null;
    @property(UIIcon)
    boxIcon: UIIcon = null;
    @property(cc.Label)
    winAmount: cc.Label = null;
}