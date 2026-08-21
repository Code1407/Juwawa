export async function GameDelay(node: cc.Node, sec: number) {
    await new Promise((res, rej) => {
        cc.tween(node).delay(sec).call(() => {
            res(0);
        }).start();
    })
}

export async function DoAsync(func: () => void) {
    func();
}

export async function WaitSkeleton(sk: sp.Skeleton) {
    await new Promise((res, rej) => {
        sk.setCompleteListener(() => {
            sk.setCompleteListener(null);
            res(0);
        })
    })
}

export async function WaitTween(tw: cc.Tween) {
    await new Promise((res, rej) => {
        tw.call(() => {
            res(0);
        }).start();
    })
}

export class CoolDown {
    constructor(public sec: number, private node: cc.Node) {

    }
    cd: boolean = false;
    IsCoolDown(): boolean {
        if (this.cd) {
            return this.cd;
        }
        this.cd = true;
        DoAsync(async () => {
            await GameDelay(this.node, this.sec);
            this.cd = false
        })
        return false;
    }
}