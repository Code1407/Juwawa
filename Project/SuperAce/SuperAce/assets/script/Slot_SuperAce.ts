// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Audio from "./Audio";
import AutoCtrl from "./AutoCtrl";
import Bottombar from "./Bottombar";
import ColumnSuperAce from "./Column_SuperAce";
import Game from "./Game";
import { gGameData } from "./GameData";
import MultipleBar from "./MultipleBar";
import Poker from "./Poker";
import TurnWinNum from "./TurnWinNum";
import Views from "./Views";
import FlyEffect from "./effect/FlyEffect";
import { IBetResp, IResultItem, IResults } from "./interface/ISuperAce";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import SpinSuperAce from "./ui/Spin_SuperAce";
import FreeEndView from "./view/FreeEndView";
import FreeView from "./view/FreeView";
import NoticeView from "./view/NoticeView";
import WinnigView from "./view/WinningView";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";


const { ccclass, property } = cc._decorator;

@ccclass
export default class SlotSuperAce extends cc.Component {

    @property(cc.Node)
    testBtn: cc.Node = null;

    @property(cc.Node)
    sceneEffect: cc.Node = null;

    @property(cc.Node)
    title: cc.Node = null;

    @property(cc.Node)
    freeSpin: cc.Node = null;

    @property(cc.Label)
    freeCountStr: cc.Label = null;

    @property(ColumnSuperAce)
    columns: ColumnSuperAce[] = [];

    @property(cc.Animation)
    starCardAnim: cc.Animation = null;

    @property(cc.Animation)
    combo: cc.Animation = null;

    @property(MultipleBar)
    multipleBar: MultipleBar = null;

    @property(cc.Label)
    winLabel: cc.Label = null;

    @property(cc.Label)
    autoCount: cc.Label = null;

    @property(cc.Label)
    comboNum: cc.Label = null;

    @property(cc.Animation)
    sceneAnime: cc.Animation = null;

    @property(cc.Node)
    starCard: cc.Node = null;

    @property(TurnWinNum)
    turnWinNum: TurnWinNum = null;

    isAuto: boolean = false;
    quickMode: boolean = false;
    isRunning: boolean = false;
    freeMode: boolean = false;
    enterFree: boolean = false;
    winNum: number = 0;
    nowIndex: number = 0;
    timeOut: ReturnType<typeof setTimeout> = null;
    freeCount: number = 0;
    repeatCount: number = 50;   //自动游戏局数
    freeWinNum: number = 0;
    eliminateIndexs: number[] = [];
    runStatus: IBetResp = null;
    nowResult: IResultItem = null;
    private resultGeneration: number = 0;
    private emergencySettlingRoundId: number = 0;
    static instance: SlotSuperAce = null;

    static get Instance() {
        if (!this.instance) this.instance = cc.find("Canvas/Game/Slot_SuperAce").getComponent(SlotSuperAce);
        return this.instance;
    }

    get ResultGeneration(): number {
        return this.resultGeneration;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    set WinNum(num: number) {
        this.winNum = num;
        this.winLabel.string = this.winNum.toString();
    }

    set IsRunning(isRun: boolean) {
        this.isRunning = isRun;
        if (isRun) {
            SpinSuperAce.Instance.darkNode();
            AmountSelectorUI.Instance.darkNode();
        }
        else {
            SpinSuperAce.Instance.lightNode();
            if (!this.freeMode) AmountSelectorUI.Instance.lightNode();
        }
    }

    set IsAuto(value: boolean) {
        this.isAuto = value;
        if (value) {
            Bottombar.Instance.autoIcon.active = false;
        }
        else {
            Bottombar.Instance.autoIcon.active = true;
        }
    }

    set FreeMode(value: boolean) {
        this.freeMode = value;
        if (value) AmountSelectorUI.Instance.darkNode();
        else {
            if (!this.isRunning) AmountSelectorUI.Instance.lightNode();
        }
    }

    /**
     * 每次切换服务端结果时使旧的动画/延时回调失效。
     * Column 中的原生 setTimeout 无法统一取消，因此回调最终进入 eliminate 时还要校验当前结果对象。
     */
    private invalidateResultCallbacks() {
        this.resultGeneration++;
        this.unscheduleAllCallbacks();
        clearTimeout(this.timeOut);
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].cancelPendingAnimations();
        }
    }

    private isCurrentResultItem(): boolean {
        const resultItems = this.runStatus && this.runStatus.result && this.runStatus.result.resultItems;
        return this.isRunning && Array.isArray(resultItems) &&
            resultItems[this.nowIndex] === this.nowResult;
    }

    /** 使用一局最后一个结果项恢复静态盘面；该方法不会启动任何下注动画。 */
    showResultSnapshot(result: IResults): boolean {
        const resultItems = result && result.resultItems;
        if (!Array.isArray(resultItems) || resultItems.length === 0) return false;
        const finalResultItem = resultItems[resultItems.length - 1];
        if (!finalResultItem || !Array.isArray(finalResultItem.slotResult) || finalResultItem.slotResult.length !== 20) {
            console.warn("Can not restore SuperAce scene snapshot", finalResultItem);
            return false;
        }

        const columnResult = this.convertArrayDimension(finalResultItem.slotResult);
        if (this.columns.length !== columnResult.length) {
            console.warn("SuperAce scene column count mismatch", {
                expected: columnResult.length,
                actual: this.columns.length
            });
            return false;
        }
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].showSnapshot(columnResult[i]);
        }
        return true;
    }

    /** 断线恢复只用于锁定并结算服务端尚未完成的局，不重新播放不可靠的本地动画进度。 */
    restoreResultForRecovery(result: IResults, roundId: number) {
        this.invalidateResultCallbacks();
        this.emergencySettlingRoundId = 0;
        this.nowIndex = 0;
        this.nowResult = null;
        this.eliminateIndexs = [];
        this.runStatus = {
            code: ETradeCode.success,
            hasResult: true,
            roundId: roundId,
            result: JSON.parse(JSON.stringify(result))
        };
        this.showResultSnapshot(this.runStatus.result);
        this.IsRunning = true;
    }

    /** 同步确认服务端已回到 Bet 后，清掉本地遗留的动画回调和运行锁。 */
    finishServerRecovery() {
        this.invalidateResultCallbacks();
        this.emergencySettlingRoundId = 0;
        this.nowIndex = 0;
        this.nowResult = null;
        this.eliminateIndexs = [];
        this.IsRunning = false;
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].initPos();
            this.columns[i].changeWildIndexs = [];
        }
    }

    private settleMalformedCascade(reason: string) {
        const roundId = this.runStatus && Number(this.runStatus.roundId);
        const resultItems = this.runStatus && this.runStatus.result && this.runStatus.result.resultItems;
        console.error("Invalid SuperAce cascade while playing", {
            reason: reason,
            roundId: roundId,
            nowIndex: this.nowIndex,
            resultItemCount: Array.isArray(resultItems) ? resultItems.length : 0,
            eliminateIndexs: this.eliminateIndexs
        });

        // 不再继续播放损坏的结果链，但仍让服务端用原 roundId 正常结算，避免下一次下注返回 missTime(-2)。
        if (!roundId || this.emergencySettlingRoundId == roundId) return;
        this.emergencySettlingRoundId = roundId;
        this.eliminateIndexs = [];
        Game.Instance.player.stopRound(roundId).then(resp => {
            if (!resp && this.emergencySettlingRoundId == roundId) {
                Game.Instance.synchronize();
            }
        });
    }

    start() {
        this.testBtn.on(cc.Node.EventType.TOUCH_START, () => {
            // for (let i = 0; i < this.columns.length; i++) {
            //     this.columns[i].fall(null, i);
            // }
        })
        this.runStatus = {
            code: -1,
            hasResult: false,
            roundId: 0,
            result: null
        }
    }

    onResultHandler(result: IBetResp) {
        // console.log(JSON.stringify(result))
        this.invalidateResultCallbacks();
        this.emergencySettlingRoundId = 0;
        this.nowIndex = 0;
        this.nowResult = null;
        this.eliminateIndexs = [];
        this.WinNum = 0;
        this.IsRunning = true;
        this.runStatus = JSON.parse(JSON.stringify(result));
        let roundResult = this.runStatus.result;
        let columnResult = this.convertArrayDimension(roundResult.resultItems[0].slotResult);
        let scatterCount = 0;
        Audio.Instance.scatterNum = 0;
        this.nowResult = roundResult.resultItems[0];
        if (this.selectScatter(result.result.resultItems[result.result.resultItems.length - 1]).length < 3) {
            this.freeCountStr.string = this.runStatus.result.freeCount.toString();
            this.freeCount = this.runStatus.result.freeCount;
        } else {
            this.freeCountStr.string = (this.runStatus.result.freeCount - 5).toString();
            this.freeCount = this.runStatus.result.freeCount - 5;
        }
        let no1ScatterIndex = -1;
        let no2ScatterIndex = -1;
        let no3ScatterIndex = -1;
        for (let i = 0; i < this.columns.length; i++) {
            if (this.quickMode) break;
            for (let j = 0; j < columnResult[i].length; j++) {
                if (columnResult[i][j] == 0) {
                    scatterCount++;
                    switch (scatterCount) {
                        case 1: no1ScatterIndex = i; break;
                        case 2: no2ScatterIndex = i; break;
                        case 3: no3ScatterIndex = i;
                        default: break;
                    }
                }
            }
        }
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].fall(columnResult[i], i, scatterCount, no1ScatterIndex, no2ScatterIndex, no3ScatterIndex,
                this.resultGeneration);
            this.eliminateIndexs = roundResult.resultItems[0].eliminateIndexs;
        }
    }

    convertArrayDimension(array: number[]) {//将数组的维度转换为2维
        let newArray = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        for (let i = 0; i < newArray.length; i++) {
            for (let j = 0; j < newArray[i].length; j++) {
                newArray[i][j] = array[i + j * 5];
            }
        }
        return newArray;
    }

    eliminate(expectedGeneration: number = this.resultGeneration) {
        if (expectedGeneration != this.resultGeneration || !this.isCurrentResultItem()) {
            console.warn("Ignore stale SuperAce animation callback", {
                expectedGeneration: expectedGeneration,
                currentGeneration: this.resultGeneration,
                nowIndex: this.nowIndex
            });
            return;
        }
        const generation = this.resultGeneration;
        const roundId = this.runStatus.roundId;
        const resultItems = this.runStatus.result.resultItems;
        cc.Tween.stopAllByTag(523);
        this.winLabel.node.scale = 1;
        FlyEffect.Instance.delayTime = 0.2;
        if (this.eliminateIndexs.length == 0) {
            // console.log(this.runStatus.result.freeCount);
            let scatterIndexs = this.selectScatter(this.nowResult);
            this.freeCountStr.string = this.runStatus.result.freeCount.toString();
            this.freeCount = this.runStatus.result.freeCount;
            if (this.runStatus.result.freeCount > 0 && !this.freeMode) {
                this.FreeMode = true;
                this.enterFree = true;
                for (let i = 0; i < this.columns.length; i++) {
                    this.columns[i].darkAll();
                }
                for (let i = 0; i < scatterIndexs.length; i++) {
                    let columnIndex = scatterIndexs[i] % 5;
                    let pokerIndex = Math.floor(scatterIndexs[i] / 5);
                    let animeState = this.columns[columnIndex].pokerEffects.children[pokerIndex].getComponent(cc.Animation).play('freeStart');
                    animeState.speed = 1.1;
                }
                Audio.Instance.playFreeStart();
                setTimeout(() => {
                    if (generation != this.resultGeneration) return;
                    Game.Instance.player.stopRound(roundId);
                }, 2000);
            } else if (this.runStatus.result.freeCount == 0 && this.freeMode) {
                this.multipleBar.switchMode(false);
                this.sceneEffect.active = false;
                this.title.active = true;
                this.freeSpin.active = false;
                this.freeWinNum += this.winNum;
                Game.Instance.player.stopRound(this.runStatus.roundId);
            } else {
                let delayTime = 0;
                this.enterFree = false;
                if (this.freeMode) {
                    let repeatCount = 0;
                    if (scatterIndexs.length >= 3) {
                        delayTime = 3000;
                        this.freeCountStr.string = (this.runStatus.result.freeCount - 5).toString();
                        this.freeCount = this.runStatus.result.freeCount - 5;
                        for (let i = 0; i < this.columns.length; i++) {
                            this.columns[i].darkAll();
                        }
                        for (let i = 0; i < scatterIndexs.length; i++) {
                            let columnIndex = scatterIndexs[i] % 5;
                            let pokerIndex = Math.floor(scatterIndexs[i] / 5);
                            this.columns[columnIndex].pokerEffects.children[pokerIndex].getComponent(cc.Animation).play('scatterWait');
                        }
                        Audio.Instance.playFreeStart();
                        this.schedule(() => {
                            this.freeCount++;
                            this.freeCountStr.string = this.freeCount.toString();
                            repeatCount++;
                        }, 0.15, 4, 1.5);
                    }
                    this.freeWinNum += this.winNum;
                }
                setTimeout(() => {
                    if (generation != this.resultGeneration) return;
                    for (let i = 0; i < this.columns.length; i++) {
                        this.columns[i].recoverAll();
                    }
                    for (let i = 0; i < scatterIndexs.length; i++) {
                        let columnIndex = scatterIndexs[i] % 5;
                        let pokerIndex = Math.floor(scatterIndexs[i] / 5);
                        let currentClip = this.columns[columnIndex].pokerEffects.children[pokerIndex].getComponent(cc.Animation).currentClip;
                        if (currentClip.name != 'scatterStart') {
                            this.columns[columnIndex].pokerEffects.children[pokerIndex].getComponent(cc.Animation).play('scatterStart');
                        }
                    }
                    Game.Instance.player.stopRound(roundId);
                }, delayTime);
            }
            return;
        }
        let nextWildIndex = 999;
        let delayTime = 2000;
        let starIndexs = [];
        let eliminatedIndexs = [];
        const nextResult = resultItems[this.nowIndex + 1];
        if (!nextResult || !Array.isArray(nextResult.slotResult)) {
            this.settleMalformedCascade("missing next result item");
            return;
        }
        this.multipleBar.setMultiple(this.nowIndex);
        if (this.nowIndex == 5) this.starCard.getComponent(cc.Animation).playAdditive('changeBig')
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].darkAll();
        }
        this.combo.node.active = true;
        this.combo.play('combo');
        this.combo.once('finished', () => {
            this.combo.node.active = false;
        })
        this.comboNum.string = (this.nowIndex + 1).toString();
        this.turnWinNum.onEliminate(Math.round(this.nowResult.multiple * this.runStatus.result.betAmount));
        this.WinNum = this.winNum + Math.round(this.nowResult.multiple * this.runStatus.result.betAmount);
        for (let i = 0; i < this.eliminateIndexs.length; i++) {
            let columnIndex = this.eliminateIndexs[i] % 5;
            let pokerIndex = Math.floor(this.eliminateIndexs[i] / 5);
            if (this.nowResult.slotResult[this.eliminateIndexs[i]] < 0) {
                nextWildIndex = nextResult.slotResult[this.eliminateIndexs[i]];
            } else {
                eliminatedIndexs.push(this.nowResult.slotResult[this.eliminateIndexs[i]]);
                nextWildIndex = 999;
            }
            this.columns[columnIndex].eliminate(pokerIndex, nextWildIndex);
            this.nowResult.slotResult[this.eliminateIndexs[i]] = null;
        }
        let setIndexs = [];
        new Set(eliminatedIndexs).forEach(index => {
            if (index != 9 && index != 10) {
                setIndexs.push(index);
            }
        });
        Audio.Instance.playEliminate(this.nowIndex, setIndexs, this.freeMode);
        for (let i = 0; i < this.nowResult.slotResult.length; i++) {
            let resultItem = this.nowResult.slotResult[i]
            let nextItem = nextResult.slotResult[i];
            if (resultItem == null) continue;
            else {
                if (resultItem != null && resultItem == -nextItem && resultItem > 0) {
                    starIndexs.push(i);
                }
            }
        }
        setTimeout(() => {
            if (generation != this.resultGeneration) return;
            this.continueRun(generation);
        }, delayTime);
    }

    continueRun(expectedGeneration: number = this.resultGeneration) {
        if (expectedGeneration != this.resultGeneration || !this.isCurrentResultItem()) return;
        const generation = this.resultGeneration;
        this.nowIndex++;
        let roundResult = this.runStatus.result;
        let delayTime = this.quickMode ? 1000 : 1300;
        let addTime = 0;
        let addTime2 = 0;
        let addTime3 = 0;
        let isCopy = false;
        if (this.nowIndex < roundResult.resultItems.length) {
            let columnResult = this.convertArrayDimension(roundResult.resultItems[this.nowIndex].slotResult);
            let changeGoldenIndexs = [[], [], [], [], []];
            let copyWildIndexs = [[], [], [], [], []];
            this.nowResult = roundResult.resultItems[this.nowIndex];
            let goldenIndex = this.nowResult.slotResult.map((item, index) => item == 10 ? index : -1).filter(index => index > 0 && !this.nowResult.copyWildIndexs.includes(index));
            for (let i = 0; i < this.nowResult.changeGoldenIndexs.length; i++) {
                let columnIndex = this.nowResult.changeGoldenIndexs[i] % 5;
                let pokerIndex = Math.floor(this.nowResult.changeGoldenIndexs[i] / 5);
                changeGoldenIndexs[columnIndex].push(pokerIndex);
                addTime3 = 800;
            }
            for (let i = 0; i < this.nowResult.copyWildIndexs.length; i++) {
                let columnIndex = this.nowResult.copyWildIndexs[i] % 5;
                let pokerIndex = Math.floor(this.nowResult.copyWildIndexs[i] / 5);
                copyWildIndexs[columnIndex].push(pokerIndex);
                isCopy = true;
            }
            for (let i = 0; i < this.columns.length; i++) {
                let time = this.columns[i].runContinue(columnResult[i], copyWildIndexs[i], changeGoldenIndexs[i], i, goldenIndex[0]);
                addTime = time > addTime ? time : addTime;
                this.eliminateIndexs = roundResult.resultItems[this.nowIndex].eliminateIndexs;
            }
            setTimeout(() => {
                if (generation != this.resultGeneration) return;
                this.sceneAnime.node.active = true;
                this.sceneAnime.play();
                this.sceneAnime.once('finished', () => {
                    this.sceneAnime.node.active = false;
                });
            }, addTime);
            setTimeout(() => {
                if (generation != this.resultGeneration) return;
                if (this.nowResult.changeGoldenIndexs.length > 0) this.starCardAnim.playAdditive('cardShiny');
                for (let i = 0; i < this.columns.length; i++) {
                    let time = this.columns[i].changeGolden(columnResult[i], changeGoldenIndexs[i], i);
                    addTime2 = time > addTime2 ? time : addTime2;
                }
                setTimeout(() => {
                    this.eliminate(generation);
                }, delayTime + addTime2);
            }, addTime + addTime3);
        }
    }

    stopRound() {
        // 断线恢复/首次进入时，服务端可能先完成旧局结算，而本地没有可播放的结果。
        // 重复的 StopRoundResp 也不应再次触发胜利弹窗、免费局切换或自动下注。
        if (!this.isRunning) {
            console.warn("Ignore duplicate SuperAce stopRound response");
            return;
        }
        if (!this.runStatus || !this.runStatus.result) {
            console.warn("Finish SuperAce recovery without local round result");
            this.finishServerRecovery();
            return;
        }
        this.invalidateResultCallbacks();
        this.emergencySettlingRoundId = 0;
        let isBigWin = this.runStatus.result.multiple >= 10;
        let freeEnd = false;
        if (this.runStatus.result.freeCount == 0 && this.freeMode) {
            this.FreeMode = false;
            freeEnd = true;
        }
        this.multipleBar.init();
        if (this.winNum > 0) {
            cc.tween(this.winLabel.node)
                .to(0.2, { scale: 1.25 })
                .delay(0.6)
                .to(0.3, { scale: 1 })
                .tag(523)
                .start();
        }
        if (this.nowIndex > 4) this.starCard.getComponent(cc.Animation).playAdditive('changeNormal');
        this.nowIndex = 0;
        this.nowResult = null;
        this.eliminateIndexs = [];
        this.IsRunning = false;
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].initPos();
            this.columns[i].changeWildIndexs = [];
        }
        let continueOrNot = AutoCtrl.Instance.continueOrNot(this.runStatus.result.multiple);
        if (((this.isAuto && this.repeatCount > 0 && continueOrNot)) && !this.enterFree) {
            this.timeOut = setTimeout(() => {
                this.startAuto(true);
            }, 300);
        }
        if (this.repeatCount <= 0 || !continueOrNot) this.stopAuto();
        if (isBigWin) {
            clearTimeout(this.timeOut);
            WinnigView.Instance.onWin(this.runStatus.result.multiple, this.runStatus.result.betAmount, freeEnd);
        } else if (freeEnd) {
            clearTimeout(this.timeOut);
            FreeEndView.Instance.onFreeEnd();
        }
        if (this.freeMode && this.enterFree && !isBigWin) {
            FreeView.Instance.node.active = true;
        }
    }

    startAuto(status: boolean): boolean {
        if (this.isAuto != status) return false;
        if (gGameData.status != EGameStatus.bet || Game.Instance.isRecoveringRound() || this.isRunning) return false;
        let config = (<any>window).config;
        let autoUnlimit = config && config.gameExtra && config.gameExtra.autoUnlimit;
        Game.Instance.autoBtnEffect.active = false;
        this.IsAuto = true;
        this.autoCount.node.active = true;
        if (!autoUnlimit) this.repeatCount--;
        this.autoCount.string = this.repeatCount.toString();
        if (this.repeatCount <= 0) {
            this.stopAuto();
            return false;
        }
        // 请求发出到结果推送之间也属于运行态，避免前台恢复回调与旧定时器
        // 同时进入这里，造成同一时刻发送两次下注。
        this.IsRunning = true;
        let betPromise: Promise<IBetResp>;
        if (this.freeMode && this.freeCount > 0) {
            betPromise = Game.Instance.player.betFree();
        }else{
            betPromise = Game.Instance.player.betNormal(gGameData.betAmountIndex);
        }
        betPromise.then(resp => {
            if (!resp) this.IsRunning = false;
        }).catch(error => {
            console.error("SuperAce auto bet failed", error);
            this.IsRunning = false;
        });
        return true;
    }


    stopAuto() {
        this.resetAutoState(true);
        Views.Instance.noticeView.active = true;
        NoticeView.Instance.label.string = (<any>window).langContent?.notice.autoDisable || "Auto Spin Disable"
    }

    /** 前后台切换时不保留 Auto，并将次数和限制项恢复为初始值。 */
    resetAutoState(restoreButtonEffect: boolean) {
        clearTimeout(this.timeOut);
        this.timeOut = null;
        this.IsAuto = false;
        this.autoCount.node.active = false;
        this.repeatCount = 50;
        AutoCtrl.Instance.betCount = 50;
        AutoCtrl.Instance.stopAuto();
        AutoCtrl.Instance.init();
        if (restoreButtonEffect) Game.Instance.autoBtnEffectPlay();
    }

    freeViewDisapper(isEnterGame: boolean) {
        if (!isEnterGame) {
            // StopRoundResp 会先结束当前播放状态并清空 nowResult，免费模式入场动画
            // 则会稍后才回调到这里。此时应从已结算结果的最后一帧恢复触发免费局的
            // Scatter，而不是继续依赖仅在播放期间有效的 nowResult。
            const resultItems = this.runStatus && this.runStatus.result && this.runStatus.result.resultItems;
            const settledResult = Array.isArray(resultItems) && resultItems.length > 0 ?
                resultItems[resultItems.length - 1] : null;
            let scatterIndexs = this.selectScatter(this.nowResult || settledResult);
            for (let i = 0; i < scatterIndexs.length; i++) {
                let columnIndex = scatterIndexs[i] % 5;
                let pokerIndex = Math.floor(scatterIndexs[i] / 5);
                this.columns[columnIndex].pokerEffects.children[pokerIndex].getComponent(cc.Animation).play('scatterStart');
            }
        }
        this.multipleBar.switchMode(this.freeMode);
        this.sceneEffect.active = true;
        this.freeSpin.active = true;
        this.title.active = false;
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].recoverAll();
        }
    }

    selectScatter(resultItem: IResultItem): number[] {
        let scatterIndexs = [];
        if (!resultItem || !Array.isArray(resultItem.slotResult)) return scatterIndexs;
        for (let i = 0; i < resultItem.slotResult.length; i++) {
            if (resultItem.slotResult[i] == 0) {
                scatterIndexs.push(i);
            }
        }
        return scatterIndexs;
    }

    darkAll(index: number) {
        for (let i = 0; i < index; i++) {
            this.columns[i].darkAll();
            this.columns[i].lightEffect.active = false;
            this.columns[i].lightEffect2.active = false;
            for (let j = 0; j < this.columns[i].item.length; j++) {
                if (this.columns[i].item[j].getComponent(Poker).pokerIndex != 0) {
                    this.columns[i].pokerEffects.children[j].active = false;
                };
            }
        }
    }

    recoverAll() {
        Audio.Instance.stopScatterWait();
        for (let i = 0; i < this.columns.length; i++) {
            this.columns[i].recoverAll();
            this.columns[i].lightEffect.active = false;
            this.columns[i].lightEffect2.active = false;
        }
    }

    playScatterWait(index: number) {
        for (let i = 0; i < this.columns[index].item.length; i++) {
            if (this.columns[index].item[i].getComponent(Poker).pokerIndex == 0) {
                this.columns[index].pokerEffects.children[i].getComponent(cc.Animation).play('scatterWait');
            }
        }
    }

    stopScatterWait() {
        for (let i = 0; i < this.columns.length; i++) {
            for (let j = 0; j < this.columns[i].item.length; j++) {
                if (this.columns[i].item[j].getComponent(Poker).pokerIndex == 0) {
                    let currentClip = this.columns[i].pokerEffects.children[j].getComponent(cc.Animation).currentClip;
                    if (currentClip.name != 'scatterStart') {
                        this.columns[i].pokerEffects.children[j].getComponent(cc.Animation).play('scatterStart');
                    }
                }
            }
        }
    }

    // update (dt) {}
}
