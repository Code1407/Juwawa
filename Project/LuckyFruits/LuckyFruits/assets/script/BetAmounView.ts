// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BetAmountUI from "./ui/BetAmountUI";
import { gGameData } from "./GameData";
import ImageCache from "./image/ImageCache";
import { getBetGradeAmounts } from "./interface/ILuckyFruits";
import { DEFAULT_BET_GRADE_AMOUNTS } from "../shared/Common";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BetAmounView extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];
    betGradeAmountsLength: number = 0;

    private readonly configRefreshHandler = () => this.refreshFromConfig();

    onLoad() {
        // MessageRouter在鉴权后会用服务端Costs替换本地面额，通过此回调立即刷新UI。
        (<any>window).changedw = this.configRefreshHandler;
    }

    onDestroy() {
        if ((<any>window).changedw === this.configRefreshHandler) {
            delete (<any>window).changedw;
        }
    }

    setState() {
        this.refreshFromConfig();
        // 仅由网络入场数据初始化完成后的调用负责首次显示。
        this.node.active = true;
    }

    protected onEnable(): void {
        this.refreshFromConfig();
    }

    private refreshFromConfig(): void {
        const formatBetAmount = (amount: number): string => {
            if (amount >= 1000000 && amount % 1000000 === 0) {
                return (amount / 1000000) + "m";
            }
            if (amount >= 1000 && amount % 1000 === 0) {
                return (amount / 1000) + "k";
            }
            return amount.toString();
        };

        let betGrade = (<any>window).betGrade;
        let betGradeAmounts = getBetGradeAmounts();
        if (betGradeAmounts.length == 0) {
            betGradeAmounts = DEFAULT_BET_GRADE_AMOUNTS.concat();
            if (betGrade && typeof betGrade.setGradeAmounts === "function") {
                betGrade.setGradeAmounts(betGradeAmounts);
            } else if (betGrade) {
                betGrade.gradeAmounts = betGradeAmounts;
            }
        }
        this.betGradeAmountsLength = Math.min(this.items.length, betGradeAmounts.length);
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].active = i < this.betGradeAmountsLength;
        }
        if (this.betGradeAmountsLength == 0) {
            console.error("invalid bet grade config: expected 1 to 5 grades");
            return;
        }
        if (gGameData.betAmountIndex < 0 || gGameData.betAmountIndex >= this.betGradeAmountsLength) {
            gGameData.betAmountIndex = 0;
        }
        for (let i = 0; i < this.betGradeAmountsLength; ++i) {
            let item = this.items[i];
            let Label = cc.find("BetAmount/Label", item);
            let chip = betGrade && typeof betGrade.getChip === "function" ? betGrade.getChip(0) : null;
            let fallbackChip = ImageCache.Instance.betAmount[i];
            let labelSprite = Label.getComponent(cc.Sprite);
            
            if(chip)
                labelSprite.spriteFrame = chip;
            else if(fallbackChip)
                labelSprite.spriteFrame = fallbackChip;

            let amountLabel = cc.find("BetAmount/Label/New Label", item);
            amountLabel.getComponent(cc.Label).string = formatBetAmount(betGradeAmounts[i]);
            if (chip && labelSprite.spriteFrame === chip) {
                amountLabel.active = false;
                Label.scale = 1.2;
            } else {
                amountLabel.active = true;
                Label.scale = 1;
                if (!fallbackChip) console.log("betImage is error!!! 404 NotFound");
            }

            let selected = gGameData.betAmountIndex == i;
            cc.find("BetAmount/bg2", item).active = selected;
            cc.find("BetAmount/Mask/dark", item).active = !selected;

            let betUI = cc.find("BetAmount", item).getComponent(BetAmountUI);
            if (betUI) {
                betUI.buttonIndex = i;
                betUI.items = this.items;
            }
        }
    }
}
