// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { ILineSame } from "./interface/IMageJackpot";




const {ccclass, property} = cc._decorator;

@ccclass
export default class Lines extends cc.Component {

    @property(cc.Node)
    lines: cc.Node = null;

    //9条线
    @property({type: [cc.Node], displayName: "9条线的节点"}) 
    lineNodes: cc.Node[] = [];

  



    /**
     * 服务端的 lineNum 为 0-based，而场景线条节点命名为 Line_1 ~ Line_9。
     */
    drawLine(lineNum: number) {
        const displayLineNum = lineNum + 1;
        const lineNode = this.lines && cc.find(`Line_${displayLineNum}`, this.lines);
        if (!lineNode) {
            console.warn(`Winning line node not found: Line_${displayLineNum}`);
            return;
        }

        lineNode.stopAllActions();
        lineNode.opacity = 255;
        lineNode.active = true;

        // 保持中奖线条闪烁，直到下一局开始时由 clearLines 统一回收。
        lineNode.runAction(cc.repeatForever(cc.sequence(
            cc.fadeTo(0.35, 255),
            cc.fadeTo(0.35, 75)
        )));
    }

    leftLine(lineNum: number) {
        let lineNode = cc.find("line", this.lines);

     

       
    }

    rightLine(lineNum: number) {

        let lineNode = cc.find("line", this.lines);

      
    }

    drawLines(lineSames: ILineSame[]) {
        this.clearLines();
        const drawnLineNums = new Set<number>();
        for (const lineSame of lineSames || []) {
            if (!lineSame || drawnLineNums.has(lineSame.lineNum)) continue;
            drawnLineNums.add(lineSame.lineNum);
            this.drawLine(lineSame.lineNum);
        }
    }

    drawSingleLine(lineNum: number) {
        this.clearLines();
        this.drawLine(lineNum);
    }

    clearLines() {
        for (const lineNode of this.lineNodes) {
            if (!lineNode) continue;
            lineNode.stopAllActions();
            lineNode.opacity = 255;
            lineNode.active = false;
        }
    }



    setDone(done: boolean) {
        
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.clearLines();
    }

    
}
