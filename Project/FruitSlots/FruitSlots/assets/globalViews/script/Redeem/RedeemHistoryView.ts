import { RedeemHistoryUIItem } from "./RedeemHistoryUIItem";

const { ccclass, property } = cc._decorator;
@ccclass
export class RedeemHistoryView extends cc.Component {
    @property(RedeemHistoryUIItem)
    items: RedeemHistoryUIItem[] = [];
    DisplayRedeemHistory(data: number[]) {
        for (let i = 0; i < this.items.length; i++) {
            if (i < data.length) {
                this.items[i].boxFx.active = true;
                this.items[i].boxIcon.SwitchIcon(i + 5);
                this.items[i].winAmount.string = data[i].toString();
            } else {
                this.items[i].boxFx.active = false;
                this.items[i].boxIcon.SwitchIcon(i);
                this.items[i].winAmount.string = "";
            }
        }
    }
}