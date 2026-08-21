//参与计算的局部变量
let result: number = 0;
let i: number = 0;
let n: number = 0;
let arg: number[] = [];
let args: { [index: number]: number[] } = {};//杨辉三角，key为层数，value为数组

let num0 = 0, num1 = 0, num2 = 0, num3 = 0, val1 = 0, val2 = 0;

function CreateTo(max: number, n: number = 1)//创建杨辉三角数组
{
    if (args[n] == null) {
        let newArg: number[] = [];
        newArg.push(1);
        if (n > 1) {
            let preArg = args[n - 1];
            for (i = 1; i < preArg.length; i++) {
                newArg.push(preArg[i - 1] + preArg[i]);
            }
            newArg.push(1);
        }
        args[n] = newArg;
    }
    if (n < max) {
        CreateTo(max, n + 1);
    }
}
function Pow(f: number, p: number): number {
    result = 1;
    while (p > 0) {
        result *= f;
        p--;
    }
    return result;
}

export class MathUtility {

    static Lerps(t: number, nums: number[]): number//贝塞尔插值
    {
        result = 0;
        n = nums.length;
        if (n > 0) {
            if (args[n] == null) {
                CreateTo(n);
            }
            arg = args[n];
            for (i = 0; i < n; i++) {
                result += arg[i] * Pow(1 - t, n - i - 1) * nums[i] * Pow(t, i);
            }
        }
        return result;
    }
    static Liner(t: number, nums: number[]): number//折线插值，经过每一个点
    {
        result = 0;
        n = nums.length;
        if (n > 0 && t >= 0) {
            if (t > 1)
                t %= 1;
            t *= n - 1;
            if (n > 1 && t < n - 1) {
                i = Math.floor(t);
                t = t - i;
                result = nums[i] * (1 - t) + nums[i + 1] * t;
            }
            else {
                result = nums[n - 1];
            }
        }
        return result;
    }


    static CurveEvaluate(t: number, nums: number[]): number//曲线插值，经过每一个点
    {
        result = 0;
        n = nums.length;
        if (n > 0 && t >= 0) {
            if (t > 1)
                t %= 1;
            t *= n - 1;
            if (n > 1 && t < n - 1) {
                i = Math.floor(t);
                num0 = nums[i > 0 ? i - 1 : 0];
                num1 = nums[i];
                num2 = nums[i + 1];
                num3 = nums[i + 2 < n ? i + 2 : n - 1];
                val1 = num1 + (num2 - num0) / 4;
                val2 = num2 - (num3 - num1) / 4;
                if (i > 0 && i + 2 < n)
                    result = MathUtility.Lerps(t - i, [num1, val1, val2, num2]);
                else if (i < 1 && i + 2 < n)
                    result = MathUtility.Lerps(t - i, [num1, val2, num2]);
                else if (i > 0 && i + 3 > n)
                    result = MathUtility.Lerps(t - i, [num1, val1, num2]);
                else
                    result = MathUtility.Lerps(t - i, [num1, num2]);
            }
            else {
                result = nums[n - 1];
            }
        }
        return result;
    }
}