// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import Game from "../Game";
import { EGameStatus } from "../../shared3/interface/IGame";
import Audio from "../Audio";
import { calculateRevenue, arraySum, IMyHistoryItem, IRoundResult, IBatListResp, IRankListItem } from "../interface/ILuckyFruits";
import { gGameData } from "../GameData";
import ResultView from "./ResultView";
import AvatarCache from "../image/AvatarCache";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoundFinal extends cc.Component {

    @property(cc.Node)
    blackBg: cc.Node = null;

    @property(cc.Node)
    Ranking: Array<cc.Node> = [];

    @property(cc.Node)
    NameNode: Array<cc.Node> = [];

    @property(cc.Node)
    ZuanshiNode: Array<cc.Node> = [];

    @property(cc.Node)
    FinalWheel: Array<cc.Node> = [];

    @property(cc.Node)
    Reward: cc.Node = null;

    @property(cc.Sprite)
    earningCoinIcon: cc.Sprite = null;

    @property(cc.Label)
    earnings: cc.Label = null;

    @property(cc.Node)
    ENODE: cc.Node = null;

    @property(cc.Label)
    rounds: cc.Label = null;

    @property(cc.Sprite)
    betCoinIcon: cc.Sprite = null;

    @property(cc.Label)
    second: cc.Label = null;

    @property(cc.Node)
    animation: cc.Node = null;

    gameCoinIcon: cc.SpriteFrame = null;
    firstIn: boolean = true;
    onlyOne: boolean = true;
    endTrue: boolean = false;
    stopView: boolean = false;
    private enterFinalTimeout: any = null;

    private cancelPendingEnterFinal() {
        if (this.enterFinalTimeout != null) {
            clearTimeout(this.enterFinalTimeout);
            this.enterFinalTimeout = null;
        }
    }

    /** 立即关闭结算层，供登录、重连和阶段切换时做显隐互斥。 */
    hideImmediate() {
        this.cancelPendingEnterFinal();
        cc.Tween.stopAllByTarget(this.node);
        cc.Tween.stopAllByTarget(this.animation);
        this.node.stopAllActions();
        this.node.opacity = 0;
        this.node.active = false;
        this.blackBg.active = false;
        this.onlyOne = true;
        this.stopView = false;
    }

    changeGameStatus(status: EGameStatus) {
        switch (status) {
            case EGameStatus.bet:
                this.stopView = false;
                this.enterBet();
                break;
            case EGameStatus.run:
                // this.enterRun();
                this.stopView = false;
                break;
            case EGameStatus.final:
                if (this.onlyOne == true && this.stopView == false) {
                    this.stopView = true;
                    this.enterFinal();
                    this.LongRank;
                }
                Game.Instance.sumBet.string = "0";

                if (this.endTrue) {
                    this.endTrue = false;
                    this.enterReady();
                }
                break;
        }
    }

    inFinal(finalSecond: number) {
        this.second.string = (finalSecond >= 0 ? Math.abs(finalSecond).toFixed(0) : 0) + "s";
        if (finalSecond == -1) {
            this.endTrue = true;
        }
        cc.tween(this.animation).stop(); // 停止之前的动画

        cc.tween(this.animation)
            .to(10, { angle: 360 })
            .call(() => {
            })
            .start();

        this.animation.angle = 0; // 显式地将 angle 设置为 0
    }
    reset() {
        this.cancelPendingEnterFinal();
        // if (!this.gameCoinIcon) {                                //币图片远程
        //     let config = (<any>window).config;
        //     this.gameCoinIcon = config && config.gameCoin;
        //     config && config.setGameCoin && config.setGameCoin(
        //         this.earningCoinIcon, this.betCoinIcon);
        // }
        let disappointTime = this.firstIn ? 0.3 : 0.3;

        cc.tween(this.node)
            .to(disappointTime, { opacity: 0 }) // 0.3秒内将透明度从255变为0
            .call(() => {
                this.node.active = false;
                for (let j = 0; j < 3; j++) {
                    try {
                        this.NameNode[j].getComponent(cc.Label).string = "name";
                        cc.find("head/Mask/profile", this.Ranking[j]).getComponent(cc.Sprite).spriteFrame = null;
                        this.ZuanshiNode[j].getChildByName("Label").getComponent(cc.Label).string = "0";

                        this.NameNode[j].active = false;
                        this.ZuanshiNode[j].active = false;
                    } catch (error) {
                        continue;
                    }

                }
            })
            .start();
        this.earnings.getComponent(cc.Label).string = "";
        this.Reward.active = false;
        Game.Instance.wheeleffect.badLuck = false;  //霉运时刻
        Game.Instance.isBigWin = false;
        this.onlyOne = true;
        this.ENODE.active = false;
        Game.Instance.TvTime = false;
        Game.Instance.bgmOver = false;
        Audio.Instance.id02 = -1;
        Audio.Instance.id03 = -1;
        Game.Instance.bad01 = false;
        Game.Instance.bad02 = false;
        Game.Instance.Bad.active = false;
        Game.Instance.Bad02.active = false;
        Game.Instance.wheeleffect.isApple = false;
        Game.Instance.wheeleffect.BlueLuck.active = true;
        Game.Instance.wheeleffect.RedLuck.active = true;
        cc.Tween.stopAllByTarget(cc.find("Canvas/Game/BottomView/Ranking/an_players/players"));
        cc.Tween.stopAllByTarget(Game.Instance.wheeleffect.wheelItems);
        Game.Instance.soundPlayed = false;
        setTimeout(() => {
            Audio.Instance.StartBGM();
        }, 3200)

        cc.Tween.stopAllByTarget(this.animation);//清理之前的 Tween 动画实例，避免动画实例累积
    }
    async enterReady() {
        this.reset();
    }
    async enterBet() {
        this.reset();
    }

    enterFinal() {
        this.cancelPendingEnterFinal();
        const expectedRound = Number(gGameData.roundStep.todayRound);
        this.enterFinalTimeout = setTimeout(() => {
            this.enterFinalTimeout = null;
            // 延迟期间可能已经进入下一阶段或下一局，旧回调不能重新打开结算层。
            if (gGameData.roundStep.status != EGameStatus.final
                || Number(gGameData.roundStep.todayRound) != expectedRound) {
                return;
            }
            Game.Instance.firstIn = false;
            this.blackBg.opacity = 150;
            this.blackBg.active = true;
            this.node.active = true;
            // 使用 cc.tween 实现淡入效果
            cc.tween(this.node)
                .to(0.7, { opacity: 255 }) // 0.7秒内将透明度从0变为255
                .call(() => {
                })
                .start();
            this.onlyOne = false;
        }, 1000)
    }

    setRankData(resp: IRankListItem[]): void {
        ////冒泡
        let arr1: IRankListItem[] = [];
        if (resp) {
            for (let i = 0; i < resp.length; i++) {
                arr1[i] = resp[i];
            }
            let len = arr1.length;
            for (let i = 0; i < len - 1; i++) {
                let swapped = false;
                for (let j = 0; j < len - 1 - i; j++) {
                    // 如果前一个元素的 revenue 小于后一个元素的 revenue，就交换它们
                    if (arr1[j].revenue < arr1[j + 1].revenue) {
                        let temp = arr1[j];
                        arr1[j] = arr1[j + 1];
                        arr1[j + 1] = temp;
                        // 标记为发生了交换
                        swapped = true;
                    }
                }
                // 如果这一轮没有发生交换，说明数组已经有序，提前退出循环
                if (!swapped) {
                    break;
                }
            }
        }


        for (let i = 0; i < arr1.length; i++) {
            if (resp) {
                // this.letplayer[i].active = true;
                this.NameNode[i].active = true;
                this.ZuanshiNode[i].active = true;
                this.setRankingValue(this.Ranking[i], arr1[i]);
            }
            else {
                try {
                    this.NameNode[i].getComponent(cc.Label).string = "name";
                    cc.find("head/Mask/profile", this.Ranking[i]).getComponent(cc.Sprite).spriteFrame = null;
                    this.ZuanshiNode[i].getChildByName("Label").getComponent(cc.Label).string = "0";

                    this.NameNode[i].active = false;
                    this.ZuanshiNode[i].active = false;
                } catch (error) {
                    continue;
                }

            }
        }
    }

    setRankingValue(node: cc.Node, item: IRankListItem): void {
        try {
            cc.find("head/Mask/profile", node).active = false;
            if (item == null) {
                return;
            }
            var name = decodeURI(item.name);
            if (name.length > 7) {
                name = name.slice(0, 7) + "...";
            }
            cc.find("name", node).getComponent(cc.Label).string = name;

            let re = (item.revenue).toString();
            cc.find("HisDiamond/Label", node).getComponent(cc.Label).string = re;

            const avatarUrl = AvatarCache.normalize(item.profile);
            if (!avatarUrl) return;
            const profileNode = cc.find("head/Mask/profile", node);
            const sprite = profileNode.getComponent(cc.Sprite);
            (<any>sprite).__avatarUrl = avatarUrl;
            AvatarCache.load(avatarUrl, (error, frame) => {
                if (!error && frame && sprite.node.isValid && (<any>sprite).__avatarUrl === avatarUrl) {
                    profileNode.active = true;
                    sprite.spriteFrame = frame;
                }
            });
        } catch (error) {

        }
    }

    finalResult(index: number, round: number) {//结算面板物品展示
        // 中途进入当前局时 ReadyView 的倒计时优先，不展示本局开奖结果。
        if (Game.Instance.cards.ReadyView.node.active) {
            return;
        }
        for (let i = 0; i < this.FinalWheel.length; i++) {
            this.FinalWheel[i].active = false;
        }
        this.FinalWheel[index].active = true;
        this.rounds.getComponent(cc.Label).string = "Round:" + round;
    }
    LongRank(res: number) {
        let res1 = res.toString();
        this.Reward.active = true;
        this.earnings.getComponent(cc.Label).string = `Congratulations on getting  ${res1}  coins!`;
        this.ENODE.active = true;
        this.Reward.getChildByName("num").getComponent(cc.Label).string = res1;
    }
    start() {

    }

}
///正确排序：
// 03，07，01，05，02，06 ,00,04，bar,蓝大奖（苹果时刻），蓝大奖（上半圈），红大奖（下半圈），红大奖（全中）
