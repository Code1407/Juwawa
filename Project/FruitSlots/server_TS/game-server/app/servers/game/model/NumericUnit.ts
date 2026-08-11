class NumericUnit {

    constructor(public K: number) { }

    M = this.K * this.K;
    G = this.M * this.K;
    T = this.G * this.K;
    P = this.T * this.K;

    public humanReadable(value: number, maxFractionDigits: number = 2, fractionDigits: number = null): string {
        if (value >= this.P) {
            return (value / this.P).toFixed(this.getFractionDigits(value, this.P, fractionDigits, maxFractionDigits)) + "P";
        } else if (value >= this.T) {
            return (value / this.T).toFixed(this.getFractionDigits(value, this.T, fractionDigits, maxFractionDigits)) + "T";
        } else if (value >= this.G) {
            return (value / this.G).toFixed(this.getFractionDigits(value, this.G, fractionDigits, maxFractionDigits)) + "G";
        } else if (value >= this.M) {
            return (value / this.M).toFixed(this.getFractionDigits(value, this.M, fractionDigits, maxFractionDigits)) + "M";
        } else if (value >= this.K) {
            return (value / this.K).toFixed(this.getFractionDigits(value, this.K, fractionDigits, maxFractionDigits)) + "K";
        }

        return `${value}`;
    }

    private getFractionDigits(value: number, unit: number, fractionDigits: number, maxFractionDigits: number): number {
        if (fractionDigits != null) {
            return fractionDigits;
        }

        let remainder = value % unit;
        if (remainder == 0) {
            return 0;
        }

        // 计算余数位数
        let fraction = 0;
        while (remainder != 0 && fraction < maxFractionDigits) {
            fraction++;
            unit = unit / 10;
            remainder = remainder % unit;
        }

        return fraction;
    }
}

export let DecimalUnit = new NumericUnit(1000);
export let BinaryUnit = new NumericUnit(1024);
