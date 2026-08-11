import { _decorator, Label } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { Utils } from "db://assets/script/framework/utils/Utils"
import { UISeven7MyBetRewardItem } from "db://assets/script/module/seven7/view/UISeven7MyBetRewardItem";
import { oops } from 'db://oops-framework/core/Oops';

const { ccclass, property } = _decorator;

@ccclass('UISeven7MyBetsHistroyItem')
export class UISeven7MyBetsHistroyItem extends GameComponent {

    @property(Label)
    timeLabel: Label;

    @property(UISeven7MyBetRewardItem)
    betItems: Array<UISeven7MyBetRewardItem> = [];

    @property(UISeven7MyBetRewardItem)
    resultItems: Array<UISeven7MyBetRewardItem> = [];

    init(data: HistoryData) {
        this.resultItems.forEach((item) => {
            item.node.active = false;
        })

        if (data == null) {
            return;
        }

        if (data.prepareTime && data.prepareTime > 0) {
            const date = new Date(data.prepareTime * 1000);
            let labTime1 = Utils.getFormateDate(date, "yyyy/M/d");
            let labTime2 = Utils.getFormateDate(date, "h:m:s");
            let r = Utils.getRound(data.round);
            let labRound = oops.language.getLanguage("common_Round_text", r);
            let timeStr = labTime1 + "\n" + labTime2 + "\n" + labRound;
            this.timeLabel.string = timeStr;
        }

        if (data.betMap) {
            for (let index = 0; index < this.betItems.length; index++) {
                let rewardID = index + 1;
                let str = rewardID.toString()
                let betNum = data.betMap[str] || 0
                this.betItems[index].init(rewardID, betNum);
            }
        }

        if (data.result) {
            for (let index = 0; index < this.resultItems.length; index++) {
                let rewardID = index + 1;
                let item = this.resultItems[index];
                for (let key in data.result) {
                    let reward = Number(key)
                    if (rewardID == reward) {
                        item.init(reward, data.result[key]);
                        item.node.active = true;
                    }
                }
            }
            //let index = 0;
            // for (let key in data.result) {
            //     let item = this.resultItems[index];
            //     item.init(Number(key), data.result[key]);
            //     item.node.active = true;
            //     index++;
            // }
        }
    }
}


