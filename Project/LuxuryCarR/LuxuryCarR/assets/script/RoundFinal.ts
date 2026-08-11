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
import { calculateRevenue, arraySum, IMyHistoryItem, IRankListItem,getDayString } from "./interface/ILuxuryCarR";
import { EGameStatus } from "../shared3/interface/IGame";
import MyHistoryView from "./view/MyHistoryView";

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
    animation: cc.Node = null;

    @property(cc.Node)
    Ranking: Array<cc.Node> = [];

    @property(sp.Skeleton)
    caidai: sp.Skeleton = null;  //彩带

    @property(cc.Label)
    RewardNum: cc.Label = null;


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
        this.second.string = "(" + Math.abs(finalSecond - 3).toFixed(0) + "s)";
        cc.tween(this.animation).stop(); // 停止之前的动画

        cc.tween(this.animation)
            .to(15, { angle: -360 })
            .call(() => {
            })
            .start();

        this.animation.angle = 0; // 显式地将 angle 设置为 0

        if (finalSecond == 2) {
            let __this = this;
            let moveTo = this.node.position;
            moveTo.y = -1350;
            cc.find("Canvas/Views/RoundFinal/RoundFinalView").active = false;
            cc.tween(this.node).to(0.3, { position: moveTo }).call(() => {
                __this.node.active = false;

                this.chuCar();
            }).start();
            cc.Tween.stopAllByTarget(this.animation);//清理之前的 Tween 动画实例，避免动画实例累积
            cc.Tween.stopAllByTarget(moveTo);//清理之前的 Tween 动画实例，避免动画实例累积
        }
    }
    chuCar() {
        Game.Instance.EffRPS.Play();
    }

    reset() {

        // let config = (<any>window).config;
        // if (config && config.setGameCoin) {
        //     config.setGameCoin(this.goldIcon);
        // }
        let __this = this;
        let moveTo = this.node.position;
        moveTo.y = -1350;
        cc.find("Canvas/Views/RoundFinal/RoundFinalView").active = false;
        cc.tween(this.node).to(0.3, { position: moveTo }).call(() => {
            __this.node.active = false;
            __this.Ranking.forEach(element => {
                element.active = false;
            });
        }).start();
        cc.Tween.stopAllByTarget(this.animation);//清理之前的 Tween 动画实例，避免动画实例累积
        cc.Tween.stopAllByTarget(moveTo);//清理之前的 Tween 动画实例，避免动画实例累积


        for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
            Game.Instance.bettingBox.myBetNum[i].active = false;
        }
    }

    async enterBet() {
        this.reset();
    }

    enterRun() {
    }

    enterFinal() {
        this.node.active = true;
        cc.find("Canvas/Views/RoundFinal/RoundFinalView").active = true;

        this.setRankingValue(gGameData.roundStep.roundRank);

        let player = Game.Instance.player;
        let myHistoryView = Game.Instance.poppusViewUI.myHistoryView.getComponent(MyHistoryView);

        let roundResult = gGameData.roundStep.result;

        let wheelAmount = player.getWheelAmount();
        // console.log(wheelAmount, roundResult);

        let sumEarnings = calculateRevenue(wheelAmount, roundResult);
        let sumBet = arraySum(wheelAmount);

        this.roundNumber.string = "Round  {Number}'s Result:".replace("{Number}", gGameData.roundStep.todayRound.toString());
        this.resultGoodsL.spriteFrame = ImageCache.Instance.goods[roundResult];
        this.resultGoodsS.spriteFrame = ImageCache.Instance.goods[roundResult];

        // console.log("roundRsult:"+roundResult);
        if (roundResult == 0) {
            this.RewardNum.string = "x100";
        }
        else if (roundResult == 1 || roundResult == 15) {
            this.RewardNum.string = "x5";
        }
        else if (roundResult == 2 || roundResult == 14) {
            this.RewardNum.string = "x8";
        } else if (roundResult == 3 || roundResult == 9) {
            this.RewardNum.string = "x2";
        } else if (roundResult == 4) {
            this.RewardNum.string = "x50";
        } else if (roundResult == 5 || roundResult == 10) {
            this.RewardNum.string = "x30";
        } else if (roundResult == 6 || roundResult == 13) {
            this.RewardNum.string = "x20";
        } else if (roundResult == 7 || roundResult == 11) {
            this.RewardNum.string = "x18";
        } else if (roundResult == 8) {
            this.RewardNum.string = "x88";
        } else if (roundResult == 12) {
            this.RewardNum.string = "x66";
        } else {
            this.RewardNum.string = "";
        }

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
            Audio.Instance.stopBgm();
            Audio.Instance.playWinGold();
            this.caidai.setAnimation(1, "animation", false);
            setTimeout(() => {
                Audio.Instance.StartBGM();
            }, 3500)
        }

        let moveTo = this.node.position;
        moveTo.y = -114;    //-170
        const __this = this;
        let allEarnings = player.toDayRevenue + sumEarnings;
        let accountDiamond = player.accountDiamond + sumEarnings;
        setTimeout(() => {
            cc.tween(this.node).to(0.5, { position: moveTo }).call(() => {
                if (sumEarnings > 0) {
                    const split = 10;
                    //Effect.FlyDiamond(__this.earnings.node, Game.Instance.account.myDiamond.node, split); 
                    player.addTodayRevenue(allEarnings, accountDiamond, sumEarnings);
                }
            }).start();

        }, 500);
        Game.Instance.player.onResult();
    }

    setRankingValue(roundRank: IRankListItem[]) {
        for (let i = 0; i < roundRank.length; ++i) {
            let rankValue = roundRank[i];
            let rankNode = this.Ranking[i];
            rankNode.active = true;
            cc.find("frame/Name", rankNode).getComponent(cc.Label).string = decodeURI(rankValue.name);
            cc.find("Diamond/Label", rankNode).getComponent(cc.Label).string = rankValue.revenue.toString();
            let url = rankValue.profile;
            if (url == null) return;
          
            cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
                if(error)return
                let spriteNode = cc.find("head/Mask/profile", rankNode).getComponent(cc.Sprite);
                var frame = new cc.SpriteFrame(texture);
                //spriteNode.spriteFrame.destroy();
                spriteNode.spriteFrame = frame;
            });
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.reset();
    }

    // update (dt) {}
}
