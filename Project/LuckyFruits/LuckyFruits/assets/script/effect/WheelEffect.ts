// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";
import { gGameData } from "../GameData";
import { EGameStatus } from "../../shared3/interface/IGame";
import ColorEffect from "./ColorEffect";
import ImageCache from "../image/ImageCache";
import Audio from "../Audio";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WheelEffect extends cc.Component {

    @property(cc.Node)
    wheelItems: cc.Node[] = [];
    wheelIndex: number = 0;
    // 记录最近一次真正停下的中奖格，避免重置或重连时从滚动途中的位置继续。
    private lastWinningIndex: number = 0;
    private activeRollingIndex: number = -1;
    // 每次重置递增，使同一局重连前创建的异步展示全部失效。
    private presentationEpoch: number = 0;
    isEnd: boolean = false;
    redResult: number[] = []
    goldResult: number[] = []
    allReuslt: number[] = []
    badBuleResult: number[] = []
    badRedResult: number[] = []
    results: number[][] = []

    @property(cc.Node)
    CenterSprite: cc.Node = null;
    @property(cc.Node)
    BlueLuck: cc.Node = null;
    @property(cc.Node)
    RedLuck: cc.Node = null;

    fruitIndex00: number = 0;
    badLuck: boolean = false;
    isApple: boolean = false;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.redResult = [5, 4, 3, 2, 1, 0, 15]
        this.goldResult = [13, 12, 11, 10, 9, 8, 7]
        // 全中只包含14个水果格；6和14分别是右、左 Lucky，不能作为水果点亮。
        this.allReuslt = [13, 12, 11, 10, 9, 8, 7, 5, 4, 3, 2, 1, 0, 15]
        this.badBuleResult = [6]
        this.badRedResult = [14]

        this.results.push(this.redResult)
        this.results.push(this.goldResult)
        this.results.push(this.allReuslt)

        this.results.push(this.badBuleResult)
        this.results.push(this.badRedResult)
    }

    /**
     * 转动
     * @param delayTime 选项亮起时间间隔
     */
    run(delayTime: number) {
        // if(gGameData.roundStep.status == EGameStatus.ready || gGameData.roundStep.status == EGameStatus.bet) return;
        // console.log("时间是："+this.finalTime);
        if (this.wheelItems.length == 0) return;
        this.CenterSprite.active = true;
        this.clearPreviousRollingHighlight(false);
        const currentIndex = this.wheelIndex;
        this.wheelItems[currentIndex].getComponent(ColorEffect).runEffect(currentIndex, delayTime);
        this.activeRollingIndex = currentIndex;
        this.indexIncrease();
        this.tvStart();//水果轮播
    }

    /**
     * 转到结果
     * @param result 结果
     */
    run2Final(result: number) {
        if (this.isEnd || this.wheelItems.length == 0) return;
        this.clearPreviousRollingHighlight(true);
        const currentIndex = this.wheelIndex;
        this.isEnd = this.wheelItems[currentIndex].getComponent(ColorEffect).run2Final(currentIndex, result, this.isEnd);
        if (this.isEnd) {
            this.lastWinningIndex = currentIndex;
        }
        this.activeRollingIndex = currentIndex;
        this.finalBgm();//音效
        this.tvStart();//水果轮播
        if (!this.isEnd) {
            this.indexIncrease();
        }
    }

    private clearPreviousRollingHighlight(preserveSelected: boolean) {
        if (this.activeRollingIndex < 0 || this.activeRollingIndex >= this.wheelItems.length) return;
        this.wheelItems[this.activeRollingIndex].getComponent(ColorEffect).clearRollingHighlight(!preserveSelected);
        this.activeRollingIndex = -1;
    }

    getLastWinningIndex(): number {
        return this.lastWinningIndex;
    }

    setRollStartIndex(index: number) {
        if (this.wheelItems.length == 0) return;
        const normalizedIndex = ((Math.floor(Number(index) || 0) % this.wheelItems.length) + this.wheelItems.length) % this.wheelItems.length;
        this.lastWinningIndex = normalizedIndex;
        this.wheelIndex = normalizedIndex;
        this.endUnlock();
    }

    /** 静默定位到滚动时间轴的当前格，不补播已经错过的 Tween 和音效。 */
    seekRollingIndex(index: number) {
        if (this.wheelItems.length == 0) return;
        const normalizedIndex = ((index % this.wheelItems.length) + this.wheelItems.length) % this.wheelItems.length;
        this.clearPreviousRollingHighlight(false);
        const effect = this.wheelItems[normalizedIndex].getComponent(ColorEffect);
        effect.clearRollingHighlight(true);
        effect.bg2Effect();
        Game.Instance.fruitIndex(normalizedIndex);
        this.CenterSprite.active = true;
        this.activeRollingIndex = normalizedIndex;
        this.wheelIndex = (normalizedIndex + 1) % this.wheelItems.length;
        this.isEnd = false;
        this.tvStart();
    }

    /** 静默恢复已经完成的停奖状态。 */
    seekFinalIndex(index: number) {
        if (this.wheelItems.length == 0) return;
        const normalizedIndex = ((index % this.wheelItems.length) + this.wheelItems.length) % this.wheelItems.length;
        this.clearPreviousRollingHighlight(true);
        const effect = this.wheelItems[normalizedIndex].getComponent(ColorEffect);
        effect.clearRollingHighlight(true);
        effect.bg2Effect();
        effect.isSelect = true;
        effect.isEnd = true;
        Game.Instance.fruitIndex(normalizedIndex);
        this.CenterSprite.active = true;
        this.activeRollingIndex = normalizedIndex;
        this.wheelIndex = normalizedIndex;
        this.lastWinningIndex = normalizedIndex;
        this.isEnd = true;
        this.tvStart();
    }

    /** 静默补齐特殊奖项中已经发生的选中格。 */
    selectIndexInstant(index: number, makeCurrent: boolean = false) {
        if (index < 0 || index >= this.wheelItems.length) return;
        const effect = this.wheelItems[index].getComponent(ColorEffect);
        effect.bg2Effect();
        effect.isSelect = true;
        if (makeCurrent) {
            Game.Instance.fruitIndex(index);
            this.CenterSprite.active = true;
            this.activeRollingIndex = index;
            this.wheelIndex = index;
            this.lastWinningIndex = index;
            this.isEnd = true;
            this.tvStart();
        }
    }

    /** 登录时已经处于结算阶段：只恢复最终盘面，不启动任何开奖动画。 */
    restoreCompletedResult(winPos: number, resultDetail: number[], resultPos: number[]) {
        if (this.wheelItems.length == 0 || winPos < 0) return;
        this.darkAll();
        this.selectCancle();
        this.endUnlock();

        if (winPos >= 0 && winPos < 9) {
            const target = Number(resultPos && resultPos[0]);
            if (Number.isFinite(target)) this.seekFinalIndex(target);
            return;
        }
        if (winPos == 9) {
            this.selectIndexInstant(6);
            let finalIndex = 6;
            for (let i = 0; i < resultPos.length; i++) {
                if (!Number.isFinite(Number(resultPos[i]))) continue;
                finalIndex = Number(resultPos[i]);
                this.selectIndexInstant(finalIndex);
            }
            this.seekFinalIndex(finalIndex);
            return;
        }

        const target = this.getGoodLuckTargetIndex(winPos);
        const selectedIndexes = this.results[winPos - 10] || [target];
        for (let i = 0; i < selectedIndexes.length; i++) {
            this.selectIndexInstant(selectedIndexes[i]);
        }
        this.seekFinalIndex(target);
    }

    getGoodLuckTargetIndex(result: number): number {
        return result == 9 || result == 10 || result == 13 ? 6 : 14;
    }

    getGoodLuckStepDelay(result: number, step: number, delayTime: number): number {
        if (result == 9 || result == 10 || result == 13) {
            return step > 0 ? delayTime + 120 : delayTime - 70;
        }
        return step > 9 ? delayTime + 100 : delayTime - 70;
    }

    /** 当前特殊奖项从现有格子滚到中奖格所需的原始等待权重。 */
    getGoodLuckStopDelay(result: number, delayTime: number): number {
        if (this.wheelItems.length == 0) return 0;
        const targetIndex = this.getGoodLuckTargetIndex(result);
        const stepsBeforeTarget = (targetIndex - this.wheelIndex + this.wheelItems.length) % this.wheelItems.length;
        let total = 0;
        for (let step = 0; step < stepsBeforeTarget; step++) {
            total += this.getGoodLuckStepDelay(result, step, delayTime);
        }
        return total;
    }

    /**
     * good luck结果展示
     * @param result 结果（goodLuck类型）
     * @param resultDetail 结果数组（goodLuck大概率有多个结果选项）
     * @param delayTime 选项亮起时间间隔
     */
    async run2GoodLuckFinal(
        result: number,
        resultDetail: number[],
        delayTime: number,
        resultPos: number[],
        waitForRollDelay?: (delay: number) => Promise<void>,
        primaryAlreadyResolved: boolean = false,
        postElapsedMs: number = 0
    ) {
        const presentationEpoch = this.presentationEpoch;
        const isPresentationActive = () => this.presentationEpoch == presentationEpoch;
        const waitForStep = waitForRollDelay || ((delay: number) => new Promise<void>(resolve => setTimeout(resolve, delay)));
        const schedulePresentation = (callback: () => void, delay: number = 0) => {
            Game.Instance.scheduleResultTimelineAction(() => {
                if (isPresentationActive()) callback();
            }, delay);
        };
        Game.Instance.isBigWin = true;
        // Audio.Instance.wheelStart02();
        // Audio.Instance.stop00();
        if (gGameData.roundStep.status == EGameStatus.final || gGameData.roundStep.status == EGameStatus.bet) return;
        /*一、停留在good luck触发的奖项*/
        if (result == 9) {
            schedulePresentation(() => {
                Audio.Instance.stopBgm();
                Audio.Instance.blueWin();
            }, 2400)
            let goodLuckIndex = 6;
            if (!primaryAlreadyResolved) {
                for (let i = 0; i < 16; i++) {
                    Game.Instance.runResultTimelineAction(() => this.run2Final(goodLuckIndex));
                    await waitForStep(this.getGoodLuckStepDelay(result, i, delayTime));
                    if (!isPresentationActive()) return;
                }
            }

            for (let i = 1; i < resultDetail.length; i++) {
                const drawStartMs = 1000 * (i - 1);
                const resultIndex = resultPos[i - 1];
                if (!Number.isFinite(Number(resultIndex))) continue;
                if (drawStartMs < postElapsedMs) {
                    // 已经开始的苹果抽取直接恢复为选中状态，不快速补播16个历史步骤。
                    if (!Game.Instance.wheelSelected.includes(resultIndex)) {
                        Game.Instance.wheelSelected.push(resultIndex);
                    }
                    this.isApple = true;
                    this.selectIndexInstant(resultIndex, true);
                    if (resultDetail[i] == 0 || resultDetail[i] == 4) Game.Instance.Desks[0].active = false;
                    if (resultDetail[i] == 1 || resultDetail[i] == 5) Game.Instance.Desks[1].active = false;
                    if (resultDetail[i] == 2 || resultDetail[i] == 6) Game.Instance.Desks[2].active = false;
                    if (resultDetail[i] == 3 || resultDetail[i] == 7) Game.Instance.Desks[3].active = false;
                    if (resultDetail[i] == 8) Game.Instance.Desks[4].active = false;
                    continue;
                }
                schedulePresentation(async () => {
                    if (!isPresentationActive()) return;
                    // console.log("special result:"+result.resultDetail[i]);
                    this.wheelIndex = goodLuckIndex;
                    this.wheelItems[goodLuckIndex].getComponent(ColorEffect).isSelect = true;

                    this.isApple = true;
                    this.endUnlock();

                    // console.log(JSON.stringify(resultPos));
                    Game.Instance.wheelSelected.push(resultIndex);
                    for (let i = 0; i < 16; i++) {
                        Game.Instance.runResultTimelineAction(() => this.run2Final(resultIndex));
                        await new Promise(resolve => setTimeout(resolve, 38.8));  //20  苹果时刻出奖速度
                        if (!isPresentationActive()) return;
                    }
                    if (resultDetail[i] == 0 || resultDetail[i] == 4) {
                        Game.Instance.Desks[0].active = false;
                        this.appleAudio();
                    }
                    if (resultDetail[i] == 1 || resultDetail[i] == 5) {
                        Game.Instance.Desks[1].active = false;
                        this.appleAudio();
                    }
                    if (resultDetail[i] == 2 || resultDetail[i] == 6) {
                        Game.Instance.Desks[2].active = false;
                        this.appleAudio();
                    }
                    if (resultDetail[i] == 3 || resultDetail[i] == 7) {
                        Game.Instance.Desks[3].active = false;
                        this.appleAudio();
                    }
                    if (resultDetail[i] == 8) {
                        Game.Instance.Desks[4].active = false;
                        this.appleAudio();
                    }
                }, drawStartMs);
            }
            schedulePresentation(() => {
                Audio.Instance.finalLucky();
            }, 1300 * (resultDetail.length));
        }
        /*二、半边中奖、全中奖 */
        else if (result == 10 || result == 11 || result == 12) {
            if (result == 10) {
                schedulePresentation(() => {
                    Audio.Instance.stopBgm();
                    Audio.Instance.blueWin();

                }, 2400)
            } else {
                schedulePresentation(() => {
                    Audio.Instance.stopBgm();
                    Audio.Instance.redWin();

                }, 3400)
            }
            let goodLuckIndex = result == 10 ? 6 : 14;
            let results = this.results[result - 10];
            if (!primaryAlreadyResolved) {
                for (let i = 0; i < 24; i++) {
                    Game.Instance.runResultTimelineAction(() => this.run2Final(goodLuckIndex));
                    await waitForStep(this.getGoodLuckStepDelay(result, i, delayTime));
                    if (!isPresentationActive()) return;
                }
            }
            for (let i = 0; i < results.length; i++) {
                schedulePresentation(() => {
                    this.wheelItems[results[i]].getComponent(ColorEffect).bg2Effect();
                    this.wheelItems[results[i]].getComponent(ColorEffect).isSelect = true;
                    this.appleAudio();

                    // resultDetail[0]是特殊结果ID(10/11/12)，水果明细从下标1开始。
                    const fruitId = resultDetail[i + 1];
                    if (fruitId == 0 || fruitId == 4) { Game.Instance.Desks[0].active = false; }
                    if (fruitId == 1 || fruitId == 5) { Game.Instance.Desks[1].active = false; }
                    if (fruitId == 2 || fruitId == 6) { Game.Instance.Desks[2].active = false; }
                    if (fruitId == 3 || fruitId == 7) { Game.Instance.Desks[3].active = false; }
                    if (fruitId == 8) { Game.Instance.Desks[4].active = false; }
                }, 250 * (i + 1));
            }
            schedulePresentation(() => {
                Audio.Instance.finalLucky();
            }, 4000);
            if (postElapsedMs < 4500) {
                schedulePresentation(() => {
                    this.selectShine();
                }, 4500);
            }
        }
        /*三、霉运时刻 */
        else if (result == 13 || result == 14) {
            this.badLuck = true;
            if (result == 13) {
                schedulePresentation(() => {
                    Audio.Instance.stopBgm();
                    Audio.Instance.badLuck();
                    schedulePresentation(() => {
                        Audio.Instance.StartBGM();
                    }, 1800)
                }, 2000)
            } else {
                schedulePresentation(() => {
                    Audio.Instance.stopBgm();
                    Audio.Instance.badLuck();
                    schedulePresentation(() => {
                        Audio.Instance.StartBGM();
                    }, 1800)
                }, 2800)
            }
            let goodLuckIndex = result == 13 ? 6 : 14;
            let results = this.results[result - 10];
            if (!primaryAlreadyResolved) {
                for (let i = 0; i < 24; i++) {
                    Game.Instance.runResultTimelineAction(() => this.run2Final(goodLuckIndex));
                    await waitForStep(this.getGoodLuckStepDelay(result, i, delayTime));
                    if (!isPresentationActive()) return;
                }
            }
            for (let i = 0; i < results.length; i++) {
                schedulePresentation(() => {
                    this.wheelItems[results[i]].getComponent(ColorEffect).bg2Effect();
                    this.wheelItems[results[i]].getComponent(ColorEffect).isSelect = true;
                }, 250 * (i + 1));
            }
            this.selectCancle();
        }
    }



    indexIncrease() {
        this.wheelIndex = (this.wheelIndex + 1) % this.wheelItems.length;
    }
    /**
     * 暗淡所有项
     */
    darkAll() {
        this.wheelItems.forEach(item => {
            // item.getComponent(ColorEffect).dark();
            item.getComponent(ColorEffect).clearRollingHighlight(true);
        })
        this.activeRollingIndex = -1;
    }
    /**
     *小电视轮播
     */
    tvStart() {
        const presentationEpoch = this.presentationEpoch;
        if (Game.Instance.TvTime == true) {      //小电视图片轮转
            Game.Instance.cards.BetView.node.active = false;
            if (this.badLuck && Game.Instance.bad01) {  //蓝霉运
                if (Game.Instance.Bad.active == true) {
                    this.BlueLuck.active = false;
                } else {
                    this.CenterSprite.getComponent(cc.Sprite).spriteFrame = this.wheelItems[this.fruitIndex00].getChildByName("good").getComponent(cc.Sprite).spriteFrame;
                }
                setTimeout(() => {
                    if (this.presentationEpoch != presentationEpoch) return;
                    Game.Instance.Bad.active = true;
                    this.CenterSprite.getComponent(cc.Sprite).spriteFrame = ImageCache.Instance.badflase01;
                }, 2000);
            }
            else if (this.badLuck && Game.Instance.bad02) {//红霉运
                if (Game.Instance.Bad02.active == true) {
                    this.RedLuck.active = false;
                } else {
                    this.CenterSprite.getComponent(cc.Sprite).spriteFrame = this.wheelItems[this.fruitIndex00].getChildByName("good").getComponent(cc.Sprite).spriteFrame;
                }
                setTimeout(() => {
                    if (this.presentationEpoch != presentationEpoch) return;
                    Game.Instance.Bad02.active = true;
                    this.CenterSprite.getComponent(cc.Sprite).spriteFrame = ImageCache.Instance.badflase02;
                }, 3000);
            } else {    //普通
                this.CenterSprite.getComponent(cc.Sprite).spriteFrame = this.wheelItems[this.fruitIndex00].getChildByName("good").getComponent(cc.Sprite).spriteFrame;
            }
        }
    }

    /**
     * 恢复所有项
     */
    recoverAll() {
        this.wheelItems.forEach(item => {
            item.getComponent(ColorEffect).isEnd = true;
        })
    }

    /**
     * 所有isSelect为真的选项同时闪烁
     */
    selectShine() {
        this.wheelItems.forEach(item => {
            if (item.getComponent(ColorEffect).isSelect) {
                cc.tween(item)
                    .sequence(
                        cc.fadeOut(0.2),
                        cc.fadeIn(0.2),
                        cc.fadeOut(0.2),
                        cc.fadeIn(0.2)
                    )
                    .start();
            }
        })
    }
    /* 
        霉运时刻混乱闪烁
     */
    // badLuckShine() {
    // this.wheelItems.forEach(item => {
    //     item.getComponent(ColorEffect).bg2.active = true;
    //     const randomDelay = Math.random() * 0.8; // 随机延迟时间范围为 0 到0.8 秒
    //     cc.tween(item)
    //         .delay(randomDelay) // 设置随机延迟
    //         .sequence(
    //             cc.fadeOut(0.2),
    //             cc.fadeIn(0.2),
    //             cc.fadeOut(0.2),
    //             cc.fadeIn(0.2),
    //             cc.fadeOut(0.2),
    //             cc.fadeIn(0.2)
    //         )
    //         .call(() => {
    //             this.darkAll();
    //         })
    //         .start();
    // });
    // }
    /**
     * 所有项的isEnd改为false，使接下来的旋转能够正常进行
     */
    endUnlock() {
        this.wheelItems.forEach(item => {
            item.getComponent(ColorEffect).isEnd = false;
        });
        this.isEnd = false;
    }

    /**
     * 所有项的isSelect改为false，使选项恢复初始状态
     */
    selectCancle() {
        this.wheelItems.forEach(item => {
            item.getComponent(ColorEffect).isSelect = false;
        })
    }

    init() {
        this.presentationEpoch++;
        this.recoverAll();
        this.darkAll();
        this.endUnlock();
        this.selectCancle();
        // 下一局从上一局最终停下的中奖格开始；首局仍使用默认的 0 号格。
        this.wheelIndex = this.lastWinningIndex;
        this.activeRollingIndex = -1;
        this.isEnd = false;
        Game.Instance.wheeleffect.CenterSprite.active = false;   //小电视图片
        Game.Instance.wheeleffect.CenterSprite.getComponent(cc.Sprite).spriteFrame = null;
    }
    appleAudio() {
        Audio.Instance.appleTime();
    }
    finalBgm() {
        if (!this.isEnd && this.isApple == false && Game.Instance.bgmOver == true) {
            Audio.Instance.wheelStart02();
        }
    }

    // update (dt) {}
}
