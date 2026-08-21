// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { ILineSame, linePaths } from "./interface/IFruitSlots";
import Line, { Point } from "./Line";

const linePathIgnore: number[][] = [
    [2,3,4],[4],[],[4],[],
    [3],[3],[],[],[],
    [3],[],[],[2,4],[3],
    [3],[],[],[],[3],
    [2,3,4],[],[],[3],[3],
    [3],[],[],[3],[2,3,4]
];

const lineColors: cc.Color[] = [
    new cc.Color(0xf4, 0xb6, 0x31), new cc.Color(0x03, 0xae, 0xf5), new cc.Color(0xd8, 0x00, 0xf9), 
    new cc.Color(0xd1, 0xdf, 0x3e), new cc.Color(0xe9, 0x1e, 0x64), new cc.Color(0xf5, 0x82, 0x18), 
    new cc.Color(0x0a, 0x8f, 0x08), new cc.Color(0x00, 0x7c, 0xbc), new cc.Color(0x75, 0xd6, 0x75), 

    new cc.Color(0x68, 0x83, 0x1c), new cc.Color(0xf4, 0x8f, 0xb1), new cc.Color(0xba, 0x68, 0xc8), 
    new cc.Color(0xf6, 0x00, 0x5d), new cc.Color(0x98, 0xc8, 0x4e), new cc.Color(0xe8, 0x56, 0x00), 
    new cc.Color(0x00, 0x9a, 0xa9), new cc.Color(0x84, 0xff, 0xff), new cc.Color(0xa1, 0x29, 0xb4), 

    new cc.Color(0x89, 0x7c, 0xaa), new cc.Color(0xf9, 0xad, 0x27), new cc.Color(0xec, 0x40, 0x7a), 
    new cc.Color(0x56, 0x77, 0xfc), new cc.Color(0x71, 0x1d, 0xa0), new cc.Color(0x41, 0x53, 0xb7), 
    new cc.Color(0x16, 0xea, 0x17), new cc.Color(0x56, 0x3e, 0x32), new cc.Color(0xff, 0xff, 0x00), 

    new cc.Color(0x00, 0xc3, 0xab), new cc.Color(0x8f, 0x0f, 0x54), new cc.Color(0x18, 0x1a, 0x4d), 
];

const numberColorLight = new cc.Color(0xff, 0xff, 0xff);
const numberColorDark = new cc.Color(0x80, 0x80, 0x80);

const {ccclass, property} = cc._decorator;

@ccclass
export default class Lines extends cc.Component {

    @property(cc.Node)
    lines: cc.Node = null;

    @property(cc.Node)
    numberLeft: cc.Node = null;

    @property(cc.Node)
    numberRigth: cc.Node = null;

    @property(cc.Node)
    path: cc.Node = null;

    done: boolean = false;

    left: number[] = [1,2,3,4,5, 
        13,14,15,16,19, 
        22,23,24,25,29]
    right: number[] = [6,8,9,11,12,
        17,18,20,21,7,
        26,27,28,10,30]

    drawLine(lineNum: number) {
        if (lineNum < 15) this.leftLine(lineNum);
        else this.rightLine(lineNum);
    }

    leftLine(lineNum: number) {
        let lineNode = cc.find("line", this.lines);

        let points: Point[] = [];

        let numberStart = cc.find((lineNum+1).toString(), this.numberLeft);
        let posWorld = numberStart.parent.convertToWorldSpaceAR(numberStart.position);
        let posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
        points.push({x: posLocal.x, y: posLocal.y});

        let pathNode = linePaths[lineNum];
        for (let i = 0; i < pathNode.length; i++) {
            let pathItem = cc.find(pathNode[i].toString(), this.path);
            let posWorld = pathItem.parent.convertToWorldSpaceAR(pathItem.position);
            let posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
            points.push({x: posLocal.x, y: posLocal.y});
        }

        let numberEnd = this.numberRigth;
        posWorld = numberEnd.parent.convertToWorldSpaceAR(numberEnd.position);
        posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
        points.push({x: posLocal.x, y: points[points.length-1].y});

        lineNode.getComponent(Line).linePath(points, linePathIgnore[lineNum], lineColors[lineNum]);

        numberStart.opacity = 255;
        numberStart.color = numberColorLight;
    }

    rightLine(lineNum: number) {
        let lineNode = cc.find("line", this.lines);

        let points: Point[] = [];

        let numberStart = cc.find((lineNum+1).toString(), this.numberRigth);
        let posWorld = numberStart.parent.convertToWorldSpaceAR(numberStart.position);
        let posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
        points.push({x: posLocal.x, y: posLocal.y});

        let pathNode = linePaths[lineNum];
        for (let i = pathNode.length - 1; i >= 0; i--) {
            let pathItem = cc.find(pathNode[i].toString(), this.path);
            let posWorld = pathItem.parent.convertToWorldSpaceAR(pathItem.position);
            let posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
            points.push({x: posLocal.x, y: posLocal.y});
        }

        let numberEnd = this.numberLeft;
        posWorld = numberEnd.parent.convertToWorldSpaceAR(numberEnd.position);
        posLocal = lineNode.parent.convertToNodeSpaceAR(posWorld);
        points.push({x: posLocal.x, y: points[points.length-1].y});

        lineNode.getComponent(Line).linePath(points, linePathIgnore[lineNum], lineColors[lineNum]);

        numberStart.opacity = 255;
        numberStart.color = numberColorLight;
    }

    drawLines(lineSames: ILineSame[]) {
        for (let i = 0; i < lineSames.length; i++) {
            this.drawLine(lineSames[i].lineNum);
        }
    }

    clear() {
        for (let i = 0; i < this.numberLeft.childrenCount; i++) {
            this.numberLeft.children[i].opacity = 150;
            this.numberLeft.children[i].color = numberColorDark;
        }

        for (let i = 0; i < this.numberRigth.childrenCount; i++) {
            this.numberRigth.children[i].opacity = 150;
            this.numberRigth.children[i].color = numberColorDark;
        }

        let line = cc.find("line", this.lines).getComponent(Line);
        line.clear();
    }

    setDone(done: boolean) {
        this.done = done;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.clear();

        //this.drawLine(7);
        //this.drawLine(20);
    }

    // update (dt) {}
}
