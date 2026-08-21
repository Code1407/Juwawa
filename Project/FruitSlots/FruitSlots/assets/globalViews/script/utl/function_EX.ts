
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
    return 0;
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

export function SetPosition(p1: cc.Node, p2: cc.Node) {
    p1.position = p1.parent.convertToNodeSpaceAR(p2.convertToWorldSpaceAR(cc.Vec3.ZERO));
}

export function deepCopy<T extends Object>(content: T): T {
    if (!content) return null;
    let Obj: Object;
    Array.isArray(content) ? Obj = [] : Obj = {};
    Object.keys(content).forEach((e) => {
        if (typeof content[e] === `object`) {
            Obj[e] = deepCopy(content[e]);
        }
        else {
            Obj[e] = content[e];
        }
    })
    return Obj as T;
}

export function AnimationPlay(anim: cc.Animation, clipIndex: number) {
    anim.play(anim.getClips()[clipIndex].name);
}