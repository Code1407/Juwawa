const { ccclass, property } = cc._decorator;

@ccclass
export default class LoopMotion extends cc.Component {
    @property()
    duration: number = 5;
    @property()
    xSpeed: number = 0;
    @property()
    ySpeed: number = 0;
    protected start(): void {
        let fromX = this.node.x;
        let fromY = this.node.y;
        let toX = this.node.x + this.node.width * this.xSpeed;
        let toY = this.node.y + this.node.height * this.ySpeed;
        cc.tween(this.node).repeatForever(cc.tween(this.node).set({ x: fromX }).to(this.duration, { x: toX })).start();
        cc.tween(this.node).repeatForever(cc.tween(this.node).set({ y: fromY }).to(this.duration, { y: toY })).start();
    }
}
