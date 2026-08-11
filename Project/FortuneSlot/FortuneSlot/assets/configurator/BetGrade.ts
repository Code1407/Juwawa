import { DecimalUnit } from "./NumericUnit";

export class BetGrade {
    constructor(public gradeAmounts?: number[], public chips?: Map<string, cc.SpriteFrame>) {
        
    }

    private getIndex(index: number): number {
        if (!this.gradeAmounts) {
            return -1;
        }

        return index < 0 ? 0 :
            index >= this.gradeAmounts.length ? this.gradeAmounts.length - 1: index;
    }

    public getGradeAmounts(): number[] {
        return this.gradeAmounts;
    }

    public setGradeAmounts(gradeAmounts: number[]): void {
        this.gradeAmounts = gradeAmounts;
    }

    public getGradeCount(): number {
        return this.gradeAmounts.length;
    }

    public getGradeAmount(index: number): number {
        let i = this.getIndex(index);
        if (i < 0) {
            return 0;
        }

        return this.gradeAmounts?.[i];
    }

    public getGradeAmountString(index: number): string {
        let amount = this.getGradeAmount(index);
        if (amount) {
            return DecimalUnit.humanReadable(amount);
        }

        return null;
    }

    public getChip(indexOrName: number|string): cc.SpriteFrame {
        // console.debug("getChip indexOrName="+indexOrName);
        if (indexOrName == null || indexOrName == undefined || !this.chips) {
            return null;
        }

        let name = (typeof indexOrName === "number") ? this.getGradeAmountString(indexOrName) : indexOrName;
        // console.debug("getChip name="+name);
        return this.chips?.get(name);
    }

    public getChipBySt(amountString: string): cc.SpriteFrame {
        if (!amountString || !this.chips) {
            return null;
        }
        return this.chips?.get(amountString);
    }
}