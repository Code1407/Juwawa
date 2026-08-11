// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import BetAmountUI from "./ui/BetAmountUI";
import BetAmountEffect from "./effect/BetAmountEffect";
import ColorChange from "./effect/ColorChange";
import { gGameData } from "./GameData";
import { EGameStatus } from "../shared3/interface/IGame";
import ImageCache from "./image/ImageCache";
import ChangeChip from "./image/ChangeChip";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BetAmountSelector extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];
    betGradeAmountsLength: number = 0;

    static get Instance() {
        return cc.find("Canvas/Game/BetAmountSelector").getComponent(BetAmountSelector);
    }



    swichBetAmountButton() {
        for (let i = 0; i < this.items.length; ++i) {
            cc.find("BetAmount/beChoose", this.items[i]).active = (gGameData.betAmountIndex == i);
            if (cc.find("BetAmount/beChoose", this.items[i]).active == true) {
                ChangeChip.Instance.NumLabel.string = cc.find("BetAmount/Num", this.items[i]).getComponent(cc.Label).string;
            }
        }
    }

    protected onEnable(): void {
        this.node.active = true;
        this.refreshFromConfig();
    }

    public refreshFromConfig(): void {
        const formatBetAmount = (amount: number): string => {
            if (amount >= 1000000 && amount % 1000000 === 0) {
                return (amount / 1000000) + "M";
            } else if (amount >= 1000 && amount % 1000 === 0) {
                return (amount / 1000) + "K";
            } else {
                return amount.toString();
            }
        };
        let betGrade = (<any>window).betGrade;
        let amountString = [0, 1, 2, 3, 4];
        // Keep the same source as LuxuryCar. AuthGame writes server costs here.
        let betGradeAmounts = betGrade && Array.isArray(betGrade.gradeAmounts)
            ? betGrade.gradeAmounts
            : (betGrade && typeof betGrade.getGradeAmounts === "function" ? betGrade.getGradeAmounts() : []);
        if (!Array.isArray(betGradeAmounts) || betGradeAmounts.length <= 0) return;

        this.betGradeAmountsLength = Math.min(betGradeAmounts.length, this.items.length);
        if (gGameData.betAmountIndex >= this.betGradeAmountsLength) {
            gGameData.betAmountIndex = 0;
        }
        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];
            item.active = i < this.betGradeAmountsLength;
            if (!item.active) continue;

            let bg2 = cc.find("BetAmount/bg2", item);
            let index = amountString[i];               /*↓从配置中获取chip图片↓*/    /*↓↓↓从本地获取chip图片↓↓↓*/
            // 防御性判断：没有 getChip 方法时直接使用本地图片
            let chipSpriteFrame = betGrade && typeof betGrade.getChip === "function" ? betGrade.getChip(i) : null;
            bg2.getComponent(cc.Sprite).spriteFrame = chipSpriteFrame || ImageCache.Instance.betAmount[index];  //两者位置互换以更换优先级为自己所需

            // 没有获取到配置面额时使用默认值 0
            let amount = betGradeAmounts ? betGradeAmounts[i] : 0;
            cc.find("BetAmount/Num", item).getComponent(cc.Label).string = formatBetAmount(amount);

            // if (bg2.getComponent(cc.Sprite).spriteFrame === betGrade.getChip(i)) {
            //     cc.find("BetAmount/bg2", item).active = false;
            //     cc.find("BetAmount/bg2", item).scale = 1.2;
            // } else if (bg2.getComponent(cc.Sprite).spriteFrame = ImageCache.Instance.betAmount[index]) {
            //     cc.find("BetAmount/bg2", item).active = true;
            // } else {
            //     console.log("betImage is error!!! 404 NotFound");
            // }
            
            // cc.find("BetAmount/New Label",item).getComponent(cc.Label).string=betGradeAmounts[i].toString();

            let betUI = cc.find("BetAmount", item).getComponent(BetAmountUI);
            betUI.buttonIndex = i;
            betUI.items = this.items;
        }
        this.swichBetAmountButton();
    }


    // update (dt) {}


    // LIFE-CYCLE CALLBACKS:

    // start () {

    //     let betGrade = (<any>window).betGrade;

    //     //let amountString = ["10", "100", "1k", "10k"];
    //     for (let i = 0; i < this.items.length; ++i) {
    //         let item = this.items[i];

    //         let betUI = cc.find("BetAmount", item).getComponent(BetAmountUI);
    //         betUI.buttonIndex = i;
    //         betUI.items = this.items;
    //         cc.find("BetAmount/bg2", item).active = (gGameData.betAmountIndex == i);
    //         cc.find("BetAmount/bg1", item).getComponent(cc.Sprite).spriteFrame = (betGrade && betGrade.getChip(i));

    //     }

    //     this.items.forEach(item => {
    //         for (let i = 0; i < item.childrenCount; ++i) {
    //             item.children[i].addComponent(BetAmountEffect);
    //         }
    //     });

    // }

}
