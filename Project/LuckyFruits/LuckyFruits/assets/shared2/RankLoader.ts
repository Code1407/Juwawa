// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html


const { ccclass, property } = cc._decorator;

@ccclass
export default class RankLoader extends cc.Component {

    @property(cc.Node)
    activityPos: cc.Node = null;
    @property(cc.Node)
    rankViewPos: cc.Node = null;
    @property(cc.Node)
    rankButtonPos: cc.Node = null;
    @property(cc.Node)
    coinFxEndPos: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        (<any>window).activityPos = this.activityPos;
        (<any>window).rankViewPos = this.rankViewPos;
        (<any>window).rankButtonPos = this.rankButtonPos;
        (<any>window).coinFxEndPos = this.coinFxEndPos;
    }

  
}