import { _decorator, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffWheelArrow')
export class EffWheelArrow extends Component {
    angles: number[] = [20, 60, 100, 140, 180, 220, 260, 300, 340]

    async StartRotate(arrow: Node, from: number, to: number, round: number, duration: number) {
        let tw = tween(arrow);
        while (to < from)
            to += this.angles.length;
        let totalStep = (to - from) % this.angles.length + round * this.angles.length;
        for (let i = 0; i < totalStep; i++) {
            let idx = i;
            tw.set({
                angle: 20 - this.angles[(idx + from + 1) % this.angles.length]
            })
            tw.delay(duration / totalStep);
        }
        await new Promise((res, rej) => {
            tw.call(() => res(0)).start();
        });
    }
    async StartFlash(arrow: Node, alpha: number[], duration: number) {
        let tw = tween(arrow);
        for (let a of alpha) {
            tw.to(duration / alpha.length, { opacity: a * 255 }, { easing: 'cubicInOut' });
        }
        await new Promise((res, rej) => {
            tw.call(() => res(0)).start();
        });
    }
}


