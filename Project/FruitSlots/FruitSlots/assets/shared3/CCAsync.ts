//js的setTimeout在游戏切后台时依然会执行，这有一定风险，而以下这些延迟操作可以在切后台的时候可以被暂停

export async function GameDelay(node: cc.Node, sec: number) {
    await new Promise((res, rej) => {
        cc.tween(node).delay(sec).call(() => {
            res(0);
        }).start();
    })
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
        (async () => {
            await GameDelay(this.node, this.sec);
            this.cd = false
        })();
        return false;
    }
}