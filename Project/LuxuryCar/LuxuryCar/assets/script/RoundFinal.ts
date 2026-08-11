// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import { Effect } from "./effect/FlyDiamond";
import Game from "./Game";
import { gGameData } from "./GameData";
import ImageCache from "./image/ImageCache";
import { calculateRevenue, arraySum, IMyHistoryItem, IRankListItem,getDayString } from "./interface/ILuxuryCar";
import { EGameStatus } from "../shared3/interface/IGame";
import MyHistoryView from "./view/MyHistoryView";
import { getLang, langContent } from "../lang/afterLoad";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoundFinal extends cc.Component {

    @property(cc.Label)
    roundNumber: cc.Label = null;

    @property(cc.Sprite)
    resultGoodsL: cc.Sprite = null;

    @property(cc.Sprite)
    resultGoodsS: cc.Sprite = null;

    @property(cc.Label)
    earnings: cc.Label = null;

    @property(cc.Label)
    bet: cc.Label = null;

    @property(cc.Label)
    second: cc.Label = null;

    @property(cc.Node)
    goldIcon: Array<cc.Node> = [];

    @property(cc.Node)
    Ranking: Array<cc.Node> = [];

    @property(cc.Node)
    EarningsNode:cc.Node=null;

    @property(cc.Node)
    MyBetNode:cc.Node=null;

    changeGameStatus(status: EGameStatus) {
        switch (status) {
            case EGameStatus.bet:
                this.enterBet();
                break;
            case EGameStatus.run:
                this.enterRun();
                break;
            case EGameStatus.final:
                this.enterFinal();
                break;
        }
    }

    inFinal(finalSecond: number) {
        this.second.string = "(" + Math.abs(finalSecond).toFixed(0) + "s)";
    }

    reset(animation: boolean) {

        // let config = (<any>window).config;
        // if (config && config.setGameCoin) {
        //     config.setGameCoin(this.goldIcon);
        // }

        if (!animation) {
            this.node.active = false;
            return;
        }

        let moveTo = this.node.position;
        moveTo.y = -850;
        cc.tween(this.node).to(0.3, { position: moveTo }).call(() => {
            this.node.active = false;
            this.Ranking.forEach(element => {
                element.active = false;
            });
        }).start();
    }

    async enterBet() {
        this.reset(true);
    }

    enterRun() {
    }

    enterFinal() {
        this.node.active = true;

        this.setRankingValue(gGameData.roundStep.roundRank);

        let player = Game.Instance.player;
        let myHistoryView = Game.Instance.poppusViewUI.myHistoryView.getComponent(MyHistoryView);

        let roundResult = gGameData.roundStep.result;

        let wheelAmount = player.getWheelAmount();
        let sumEarnings = calculateRevenue(wheelAmount, roundResult);
        let sumBet = arraySum(wheelAmount);

        const lang = getLang();   // 获取当前语言代码 (默认英语)
        this.roundNumber.string =langContent[lang].roundFinal.Result.replace("Number",JSON.stringify(gGameData.roundStep.todayRound));

        this.resultGoodsL.spriteFrame = ImageCache.Instance.goods[roundResult];
        this.resultGoodsS.spriteFrame = ImageCache.Instance.goods[roundResult];

        this.earnings.string = sumEarnings.toString();
        this.bet.string = sumBet.toString();

        let timestamp = gGameData.roundStep.timestamp;
        let toDay = getDayString(JSON.stringify(timestamp));
        gGameData.roundStep.todayRound.toString();

        let historyItem: IMyHistoryItem = {
            timestamp: timestamp,
            date: toDay,
            round: gGameData.roundStep.todayRound,
            betDatails: wheelAmount,
            roundResult: roundResult
        };
        myHistoryView.addItem(historyItem);
        if (sumEarnings > 0) {
            Audio.Instance.playWinGold();
        }

        let moveTo = this.node.position;
        moveTo.y = -170;
        const __this = this;
        setTimeout(() => {
            cc.tween(this.node).to(0.5, { position: moveTo }).call(() => {
                if (sumEarnings > 0) {
                    const split = 10;
                    //Effect.FlyDiamond(__this.earnings.node, Game.Instance.account.myDiamond.node, split); 
                    let sumEarningsSplit = sumEarnings / split;
                    for (let i = 0; i < split; i++) {
                        setTimeout(() => {
                            player.addTodayRevenue(sumEarningsSplit);
                        }, 500 + 200 * i);
                    }
                }

            }).start();
        }, 500);
        setTimeout(() => {
            Game.Instance.player.onResult();
        }, 2000);
    }

    setRankingValue(roundRank: IRankListItem[]) {
        for (let i = 0; i < roundRank.length; ++i) {
            let rankValue = roundRank[i];
            let rankNode = this.Ranking[i];
            rankNode.active = true;
            cc.find("Name", rankNode).getComponent(cc.Label).string = decodeURI(rankValue.name);
            cc.find("Diamond/Label", rankNode).getComponent(cc.Label).string = rankValue.revenue.toString();
            let url = rankValue.profile;
            if (url == null) return;
            cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
                let spriteNode = cc.find("head/profile", rankNode).getComponent(cc.Sprite);
                var frame = new cc.SpriteFrame(texture);
                //spriteNode.spriteFrame.destroy();
                spriteNode.spriteFrame = frame;
            });
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.reset(false);
    }

    // update (dt) {}
}
