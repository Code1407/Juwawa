// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


import Cards from "./Cards";

import { gGameData } from "./GameData";
import ReadyView from "./view/ReadyView"
import BetView from "./view/BetView"
import Account from "./Account";
import PlayerAccount from "./PlayerAccount";
import RoundFinal from "./view/RoundFinal";
import { IRoundStep, IEnterGameResp, IRoundResult, IBetResp, IAllBetResp, IRankListItem, arraySum, IRewardResp, IBatListResp, setNewRank, gConst, calNumber, BET_POSITION_COUNT, createEmptyBetNum, createEmptyBetPositions, getBetGradeAmounts, normalizeProtocolNumberArray } from "./interface/ILuckyFruits";
import RankUI from "./ui/RankUI";
import RepeatBetUI from "./ui/RepeatBetUI";
import GameRecordView from "./view/GameRecordView";
import GameSettingView from "./view/GameSettingView";
import { Effect } from "./effect/FlyChip";
import ChangeChip from "./image/ChangeChip";
import { EBetStatus, EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import { sdk } from "../shared/Common";
import { afterLoad } from "../lang/afterLoad";
import ResultView from "./view/ResultView";
import RuleView from "./view/RuleView";
import { setRechargeView } from "../shared2/GlobalViewsLoader";
import Historyicon from "./HistoryIcon";
import MyHistoryView from "./view/MyHistoryView";
import WheelEffect from "./effect/WheelEffect";
import ColorEffect from "./effect/ColorEffect";
import BetNumView from "./BetNumView";
import BetNumLimitView from "./view/BetNumLimitView";
import ImageCache from "./image/ImageCache";
import EffRPS from "./effect/EffRPS";
import Audio from "./Audio";

const { ccclass, property } = cc._decorator;

interface ResultRollEvent {
    offsetMs: number;
    index: number;
    useFinalStep: boolean;
    highlightDelay: number;
}

@ccclass
export default class Game extends cc.Component {
    private readonly resultRollDurationMs: number = 6000;

    @property(Cards)
    cards: Cards = null;

    @property(Account)
    account: Account = null;

    @property(EffRPS)
    EffRPS: EffRPS = null;

    @property(BetView)
    BetView: BetView = null;

    @property(RepeatBetUI)
    autoBetUI: RepeatBetUI = null;

    @property(RankUI)
    RankUI: RankUI = null;

    @property(RoundFinal)
    roundFinal: RoundFinal = null;

    @property(cc.Label)
    todayRoundLabel: cc.Label = null;

    @property(cc.Node)
    SettingBtn: cc.Node = null;

    @property(cc.Node)
    HistoryBtn: cc.Node = null;

    @property(cc.Node)
    MyHistoryBtn: cc.Node = null;

    @property(cc.Node)
    RuleBtn: cc.Node = null;

    @property(cc.Node)
    ExitBtn: cc.Node = null;

    @property(cc.Node)
    DiamonIcon: cc.Node = null;

    @property(cc.Node)
    AgainBet: cc.Node = null;

    @property(cc.Node)
    RewardingView: cc.Node = null;

    @property(cc.Node)
    FlyFromNode: cc.Node = null;

    @property(cc.Node)
    BetLimitView: cc.Node = null;

    @property(cc.Node)
    stopBtn: cc.Node = null;

    @property(cc.Node)
    newButton: cc.Node = null;

    @property(cc.Node)
    BetAmounView: cc.Node = null;

    @property(GameSettingView)
    GameSettingView: GameSettingView = null;

    @property(GameRecordView)
    GameRecordView: GameRecordView = null;

    @property(MyHistoryView)
    MyHistoryView: MyHistoryView = null;

    @property(RuleView)
    RuleView: RuleView = null;

    @property(RepeatBetUI)
    RepeatBetUI: RepeatBetUI = null;

    @property(ResultView)
    ResultView: ResultView = null;

    @property(WheelEffect)
    wheeleffect: WheelEffect = null;

    @property(BetNumLimitView)
    BetNumLimitView: BetNumLimitView = null;

    @property(cc.Node)
    Betitems: Array<cc.Node> = [];

    @property(cc.SpriteFrame)
    IconItems: Array<cc.SpriteFrame> = [];

    @property(cc.Integer)
    screenRate: number = 0;//1为半屏

    @property(cc.Label)
    sumBet: cc.Label = null;

    @property(cc.Node)
    BetTime: cc.Node = null;

    @property(cc.Node)
    Desks: Array<cc.Node> = [];

    @property(cc.Node)
    Bad: cc.Node = null;

    @property(cc.Node)
    Bad02: cc.Node = null;

    @property(cc.Node)
    NCAuto: cc.Node = null;


    @property(sp.Skeleton)
    Anya1: sp.Skeleton = null;  //苹果按钮 
    @property(sp.Skeleton)
    Anya2: sp.Skeleton = null; //香蕉按钮 
    @property(sp.Skeleton)
    Anya3: sp.Skeleton = null;  //柠檬按钮 
    @property(sp.Skeleton)
    Anya4: sp.Skeleton = null;  //西瓜按钮  
    @property(sp.Skeleton)
    Anya5: sp.Skeleton = null; //bar按钮 

    chips: any;
    finalTrueTime: number;

    tick: number = 0;
    flag: boolean = true;
    flag1: boolean = true;
    player: PlayerAccount = null;
    autoBet: boolean = false;
    firstIn: Boolean = true;
    curRound = 0;//记录当前round，不随心跳更变。
    private resultAnimationRound: number = -1;
    private resultAnimationEpoch: number = 0;
    private serverClockOffsetMs: number = 0;
    private resultTimelineStartedAtLocalMs: number = 0;
    private resultTimelineLogicalOffsetMs: number = 0;
    wheelSelected: number[] = [];
    autoBetLastTime: number = 0;
    isSendAutoBetOnce: boolean = false;
    onlyOne: boolean = true;
    bgmOver: boolean = false;
    liang: boolean = false;
    // sumbig: boolean = false;
    isBigWin: boolean = false;
    soundPlayed: boolean = false;
    TvTime: boolean = false;
    isMySelf: boolean = false;
    bad01: boolean = false;
    bad02: boolean = false;
    notInTime: boolean = true;
    //private lifecycle: number;

    static get Instance() {
        return cc.find("Canvas/Game").getComponent(Game);

    }
    private isResultAnimationActive(round: number, epoch: number): boolean {
        return this.curRound == round && this.resultAnimationEpoch == epoch;
    }

    private syncServerClock(roundStep: IRoundStep) {
        const serverNowMs = Number((<any>roundStep).serverNowMs);
        if (Number.isFinite(serverNowMs) && serverNowMs > 0) {
            this.serverClockOffsetMs = serverNowMs - Date.now();
        }
    }

    private getPhaseElapsedMs(roundStep: IRoundStep = gGameData.roundStep): number {
        const startedAtMs = Number((<any>roundStep).phaseStartedAtMs);
        const endsAtMs = Number((<any>roundStep).phaseEndsAtMs);
        if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return 0;
        const serverNowEstimate = Date.now() + this.serverClockOffsetMs;
        const elapsedMs = Math.max(0, serverNowEstimate - startedAtMs);
        if (!Number.isFinite(endsAtMs) || endsAtMs <= startedAtMs) return elapsedMs;
        return Math.min(elapsedMs, endsAtMs - startedAtMs);
    }

    private isResultTimelineCatchingUp(offsetMs: number = this.resultTimelineLogicalOffsetMs): boolean {
        return this.resultTimelineStartedAtLocalMs > 0
            && Date.now() - this.resultTimelineStartedAtLocalMs > offsetMs + 16;
    }

    /** 执行时间轴动作；追帧期间临时静音，避免把已经错过的音效集中播放。 */
    runResultTimelineAction(callback: () => void, offsetMs: number = this.resultTimelineLogicalOffsetMs) {
        if (!this.isResultTimelineCatchingUp(offsetMs)) {
            callback();
            return;
        }
        const audio = Audio.Instance;
        const audioOn = audio && audio.audioOn;
        if (audio) audio.audioOn = false;
        try {
            callback();
        } finally {
            if (audio) audio.audioOn = audioOn;
        }
    }

    scheduleResultTimelineAction(callback: () => void, delayMs: number = 0) {
        const targetOffsetMs = this.resultTimelineLogicalOffsetMs + Math.max(0, delayMs);
        const remainingMs = this.resultTimelineStartedAtLocalMs + targetOffsetMs - Date.now();
        if (remainingMs <= 0) {
            this.runResultTimelineAction(callback, targetOffsetMs);
            return;
        }
        setTimeout(callback, remainingMs);
    }

    private createInitialRollDelays(): number[] {
        const delays: number[] = [];
        let delayTime = 60;
        for (let i = 0; i < 112; i++) {
            if (10 < i && i < 40) delayTime -= 1.2;
            else if (70 < i && i < 100) delayTime += 0.2;
            else if (i >= 111) delayTime += 188;
            delays.push(delayTime);
        }
        return delays;
    }

    /**
     * 把完整滚动拆成带绝对偏移的关键帧。最后一个关键帧固定在 6000ms，
     * 因此更换起点或落点不会改变整段开奖时长。
     */
    private createResultRollTimeline(
        startIndex: number,
        targetIndex: number,
        isNormalResult: boolean,
        resultType: number,
        initialRollDelays: number[],
        finalDelayTime: number
    ): ResultRollEvent[] {
        const itemCount = this.wheeleffect.wheelItems.length;
        if (itemCount == 0) return [];
        const events: ResultRollEvent[] = [];
        let cursor = ((startIndex % itemCount) + itemCount) % itemCount;
        let naturalOffset = 0;
        let highlightDelay = 100;

        for (let i = 0; i < initialRollDelays.length; i++) {
            events.push({ offsetMs: naturalOffset, index: cursor, useFinalStep: false, highlightDelay });
            cursor = (cursor + 1) % itemCount;
            naturalOffset += initialRollDelays[i];
            highlightDelay += 0.5;
        }

        if (isNormalResult) {
            const extraLapDelays = this.createNormalExtraLapDelays(targetIndex, finalDelayTime);
            for (let i = 0; i < extraLapDelays.length; i++) {
                events.push({ offsetMs: naturalOffset, index: cursor, useFinalStep: false, highlightDelay });
                cursor = (cursor + 1) % itemCount;
                naturalOffset += extraLapDelays[i];
            }
        }

        let finalStep = 0;
        while (cursor != targetIndex && finalStep < itemCount) {
            events.push({ offsetMs: naturalOffset, index: cursor, useFinalStep: true, highlightDelay });
            cursor = (cursor + 1) % itemCount;
            naturalOffset += isNormalResult
                ? this.getNormalFinalStepDelay(targetIndex, finalStep, finalDelayTime)
                : this.wheeleffect.getGoodLuckStepDelay(resultType, finalStep, finalDelayTime);
            finalStep++;
        }
        events.push({ offsetMs: naturalOffset, index: targetIndex, useFinalStep: true, highlightDelay });

        const timeScale = naturalOffset > 0 ? this.resultRollDurationMs / naturalOffset : 1;
        for (let i = 0; i < events.length; i++) {
            events[i].offsetMs = i == events.length - 1
                ? this.resultRollDurationMs
                : Math.round(events[i].offsetMs * timeScale);
        }
        return events;
    }

    /** 跳过过期关键帧，只恢复当前画面并播放剩余关键帧。 */
    private async playResultRollTimeline(
        events: ResultRollEvent[],
        targetIndex: number,
        phaseElapsedMs: number,
        isAnimationActive: () => boolean
    ) {
        if (events.length == 0) return;
        const elapsedMs = Math.max(0, Math.min(this.resultRollDurationMs, phaseElapsedMs));
        const shouldSeek = elapsedMs > 32;
        let latestElapsedEvent: ResultRollEvent = null;

        if (shouldSeek) {
            for (let i = 0; i < events.length; i++) {
                if (events[i].offsetMs > elapsedMs) break;
                latestElapsedEvent = events[i];
            }
            if (latestElapsedEvent) {
                if (latestElapsedEvent.useFinalStep && latestElapsedEvent.index == targetIndex) {
                    this.wheeleffect.seekFinalIndex(targetIndex);
                } else {
                    this.wheeleffect.seekRollingIndex(latestElapsedEvent.index);
                }
            }
        }

        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (shouldSeek && event.offsetMs <= elapsedMs) continue;
            const remainingMs = this.resultTimelineStartedAtLocalMs + event.offsetMs - Date.now();
            const runEvent = () => {
                if (!isAnimationActive()) return;
                this.runResultTimelineAction(() => {
                    if (event.useFinalStep) this.wheeleffect.run2Final(targetIndex);
                    else this.wheeleffect.run(event.highlightDelay);
                }, event.offsetMs);
            };
            if (remainingMs <= 0) runEvent();
            else setTimeout(runEvent, remainingMs);
        }

        const remainingRollMs = Math.max(0,
            this.resultTimelineStartedAtLocalMs + this.resultRollDurationMs - Date.now());
        await new Promise<void>(resolve => setTimeout(resolve, remainingRollMs));
        if (isAnimationActive() && !this.wheeleffect.isEnd) {
            // 定时器同毫秒触发顺序或后台限频不能让最终落点晚于6秒。
            this.wheeleffect.seekFinalIndex(targetIndex);
        }
        this.resultTimelineLogicalOffsetMs = this.resultRollDurationMs;
    }

    private getNormalFinalStepDelay(resultIndex: number, step: number, delayTime: number): number {
        if (resultIndex < 3) return delayTime + 150;
        if (resultIndex == 3) return step > 0 ? delayTime + 200 : delayTime - 70;
        if (resultIndex > 3 && resultIndex < 6) return step > 0 ? delayTime + 100 : delayTime - 70;
        if (resultIndex > 6 && resultIndex < 9) return step > 3 ? delayTime + 150 : delayTime - 50;
        if (resultIndex >= 9 && resultIndex <= 11) return step > 6 ? delayTime + 100 : delayTime - 50;
        if (resultIndex > 11) return step > 9 ? delayTime + 100 : delayTime - 70;
        return delayTime;
    }

    private createNormalExtraLapDelays(resultIndex: number, delayTime: number): number[] {
        if (resultIndex >= 4) return [];
        const delays: number[] = [];
        for (let i = 0; i < 16; i++) {
            delays.push(i < 13 ? delayTime - 80 : delayTime + 150);
        }
        return delays;
    }

    private getNormalStopDelay(resultIndex: number, delayTime: number): number {
        const itemCount = this.wheeleffect.wheelItems.length;
        if (itemCount == 0) return 0;
        const stepsBeforeTarget = (resultIndex - this.wheeleffect.wheelIndex + itemCount) % itemCount;
        let total = this.createNormalExtraLapDelays(resultIndex, delayTime)
            .reduce((sum, delay) => sum + delay, 0);
        for (let step = 0; step < stepsBeforeTarget; step++) {
            total += this.getNormalFinalStepDelay(resultIndex, step, delayTime);
        }
        return total;
    }

    /**
     * 让当前开奖展示立即失效，并清理中央中奖图层。
     * reconnect 可能发生在同一局内，不能只依赖 curRound 变化来终止旧动画。
     */
    private cancelResultPresentation(suppressRound: number = -1) {
        this.resultAnimationEpoch++;
        this.resultAnimationRound = suppressRound;
        this.resultTimelineStartedAtLocalMs = 0;
        this.resultTimelineLogicalOffsetMs = 0;
        this.wheelSelected = [];
        this.TvTime = false;
        // 开奖表现不只包含转盘高亮，还包含 RoundFinal 结算层。
        // 登录/重连时必须一起立即关闭，避免旧结算层与恢复后的倒计时重叠。
        if (this.roundFinal) {
            this.roundFinal.hideImmediate();
        }
        this.wheeleffect.init();
    }

    private isOlderRoundStep(roundStep: IRoundStep): boolean {
        const current = gGameData.roundStep;
        if (!roundStep || !current) return false;

        const incomingRound = Number(roundStep.todayRound);
        const currentRound = Number(current.todayRound);
        if (!Number.isFinite(incomingRound) || !Number.isFinite(currentRound)) return false;
        if (incomingRound < currentRound) return true;
        if (incomingRound > currentRound) return false;

        const currentStatus = Number(current.status);
        const incomingStatus = Number(roundStep.status);
        // stop 是本地断线状态，必须允许服务端快照恢复它。
        if (currentStatus == EGameStatus.stop || currentStatus == EGameStatus.unknow) return false;

        const phaseOrder = (status: number) => {
            if (status == EGameStatus.bet) return 1;
            if (status == EGameStatus.run || status == EGameStatus.run2final) return 2;
            if (status == EGameStatus.final) return 3;
            return 0;
        };
        const incomingPhase = phaseOrder(incomingStatus);
        const currentPhase = phaseOrder(currentStatus);
        if (incomingPhase < currentPhase) return true;
        if (incomingPhase > currentPhase) return false;

        const incomingRemain = Number(roundStep.remainSecond);
        const currentRemain = Number(current.remainSecond);
        // 同一局、同一阶段的剩余秒数只会递减；较大的值来自延迟到达的恢复快照。
        return Number.isFinite(incomingRemain)
            && Number.isFinite(currentRemain)
            && incomingRemain > currentRemain;
    }

    changeGameStatus(_roundStep: IRoundStep) {
        if (!_roundStep || this.isOlderRoundStep(_roundStep)) return;
        this.syncServerClock(_roundStep);
        //if (gGameData.status == _roundStep.status) return;
        //console.log("current ROUND = "+_roundStep.todayRound);
        gGameData.roundStep.todayRound = _roundStep.todayRound;
        gGameData.roundStep.status = _roundStep.status;
        gGameData.roundStep.remainSecond = _roundStep.remainSecond;
        gGameData.roundStep.serverNowMs = Number((<any>_roundStep).serverNowMs) || 0;
        gGameData.roundStep.phaseStartedAtMs = Number((<any>_roundStep).phaseStartedAtMs) || 0;
        gGameData.roundStep.phaseEndsAtMs = Number((<any>_roundStep).phaseEndsAtMs) || 0;
        gGameData.roundStep.timelineVersion = Number((<any>_roundStep).timelineVersion) || 0;
        gGameData.roundStep.rollStartPos = Number.isFinite(Number((<any>_roundStep).rollStartPos))
            ? Number((<any>_roundStep).rollStartPos)
            : this.wheeleffect.getLastWinningIndex();
        if (_roundStep.status == EGameStatus.run
            && this.resultAnimationRound == _roundStep.todayRound
            && this.resultTimelineStartedAtLocalMs > 0
            && gGameData.roundStep.phaseStartedAtMs > 0) {
            // 后续心跳用新的服务端时间样本校正本地时间轴，避免长动画逐渐漂移。
            this.resultTimelineStartedAtLocalMs = gGameData.roundStep.phaseStartedAtMs - this.serverClockOffsetMs;
        }
        gGameData.roundStep.winPos = _roundStep.winPos;
        const resultDetail = normalizeProtocolNumberArray((<any>_roundStep).resultDetail);
        const resultPos = normalizeProtocolNumberArray((<any>_roundStep).resultPos);
        // 同时回写本次网络对象，保证后续状态处理可以安全使用 length/slice。
        _roundStep.resultDetail = resultDetail;
        _roundStep.resultPos = resultPos;
        gGameData.roundStep.resultDetail = resultDetail.concat();
        gGameData.roundStep.resultPos = resultPos.concat();
        // this.wheeleffect.changeGameStatus();

        switch (gGameData.roundStep.status) {
            case EGameStatus.bet:
                // 新回合收尾保险：正常情况下 ReadyView 会在 final,-1 时关闭，
                // 但断线重连或丢帧时仍需显式清理，避免倒计时与上局中心图叠加。
                this.cards.ReadyView.hideImmediate();
                if (this.curRound !== gGameData.roundStep.todayRound) {
                    this.cancelResultPresentation();
                }
                if (this.firstIn) {
                    this.firstIn = false;
                    this.stopBtn.active = true;         //Again按钮
                    this.newButton.active = false;
                }
                this.todayRoundLabel.string = gGameData.roundStep.todayRound.toString();    //更新回合数


                this.BetTime.active = true;
                Game.Instance.cards.BetView.node.active = true;
                this.firstIn = false;
                this.flag1 = true;
                this.inBet()
                if (this.onlyOne == true) {
                    this.Desk02();
                }
                let player = Game.Instance.player;
                let wheelAmount = player.getAutoBetAmount();
                if (wheelAmount.length == 0) {
                    return;
                }
                if (gGameData.roundStep.remainSecond > 0) {
                    this.stopBtn.active = false;
                    this.newButton.active = true;
                } else if (gGameData.roundStep.remainSecond == 0) {
                    this.stopBtn.active = true;
                    this.RepeatBetUI.RepeatAnimation.clearTrack(1);
                    this.newButton.active = false;
                    this.Desk01();
                    this.onlyOne = false;
                }
                break;
            case EGameStatus.run:
                if (this.onlyOne == false) {
                    this.Desk01();
                    if (this.notInTime == true) {
                        this.notInTime = false;
                        this.BetView.toString00();
                    }
                }
                this.inRun();
                if (this.firstIn) {
                    // 中途进入开奖阶段时显示“距下一轮”的整数倒计时。
                    const readySecond = Math.max(0, Math.ceil(Number(gGameData.roundStep.remainSecond) || 0) + 7);
                    this.firstInHandler(readySecond);
                    return
                }
                if (gGameData.Gamefocus == false || this.curRound != _roundStep.todayRound) {
                    return;
                }
                break;
            case EGameStatus.final:
                const finalRemainSecond = Math.ceil(Number(gGameData.roundStep.remainSecond) || 0);
                // 玩家首次进入/重连时，结算阶段只剩最后 5 秒则不补显示开奖结果。
                // 这段时间只保留 ReadyView 倒计时；-1 用于让 ReadyView 执行结束淡出。
                if (this.firstIn && finalRemainSecond >= -1 && finalRemainSecond <= 5) {
                    this.roundFinal.hideImmediate();
                    this.firstInHandler(finalRemainSecond);
                    return;
                }
                // 剩余时间大于 5 秒时按正常结算流程恢复，并确保没有遗留倒计时层。
                if (this.firstIn) {
                    this.firstIn = false;
                    this.cards.ReadyView.hideImmediate();
                }
                if (gGameData.Gamefocus == false || this.curRound != _roundStep.todayRound) {
                    return;
                }
                this.inFinal()
                this.roundFinal.inFinal(gGameData.roundStep.remainSecond);


                if (this.roundFinal.endTrue) {
                    this.inReady();     //重置下注上局金额信息
                    this.wheeleffect.init()
                }
                break;
        }
        this.roundFinal.changeGameStatus(gGameData.roundStep.status);

    }

    private initRound(roundStep: IRoundStep) {
    }

    private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
        let enterGameResp = await this.player.enterGame();
        this.initPlayerData(enterGameResp, true);
        this.firstInBetHandler(enterGameResp);
        this.EffRPS.Play();

    }
    private initPlayerData(enterGameResp: IEnterGameResp, isFirstCall: boolean = false, isReconnect: boolean = false) {
        //console.log("玩家进入游戏："+JSON.stringify(enterGameResp));
        if (!enterGameResp || !enterGameResp.roundStep) return;
        const snapshotIsOlder = !isFirstCall && this.isOlderRoundStep(enterGameResp.roundStep);
        if (!snapshotIsOlder && (isFirstCall || isReconnect)) {
            // 登录/重连先清掉旧展示，随后由服务端时间锚点从当前进度恢复。
            this.cancelResultPresentation();
        }
        const canResumeRunTimeline = !snapshotIsOlder
            && enterGameResp.roundStep.status == EGameStatus.run
            && Number((<any>enterGameResp.roundStep).timelineVersion) >= 2
            && Number(enterGameResp.roundStep.winPos) >= 0;
        if (isReconnect && !snapshotIsOlder) {
            // 网络恢复后必须以服务端快照重新驱动界面，不能沿用断线前的 firstIn
            // 和 ReadyView 淡出 Action，否则中央倒计时会缺失或被旧回调隐藏。
            gGameData.Gamefocus = true;
            this.cards.ReadyView.node.stopAllActions();
            this.cards.ReadyView.node.opacity = 255;
            if (enterGameResp.roundStep.status == EGameStatus.final) {
                this.firstIn = true;
            } else if (canResumeRunTimeline) {
                this.firstIn = false;
                this.cards.ReadyView.hideImmediate();
            } else {
                this.firstIn = false;
                this.cards.ReadyView.hideImmediate();
            }
        }
        if (isFirstCall && canResumeRunTimeline) {
            this.firstIn = false;
            this.cards.ReadyView.hideImmediate();
        }
        (<any>window).myUID = enterGameResp.uid;
        if (!snapshotIsOlder) {
            this.todayRoundLabel.string = enterGameResp.roundStep.todayRound.toString();
        }
        const snapshotRoundChanged = this.curRound != enterGameResp.roundStep.todayRound;
        if (!snapshotIsOlder && (isFirstCall || (snapshotRoundChanged && enterGameResp.roundStep.status != EGameStatus.bet))) {
            // 从 run/final 阶段进入或重连时也要建立当前局号，否则权威结果会被当成过期消息。
            this.curRound = enterGameResp.roundStep.todayRound;
            if (enterGameResp.roundStep.status != EGameStatus.run) {
                this.resultAnimationRound = -1;
            }
        }
        this.cards.node.active = true;
        // this.autoBetUI.node.active =true;
        Historyicon.Instance.setIcon(enterGameResp.gameHistory);
        this.MyHistoryView.setHistoryValue(enterGameResp.myHistory);
        this.player.uid = enterGameResp.uid;
        this.player.setDiamon(enterGameResp.account.diamond);
        this.RankUI.setRankData(enterGameResp.rankList);
        this.todayRankList = enterGameResp.rankList;
        const playerSettings = enterGameResp.playerSettings || {};
        gGameData.betAmountIndex = playerSettings.lastBetAmountButton ?? gGameData.betAmountIndex;
        const serverSoundVol = playerSettings.soundVol;
        let targetSoundVol = serverSoundVol === undefined ? gGameData.soundVol : serverSoundVol;
        const noAudio = String((<any>window).user?.noAudio ?? "");
        const hasAudioOverride = isFirstCall && (noAudio === "0" || noAudio === "1");
        if (hasAudioOverride) {
            targetSoundVol = noAudio === "1" ? 0 : 1;
        }
        gGameData.soundVol = targetSoundVol;
        Audio.Instance.audioOn = targetSoundVol > 0;
        if (!Audio.Instance.audioOn) {
            cc.audioEngine.stopAll();
            cc.audioEngine.stopMusic();
        }
        if (hasAudioOverride && serverSoundVol !== targetSoundVol) {
            this.player.updateSettings({
                soundVol: targetSoundVol,
                lastBetAmountButton: gGameData.betAmountIndex,
            });
        }
        this.GameSettingView.settingBtn();
        this.BetAmounView.getComponent("BetAmounView").setState();
        BetNumView.instance.BetAmountChange();
        let gradeAmounts = getBetGradeAmounts().concat();
        gradeAmounts = gradeAmounts.sort((a, b) => b - a);
        gGameData.betMax = gradeAmounts.length > 0 ? gradeAmounts[0] * 100 : 0;
        (<any>window).onRankAwardFinish = (diamond: number) => this.account.setMyDiamon(diamond)
        // enterGame/synchronize 已携带权威回合状态，立即驱动一次界面状态机；
        // 不再依赖下一秒的 onRoundStep 推送才能启动或恢复游戏流程。
        if (!snapshotIsOlder) {
            this.changeGameStatus(enterGameResp.roundStep);
            if (canResumeRunTimeline) {
                this.resumeResultTimeline(enterGameResp.roundStep);
            } else if (enterGameResp.roundStep.status == EGameStatus.final
                && Number(enterGameResp.roundStep.winPos) >= 0
                && !this.cards.ReadyView.node.active) {
                // 真正结算阶段只恢复最终盘面，绝不补播或压缩开奖动画。
                // ReadyView 正在显示表示玩家是在最后 5 秒进入，按规则不恢复本局结果。
                this.TvTime = true;
                this.wheeleffect.restoreCompletedResult(
                    Number(enterGameResp.roundStep.winPos),
                    normalizeProtocolNumberArray((<any>enterGameResp.roundStep).resultDetail),
                    normalizeProtocolNumberArray((<any>enterGameResp.roundStep).resultPos)
                );
            }
        }
        //this.firstInChipHandler(betCount);
    }

    private resumeResultTimeline(roundStep: IRoundStep) {
        const result: IRoundResult = {
            todayRound: roundStep.todayRound,
            rollStartPos: Number.isFinite(Number((<any>roundStep).rollStartPos))
                ? Number((<any>roundStep).rollStartPos)
                : this.wheeleffect.getLastWinningIndex(),
            winPos: roundStep.winPos,
            resultDetail: normalizeProtocolNumberArray((<any>roundStep).resultDetail),
            resultPos: normalizeProtocolNumberArray((<any>roundStep).resultPos),
        };
        this.onResultHandler(result, this.getPhaseElapsedMs(roundStep));
    }
    private firstInBetHandler(enterGameResp: IEnterGameResp) {
        if (enterGameResp.curRoundAllWheelAmount.length > 0 && enterGameResp.roundStep.status == EGameStatus.bet) {
            let betCount: number[][] = createEmptyBetNum();

            for (let index = 0; index < enterGameResp.curRoundAllWheelAmount.length; index++) {
                const element = enterGameResp.curRoundAllWheelAmount[index];
                for (let i = 0; i < Math.min(element.betGradeNum.length, BET_POSITION_COUNT); i++) {
                    const list = element.betGradeNum[i];
                    for (let j = 0; j < betCount[i].length; j++) {
                        const element = list[j];
                        betCount[i][j] += Number(element) || 0;
                    }
                }
                if (element.uid == this.player.uid) {
                    this.FlyChip({ batIndex: element.betGradeArr, num: element.betGradeNum });
                    let betTotal = 0;
                    for (let i = 0; i < Math.min(element.betGradeNum.length, BET_POSITION_COUNT); i++) {
                        betTotal += calNumber(element.betGradeNum[i]);
                    }
                    gGameData.BetTotalNumber += betTotal;
                }
                else {
                    let oldPlayer: boolean = false;
                    if (this.todayRankList.length > 0) {
                        for (let k = 0; k < this.todayRankList.length; k++) {
                            if (this.todayRankList[k].uid == element.uid) {
                                if (k < 5) {
                                    this.OnbatListRound({ uid: element.uid, flyPlayerPos: k, batIndex: element.betGradeArr, num: element.betGradeNum });
                                }
                                else {
                                    this.OnbatListRound({ uid: element.uid, flyPlayerPos: 5, batIndex: element.betGradeArr, num: element.betGradeNum });
                                }
                                oldPlayer = true;
                                break;
                            }
                        }
                    }
                    if (oldPlayer == false) {
                        this.OnbatListRound({ uid: element.uid, flyPlayerPos: 5, batIndex: element.betGradeArr, num: element.betGradeNum });
                    }
                }
            }

            this.cards.setAllBatNum(betCount);
            this.cards.setMyBatNum(enterGameResp.curRoundWheelAmount);

            for (let index = 0; index < enterGameResp.curRoundWheelAmount.length; index++) {
                this.player.curBetLimit[index] = arraySum(enterGameResp.curRoundWheelAmount[index]) > 0 ? 1 : 0;
            }
        }
    }
    private firstInChipHandler(list: number[][]) {
        if (list.length > 0) {
            for (let index = 0; index < list.length; index++) {
                const chipList = list[index];
                if (chipList.length > 0) {
                    for (let i = 0; i < chipList.length; i++) {
                        const chipCount = chipList[i];
                        if (chipCount > 0) {
                            for (let j = 0; j < chipCount; j++) {
                                let flyNode = new cc.Node();
                                flyNode.addComponent(cc.Sprite).spriteFrame = ChangeChip.Instance.chips[gGameData.BetLevel[i] - 1];
                                this.RankUI.letpos[index].addChild(flyNode);
                                flyNode.active = true;
                                flyNode.scale = 0.8;
                                //flyNode.width = flyNode.height = 50;
                                flyNode.x = Math.random() * 130 - 60
                                flyNode.y = Math.random() * 70 - 150
                            }
                        }
                    }
                }

            }
        }
    }
    private firstInHandler(CountTime: number) {
        this.cards.inReady(CountTime);
        //this.player.setMyBatNum([[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    }

    private inReady() {
        this.flag = true;
        this.flag1 = true;
        // this.cards.inReady(gGameData.roundStep.remainSecond);
        this.player.curBetLimit = createEmptyBetPositions();
        this.player.setMyBatNum(createEmptyBetNum());
        this.player.itemAmount = [];
        gGameData.roundBetCount = 0;
        gGameData.BetTotalNumber = 0;
    }

    private async inBet() {
        if (gGameData.Gamefocus == true) {
            if (this.curRound != gGameData.roundStep.todayRound) {
                this.resultAnimationRound = -1;
            }
            this.curRound = gGameData.roundStep.todayRound;
        }
        this.cards.inBet(gGameData.roundStep.remainSecond);
        //////////////////// 自动下注 Handler //////////////////
        if (gGameData.roundStep.remainSecond <= 3) return;
        if (this.autoBet && this.player.getNotedBat() == false) {
            //多加一个容错，多次autoBet需要隔几秒 避免“粘连”
            //resp 粘贴问题(容错1)，todo:之后待排查
            if (Date.now() - this.autoBetLastTime < 2500) {
                console.log("正常容错代码：inBet 粘连 排除多次autoBet offset=" + (Date.now() - this.autoBetLastTime))
                return;
            }
            //强制 只发送一次 autobe(容错2)
            if (this.isSendAutoBetOnce == true) return;

            this.autoBetLastTime = Date.now();
            let needDiamon: number = this.player.autoRecordBetSum();
            this.autoBet = this.player.accountDiamond >= needDiamon;
            if (this.autoBet) {
                let gradeList = createEmptyBetPositions();
                let betAmount = this.player.getAutoBetAmount();
                if (betAmount && betAmount.length > 0) {
                    if (betAmount[0].length > 0) {
                        for (let index = 0; index < betAmount.length; index++) {
                            this.player.curBetLimit[index] = gradeList[index] = arraySum(betAmount[index]) > 0 ? 1 : 0;
                        }
                        let betTotal = 0;
                        for (let side = 0; side < betAmount.length; side++) {
                            betTotal += calNumber(betAmount[side]);
                        }
                        gGameData.BetTotalNumber += betTotal;

                        //发送服务器
                        this.player.bet(gGameData.roundStep.todayRound, gradeList, betAmount);
                        this.player.setNotedBetCount(gradeList);
                        //this.player.wheelAmount = betAmount;//防止自动下注没有返回导致的重复下注。
                        Game.Instance.FlyChip({ batIndex: gradeList, num: betAmount });
                    }
                }
            }
            else {
                this.ShowRechargeView(needDiamon);
            }
        }
    }

    private async inRun() {
        if(Audio.Instance.audioOn==false){
            Audio.Instance.stop00();
        }
    }

    private async inFinal() {
        // for(let i=0;i<10;i++){
        //     this.wheeleffect.run2Final(); 
        //     await new Promise(resolve => setTimeout(resolve, 100));
        // }
        if (this.flag1 == false) {
            return;
        }
        this.firstIn = false;
        //Audio.Instance.playFinal();
        this.flag1 = false;
        this.cards.inFinal();
        // setTimeout(() => {
        //     this.RankUI.setRankData([]);
        // }, 3000);

    }
    async ShowRechargeView(needDiamon: number) {
        let enterGameResp = await this.synchronize();
        if (this.player.accountDiamond < needDiamon) {
            setRechargeView(true)
        }
        // this.autoBet = false;
    }
    async onResultHandler(result: IRoundResult, resumeElapsedMs?: number) {
        // console.log("OnResultHandler:" + JSON.stringify(result));
        // 兼容 Lua table 经 PureClient 解码后的数字键对象和空对象。
        result.resultDetail = normalizeProtocolNumberArray((<any>result).resultDetail);
        result.resultPos = normalizeProtocolNumberArray((<any>result).resultPos);
        // 丢弃过期结果，并防止同一局的重复推送启动多条并行动画。
        if (!result || result.todayRound != this.curRound || this.resultAnimationRound == result.todayRound) {
            return;
        }
        this.resultAnimationRound = result.todayRound;
        const animationEpoch = ++this.resultAnimationEpoch;
        const isAnimationActive = () => this.isResultAnimationActive(result.todayRound, animationEpoch);
        const phaseElapsedMs = Math.max(0, Number.isFinite(resumeElapsedMs)
            ? Number(resumeElapsedMs)
            : this.getPhaseElapsedMs());
        this.resultTimelineStartedAtLocalMs = Date.now() - phaseElapsedMs;
        this.resultTimelineLogicalOffsetMs = 0;
        const scheduleAnimation = (callback: () => void, delay: number = 0) => {
            this.scheduleResultTimelineAction(() => {
                if (isAnimationActive()) callback();
            }, delay);
        };
        this.wheelSelected = [];
        this.wheeleffect.darkAll();
        // 结果已到达，中央水果必须与外圈第一步同时开始轮播；
        // 不再等待 BetView 中与服务端结果时机无关的固定延时。
        this.cards.inRun();
        this.TvTime = true;
        this.BetView.node.active = false;
        const initialRollDelays = this.createInitialRollDelays();
        const delayTime = initialRollDelays[initialRollDelays.length - 1];

        const isNormalResult = result.resultDetail.length == 1
            && result.resultDetail[0] != 13
            && result.resultDetail[0] != 14;
        const fallbackStartIndex = this.wheeleffect.getLastWinningIndex();
        const rawStartIndex = Number((<any>result).rollStartPos);
        const rollStartIndex = Number.isFinite(rawStartIndex) ? rawStartIndex : fallbackStartIndex;
        this.wheeleffect.setRollStartIndex(rollStartIndex);
        const rawResultIndex = isNormalResult ? Number(result.resultPos[0]) : -1;
        const resultIndex = isNormalResult && Number.isFinite(rawResultIndex)
            ? rawResultIndex
            : -1;
        const targetIndex = isNormalResult
            ? resultIndex
            : this.wheeleffect.getGoodLuckTargetIndex(result.winPos);
        if (targetIndex < 0 || targetIndex >= this.wheeleffect.wheelItems.length) return;

        const rollEvents = this.createResultRollTimeline(
            rollStartIndex,
            targetIndex,
            isNormalResult,
            result.winPos,
            initialRollDelays,
            delayTime
        );
        this.bgmOver = false;
        const runStartClip = Audio.Instance.WheelStart && Audio.Instance.WheelStart.clip;
        const runStartDurationMs = runStartClip
            ? runStartClip.duration * 1000
            : this.resultRollDurationMs;
        const runStartDelayMs = Math.max(0, this.resultRollDurationMs - runStartDurationMs);
        scheduleAnimation(() => Audio.Instance.wheelStart(), runStartDelayMs);
        scheduleAnimation(() => this.bgmOver = true, this.resultRollDurationMs);
        if (isNormalResult && resultIndex < 4 && rollEvents.length > 125) {
            scheduleAnimation(() => Audio.Instance.wheelStart02(), rollEvents[125].offsetMs);
        }

        await this.playResultRollTimeline(rollEvents, targetIndex, phaseElapsedMs, isAnimationActive);
        if (!isAnimationActive()) return;

        if (isAnimationActive()) {
            if (isNormalResult) {            //普通中奖
                if (gGameData.roundStep.winPos != -1) {
                    this.roundFinal.finalResult(gGameData.roundStep.winPos, result.todayRound);
                }
            } else if (result.resultDetail.length > 1) {       //特殊中奖
                this.wheeleffect.run2GoodLuckFinal(
                    result.winPos,
                    result.resultDetail,
                    delayTime,
                    result.resultPos,
                    undefined,
                    true,
                    Math.max(0, phaseElapsedMs - this.resultRollDurationMs)
                );
                if (gGameData.roundStep.winPos != -1) {
                    this.roundFinal.finalResult(gGameData.roundStep.winPos, result.todayRound);
                }
            }
            else if (result.resultDetail[0]==13||result.resultDetail[0]==14) {        //霉运时刻
                this.bad01 = result.winPos == 13;
                this.bad02 = result.winPos == 14;
                this.wheeleffect.run2GoodLuckFinal(
                    result.winPos,
                    result.resultDetail,
                    delayTime,
                    result.resultPos,
                    undefined,
                    true,
                    Math.max(0, phaseElapsedMs - this.resultRollDurationMs)
                );
                if (gGameData.roundStep.winPos != -1) {
                    this.roundFinal.finalResult(gGameData.roundStep.winPos, result.todayRound);
                }

            }
            for (let j = 0; j < this.Desks.length; j++) {    ///控制中间按钮亮灭
                if (result.winPos == 0 || result.winPos == 4) {
                    if (resultIndex == 4) {
                        scheduleAnimation(() => {
                            this.Desks[0].active = false;  //苹果
                            Audio.Instance.result();
                        }, 1500)
                    } else if (resultIndex == 5) {
                        scheduleAnimation(() => {
                            this.Desks[0].active = false;  //苹果
                            Audio.Instance.result();
                        }, 1700)
                    } else if (resultIndex == 0) {
                        scheduleAnimation(() => {
                            this.Desks[0].active = false;  //苹果
                            Audio.Instance.result();
                        }, 3100)
                    }
                    else if (resultIndex == 12) {
                        scheduleAnimation(() => {
                            this.Desks[0].active = false;  //苹果
                            Audio.Instance.result();
                        }, 2100)
                    } else if (resultIndex == 8) {
                        scheduleAnimation(() => {
                            this.Desks[0].active = false;  //苹果
                            Audio.Instance.result();
                        }, 2200)
                    }
                }
                else if (result.winPos == 1 || result.winPos == 5) {
                    if (resultIndex == 15) {
                        scheduleAnimation(() => {
                            this.Desks[1].active = false;  //香蕉
                            Audio.Instance.result();

                        }, 3100)
                    } else if (resultIndex == 7) {
                        scheduleAnimation(() => {
                            this.Desks[1].active = false;  //香蕉
                            Audio.Instance.result();

                        }, 2200)
                    }
                    else {
                        scheduleAnimation(() => {
                            this.Desks[1].active = false;  //香蕉
                            Audio.Instance.result();

                        }, 2700)
                    }
                }
                else if (result.winPos == 2 || result.winPos == 6) {
                    if (resultIndex == 1) {
                        scheduleAnimation(() => {
                            this.Desks[2].active = false;  //柠檬
                            Audio.Instance.result();

                        }, 3600)
                    } else if (resultIndex == 3) {
                        scheduleAnimation(() => {
                            this.Desks[2].active = false;  //柠檬
                            Audio.Instance.result();
                        }, 4300)
                    }
                    else {
                        scheduleAnimation(() => {
                            this.Desks[2].active = false;  //柠檬
                            Audio.Instance.result();
                        }, 2600)
                    }
                }
                else if (result.winPos == 3 || result.winPos == 7) {
                    if (resultIndex == 9) {
                        scheduleAnimation(() => {
                            this.Desks[3].active = false;  //西瓜
                            Audio.Instance.result();
                        }, 2100)
                    } else {
                        scheduleAnimation(() => {
                            this.Desks[3].active = false;  //西瓜
                            Audio.Instance.result();

                        }, 2400)
                    }

                }
                else if (result.winPos == 8) {
                    scheduleAnimation(() => {
                        this.Desks[4].active = false;  //bar
                        Audio.Instance.result();

                    }, 3700)
                }
                else if (result.winPos == 9) {  //蓝大奖，苹果时刻
                    scheduleAnimation(() => {
                    }, 1200)
                    break;
                }
                else if (result.winPos == 10) { //蓝大奖，上半圈
                    scheduleAnimation(() => {
                        // this.Desks[0].active = false;  //苹果
                        // this.Desks[2].active = false;  //柠檬
                        this.Desks[4].active = false;  //bar
                        // this.Desks[1].active = false;  //香蕉
                    }, 9800)
                    break;
                }
                else if (result.winPos == 11) {
                    // setTimeout(() => {
                    //     this.Desks[2].active = false;  //柠檬
                    //     this.Desks[0].active = false;  //苹果
                    //     this.Desks[1].active = false;  //香蕉
                    //     this.Desks[3].active = false;  //西瓜
                    // }, 6300)
                    break;
                    //红大奖，下半圈
                } else {
                    if (this.wheeleffect.badLuck == false) {
                        scheduleAnimation(() => {
                            this.Desks[2].active = false;  //柠檬
                            this.Desks[0].active = false;  //苹果
                            this.Desks[1].active = false;  //香蕉
                            this.Desks[3].active = false;  //西瓜
                            this.Desks[4].active = false;  //bar
                            scheduleAnimation(() => {
                                this.Desks[2].active = true;  //柠檬
                                this.Desks[0].active = true;  //苹果
                                this.Desks[1].active = true;  //香蕉
                                this.Desks[3].active = true;  //西瓜
                                this.Desks[4].active = true;  //bar
                                scheduleAnimation(() => {
                                    this.Desks[2].active = false;  //柠檬
                                    this.Desks[0].active = false;  //苹果
                                    this.Desks[1].active = false;  //香蕉
                                    this.Desks[3].active = false;  //西瓜
                                    this.Desks[4].active = false;  //bar
                                    scheduleAnimation(() => {
                                        this.Desks[2].active = true;  //柠檬
                                        this.Desks[0].active = true;  //苹果
                                        this.Desks[1].active = true;  //香蕉
                                        this.Desks[3].active = true;  //西瓜
                                        this.Desks[4].active = true;  //bar
                                        scheduleAnimation(() => {
                                            this.Desks[2].active = false;  //柠檬
                                            this.Desks[0].active = false;  //苹果
                                            this.Desks[1].active = false;  //香蕉
                                            this.Desks[3].active = false;  //西瓜
                                            this.Desks[4].active = false;  //bar
                                        }, 222)
                                    }, 222)
                                }, 222)
                            }, 1722)
                        }, 8866)
                    }
                    break;
                    //全中，闪烁
                }
            }

        }
        else {
            console.log("round is wrong!");
        }
    }
    fruitIndex(index: number) {
        this.wheeleffect.fruitIndex00 = index;
    }
    Onbat(result: IBetResp) {
        if (!result) {
            console.error("bet response is empty");
            return;
        }
        if (result.code == ETradeCode.success) {
            this.player.setDiamon(result.accountDiamond);
            this.player.setMyBatNum(result.betGradeNum);
            this.cards.setMyBatNum(result.betGradeNum);
        }
        else if (result.code == ETradeCode.insufficient) {
            setRechargeView(true);
        }
        else if (result.code == ETradeCode.missTime) {
            console.warn("bet missed current round", result);
        }
        else if (result.code == ETradeCode.closeServer) {
            console.warn("bet rejected: server is closing", result);
        }
        else if (result.code == ETradeCode.fail) {
            console.error("bet rejected by server validation", result);
        }
        else {
            console.warn("bet failed", ETradeCode[result.code] || result.code, result);
        }
    }
    sumBet00(sum: number) {
        this.sumBet.string = sum.toString();

    }
    OnbatNoticeAll(resp: IAllBetResp) {
        this.cards.setAllBatNum(resp.wheelAmount);
        if (resp) {
            if (this.isMySelf) {
                this.isMySelf = false;
                return;
            }
            cc.tween(cc.find("Canvas/Game/BottomView/Ranking/an_players/players"))      //上下抖动
                .to(0.06, { y: 9 })
                .to(0.06, { y: 0 })
                .to(0.06, { y: -9 })
                .to(0.06, { y: 0 })
                .start();
        }
    }
    OnRewardHandler(roundResult: IRewardResp) {
        roundResult.resultDetail = normalizeProtocolNumberArray((<any>roundResult).resultDetail);
        let winId: number = Number.parseInt(roundResult.winCard);
        gGameData.WinPos = winId;
        gGameData.ResultDetail = roundResult.resultDetail;
        // console.log("OnRewardHandler====================" +roundResult.resultDetail);
        this.player.OnRewardHandler(winId, roundResult.resultDetail);
        // this.WinHistory.getComponent(cc.Sprite).spriteFrame = this.IconItems[winId];
    }
    todayRankList: IRankListItem[] = [];
    onRankListChange(resp: IRankListItem[]) {
        this.RankUI.setRankData(resp);
        this.roundFinal.setRankData(resp);
        this.todayRankList = resp;
    }
    // OnHistoryHandler(resp:IMyHistoryItem[]){
    //     this.player.setHistoryData(resp);
    // }
    OnbatListRound(resp: IBatListResp) {
        this.RankUI.FlyChip(resp);
    }

    FlyChip(data: any) {
        this.FlyChipMind(data, this.RankUI.letpos);
    }
    FlyChipMind(data: any, nodes: {}) {
        this.isMySelf = true;
        if (this.Betitems != null && this.Betitems.length > 0) {
            let player;
            let targetPos;
            // if(this.sumbig==true){
            //     Audio.Instance.playSendBet();
            //     this.sumbig=false;
            // }else{

            Audio.Instance.playSendBet();
            // }

            let gradeCount = getBetGradeAmounts().length;
            for (let i = 0; i < BET_POSITION_COUNT; i++) {
                if (data.batIndex[i] > 0) {
                    targetPos = nodes[i];
                    let row = data.num[i] || [];
                    for (let j = 0; j < gradeCount; j++) {
                        if (row[j] > 0) {
                            player = this.AgainBet;
                            for (let n = 0; n <= 19; n++) {      ////原n<data.num[i][j]是根据下注的情况多少来调用飞币数量,改成 n <=19限制每个选项同时飞金币的数量
                                let flyChip = this.chips.getChip(j) || ImageCache.Instance.betAmount[j];

                                Effect.FlyChipSingle(player, targetPos, flyChip, 1, this.DiamonIcon);//投注，飞筹码
                            }
                        }
                    }
                }
            }
        }
    }
    FlyChipByPos(pos: number, betGrade: number): cc.Node {
        let player = this.Betitems[betGrade];       ///this.Betitems[betGrade]从各自档位飞出     this.FlyFromNode从多人icon飞出
        this.isMySelf = true;
        let targetPos = this.RankUI.letpos[pos];
        Audio.Instance.playSendBet();
        let flyChip = this.chips.getChip(betGrade) || ImageCache.Instance.betAmount[betGrade];
        return Effect.FlyChipSingle(player, targetPos, flyChip, 1, this.DiamonIcon);//投注，飞筹码
    }
    Desk01() {
        for (let i = 0; i < 5; i++) {
            this.Desks[i].active = true;    //暗
            this.onlyOne = true;
        }
    }
    Desk02() {
        for (let i = 0; i < 5; i++) {
            this.Desks[i].active = false;   //亮
            this.onlyOne = false;
        }
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    protected onLoad(): void {
        cc.view.enableAutoFullScreen(false);
        // 筹码面额必须等待网络鉴权和入场数据完成后再显示。
        this.BetAmounView.active = false;
    }

    async start() {
        cc.view.enableAutoFullScreen(false);
        if (!await sdk.init()) {
            console.error("sdk init failed!");
            return;
        }
        let config = (<any>window).config;
        if (config) {
            if (config.gameExtra) {//内测专属Auto
                    // if (config.gameExtra.removeAuto) {
                    //     this.NCAuto.active = !config.gameExtra.removeAuto;
                    // }
                    // else if (config.gameExtra.removeAuto == false) {
                    //     this.NCAuto.active = !config.gameExtra.removeAuto;
                    // }

                // } else
                if (config.appExtra) {
                    this.NCAuto.active = config.appExtra.removeAuto;
                }
            }
        } else {
            this.NCAuto.active = false;
        }

        gConst.gameName = (<any>window).gameName;
        setNewRank((<any>window).config.enableRank);

        this.chips = (<any>window).betGrade;
        this.account.node.active = true;

        (<any>window).onReconnect = async () => {
            let enterGameResp = await this.player.enterGame();
            const snapshotIsOlder = !enterGameResp?.roundStep || this.isOlderRoundStep(enterGameResp.roundStep);
            if (!snapshotIsOlder && this.curRound != enterGameResp.roundStep.todayRound) {
                this.player.setMyBatNum(createEmptyBetNum());
                gGameData.roundBetCount = 0;
                gGameData.BetTotalNumber = 0;
            }
            this.initPlayerData(enterGameResp, false, true);
        };

        afterLoad();
        await this.initGame();
        Audio.Instance.PlayBgm();

        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮，屏蔽自动玩法
            this.autoBetUI.node.active = false;
        };

        (<any>window).hideAllSounds = () => {
            //将所有声音的音量调到0
            Audio.Instance.stopAllSounds();
            Audio.Instance.audioOn = false;

        };

        (<any>window).showAllSounds = () => {
            //恢复所有声音的音量
            Audio.Instance.audioOn = true;
        };

        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
            gGameData.roundStep.status = EGameStatus.stop;
        }
        // cc.debug.setDisplayStats(true);
        this.SettingBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playCardOut();
            this.GameSettingView.node.active = true;
        });
        this.HistoryBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playCardOut();
            this.GameRecordView.node.active = true;
        });
        this.ExitBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playCardOut();
            sdk.quit();
        });
        this.RuleBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playCardOut();
            this.RuleView.node.active = true;
            let scrollView = this.RuleView.node.getChildByName("ruleView").getComponent(cc.ScrollView);
            scrollView.scrollToTop(0); // 0表示立即滚动到顶部，单位为秒        
        });
        this.MyHistoryBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playCardOut();
            this.MyHistoryView.node.active = true;
        });

        cc.game.on(cc.game.EVENT_HIDE, () => {
            //this.curRound = gGameData.roundStep.todayRound
            gGameData.Gamefocus = false;
            Audio.Instance.pauseForBackground();
            this.player.actionRecord("hide");
            //console.log(cc.game.EVENT_HIDE+",this.lastRound="+this.curRound);
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            let shouldReload = false;
            if (config && config.gameExtra && config.gameExtra.showReload != undefined && config.gameExtra.showReload != null) {
                shouldReload = config.gameExtra.showReload === true;
            }
            else if (config && config.appExtra && config.appExtra.showReload != undefined && config.appExtra.showReload != null) {
                shouldReload = config.appExtra.showReload === true;
            } else {
                console.log("config.showReload:Is Error!");
            }
            // reload 后旧场景必须立即停止执行，避免旧异步 synchronize 再覆盖新场景UI。
            if (shouldReload) {
                sdk.reload();
                return;
            }
            Audio.Instance.resumeFromBackground();
            //console.log(cc.game.EVENT_SHOW);
            let enterGameResp = await this.player.synchronize();
            this.player.actionRecord("show");
            gGameData.Gamefocus = true;
            this.initPlayerData(enterGameResp, false, true);
        });
    }
    ShowStopBetView() {
        if (this.RewardingView.active) {
            return;
        }
        this.RewardingView.active = true;
        this.RewardingView.opacity = 0;
        //this.RewardingView.runAction(cc.fadeIn(0.3));

        this.RewardingView.runAction(
            cc.sequence(
                cc.fadeIn(0.3),
                cc.delayTime(1),
                cc.fadeOut(0.3),
                cc.callFunc(() => {
                    this.RewardingView.active = false
                })
            )
        );
    }
    ShowBetLimitView() {
        if (this.BetLimitView.active) {
            return;
        }
        this.BetLimitView.active = true;
        this.BetLimitView.opacity = 0;
        //this.RewardingView.runAction(cc.fadeIn(0.3));
        this.BetLimitView.runAction(cc.sequence(cc.fadeIn(0.3),cc.delayTime(1.0),cc.fadeOut(0.3),cc.callFunc(()=>{
            this.BetLimitView.active = false
        })));
    }

    ShowRewardCount(num: {}) {
        this.RankUI.ShowRewardCount(num);
    }
    ShowResult(num: number) {
        this.ResultView.earnNum = num; //记录本局奖金
        this.ResultView.rewardNum.getComponent(cc.Label).string = num + "";
        Audio.Instance.playpattiwin();
    }
    ShowMindRewardCount(num: number) {
        let addGoldLabel: cc.Node = cc.find("addgold", this.DiamonIcon);
        if (num > 0) {
            addGoldLabel.getComponent(cc.Label).string = "+" + (num < 1000 ? num.toString() : num / 1000 + "k");
            addGoldLabel.active = true;
            addGoldLabel.opacity = 0;
            //this.RewardingView.runAction(cc.fadeIn(0.3));

            addGoldLabel.runAction(
                cc.sequence(
                    cc.fadeIn(0.3),
                    cc.delayTime(1),
                    cc.fadeOut(0.3),
                    cc.callFunc(() => {
                        addGoldLabel.active = false;
                    })
                )
            );
        }
    }
    async synchronize() {
        //console.log(cc.game.EVENT_SHOW);
        let enterGameResp = await this.player.synchronize();
        gGameData.Gamefocus = true;
        this.initPlayerData(enterGameResp, false, true);
    }
    async userRechargeSuccess() {
        return (<any>window).updateBalance?.();
    }
}

(<any>window).updateBalance = async function () {
    const msgRouter = (<any>window).msgRouter;
    if (msgRouter?.request) {
        try {
            const response = await msgRouter.request("CsPlayerBaseDataReq", {});
            const coins = Number(response?.pBaseData?.coins);
            if (Number.isFinite(coins) && coins >= 0) {
                Game.Instance.player.setDiamon(coins);
            }
            return;
        } catch (error) {
            console.error("CsPlayerBaseDataReq failed", error);
        }
    }
    await Game.Instance.synchronize();
};

(<any>window).rechargeSuccess = function () {
    return (<any>window).updateBalance();
};
(<any>window).stopAllSounds = function () {
    Audio.Instance.stopAllSounds();
};
