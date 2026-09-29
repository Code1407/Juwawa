// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Account from "./Account";
import Bottombar from "./Bottombar";
import { gBetAmounts, gBetAmountsExtra, gGameData, initBetAmounts } from "./GameData";
import { ILineSame, IEnterGameResp, IResults, EBetAmountIndex, IBetResp } from "./interface/ISuperAce";
import PlayerAccount from "./PlayerAccount";
import Views from "./Views";
import Audio from "./Audio";
import { afterLoad } from "../lang/afterLoad";
import { sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2 } from "../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import AutoCtrl from "./AutoCtrl";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import { ELang } from "../lang/langEnum";
import SlotSuperAce from "./Slot_SuperAce";
import FreeView from "./view/FreeView";
import FreeEndView from "./view/FreeEndView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    audioButton: cc.Node = null;
    @property(Account)
    account: Account = null;
    @property(cc.Node)
    autoBtnEffect: cc.Node = null;
    @property(cc.Layout)
    layouts: cc.Layout[] = [];
    @property(cc.Node)
    test:cc.Node = null;

    player: PlayerAccount = null;
    roundResult: IResults = null;

    private remainSecond = 0;
    private isEnterGame = false;
    private gameViewsReady = false;
    private recoveryRoundId = 0;
    private recoveryStatus: EGameStatus = EGameStatus.stop;
    private recoveryPromise: Promise<boolean> = null;
    private recoveryRetryTimer: ReturnType<typeof setTimeout> = null;
    private foregroundSyncPromise: Promise<void> = null;
    private foregroundSyncRequested = false;
    private reloadOnForeground = false;

    static get Instance() {
        return cc.find("Canvas/Game").getComponent(Game);
    }

    // async newRound() {
    //     let betAmount = gBetAmounts[gGameData.betAmountIndex];

    //     this.initGameData();

    //     if (gGameData.freeCount > 0) {
    //         await this.player.betFree();
    //     } else {
    //         // await this.player.betNormal(betAmount);
    //     }

    //     if (!this.roundResult) {
    //         console.log("这局失败弹窗");
    //     }
    // }

    initGameData() {
        gGameData.results = [];
        gGameData.lineSames = [];
        gGameData.multiple = 0;
        gGameData.jackpotAmount = 0;
    }

    finishRound() {
    }

    async changeGameStatus(status: EGameStatus) {
        if (!this.isEnterGame) return;
        if (gGameData.status == status) return;

        gGameData.status = status;
        switch (status) {
            case EGameStatus.bet:
                //console.log("enterBet");
                // await this.enterBet();
                break;
            case EGameStatus.run:
                //console.log("enterRun");
                // await this.enterRun();
                break;
            case EGameStatus.final:
                //console.log("enterFinal");
                // await this.enterFinal();
                break;
        }
    }

    async enterBet() {
        Bottombar.Instance.resetSpin();
        await new Promise(resolve => setTimeout(resolve, this.remainSecond * 1000));
        this.remainSecond = 0;
        Bottombar.Instance.showSpin();
        Views.Instance.closeAll();

        Bottombar.Instance.setFreeTime(gGameData.freeCount);
        if (gGameData.freeCount == 0) Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
    }

    async clientRun() {
        if (gGameData.freeCount > 0) Bottombar.Instance.setFreeTime(gGameData.freeCount - 1);
    }

    async enterRun() {
        Bottombar.Instance.showSpin();
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.changeGameStatus(EGameStatus.final);
    }

    setRoundResult(roundResult: IResults) {
        this.roundResult = roundResult;
    }

    /**
     * TS 服务端发送的是原生 Array；Lua 空 table 经通用消息编码后可能变成 JS 的 {}。
     * 在协议入口把空表及数字键 table 还原为数组，后续播放层只处理统一结构。
     */
    private normalizeProtocolArray<T>(value: any): T[] {
        if (Array.isArray(value)) return value;
        if (!value || typeof value !== "object") return null;

        const keys = Object.keys(value);
        if (keys.length === 0) return [];
        if (keys.some(key => !/^\d+$/.test(key))) return null;
        keys.sort((left, right) => Number(left) - Number(right));
        return keys.map(key => value[key]);
    }

    private normalizeRoundResult(result: IResults): IResults {
        if (!result || typeof result !== "object") return result;
        const normalized: any = JSON.parse(JSON.stringify(result));
        normalized.multiples = this.normalizeProtocolArray<number>(normalized.multiples);
        normalized.multipleKinds = this.normalizeProtocolArray<number>(normalized.multipleKinds);
        normalized.resultItems = this.normalizeProtocolArray<any>(normalized.resultItems);
        if (Array.isArray(normalized.resultItems)) {
            normalized.resultItems.forEach(item => {
                if (!item || typeof item !== "object") return;
                item.slotResult = this.normalizeProtocolArray<number>(item.slotResult);
                item.eliminateIndexs = this.normalizeProtocolArray<number>(item.eliminateIndexs);
                item.multiples = this.normalizeProtocolArray<number>(item.multiples);
                item.changeGoldenIndexs = this.normalizeProtocolArray<number>(item.changeGoldenIndexs);
                item.copyWildIndexs = this.normalizeProtocolArray<number>(item.copyWildIndexs);
                item.multipleKinds = this.normalizeProtocolArray<number>(item.multipleKinds);
            });
        }
        return normalized;
    }

    private getRoundResultProtocolError(result: IResults): string {
        if (!result || !Array.isArray(result.resultItems)) return "resultItems is not an array";
        if (result.resultItems.length === 0) return "resultItems is empty";
        if (result.resultItems.length > 128) return "resultItems exceeds protocol limit 128";

        for (let index = 0; index < result.resultItems.length; index++) {
            const item = result.resultItems[index];
            if (!item || !Array.isArray(item.slotResult) || item.slotResult.length !== 20) {
                return `resultItems[${index}].slotResult must contain 20 cells`;
            }
            if (!Array.isArray(item.eliminateIndexs)) {
                return `resultItems[${index}].eliminateIndexs is not an array`;
            }
            if (item.eliminateIndexs.some(cellIndex =>
                !Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= item.slotResult.length
            )) {
                return `resultItems[${index}].eliminateIndexs contains an invalid cell index`;
            }
            if (item.eliminateIndexs.length > 0 && index + 1 >= result.resultItems.length) {
                return `resultItems[${index}] eliminates cells but has no next result item`;
            }
            if (!Array.isArray(item.changeGoldenIndexs) || !Array.isArray(item.copyWildIndexs)) {
                return `resultItems[${index}] is missing golden-wild index arrays`;
            }
        }
        return null;
    }

    onResultHandler(msg: IBetResp){
        if(msg.code == ETradeCode.success){
            const normalizedMsg: IBetResp = Object.assign({}, msg, {
                result: this.normalizeRoundResult(msg.result)
            });
            const protocolError = normalizedMsg.hasResult === false ? "hasResult is false" :
                this.getRoundResultProtocolError(normalizedMsg.result);
            if (protocolError) {
                console.error("Invalid SuperAce result protocol", protocolError, normalizedMsg);
                const roundId = Number(normalizedMsg.roundId) || 0;
                if (roundId > 0) {
                    if (normalizedMsg.result) SlotSuperAce.Instance.restoreResultForRecovery(normalizedMsg.result, roundId);
                    else SlotSuperAce.Instance.IsRunning = true;
                    this.recoveryRoundId = roundId;
                    this.recoveryStatus = EGameStatus.run;
                    this.recoverUnfinishedRound();
                } else {
                    SlotSuperAce.Instance.IsRunning = false;
                }
                return;
            }
            SlotSuperAce.Instance.onResultHandler(normalizedMsg);
        }else{
            checkTradeCode(msg.code);
            SlotSuperAce.Instance.IsRunning = false;
        }
    }

    private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
        let enterGameResp = await this.player.enterGame();
        await this.initPlayerData(enterGameResp);
    }

    private async initPlayerData(enterGameResp: IEnterGameResp) {
        const isFirstCall = !this.isEnterGame;
        if (enterGameResp?.account) {
            this.node.active = true;
            Bottombar.Instance.node.active = true;
            this.player.setAccountDiamond(enterGameResp.account.diamond);
            if(enterGameResp.playerSettings){
                AmountSelectorUI.Instance.BetAmountIndex = enterGameResp.playerSettings?.lastBetAmountButton || 0;
            }
            const serverSoundVol = enterGameResp.playerSettings?.soundVol;
            let targetSoundVol = serverSoundVol === undefined ? gGameData.soundVol : serverSoundVol;
            const noAudio = String((<any>window).user?.noAudio ?? "");
            const hasAudioOverride = isFirstCall && (noAudio === "0" || noAudio === "1");
            if (hasAudioOverride) {
                targetSoundVol = noAudio === "1" ? 0 : 1;
            }
            gGameData.soundVol = targetSoundVol;
            Audio.Instance.audioOn = targetSoundVol > 0;
            Audio.Instance.volume = targetSoundVol;
            if (hasAudioOverride && serverSoundVol !== targetSoundVol) {
                this.player.updateSettings({soundVol: targetSoundVol}).catch(error => {
                    console.warn("Save noAudio override failed", error);
                });
            }
            Audio.Instance.stopBgm();
            Audio.Instance.playBgm();
            if (gGameData.betAmountIndex > gBetAmounts.length - 1) gGameData.betAmountIndex = EBetAmountIndex.single;
            // gGameData.jackpotAmountPool = enterGameResp.jackpotAmountPool;
            // Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
            this.isEnterGame = true;
            (<any>window).myUID = this.player.uid;
            (<any>window).onRankAwardFinish = (diamond: number) => this.account.setAccountDiamond(diamond);
            // ResultView.Instance.init();
            this.autoBtnEffectPlay();
            this.player.roundId = enterGameResp.runningRoundId || 0;
            if (enterGameResp.machineStatus != null) {
                await this.changeGameStatus(enterGameResp.machineStatus);
            }
            const lastResult = enterGameResp.hasLastResult === false ? null :
                this.normalizeRoundResult(enterGameResp.lastResult);
            const slot = SlotSuperAce.Instance;
            const runningRoundId = Number(enterGameResp.runningRoundId) || 0;
            const hasActiveRound = runningRoundId > 0 && [
                EGameStatus.run,
                EGameStatus.run2final,
                EGameStatus.final
            ].includes(enterGameResp.machineStatus);
            const isLocalRoundContinuing = hasActiveRound && slot.isRunning && slot.nowResult != null &&
                slot.runStatus && slot.runStatus.roundId == runningRoundId;

            if (hasActiveRound && lastResult && !isLocalRoundContinuing) {
                slot.restoreResultForRecovery(lastResult, runningRoundId);
                this.recoveryRoundId = runningRoundId;
                this.recoveryStatus = enterGameResp.machineStatus;
            } else if (isLocalRoundContinuing) {
                // 短线重连时本地动画仍在播放，由原流程使用同一 roundId 正常 stopRound。
                this.recoveryRoundId = 0;
            } else if (enterGameResp.machineStatus == EGameStatus.bet) {
                // synchronize 返回 Bet 是解锁的唯一权威依据。即使本地
                // recoveryRoundId 已被旧回调清掉，也要清理 isRunning 和残留动画。
                slot.finishServerRecovery();
                this.recoveryRoundId = 0;
                this.recoveryStatus = EGameStatus.bet;
                if(lastResult) {
                    slot.runStatus.result = lastResult;
                    slot.showResultSnapshot(lastResult);
                }
            } else if(lastResult) {
                slot.runStatus.result = lastResult;
                slot.showResultSnapshot(lastResult);
            }
            if(lastResult && lastResult.freeCount > 0 && !SlotSuperAce.Instance.freeMode && !isLocalRoundContinuing){
                let betAmount = Game.Instance.player.isExtra ? gBetAmountsExtra : gBetAmounts
                if(betAmount[gGameData.betAmountIndex] != lastResult.betAmount){
                    let index = -1;
                    betAmount.includes(lastResult.betAmount) ? index = betAmount.indexOf(lastResult.betAmount) : index = -1
                    if(index == -1) return;
                    gGameData.betAmountIndex = index;
                    AmountSelectorUI.Instance.BetAmountIndex = index;
                    AmountSelectorUI.Instance.setBetAmountLabel(betAmount[gGameData.betAmountIndex]);
                    let playerSettings = {
                        lastBetAmountButton: gGameData.betAmountIndex,
                        soundVol: gGameData.soundVol
                    }
                    this.player.updateSettings(playerSettings).catch(error => {
                        console.warn("Save settings failed", error);
                    });
                }
                SlotSuperAce.Instance.freeCount = lastResult.freeCount;
                SlotSuperAce.Instance.freeCountStr.string = lastResult.freeCount.toString();
                SlotSuperAce.Instance.FreeMode = true;
                SlotSuperAce.Instance.freeViewDisapper(true);
            }
        }
    }

    isRecoveringRound(): boolean {
        return this.recoveryRoundId > 0 || this.recoveryPromise != null || this.foregroundSyncPromise != null;
    }

    private waitRecovery(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async refreshRecoveryState(enterGameResp: IEnterGameResp): Promise<void> {
        if (!enterGameResp || !enterGameResp.account) return;

        this.player.setAccountDiamond(enterGameResp.account.diamond);
        const runningRoundId = Number(enterGameResp.runningRoundId) || 0;
        this.player.roundId = runningRoundId;
        if (enterGameResp.machineStatus != null) {
            await this.changeGameStatus(enterGameResp.machineStatus);
        }

        if (enterGameResp.machineStatus == EGameStatus.bet) {
            const wasRecovering = this.recoveryRoundId > 0;
            this.recoveryRoundId = 0;
            this.recoveryStatus = EGameStatus.bet;
            clearTimeout(this.recoveryRetryTimer);
            this.recoveryRetryTimer = null;
            if (wasRecovering) SlotSuperAce.Instance.finishServerRecovery();
            else SlotSuperAce.Instance.IsRunning = false;
            return;
        }

        const lastResult = enterGameResp.hasLastResult === false ? null :
            this.normalizeRoundResult(enterGameResp.lastResult);
        if (runningRoundId > 0 && [
            EGameStatus.run,
            EGameStatus.run2final,
            EGameStatus.final
        ].includes(enterGameResp.machineStatus)) {
            this.recoveryRoundId = runningRoundId;
            this.recoveryStatus = enterGameResp.machineStatus;
            if (lastResult) {
                const slot = SlotSuperAce.Instance;
                if (!slot.runStatus || slot.runStatus.roundId != runningRoundId) {
                    slot.restoreResultForRecovery(lastResult, runningRoundId);
                }
            }
            SlotSuperAce.Instance.IsRunning = true;
        }
    }

    /**
     * 一轮快速恢复结束后服务端仍是 Run 时，继续在后台对账。
     * 不能直接清掉本地锁，否则服务端仍有 activeRound 时下一次下注只会返回 MissTime；
     * 也不能只依赖再次切前台，否则当前页面会永久停在不可点击状态。
     */
    private scheduleRecoveryRetry() {
        if (this.recoveryRoundId <= 0 || this.recoveryRetryTimer != null) return;
        this.recoveryRetryTimer = setTimeout(() => {
            this.recoveryRetryTimer = null;
            this.recoverUnfinishedRound().catch(error => {
                console.warn("Recover unfinished SuperAce round background retry failed", error);
                this.scheduleRecoveryRetry();
            });
        }, 1000);
    }

    /**
     * 页面重载后本地已没有可靠的连消播放进度，使用服务端返回的原 roundId 收尾。
     * Final 状态表示派彩正在处理中，此时只轮询同步，不能重复提交 stopRound。
     */
    private async recoverUnfinishedRound(): Promise<boolean> {
        if (!this.gameViewsReady || this.recoveryRoundId <= 0) return false;
        if (this.recoveryPromise) return this.recoveryPromise;

        this.recoveryPromise = (async () => {
            console.warn("Recover unfinished SuperAce round", {
                roundId: this.recoveryRoundId,
                status: this.recoveryStatus
            });
            let lastSubmitRoundId = 0;
            let lastSubmitAttempt = -8;
            for (let attempt = 0; attempt < 30 && this.recoveryRoundId > 0; attempt++) {
                const roundId = this.recoveryRoundId;
                try {
                    // StopRound 是服务端幂等接口。成功响应与 synchronize 可能来自不同的
                    // 状态快照；只提交一次会在同步持续返回旧 Run 时永久卡住。因此同一局
                    // 仍为 Run 时每约 2 秒低频重提，既能跨过丢包/旧快照，也不会请求风暴。
                    const shouldSubmit = lastSubmitRoundId != roundId || attempt - lastSubmitAttempt >= 8;
                    if ([EGameStatus.run, EGameStatus.run2final].includes(this.recoveryStatus) && shouldSubmit) {
                        lastSubmitRoundId = roundId;
                        lastSubmitAttempt = attempt;
                        const stopResp = await this.player.stopRound(roundId);
                        if (stopResp && stopResp.code != null && ![
                            ETradeCode.success,
                            ETradeCode.repeatOrder,
                            ETradeCode.coolDown
                        ].includes(stopResp.code)) {
                            console.warn("Recover unfinished SuperAce stopRound rejected", {
                                roundId: roundId,
                                code: stopResp.code
                            });
                        }
                    }

                    await this.waitRecovery(250);
                    const syncResp = await this.player.synchronize();
                    if (syncResp) await this.refreshRecoveryState(syncResp);
                    if (this.recoveryRoundId <= 0 && gGameData.status == EGameStatus.bet) return true;
                } catch (error) {
                    console.warn("Recover unfinished SuperAce round retry", error);
                    await this.waitRecovery(500);
                }
            }

            if (this.recoveryRoundId > 0) {
                SlotSuperAce.Instance.IsRunning = true;
                console.error("Recover unfinished SuperAce round timeout", {
                    roundId: this.recoveryRoundId,
                    status: this.recoveryStatus
                });
                this.scheduleRecoveryRetry();
                return false;
            }
            return true;
        })();

        try {
            return await this.recoveryPromise;
        } finally {
            this.recoveryPromise = null;
        }
    }

    async synchronize() {
        if (gGameData.status != EGameStatus.stop) {
            let enterGameResp = await this.player.synchronize();
            await this.initPlayerData(enterGameResp);
            await this.recoverUnfinishedRound();
        }
    }

    /** 合并频繁 EVENT_SHOW，保证同一时刻只有一条同步/恢复链在修改游戏状态。 */
    private async synchronizeAfterForeground(): Promise<void> {
        this.foregroundSyncRequested = true;
        if (this.foregroundSyncPromise) return this.foregroundSyncPromise;

        const task = (async () => {
            while (this.foregroundSyncRequested) {
                this.foregroundSyncRequested = false;
                if (gGameData.status == EGameStatus.stop) continue;
                try {
                    const enterGameResp = await this.player.synchronize();
                    await this.initPlayerData(enterGameResp);
                    await this.recoverUnfinishedRound();
                } catch (error) {
                    console.warn("SuperAce foreground synchronize failed", error);
                }
            }
        })();
        this.foregroundSyncPromise = task;
        try {
            await task;
        } finally {
            this.foregroundSyncPromise = null;
        }

        // 最后一次 await 结束到释放锁之间若又收到 EVENT_SHOW，再补一次最新同步。
        if (this.foregroundSyncRequested) await this.synchronizeAfterForeground();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    invisibleNodes() {
        this.audioButton.active = false;
        Bottombar.Instance.node.active = false;
    }

    visibleNodes() {
        this.audioButton.active = true;
        Bottombar.Instance.node.active = true;
    }

    async start() {
        cc.view.enableAutoFullScreen(false);

        this.invisibleNodes();
        if (!await sdk.init()) {
            console.error("sdk init failed!");
            return;
        }

        initBetAmounts();

        (<any>window).onReconnect = async () => {
            let enterGameResp = await this.player.enterGame();
            await this.initPlayerData(enterGameResp);
            await this.recoverUnfinishedRound();
        };

        afterLoad();
        this.registerSdk();

        await this.initGame();
        FreeView.Instance.init();
        FreeEndView.Instance.init();
        this.gameViewsReady = true;
        await this.recoverUnfinishedRound();

        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮，屏蔽自动玩法
            // this.autoBetUI.node.active = false;
            // this.slotsFortuneSlot.stopAuto();
            Bottombar.Instance.autoSuperAce.active = false;
        };
        let volumeStatus =  Audio.Instance.Volume;
        let backgroundAudioSuspended = false;
        (<any>window).hideAllSounds = () => {
            //将所有声音的音量调到0
            volumeStatus =  Audio.Instance.Volume;
            Audio.Instance.stopAllSounds();
            Audio.Instance.volume = 0;
        };

        (<any>window).showAllSounds = () => {
            //恢复所有声音的音量
            Audio.Instance.volume = volumeStatus;
        };

        (<any>window).stopGame = () => {
            gGameData.status = EGameStatus.stop;
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
        }

        this.account.setGameCoin();
        this.visibleNodes();
        cc.game.on(cc.game.EVENT_HIDE, () => {
            // console.log(cc.game.EVENT_HIDE);
            volumeStatus =  Audio.Instance.Volume;
            if (!(<any>window).config?.appExtra?.hidekeepSound) {
                backgroundAudioSuspended = true;
                cc.audioEngine.pauseAll();
                (<any>window).hideAllSounds?.();
            }
            // 后台中执行 reload 在部分 WebView 会被挂起，旧页的 EVENT_SHOW
            // 反而可能继续跑同步逻辑。只记录意图，回到前台后再重载。
            this.reloadOnForeground = SlotSuperAce.Instance.isRunning || [
                EGameStatus.coolDown,
                EGameStatus.run,
                EGameStatus.run2final,
                EGameStatus.final
            ].includes(gGameData.status);
            SlotSuperAce.Instance.resetAutoState(false);
            // if(this.slotsFortuneSlot.isAuto) this.slotsFortuneSlot.stopAuto();
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            const slot = SlotSuperAce.Instance;
            const needReload = this.reloadOnForeground || slot.isRunning || [
                EGameStatus.coolDown,
                EGameStatus.run,
                EGameStatus.run2final,
                EGameStatus.final
            ].includes(gGameData.status);
            if (needReload) {
                slot.resetAutoState(false);
                this.reloadOnForeground = false;
                await this.synchronizeAfterForeground();
                if (slot.isRunning || [
                    EGameStatus.coolDown,
                    EGameStatus.run,
                    EGameStatus.run2final,
                    EGameStatus.final
                ].includes(gGameData.status)) {
                    sdk.reload();  // 重载sdk
                }
                return;
            }
            slot.resetAutoState(true);
            if (backgroundAudioSuspended) {
                cc.audioEngine.resumeAll();
                (<any>window).showAllSounds?.();
                backgroundAudioSuspended = false;
            } else {
                Audio.Instance.volume = volumeStatus;
            }
            await this.synchronizeAfterForeground();
        });
        this.test.on(cc.Node.EventType.TOUCH_START, () => {
            let betAmounts =this.player.isExtra ? gBetAmountsExtra : gBetAmounts
            let betAmount = betAmounts[gGameData.betAmountIndex];
            this.player.test(betAmount, gBetAmounts[gGameData.betAmountIndex]);
        });

        let config = (<any>window).config;
        let removeAuto = config.gameExtra?.removeAuto || config.appExtra?.removeAuto || false;
        console.log("removeAuto", removeAuto);
        // this.changeGameStatus(EGameStatus.bet);
        let betAmount = gBetAmounts[gGameData.betAmountIndex];
        Bottombar.Instance.setBetAmount(betAmount);
        // this.player.sendBetAmounts();
        let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
        if (lang && lang.length > 2) lang = lang.substring(0, 2);
        if([ELang.ar,ELang.ur].includes(lang)){
            for(let layout of this.layouts){
                layout.horizontalDirection = cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
            }
        }
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
    }

    showDisconnectView() {
        gGameData.status = EGameStatus.stop;
        setDisconnectView2(true);
    }

    autoBtnEffectPlay() {
        this.autoBtnEffect.active = true;
        let animeState = this.autoBtnEffect.getComponent(cc.Animation).play(); 
        animeState.wrapMode = cc.WrapMode.Loop;
    }
}

(<any>window).updateBalance = async function () {
    const game = Game.Instance;
    if (!game?.player) return;
    try {
        await game.player.refreshPlayerBaseData();
        return;
    } catch (error) {
        console.error("CsPlayerBaseDataReq failed", error);
    }
    await game.synchronize();
};

(<any>window).onQueryUser = function () {
    return (<any>window).updateBalance();
};

(<any>window).rechargeSuccess = function () {
    return (<any>window).updateBalance();
};

(<any>window).showDisconnectView = function () {
    Game.Instance.showDisconnectView();
};

(<any>window).stopAllSounds = function () {
    Audio.Instance.stopAllSounds();
};
