import { DateTimeFormatOptions, timeZones, timeZones2 } from "./interface/IGame";

export function GetTimeZoneTicks(timezone: string) {//把时区转为时间戳时差
    let strAry = timezone.split(`:`)
    let hour = Number(strAry[0]);
    let min = Number(strAry[1]);
    let tick = hour * 60 * 60 * 1000 + min * 60 * 1000;
    return tick;
}

export function convertToLocalTime(timestamp: number, timeZone: string): string {
    if (!timestamp) {
        console.warn("timestamp is null")
        return
    };
    try {//某些环境没有 Intl 这个命名空间
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timeZones[timeZone] || timeZone, // 使用给定时区
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        // 使用Intl.DateTimeFormat进行格式化
        const formatter = new Intl.DateTimeFormat('en-US', options);
        return formatter.format(new Date(timestamp));
    }
    catch (e) {
        console.warn(e);
        return DateTimeFormat(timestamp, { year: true, month: true, day: true, char: "/", timeZone: timeZone }) + ", " +
            DateTimeFormat(timestamp, { hour: true, minute: true, second: true, char: ":", timeZone: timeZone })
    }
}

export function DateTimeFormat(timestamp: number, options: DateTimeFormatOptions, isOffset = false) {
    const date = new Date(timestamp + (options.timeZone ? GetTimeZoneTicks(timeZones2[options.timeZone] || options.timeZone) : 0));
    let str = "";
    if (options.year) {
        str += `${StringPadStart(4, "0", date.getUTCFullYear().toString())}`;
    }
    if (options.month) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (isOffset ? date.getUTCMonth() : (date.getUTCMonth() + 1)).toString())}`;
    }
    if (options.day) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (isOffset ? (date.getUTCDate() - 1) : date.getUTCDate()).toString())}`;
    }
    if (options.hour) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCHours()).toString())}`;
    }
    if (options.minute) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCMinutes()).toString())}`;
    }
    if (options.second) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getSeconds()).toString())}`;
    }
    return str;
}

export function StringPadStart(length: number, char: string, input: string) {
    let output = '';
    let offset = length - input.length;
    for (let i = 0; i < offset; i += char.length)
        output += char;
    output += input;
    return output;
}

export function RandomInt(include: number, exclude: number): number {
    return include + Math.floor(Math.random() * (exclude - include));
}

export function RandomFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function GetIndexArray(length: number): number[] {
    let arry: number[] = [];
    for (let i = 0; i < length; i++) {
        arry.push(i);
    }
    return arry;
}

export function Disarray<T>(arry: T[]) {
    let exValue: T = null;
    let exIndex: number = 0;
    for (let i = 0; i < arry.length; i++) {
        exIndex = RandomInt(i, arry.length);
        exValue = arry[exIndex];
        arry[exIndex] = arry[i];
        arry[i] = exValue;
    }
}

export function Disarray2<T>(arry: T[], from: number, to: number) {
    let exValue: T = null;
    let exIndex: number = 0;
    for (let i = from; i < to; i++) {
        exIndex = RandomInt(i, to);
        exValue = arry[exIndex];
        arry[exIndex] = arry[i];
        arry[i] = exValue;
    }
}

export function RandomGet<T>(arry: T[]): T {
    return arry[Math.floor(Math.random() * arry.length)];
}

export function ArraySum(arry: number[]): number {
    let res = 0;
    arry.forEach(element => {
        res += element;
    });
    return res;
}

export function BetweenInt(include: number, value: number, exclude: number): boolean {
    return value >= include && value < exclude;
}

export function WeightToIndex(weights: number[]): number {
    let weightSum = 0;
    let weightSums: number[] = [];
    for (let i = 0; i < weights.length; i++) {
        weightSum += weights[i];
        weightSums.push(weightSum);
    }
    let ran = Math.random() * weightSum;
    for (let i = 0; i < weights.length; i++) {
        if ((i > 0 ? weightSums[i - 1] : 0) <= ran && ran < weightSums[i]) {
            return i;
        }
    }
}

export function TweenSequence(tws: cc.Tween[]): cc.Tween[] {//将所有的Tween头尾相接，组合成一套长动画
    for (let i = 0; i < tws.length - 1; i++) {
        tws[i].call(() => tws[i + 1].start());
    }
    return tws;
}

export function RandomGroupResults(groupLength: number, totalLength: number): number[] {
    let results: number[] = [];
    while (results.length < totalLength) {
        let group = GetIndexArray(groupLength);
        Disarray(group);
        if (results.length > 1 && group.length > 1) {
            while (results[results.length - 1] == group[0]) {
                Disarray(group);
            }
        }
        results.push(...group);
    }
    return results;
}

export function GetLast<T>(arry: T[], i = 0): T {
    return arry[arry.length - 1 - i];
}

export function GetWorldPosition(node: cc.Node) {
    return node.convertToWorldSpaceAR(cc.Vec3.ZERO);
}

export function SetWorldPosition(node: cc.Node, pos: cc.Vec3) {
    node.position = node.parent.convertToNodeSpaceAR(pos);
}

export function deepCopy<T extends Object>(content: T): T {
    if (!content) return null;
    return JSON.parse(JSON.stringify(content)) as T;
}

export function CallEvents<T>(callbacks: ((...arg: T[]) => void)[], ...arg: T[]) {
    for (let callback of callbacks) {
        callback?.(...arg);
    }
}

export function AnimationPlay(anim: cc.Animation, clipIndex: number) {
    anim.play(anim.getClips()[clipIndex].name);
}