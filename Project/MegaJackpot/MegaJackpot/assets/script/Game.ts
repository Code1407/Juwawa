// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Account from "./Account";
import Bottombar from "./Bottombar";
import { gBetAmounts, gGameData, gPlayerSettings, initBetAmounts, setBetAmounts } from "./GameData";
import { bigWinMultiple, ILineSame, collectConnectedIndex, IBetResp, IEnterGameResp, IResults, EBetAmountIndex, linePaths } from "./interface/IMageJackpot";
import Lines from "./Lines";
import PlayerAccount from "./PlayerAccount";
import Slots from "./Slots";
import Views from "./Views";
import Jackpot from "./Jackpot";
import { LocalizedSprite } from "../lang/LocalizedSprite";
import { sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2 } from "../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import AudioCtrl from "../shared3/AudioCtrl_shared3";
import { AudioClip } from "./AudioClip_MageJackpot";
import MailModel from "../mail/script/MailModel";
import { pinusRequest } from "../shared/MessageRouter";
import AnimControl from "./effect/AnimControl";
import SpineControl from "./SpineControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    audioButton: cc.Node = null;
    @property(Slots)
    slots: Slots = null;

    /** 连线中奖特效覆盖层：Canvas/Game/SlotsAnim */
    @property(AnimControl)
    slotsAnim: AnimControl = null;

    /** 线条动画节点*/
    @property(cc.Node)
    linesNode: cc.Node = null;


 
    @property(Account)
    account: Account = null;


    //动画控制节点
    @property({type: cc.Node, tooltip: "SpineControl 节点"})
    spineControlNode: cc.Node = null;

    private spineControl: SpineControl = null;

    player: PlayerAccount = null;
    roundResult: IResults = null;

    private remainSecond = 0;
    private isEnterGame = false;
    private isRecoveringFreeRound = false;
    private isBackground = false;
    private restoringGameStateDepth = 0;
    private suppressRecoveredFreeGameView = false;
    /** 每次开新局递增，用于中止上局尚在运行的连线表现协程。 */
    private linePresentationId = 0;

    static get Instance() {
        return cc.find("Canvas/Game").getComponent(Game);
    }

    async newRound() {
        // 浏览器的 setTimeout/Promise 在页面切到后台后仍可能继续执行。
        // 自动模式即使已经关闭，也可能有一个排队中的 enterBet 回调走到这里，
        // 因此必须在真正发起下注前再做一次后台状态校验。
        if (this.isBackground || (<any>window).gameHide) {
            Bottombar.Instance.setAutoBet(false);
            return;
        }

        // A delayed input callback must not open a second request while the
        // previous bet is still awaiting its server response.
        if (Bottombar.Instance.coolDown) return;
        Bottombar.Instance.coolDown = true;

        let betAmount = gBetAmounts[gGameData.betAmountIndex];

        this.linePresentationId++;
        this.initGameData();
        let slotsAnim = this.getSlotsAnimControl();
        if (slotsAnim) slotsAnim.clearAnim();
        this.getLinesControl()?.clearLines();
        this.slots.newRound();
        this.spineControl?.showFreeModeSpin(Bottombar.Instance.isFreeStatus());

        if (!Bottombar.Instance.isFreeStatus() && !Bottombar.Instance.isAutoBet()) {
            //this.clientRun();
            Bottombar.Instance.hideSpin();
        }

        let resp: IBetResp;
        try {
            resp = gGameData.freeCount > 0
                ? await this.player.betFree()
                : await this.player.betNormal(betAmount);
        } catch (error) {
            console.error("bet request failed", error);
            this.restoreAfterResultFailure();
            return;
        }
        if (!await this.onResultHandler(resp)) return;

        while (this.slots.getSlotsStatus() != EGameStatus.final || !this.roundResult) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!this.roundResult) {
            console.log("这局失败弹窗");
        }
    }

    initGameData() {
        gGameData.results = [];
        gGameData.lineSames = [];
        gGameData.multiple = 0;
        gGameData.jackpotAmount = 0;
        gGameData.bonusTriggered = false;
        gGameData.bonusSymbolCount = 0;
        gGameData.bonusMultiplier = 0;
        gGameData.bonusWinAmount = 0;
        gGameData.bonusSegmentIndex = -1;
    }

    /**
     * 手动 Stop 使用默认的最短停轮；Turbo 切换时传入较平滑的急速档位。
     */
    finishRound(remain: number = 3) {
        this.slots.setSlotRemain(remain);
    }

    /** 运行中切换急速时，同步更新 Jackpot suspense 的客户端表现策略。 */
    setJackpotSuspenseEnabled(enabled: boolean) {
        this.slots.setJackpotSuspenseEnabled(enabled);
    }

    /** 同步急速的并行停轮、短回弹与 Jackpot suspense 策略。 */
    setQuickStopEnabled(enabled: boolean) {
        this.slots.setQuickStopEnabled(enabled);
    }

    async onResultHandler(msg: IBetResp): Promise<boolean> {
        if (!msg) {
            this.restoreAfterResultFailure();
            return false;
        }

        if (msg.code != ETradeCode.success) {
            this.restoreAfterResultFailure(msg.rawTradeCode ?? msg.code);
            return false;
        }

        // 免费次数耗尽时服务端可能返回成功但没有新回合，不应进入转动状态。
        if (!msg.result || !msg.roundId) {
            Bottombar.Instance.coolDown = false;
            if (gGameData.freeCount <= 0) {
                Bottombar.Instance.showSpin();
            }
            return false;
        }

        this.player.roundId = msg.roundId;
        this.setRoundResult(msg.result);

        if (msg.result.jackpotAmountPool) {
            gGameData.jackpotAmountPool = msg.result.jackpotAmountPool;
            Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
        }

        // onRoundStep 可能先于下注响应到达；changeGameStatus 自带同状态去重。
        await this.changeGameStatus(EGameStatus.run);
        await this.changeGameStatus(EGameStatus.run);
        return true;
    }

    private restoreAfterResultFailure(code?: ETradeCode) {
        this.setRoundResult(null);
        if (this.player) this.player.roundId = 0;
        Bottombar.Instance.coolDown = false;
        Bottombar.Instance.setAutoBet(false);
        Bottombar.Instance.showSpin();
        if (code != null) checkTradeCode(code);
    }

    async changeGameStatus(status: EGameStatus) {
        if (!this.isEnterGame) return;
        if (gGameData.status == status) return;

        gGameData.status = status;
        switch (status) {
            case EGameStatus.bet:
                //console.log("enterBet");
                await this.enterBet();
                break;
            case EGameStatus.run:
                //console.log("enterRun");
                await this.enterRun();
                break;
            case EGameStatus.final:
                //console.log("enterFinal");
                await this.enterFinal();
                break;
        }
    }

    async enterBet() {
        await new Promise(resolve => setTimeout(resolve, this.remainSecond * 1000));
        this.remainSecond = 0;
        Bottombar.Instance.showSpin();
        Views.Instance.closeAll();

        if (gGameData.freeCount > 0) {
            Bottombar.Instance.setFreeTime(gGameData.freeCount);
        } else {
            Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
        }
        if (Bottombar.Instance.isFreeStatus() || Bottombar.Instance.isAutoBet()) await this.newRound();
    }

    async clientRun() {
       
        AudioCtrl.PlayOnce(AudioClip.run);

        const isTurboMode = Bottombar.Instance.isTurboMode();
        this.slots.setQuickStopEnabled(isTurboMode);
        if (isTurboMode) this.slots.setSlotRemain(Bottombar.TurboSpinRemain);
        else if (Bottombar.Instance.isAutoBet() || Bottombar.Instance.isFreeStatus()) this.slots.setSlotRemain(24);
        Bottombar.Instance.coolDown = false;
        

        if (!Bottombar.Instance.isFreeStatus()) Bottombar.Instance.setWinAmount(0);
        if (Bottombar.Instance.isFreeStatus()) {
            Bottombar.Instance.setFreeTime(gGameData.freeCount - 1);
        }
        this.slots.run();
    }

    async enterRun() {
        this.slots.setResults(this.roundResult.results);

        if (Bottombar.Instance.isFreeStatus() || Bottombar.Instance.isAutoBet()) {
            this.clientRun();
        }

        // 可以尝试的优化 ---> 提前到 newRound 里
        if (!Bottombar.Instance.isFreeStatus() && !Bottombar.Instance.isAutoBet()) {
            this.clientRun();
        }

        //滚动完成  显示动画

        Bottombar.Instance.showSpin();

        while (this.slots.getSlotsStatus() != EGameStatus.final) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        Bottombar.Instance.showSpinbtnAnim();
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.changeGameStatus(EGameStatus.final);
    }

    setRoundResult(roundResult: IResults) {
        if (!roundResult) {
            this.roundResult = null;
            return;
        }

        // 下注响应与重连响应都可能携带 protobuf 数字键对象或数值字符串。
        // 转轴渲染会隐式转换数组下标，但连线动画使用严格比较；必须在进入
        // 整个回合流程前统一规范化，避免诸如 4 + Wild(8) 的合法组合漏播动画。
        this.roundResult = {
            ...roundResult,
            results: this.normalizeResults(roundResult.results),
            lineSames: this.normalizeLineSames(roundResult.lineSames),
        };
    }

    async enterFinal() {
        if (this.roundResult) {
            AudioCtrl.clips.get(AudioClip.run).stop();

            let betAmount = gBetAmounts[gGameData.betAmountIndex];

            gGameData.results = this.roundResult.results;
            // 协议解码器有时会把数组编码为 { 0: ..., 1: ... } 对象；
            // 后续的连线计算和展示必须统一使用标准数组。
            gGameData.lineSames = this.getDisplayLineSames(
                this.normalizeLineSames(this.roundResult.lineSames),
                this.roundResult.results
            );
            gGameData.multiple = this.roundResult.multiple;
            gGameData.freeCount = this.roundResult.freeCount;
            gGameData.freeWinAmount = this.roundResult.freeWinAmount;
            gGameData.bonusTriggered = this.roundResult.bonusTriggered;
            gGameData.bonusSymbolCount = this.roundResult.bonusSymbolCount;
            gGameData.bonusMultiplier = this.roundResult.bonusMultiplier;
            gGameData.bonusWinAmount = this.roundResult.bonusWinAmount;
            gGameData.bonusSegmentIndex = this.roundResult.bonusSegmentIndex;
            gGameData.jackpotAmount = this.roundResult.jackpotAmount;

            gGameData.connectedIndex = collectConnectedIndex(gGameData.lineSames);

            let winAmount = betAmount * gGameData.multiple;
            if (gGameData.multiple > 0 && gGameData.multiple < bigWinMultiple)
                AudioCtrl.PlayAsync(AudioClip.win);
            if (gGameData.multiple >= bigWinMultiple)
                AudioCtrl.PlayAsync(AudioClip.bigwin);
            if (gGameData.jackpotAmount > 0)
                AudioCtrl.PlayAsync(AudioClip.jackpot);

    
            this.repeatLineShake(gGameData.lineSames, gGameData.connectedIndex);  //连线成功

            // BONUS 出现后，先保留1秒连线动画，再展示转盘。中奖金额须在
            // 转盘完整播放并关闭后才显示，避免奖励在揭晓前提前结算。
            if (gGameData.bonusTriggered) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await Views.Instance.showBonusWheel(
                    gGameData.bonusSegmentIndex,
                    gGameData.bonusMultiplier);
            }

            Bottombar.Instance.setWinAmount(winAmount);

            if (gGameData.multiple >= bigWinMultiple) {
                Views.Instance.showBigWinView(winAmount, Number(this.roundResult.betAmount) || betAmount);
            }
            if (gGameData.jackpotAmount > 0) Views.Instance.showJackpotView(gGameData.jackpotAmount);

            if (Bottombar.Instance.isFreeStatus()) {   //如果是免费游戏
                if (gGameData.freeCount == 0) {
                    Views.Instance.showBigWinView(Bottombar.Instance.getFreeWinTotal(), betAmount);
                    this.player.increaseAmount(gGameData.freeWinAmount, true);
                }
            } else {
                this.player.increaseAmount(winAmount, true);
                // 登录、重连或前后台同步时，服务端返回的免费次数表示玩家已经
                // 处于免费模式；只有正常结算首次触发免费游戏时才展示次数提示。
                if (gGameData.freeCount
                    && this.restoringGameStateDepth == 0
                    && !this.suppressRecoveredFreeGameView) {
                    Views.Instance.showFreeGameView(gGameData.freeCount);
                }
            }

            this.remainSecond = this.getFinalRemainSecond(betAmount, winAmount);
            Bottombar.Instance.hideSpin();

            if (gGameData.freeCount > 0) {
                Bottombar.Instance.setFreeTime(gGameData.freeCount);
            } else {
                Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
                // 已恢复的免费模式到这里才真正结束，之后的新触发应正常展示提示。
                this.suppressRecoveredFreeGameView = false;
            }
            this.setRoundResult(null);
        } else {
            console.log("enterFinal return");
        }

        await this.player.stopRoundCurrent();
        this.player.roundId = 0;
        // Most servers push the following bet state.  Do not leave the UI stuck
        // when that push is delayed or omitted; changeGameStatus is idempotent.
        await this.changeGameStatus(EGameStatus.bet);
    }

    private getFinalRemainSecond(betAmount: number, winAmount: number): number {
        let remainSecond = 1;
        if (winAmount && Bottombar.Instance.isAutoBet()) remainSecond = 3;
        if (Bottombar.Instance.inSwitchStatus()) remainSecond = 4;
        if (Views.Instance.isShow()) remainSecond = 5;
        return remainSecond;
    }

    repeatLineShake(lineSames: ILineSame[], connectedIndex: number[]) {
        // 表现顺序：全部中奖线/格子 1 秒 -> 每条中奖线/格子各 1 秒 -> 循环。
        // 新一局会递增 linePresentationId，使旧协程自行退出。
        void this.playWinningLineLoop(lineSames, connectedIndex, ++this.linePresentationId);
    }

    private async playWinningLineLoop(
        lineSames: ILineSame[],
        connectedIndex: number[],
        presentationId: number
    ) {
        const lines = this.getLinesControl();
        const slotsAnim = this.getSlotsAnimControl();
        const winningLines = (lineSames || []).filter(lineSame => lineSame && lineSame.count > 0);
        if (!lines || !slotsAnim || winningLines.length === 0) return;

        // 压暗 Canvas/Game/Slots 的底层符号；中奖 item 由 SlotsAnim 覆盖层保持完整亮度。
        this.slots.setItemAnimationDimmed(true);
        while (presentationId === this.linePresentationId) {
            lines.drawLines(winningLines);
            this.slots.playConnectedWinAnimation(connectedIndex, slotsAnim);

            // 急速模式仍展示全部中奖线/命中 item，但仅保留 0.3 秒；
            // 普通模式维持原来的 1 秒总览并继续逐条轮播。
            const isTurboMode = Bottombar.Instance.isTurboMode();
            await new Promise(resolve => setTimeout(resolve, isTurboMode ? 300 : 1000));
            if (isTurboMode || Bottombar.Instance.isTurboMode()) return;

            for (const lineSame of winningLines) {
                if (presentationId !== this.linePresentationId || Bottombar.Instance.isTurboMode()) return;
                lines.drawSingleLine(lineSame.lineNum);
                this.slots.playLineWinAnimation(lineSame.lineNum, lineSame.count, slotsAnim);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    private getSlotsAnimControl(): AnimControl {
        if (this.slotsAnim && cc.isValid(this.slotsAnim)) return this.slotsAnim;

        // 预览缓存可能尚未刷新新增的场景序列化字段，使用固定节点路径做兼容兜底。
        const slotsAnimNode = cc.find("Canvas/Game/SlotsAnim");
        if (!slotsAnimNode) {
            console.error("SlotsAnim node not found: Canvas/Game/SlotsAnim");
            return null;
        }
        if (slotsAnimNode.uuid !== "a8fVzCUd9MpaxpDMKzRHx1") {
            console.warn("SlotsAnim UUID changed", slotsAnimNode.uuid);
        }
        this.slotsAnim = slotsAnimNode.getComponent(AnimControl);
        if (!this.slotsAnim) console.error("SlotsAnim AnimControl component not found");
        return this.slotsAnim;
    }

    private getLinesControl(): Lines {
        let linesNode = this.linesNode;
        if (!linesNode || !cc.isValid(linesNode)) {
            linesNode = cc.find("Canvas/Game/Lines");
            this.linesNode = linesNode;
        }
        if (!linesNode) {
            console.error("Lines node not found: Canvas/Game/Lines");
            return null;
        }
        if (linesNode.uuid !== "e9R/m3ijpK/IZH9XGBq3Cg") {
            console.warn("Lines UUID changed", linesNode.uuid);
        }
        const lines = linesNode.getComponent(Lines);
        if (!lines) console.error("Lines component not found: Canvas/Game/Lines");
        return lines;
    }

    private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
        let enterGameResp = await this.player.enterGame();
        await this.applyEnterGameResp(enterGameResp, true);
    }

    private async applyEnterGameResp(
        enterGameResp: IEnterGameResp,
        isFirstCall: boolean = false,
        restoreRoundStatus: boolean = true
    ): Promise<boolean> {
        if (!enterGameResp) return false;
        // 必须先应用服务端档位，再恢复玩家选中的下注索引和相关 UI。服务端已按
        // 后台 Costs 配置优先、FRBetAmounts 兜底的规则解析该字段。
        if (enterGameResp.betAmounts && !setBetAmounts(enterGameResp.betAmounts)) {
            console.error("enterGame returned invalid bet amounts", enterGameResp.betAmounts);
            return false;
        }
        const recoveredFreeCount = Math.max(
            Number(enterGameResp.lastResult?.freeCount) || 0,
            Number(enterGameResp.roundStep?.results?.freeCount) || 0
        );
        this.suppressRecoveredFreeGameView = recoveredFreeCount > 0;
        this.restoringGameStateDepth++;
        try {
            await this.initPlayerData(enterGameResp, isFirstCall);
            if (this.suppressRecoveredFreeGameView) {
                // 旧回合的转动/结算协程可能在恢复完成后才继续执行，因此抑制状态
                // 必须保持到整轮免费游戏结束，不能只覆盖本次同步调用。
                Views.Instance.hideFreeGameView();
            }
            if (!enterGameResp.roundStep) return false;
            await this.player.restoreRoundStep(enterGameResp.roundStep, restoreRoundStatus);
            return true;
        } finally {
            this.restoringGameStateDepth--;
        }
    }

    private async restoreAfterInterruption(enterGameResp: IEnterGameResp) {
        if (!enterGameResp) return;

        const roundStep = enterGameResp.roundStep;
        const shouldResumeFreeRound = !!roundStep
            && roundStep.status == EGameStatus.bet
            && !roundStep.runningRoundID
            && (enterGameResp.lastResult?.freeCount || 0) > 0;

        // Socket 断线重连不会走 EVENT_SHOW 的自动模式清理。若仍保留自动
        // 状态，恢复到 bet 后 enterBet 会立即 newRound()，从而调用
        // slots.newRound() 覆盖刚恢复的 lastResult 盘面。
        // 待续免费局例外，仍由下方专门的恢复流程发起下一局免费旋转。
        if (!shouldResumeFreeRound) {
            Bottombar.Instance.setAutoBet(false);
        }

        // 待续的免费局必须由 resumeFreeRoundAfterReconnect 强制从 stop -> bet，
        // 否则客户端留在 bet/run 时会被同状态去重或乱序保护拦掉。
        const restoredRoundStep = await this.applyEnterGameResp(
            enterGameResp,
            false,
            !shouldResumeFreeRound
        );
        if (shouldResumeFreeRound || !restoredRoundStep) {
            await this.resumeFreeRoundAfterReconnect();
        }
    }

    private async initPlayerData(enterGameResp: IEnterGameResp, isFirstCall: boolean = false) {
        if (enterGameResp?.account) {
            this.node.active = true;
            Bottombar.Instance.node.active = true;
            this.player.setAccountDiamond(enterGameResp.account.diamond);
            // await this.changeGameStatus(EGameStatus.bet);
            gGameData.betAmountIndex = enterGameResp.betAmountIndex;
            if (gGameData.betAmountIndex > gBetAmounts.length - 1) gGameData.betAmountIndex = EBetAmountIndex.single;
            gGameData.jackpotAmountPool = enterGameResp.jackpotAmountPool;
            // 历史记录由 enterGame / synchronize 一并下发。必须原地替换，
            // HistoryListView 打开时即可直接读缓存，不需要额外发起会影响游戏状态的同步请求。
            let historyChanged = false;
            if (Array.isArray(enterGameResp.history)) {
                gGameData.history.splice(0, gGameData.history.length, ...enterGameResp.history);
                historyChanged = true;
            }
            if (enterGameResp.historySummary) {
                gGameData.historySummary = enterGameResp.historySummary;
                historyChanged = true;
            }
            if (historyChanged) {
                cc.director.emit("mage-jackpot-history-changed", gGameData.history);
            }
            Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
            (<any>window).onRankAwardFinish = (diamond: number) => this.account.setAccountDiamond(diamond);
            if (enterGameResp.lastResult) {
                gGameData.results = this.normalizeResults(enterGameResp.lastResult.results);
                // 进入/重连时 lastResult 仅被保存到数据层，之前没有同步到
                // 转轴显示，导致盘面保留 Slot 初始化时的随机图标。这里直接
                // 写入最终结果，不触发滚动或中奖动画。
                if (gGameData.results.length == 15) {
                    this.slots.setResults(gGameData.results);
                } else {
                    console.warn("Invalid lastResult layout", gGameData.results);
                }
                gGameData.lineSames = this.getDisplayLineSames(
                    this.normalizeLineSames(enterGameResp.lastResult.lineSames),
                    enterGameResp.lastResult.results
                );
                gGameData.multiple = enterGameResp.lastResult.multiple;
                gGameData.freeCount = enterGameResp.lastResult.freeCount;
                gGameData.freeWinAmount = enterGameResp.lastResult.freeWinAmount;
                gGameData.jackpotAmount = enterGameResp.lastResult.jackpotAmount;
                // 奖池使用本次入场的实时快照，不能被上局结果中的旧奖池覆盖。
                if (gGameData.freeCount > 0) {
                    Bottombar.Instance.initBottomData();
                    Bottombar.Instance.setFreeTime(enterGameResp.lastResult.freeCount);
                    Bottombar.Instance.setWinAmount(gGameData.freeWinAmount);
                    Bottombar.Instance.hideSpin();
                    this.remainSecond = 2;
                    // this.newRound();
                }
                // await this.changeGameStatus(EGameStatus.bet);
            }
            this.isEnterGame = true;
        }
        const serverSoundVol = enterGameResp?.playerSettings?.soundVol;
        let targetSoundVol = serverSoundVol === undefined ? gPlayerSettings.soundVol : serverSoundVol;
        const noAudio = String((<any>window).user?.noAudio ?? "");
        const hasAudioOverride = isFirstCall && (noAudio === "0" || noAudio === "1");
        if (hasAudioOverride) {
            targetSoundVol = noAudio === "1" ? 0 : 1;
        }
        gPlayerSettings.soundVol = targetSoundVol;
        AudioCtrl.InitVol();
        if (hasAudioOverride && serverSoundVol !== targetSoundVol) {
            pinusRequest("updateSettings", { config: gPlayerSettings });
        }
    }

    private async resumeFreeRoundAfterReconnect() {
        if (this.isRecoveringFreeRound || gGameData.freeCount <= 0) return;

        this.isRecoveringFreeRound = true;
        try {
            // 断线时 stopGame 会把状态置为 stop。重连同步只恢复数据和 UI，
            // 这里重新进入 bet 状态，由 enterBet 唯一地发起下一次免费游戏。
            this.setRoundResult(null);
            this.player.roundId = 0;
            gGameData.status = EGameStatus.stop;
            await this.changeGameStatus(EGameStatus.bet);
        } finally {
            this.isRecoveringFreeRound = false;
        }
    }

    private normalizeLineSames(lineSames: any): ILineSame[] {
        if (Array.isArray(lineSames)) return lineSames;
        if (!lineSames || typeof lineSames !== "object") return [];

        // 保持协议中的数字下标顺序，以便逐条展示中奖线时顺序稳定。
        return Object.keys(lineSames)
            .sort((left, right) => Number(left) - Number(right))
            .map(key => lineSames[key])
            .filter(lineSame => lineSame && typeof lineSame === "object");
    }

    /**
     * Protobuf 解码器在进入/同步消息中可能将 repeated 字段返回为
     * { 0: ..., 1: ... } 的数字键对象。转轴恢复只接受标准数组。
     */
    private normalizeResults(results: any): number[] {
        if (Array.isArray(results)) return results.map(value => Number(value));
        if (!results || typeof results !== "object") return [];

        return Object.keys(results)
            .sort((left, right) => Number(left) - Number(right))
            .map(key => Number(results[key]));
    }

    /**
     * 连线特效只允许覆盖盘面上实际连续命中的前缀。
     *
     * 服务端的 count 是权威结算数据；这里仍以当前盘面复核一次，避免在协议
     * 延迟、数据异常或符号被中途截断时，把截断点右侧的格子误播放为中奖动画。
     */
    private getDisplayLineSames(lineSames: ILineSame[], results: number[]): ILineSame[] {
        if (!Array.isArray(results)) return [];

        const wild = 8;
        return (lineSames || []).reduce((displayLines: ILineSame[], lineSame) => {
            const linePath = linePaths[lineSame && lineSame.lineNum];
            const target = Number(lineSame && lineSame.target);
            const reportedCount = Math.min(Math.max(0, Number(lineSame && lineSame.count) || 0), linePath ? linePath.length : 0);
            if (!linePath || reportedCount === 0) return displayLines;

            let matchedCount = 0;
            for (let pathOffset = 0; pathOffset < reportedCount; pathOffset++) {
                const symbol = results[linePath[pathOffset] - 1];
                if (symbol !== target && symbol !== wild) break;
                matchedCount++;
            }

            // 赔付资格由服务端判定；客户端仅负责把动画限制在实际连续的前缀。
            // 不在此根据图标 ID 二次推导最少连线数，以免误过滤含 Wild 的合法中奖线。
            if (matchedCount > 0) {
                displayLines.push({ ...lineSame, count: matchedCount });
            }
            return displayLines;
        }, []);
    }

    async synchronize() {
        if (gGameData.status != EGameStatus.stop) {
            let enterGameResp = await this.player.synchronize();
            await this.applyEnterGameResp(enterGameResp);
        }
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.spineControl = this.spineControlNode
            ? this.spineControlNode.getComponent(SpineControl)
            : null;
        if (!this.spineControl) {
            console.error("Game spineControlNode is not assigned or missing SpineControl");
        }
        this.slots?.setSpineControl(this.spineControl);
    }

    invisibleNodes() {
        this.audioButton.active = false;
        Bottombar.Instance.node.active = false;
    }

    visibleNodes() {
        this.audioButton.active = true;
        Bottombar.Instance.node.active = true;
    }

    private refreshBetAmountUi() {
        if (gBetAmounts.length === 0) return;

        let index = Math.floor(Number(gGameData.betAmountIndex));
        if (!Number.isFinite(index) || index < 0 || index >= gBetAmounts.length) index = 0;
        gGameData.betAmountIndex = index as EBetAmountIndex;
        Bottombar.Instance.setBetAmount(gBetAmounts[index]);
        Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
    }

    async start() {
        cc.view.enableAutoFullScreen(false);

        this.invisibleNodes();
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
        };
        let autoStatus = false;
        (<any>window).isAutoPlaying = () => Bottombar.Instance.isAuto();
        (<any>window).stopAuto = () => {
            console.log("win stop")

            autoStatus = Bottombar.Instance.isAuto();
            Bottombar.Instance.setAutoBet(false);
        };
        (<any>window).resumeAuto = () => {
            console.log("resumeAuto")
            Bottombar.Instance.setAutoBet(autoStatus);
        };
        (<any>window).onReconnect = async () => {
            if ((<any>window).isAutoQuitLocked) return;
            let enterGameResp = await this.player.enterGame();
            await this.restoreAfterInterruption(enterGameResp);
        }
        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮
            Bottombar.Instance.hideAutoButton();
        };
        (<any>window).hideAllSounds = () => {
            //将所有声音的音量调到0
            AudioCtrl.HideSounds();
        };
        (<any>window).showAllSounds = () => {
            //恢复所有声音的音量
            AudioCtrl.ShowSounds();
        };
        if (!await sdk.init()) {
            console.error("sdk init failed!");
            return;
        }
        initBetAmounts();
        LocalizedSprite.refresh();
        this.registerSdk();

        await this.initGame();
        await MailModel.getInstance().mail_system_init((<any>window).jsnet);
        this.account.setGameCoin();
        this.visibleNodes();
        cc.game.on(cc.game.EVENT_HIDE, () => {
            this.isBackground = true;
            // MageJackpot 切到后台后必须终止自动开奖，不依赖平台配置开关。
            autoStatus = false;
            Bottombar.Instance.setAutoBet(false);
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            this.isBackground = false;
            // ClientSwitch 可能按平台配置恢复自动状态；MageJackpot 返回前台后仍保持停止。
            Bottombar.Instance.setAutoBet(false);
            if (gGameData.status != EGameStatus.stop) {
                let enterGameResp = await this.player.synchronize();
                await this.restoreAfterInterruption(enterGameResp);
            }
        });
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
            gGameData.status = EGameStatus.stop;
        }

        // 登录响应已携带权威档位，无需再额外发起 sendBetAmounts 请求。
        this.refreshBetAmountUi();
    }

    update(dt) {
        switch (gGameData.status) {
            case EGameStatus.bet:
                //console.log("update", "bet");
                break;
            case EGameStatus.run:
                //console.log("update", "run");
                //this.changeGameStatus(this.slots.getSlotsStatus());
                break;
            case EGameStatus.final:
                //console.log("update", "final");
                // this.remainSecond -= dt;
                // if (this.remainSecond <= 0) this.changeGameStatus(EGameStatus.bet);
                break;
        }
    }
    private registerSdk() {
        // (<any>window).TMUtils?.registerHandler("XGUpdateCoin", (<any>window).XGUpdateCoin);
        // (<any>window).VYBridge?.onRechargeFinish((<any>window).VYUpdateCoin);
        (<any>window).changedw = () => this.refreshBetAmountUi();
    }

    showDisconnectView() {
        setDisconnectView2(true);
        gGameData.status = EGameStatus.stop;
    }
}

(<any>window).updateBalance = async function () {
    const msgRouter = (<any>window).msgRouter;
    if (msgRouter?.request) {
        try {
            await msgRouter.request("CsPlayerBaseDataReq", {});
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

(<any>window).showDisconnectView = function () {
    Game.Instance.showDisconnectView();
};

(<any>window).stopAllSounds = function () {
    AudioCtrl.StopAllSounds();
};
