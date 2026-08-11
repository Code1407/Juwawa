import { v3 } from 'cc';
import { _decorator, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ReconnectAni')
export class ReconnectAni extends Component {
    @property(Node)
    private roll1: Node;
    @property(Node)
    private roll2: Node;

    start(): void {
        tween(this.roll1).repeatForever(tween(this.roll1).by(1, { angle: 60 })).start();
        tween(this.roll2).repeatForever(tween(this.roll2).by(1, { angle: -60 })).start();
        tween(this.roll1).repeatForever(
            tween(this.roll1)
                .to(1, { scale: v3(0.25, 0.25, 0.25) }, { easing: 'quadOut' })
                .to(1, { scale: v3(0.5, 0.5, 0.5) }, { easing: 'quadOut' })
        ).start();
        tween(this.roll2).repeatForever(
            tween(this.roll2)
                .to(1, { scale: v3(0.6, 0.6, 0.6) }, { easing: 'sineInOut' })
                .to(1, { scale: v3(0.5, 0.5, 0.5) }, { easing: 'sineInOut' })
        ).start();
    }
}


