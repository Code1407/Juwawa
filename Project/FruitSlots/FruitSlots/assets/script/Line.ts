// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

export class Point {
    x: number;
    y: number;
}

@ccclass
export default class Line extends cc.Component {

    @property(cc.Graphics)
    l1: cc.Graphics = null;

    @property(cc.Graphics)
    l2: cc.Graphics = null;

    async linePath(points: Point [], ignore: number[], color: cc.Color) {
        let start = points[0];
        this.l2.strokeColor = color;
        this.l2.strokeColor.a = 200;
        this.l1.strokeColor.a = 180;
        this.l1.moveTo(start.x, start.y);
        this.l2.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            // if (ignore.includes(i)) continue;
            let pt = points[i];
            this.l1.lineTo(pt.x, pt.y);
            this.l2.lineTo(pt.x, pt.y);
        }
        this.l1.stroke();
        this.l2.stroke();
    }

    clear() {
        this.l1.clear();
        this.l2.clear();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
