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
import { calNumber, normalizeProtocolNumberArray } from "./interface/ILuckyFruits";
import { EGameStatus } from "../shared3/interface/IGame";

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

    private finalTimers: any[] = [];
    private finalPresentationEpoch: number = 0;

    cancelFinalPresentation() {
        this.finalPresentationEpoch++;
        for (const timer of this.finalTimers) clearTimeout(timer);
        this.finalTimers = [];
    }

    private scheduleFinalCallback(callback: () => void, delayMs: number) {
        const round = gGameData.roundStep.todayRound;
        const epoch = this.finalPresentationEpoch;
        const timer = setTimeout(() => {
            this.finalTimers = this.finalTimers.filter(value => value !== timer);
            if (!cc.isValid(this, true) || !cc.isValid(this.node, true)
                || epoch !== this.finalPresentationEpoch
                || round !== gGameData.roundStep.todayRound
                || gGameData.roundStep.status !== EGameStatus.final) return;
            callback();
        }, delayMs);
        this.finalTimers.push(timer);
    }

    private returnWinningChips(container: cc.Node, rewardObj: { [name: string]: number }): number {
        if (!cc.isValid(container, true)) return 0;
        const gradeList = { 3: 10, 6: 100, 9: 1000, 12: 10000 };
        let maxFlyDuration = 0;
        // 飞币会销毁/移动节点，遍历副本并先校验筹码结构和返回目标。
        for (const child of container.children.slice()) {
            if (!cc.isValid(child, true)) continue;
            const spriteNode = child.getChildByName("sprite");
            const sprite = cc.isValid(spriteNode, true) && spriteNode.getComponent(cc.Sprite);
            const destination = child["setFromPos"] as cc.Node;
            if (!sprite || !sprite.spriteFrame
                || !cc.isValid(destination, true) || !cc.isValid(destination.parent, true)
                || !cc.isValid(child.parent, true)) continue;
            const amount = gradeList[Number.parseInt(sprite.spriteFrame.name)] || 0;
            const playerName = destination.name;
            maxFlyDuration = Math.max(maxFlyDuration, Effect.FlyChip2(child, destination, child.parent));
            Audio.Instance.playSendBet();
            if (Object.prototype.hasOwnProperty.call(rewardObj, playerName)) {
                rewardObj[playerName] += amount;
            }
        }
        return maxFlyDuration;
    }

    inFinal() {
        this.cancelFinalPresentation();
        gGameData.WinChip = {};
        for (const key in ChangeChip.Instance.chips) {
            gGameData.WinChip[ChangeChip.Instance.chips[key].name] = 0;
        }
        const result = normalizeProtocolNumberArray(gGameData.ResultDetail)
            .map(value => value >= 9 ? value : value === 8 ? 4 : value % 4);
        const winningCards: cc.Node[] = [];
        for (const card of this.node.children) {
            const chip = cc.find("pos/chip", card);
            const betUI = chip && chip.getComponent(BetUI);
            if (!betUI) continue;
            if (result.includes(betUI.indexRank - 1)) {
                winningCards.push(card);
            } else {
                const container = cc.find("pos/chip1", card);
                if (container) {
                    for (const child of container.children.slice()) child.destroy();
                }
            }
        }
        this.scheduleFinalCallback(() => {
            const rewardObj = { player1: 0, player2: 0, player3: 0, player4: 0, player5: 0, an_players: 0 };
            let maxBackDuration = 0;
            for (const card of winningCards) {
                if (!cc.isValid(card, true)) continue;
                maxBackDuration = Math.max(maxBackDuration, this.returnWinningChips(cc.find("pos/chip1", card), rewardObj));
                maxBackDuration = Math.max(maxBackDuration, this.returnWinningChips(cc.find("pos/chip2", card), rewardObj));
            }
            Game.Instance.ShowRewardCount(rewardObj);
            if (maxBackDuration > 0) {
                this.scheduleFinalCallback(() => {
                    Game.Instance.PlayPendingMindRewardCount();
                }, maxBackDuration * 1000);
            }
        }, 500);
        this.scheduleFinalCallback(() => {
            for (const card of winningCards) {
                if (!cc.isValid(card, true)) continue;
                for (const name of ["pos/chip1", "pos/chip2"]) {
                    const container = cc.find(name, card);
                    if (cc.isValid(container, true)) container.removeAllChildren();
                }
            }
        }, 4000);
        this.scheduleFinalCallback(() => {
            for (const card of this.node.children) {
                for (const name of ["pos/AllNumber/num", "pos/MineNumber/num"]) {
                    const node = cc.find(name, card);
                    const label = node && node.getComponent(cc.Label);
                    if (label) label.string = "0";
                }
            }
        }, 2000);
    }

    onDestroy() {
        this.cancelFinalPresentation();
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
        this.cancelFinalPresentation();
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
