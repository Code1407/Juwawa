// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ReadyView from "./view/ReadyView";
import BetView from "./view/BetView";
import { gGameData } from "./GameData";
import { Effect } from "./effect/FlyChip";
import ChangeChip from "./image/ChangeChip";
import Game from "./Game";
import Audio from "./Audio";
import { calNumber } from "./interface/ILuckyFruits";

import BetUI from "./ui/BetUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Cards extends cc.Component {

    @property(cc.Node)
    items: Array<cc.Node> = [];

    @property(cc.Node)
    chips: Array<cc.Node> = [];

    @property(ReadyView)
    ReadyView: ReadyView = null;

    @property(BetView)
    BetView: BetView = null;

    timeout1: any;
    timeout2: any;
    timeout3: any;
    timeout4: any;

    timeout5: any;
    timeout6: any;
    timeout7: any;

    // youBet:boolean=false;

    isStart = 0;
    inReady(readyTime: number) {
        Game.Instance.cards.BetView.node.active = false;
        this.ReadyView.showTime(readyTime);
        Game.Instance.Desk01();
    }

    inBet(betTime: number) {
        this.BetView.node.active = true;
        this.BetView.reduceTime(betTime);
    }

    inRun() {
        this.isStart = 1;
       
        // this.BetView.node.active = false;
        // gGameData.noDiffArr = [];
        // gGameData.AllPoker=createPoker();
        // gGameData.comparePoker={"Card1":[],"Card2":[],"Card3":[]};
        // PokerEffect.Flip(this.AllPoker1,0)
        // this.timeout5 = setTimeout(()=>{
        //     PokerEffect.Flip(this.AllPoker2,1)
        //     this.timeout6 =setTimeout(()=>{
        //         PokerEffect.Flip(this.AllPoker3,2)
        //         this.timeout7 = setTimeout(()=>{
        //             Compare();
        //             this.light();
        //         },1000)
        //     },500)
        // },500)
    }

    inFinal() {

        gGameData.WinChip = {}
        for (let key in ChangeChip.Instance.chips) {
            gGameData.WinChip[ChangeChip.Instance.chips[key].name] = 0;
        }
        for (let Card of this.node.children) {
            let chip = cc.find("pos/chip", Card);
            let result = JSON.parse(JSON.stringify(gGameData.ResultDetail));
            for (let i = 0; i < result.length; i++) {
                if (result[i] >= 9) continue;
                switch (result[i]) {
                    case 8: result[i] = 4; break;
                    default: result[i] = result[i] % 4; break;
                }
            }
            if (!result.includes(chip.getComponent(BetUI).indexRank - 1)) {
                for (let child of cc.find("pos/chip1", Card).children) {
                    // Effect.FlyChip2(child, cc.find("Canvas/Game/test"),child.parent);//飞往庄家
                    child.destroy();
                }
            } else {
                // for(let child of cc.find("pos/chip1",Card).children){
                //     let name=child.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame.name
                //     gGameData.WinChip[name]++;
                //     gGameData.WinChip[name]["formNode"] = child["setFromPos"];
                // }
                // this.timeout1 = setTimeout(()=>{
                //     for(let child of cc.find("pos/chip1",Card).children){
                //             let name=child.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame.name;
                //             //gGameData.WinChip[name]++;
                //             let fromNode=cc.find("Canvas/Game/test");
                //             let toNode=cc.find("pos/chip2",Card);
                //             let sprite=Game.Instance.chips.getChipBySt(name);
                //             Effect.FlyChip(fromNode,toNode,sprite,1,child["setFromPos"]);//飞往赢牌区
                //             Effect.FlyChip(fromNode,toNode,sprite,1,child["setFromPos"]);//飞往赢牌区
                //     }

                // },1000)
                this.timeout2 = setTimeout(() => {
                    let rewardObj = {};
                    rewardObj["player1"] = 0;
                    rewardObj["player2"] = 0;
                    rewardObj["player3"] = 0;
                    rewardObj["player4"] = 0;
                    rewardObj["player5"] = 0;
                    rewardObj["an_players"] = 0;
                    let gradeList2 = {
                        3: 10,
                        6: 100,
                        9: 1000,
                        12: 10000
                    }
                    // setTimeout(() => {
                    for (let child of cc.find("pos/chip1", Card).children) {
                        Effect.FlyChip2(child, child["setFromPos"], child.parent);//赢得的筹码返回
                        Audio.Instance.playSendBet();

                        let name = Number.parseInt(child.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame.name);
                        rewardObj[child["setFromPos"].name] += gradeList2[name];
                    }
                    for (let child of cc.find("pos/chip2", Card).children) {
                        Effect.FlyChip2(child, child["setFromPos"], child.parent);//赢得的筹码返回
                        Audio.Instance.playSendBet();

                        let name = Number.parseInt(child.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame.name);
                        rewardObj[child["setFromPos"].name] += gradeList2[name];
                    }
                    // }, 1000)

                    Game.Instance.ShowRewardCount(rewardObj);
                }, 500)
                this.timeout3 = setTimeout(() => {
                    cc.find("pos/chip1", Card).removeAllChildren();
                    cc.find("pos/chip2", Card).removeAllChildren();
                }, 4000)
            }
        }
        this.timeout4 = setTimeout(() => {
            for (let Card of this.node.children) {
                cc.find("pos/AllNumber/num", Card).getComponent(cc.Label).string = "0"
                cc.find("pos/MineNumber/num", Card).getComponent(cc.Label).string = "0"
            }
        }, 2000)
        setTimeout(() => {
            let rewardObj = {};
            rewardObj["player1"] = 0;
            rewardObj["player2"] = 0;
            rewardObj["player3"] = 0;
            rewardObj["player4"] = 0;
            rewardObj["player5"] = 0;
            rewardObj["an_players"] = 0;
            let gradeList2 = {
                3: 10,
                6: 100,
                9: 1000,
                12: 10000
            }
            Game.Instance.ShowRewardCount(rewardObj);
        }, 500)
    }

    light(winPos: number) {
        Audio.Instance.playReward();
        for (let Card of this.node.children) {
            let chip = cc.find("pos/chip", Card);
            if (chip.getComponent(BetUI).indexRank == winPos) {
            }
            else {
                cc.find("pos/AllNumber/num", Card).getComponent(cc.Label).string = "0"
                cc.find("pos/MineNumber/num", Card).getComponent(cc.Label).string = "0"
            }
        }
    }

    init() {
    }
    setMyBatNum(num: number[][]) {
        let totalNum: number = 0;
        let sumNum: number = 0;
        for (let i = 0; i < 5; i++) {
            let row = num && num[i] || [];
            totalNum = calNumber(row);
            let card = this.node.children[i];
            if (totalNum > 0) {
                sumNum += totalNum;
            }
            cc.find("pos/MineNumber/num", card).getComponent(cc.Label).string = totalNum < 1000 ? totalNum.toString() : totalNum / 1000 + "k";
        }
        Game.Instance.sumBet00(sumNum);  ///赋值sumBet

    }
    setAllBatNum(num: number[][]) {
        let totalNum: number = 0;
        for (let i = 0; i < 5; i++) {
            let row = num && num[i] || [];
            totalNum = calNumber(row);
            let card = this.node.children[i];
            cc.find("pos/AllNumber/num", card).getComponent(cc.Label).string = totalNum < 1000 ? totalNum.toString() : totalNum / 1000 + "k";
        }
    }
    // LIFE-CYCLE CALLBACKS:

    onLoad() { }

    onClear() {
        clearTimeout(this.timeout1);
        clearTimeout(this.timeout2);
        clearTimeout(this.timeout3);
        clearTimeout(this.timeout4);
        clearTimeout(this.timeout5);
        clearTimeout(this.timeout6);
        clearTimeout(this.timeout7);
        for (let Card of this.node.children) {
            cc.find("pos/chip1", Card).removeAllChildren();
            cc.find("pos/chip2", Card).removeAllChildren();
            cc.find("pos/AllNumber/num", Card).getComponent(cc.Label).string = "0"
            cc.find("pos/MineNumber/num", Card).getComponent(cc.Label).string = "0"
        }
    }

    start() {
        this.init();
    }

    // update (dt) {}
}
