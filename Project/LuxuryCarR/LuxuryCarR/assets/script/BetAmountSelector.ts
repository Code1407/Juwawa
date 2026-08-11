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

const { ccclass, property } = cc._decorator;

@ccclass
export default class BetAmountSelector extends cc.Component {

    private readonly selectedY: number = 2;
    private readonly normalY: number = -38;

    @property(cc.Node)
    items: Array<cc.Node> = [];

    static get Instance() {
        return cc.find("Canvas/Game/BetAmountSelector").getComponent(BetAmountSelector);
    }

    private applySelectedState() {
        for (let i = 0; i < this.items.length; ++i) {
            const item = this.items[i];
            const selected = gGameData.betAmountIndex === i;
            cc.find("BetAmount/bg2", item).active = selected;
            item.stopAllActions();
            item.y = selected ? this.selectedY : this.normalY;
        }
    }

    // changeGameStatus(status: EGameStatus) {
    //     switch (status) {
    //         case EGameStatus.bet:
    //             this.enterBet();
    //             break;
    //         case EGameStatus.final:
    //             this.enterFinal();
    //             break;
    //     }
    // }

    // enterBet() {
    //     this.items.forEach(item => {
    //         for (let i = 0; i < item.childrenCount; ++i) {
    //             item.children[i].getComponent(ColorChange).recover();
    //         }
    //     });
    // }

    // enterFinal() {
    //     this.items.forEach(item => {
    //         for (let i = 0; i < item.childrenCount; ++i) {
    //             item.children[i].getComponent(ColorChange).dark();
    //         }
    //     });
    // }

    swichBetAmountButton() {
        this.applySelectedState();
    }

    simplifyNumber(num: number): string {
        if (num == null || isNaN(num)) return '0';

        const absNum = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        if (absNum >= 100000000) {
            let value = absNum / 100000000;
            // 保留1位小数，如果小数部分为0则不显示
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return sign + formatted + 'b';
        }
        else  if (absNum >= 1000000) {
            // 超过6位数，使用M单位（百万）
            const value = absNum / 1000000;
            // 保留1位小数，如果小数部分为0则不显示
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return sign + formatted + 'm';
        } else if (absNum >= 1000) {
            // 超过3位数，使用K单位（千）
            const value = absNum / 1000;
            // 保留1位小数，如果小数部分为0则不显示
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return sign + formatted + 'k';
        } else {
            // 小于1000，直接返回原数字
            return sign + absNum.toString();
        }
    }


    private refreshConfiguredGrades() {
        let betGrade = (<any>window).betGrade;
        let gradeAmounts = betGrade && Array.isArray(betGrade.gradeAmounts)
            ? betGrade.gradeAmounts : [];
        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];
            item.active = i < gradeAmounts.length;
            if (!item.active) continue;

            let betUI = cc.find("BetAmount", item).getComponent(BetAmountUI);
            betUI.buttonIndex = i;
            betUI.items = this.items;
            cc.find("BetAmount/str", item).getComponent(cc.Label).string =
                this.simplifyNumber(gradeAmounts[i]);
        }
        this.applySelectedState();
    }

    // LIFE-CYCLE CALLBACKS:

    start() {
        (<any>window).changedw = () => {
            if (this.node && this.node.isValid) this.refreshConfiguredGrades();
        };
        let betGrade = (<any>window).betGrade;
        //let amountString = ["100", "1k", "10k", "100k"];
        for (let i = 0; i < this.items.length; ++i) {
            let item = this.items[i];

            item.active = false;
            if (i >= betGrade.gradeAmounts.length) {
                continue;
            }

            item.active = true;

            let betUI = cc.find("BetAmount", item).getComponent(BetAmountUI);
            betUI.buttonIndex = i;
            betUI.items = this.items;
            let amount = betGrade.gradeAmounts[i];
            amount = this.simplifyNumber(amount);  // 简化数字
            
            cc.find("BetAmount/str", item).getComponent(cc.Label).string = amount; 

        }
        this.items.forEach(item => {
            for (let i = 0; i < item.childrenCount; ++i) {
                item.children[i].addComponent(BetAmountEffect);
            }
        });
        this.applySelectedState();
    }

    // start() { }

    // update (dt) {}
}
