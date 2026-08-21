// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Account from "./Account";
import Bottombar from "./Bottombar";
import { gBetAmounts, gGameData, gPlayerSettings, initBetAmounts } from "./GameData";
import { bigWinMultiple, ILineSame, collectConnectedIndex, IBetResp, IEnterGameResp, IResults, EBetAmountIndex } from "./interface/IFruitSlots";
import Lines from "./Lines";
import PlayerAccount from "./PlayerAccount";
import Slots from "./Slots";
import Views from "./Views";
import Jackpot from "./Jackpot";
import SpinUI from "./ui/SpinUI";
import { afterLoad } from "../lang/afterLoad";
import { sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2 } from "../shared2/GlobalViewsLoader";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import AudioCtrl from "../shared3/AudioCtrl_shared3";
import { AudioClip } from "./AudioClip_FruitSlots";
import MailModel from "../mail/script/MailModel";
import { pinusRequest } from "../shared/MessageRouter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    audioButton: cc.Node = null;
    @property(Slots)
    slots: Slots = null;
    @property(Lines)
    lines: Lines = null;
    @property(Account)
    account: Account = null;

    player: PlayerAccount = null;
    roundResult: IResults = null;

    private remainSecond = 0;
    private isEnterGame = false;
    private isRecoveringFreeRound = false;
    private isBackground = false;

    static get Instance() {
        return cc.find("Canvas/Game").getComponent(Game);
    }

    async newRound() {
        // 浏览器的 setTimeout/Promise 在页面切到后台后仍可能继续执行。
        // 自动模式即使已经关闭，也可能有一个排队中的 enterBet 回调走到这里，
        // 因此必须在真正发起下注前再做一次后台状态校验。
        if (this.isBackground || (<any>window).gameHide) {
            SpinUI.Instance.setAutoBet(false);
            return;
        }

        let betAmount = gBetAmounts[gGameData.betAmountIndex];

        this.initGameData();
        this.slots.newRound();

        if (!Bottombar.Instance.isFreeStatus() && !Bottombar.Instance.isAutoBet()) {
            //this.clientRun();
            Bottombar.Instance.hideSpin();
        }

        const resp = gGameData.freeCount > 0
            ? await this.player.betFree()
            : await this.player.betNormal(betAmount);
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
    }

    finishRound() {
        this.slots.setSlotRemain(3);
    }

    async onResultHandler(msg: IBetResp): Promise<boolean> {
        if (!msg) {
            this.restoreAfterResultFailure();
            return false;
        }

        if (msg.code != ETradeCode.success) {
            this.restoreAfterResultFailure(msg.code);
            return false;
        }

        // 免费次数耗尽时服务端可能返回成功但没有新回合，不应进入转动状态。
        if (!msg.result || !msg.roundId) {
            if (gGameData.freeCount <= 0) {
                Bottombar.Instance.resetSpin();
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
        SpinUI.Instance.setAutoBet(false);
        Bottombar.Instance.resetSpin();
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
        Bottombar.Instance.resetSpin();
        await new Promise(resolve => setTimeout(resolve, this.remainSecond * 1000));
        this.remainSecond = 0;
        Bottombar.Instance.showSpin();
        Views.Instance.closeAll();

        Bottombar.Instance.setFreeTime(gGameData.freeCount);
        if (gGameData.freeCount == 0) Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
        if (Bottombar.Instance.isFreeStatus() || Bottombar.Instance.isAutoBet()) await this.newRound();
    }

    async clientRun() {
        this.lines.setDone(true);
        AudioCtrl.PlayOnce(AudioClip.run);

        if (Bottombar.Instance.isAutoBet() || Bottombar.Instance.isFreeStatus()) this.slots.setSlotRemain(24);
        SpinUI.Instance.coolDown = false;
        this.lines.clear();

        if (!Bottombar.Instance.isFreeStatus()) Bottombar.Instance.setWinAmount(0);
        if (gGameData.freeCount > 0) Bottombar.Instance.setFreeTime(gGameData.freeCount - 1);
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

        Bottombar.Instance.showSpin();

        while (this.slots.getSlotsStatus() != EGameStatus.final) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.changeGameStatus(EGameStatus.final);
    }

    setRoundResult(roundResult: IResults) {
        this.roundResult = roundResult;
    }

    async enterFinal() {
        if (this.roundResult) {
            AudioCtrl.clips.get(AudioClip.run).stop();

            let betAmount = gBetAmounts[gGameData.betAmountIndex];

            gGameData.results = this.roundResult.results;
            gGameData.lineSames = this.roundResult.lineSames;
            gGameData.multiple = this.roundResult.multiple;
            gGameData.freeCount = this.roundResult.freeCount;
            gGameData.freeWinAmount = this.roundResult.freeWinAmount;
            gGameData.jackpotAmount = this.roundResult.jackpotAmount;

            gGameData.connectedIndex = collectConnectedIndex(gGameData.lineSames);

            let winAmount = betAmount * gGameData.multiple;
            if (gGameData.multiple > 0 && gGameData.multiple < bigWinMultiple)
                AudioCtrl.PlayAsync(AudioClip.win);
            if (gGameData.multiple >= bigWinMultiple)
                AudioCtrl.PlayAsync(AudioClip.bigwin);
            if (gGameData.jackpotAmount > 0)
                AudioCtrl.PlayAsync(AudioClip.jackpot);

            this.lines.setDone(false);
            this.repeatLineShake(gGameData.lineSames, gGameData.connectedIndex);

            Bottombar.Instance.setWinAmount(winAmount);

            if (gGameData.multiple >= bigWinMultiple) Views.Instance.showBigWinView(winAmount);
            if (gGameData.jackpotAmount > 0) Views.Instance.showJackpotView(gGameData.jackpotAmount);

            if (Bottombar.Instance.isFreeStatus()) {
                if (gGameData.freeCount == 0) {
                    Views.Instance.showFreeGameWinView(Bottombar.Instance.getFreeWinTotal());
                    this.player.increaseAmount(gGameData.freeWinAmount, true);
                }
            } else {
                this.player.increaseAmount(winAmount, true);
                if (gGameData.freeCount) Views.Instance.showFreeGameView(gGameData.freeCount);
            }

            this.remainSecond = this.getFinalRemainSecond(betAmount, winAmount);
            Bottombar.Instance.hideSpin();

            Bottombar.Instance.setFreeTime(gGameData.freeCount);
            if (gGameData.freeCount == 0) Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
            this.setRoundResult(null);
        } else {
            console.log("enterFinal return");
        }

        await this.player.stopRoundCurrent();
        return;
        await this.changeGameStatus(EGameStatus.bet);
    }

    private getFinalRemainSecond(betAmount: number, winAmount: number): number {
        let remainSecond = 1;
        if (winAmount && Bottombar.Instance.isAutoBet()) remainSecond = 3;
        if (Bottombar.Instance.inSwitchStatus()) remainSecond = 4;
        if (Views.Instance.isShow()) remainSecond = 5;
        return remainSecond;
    }

    async repeatLineShake(lineSames: ILineSame[], connectedIndex: number[]) {
        this.lines.drawLines(lineSames);
        for (let i = 0; i < 3; i++) {
            this.slots.shakeSameWide(connectedIndex);
            await new Promise(resolve => setTimeout(resolve, 200));
            if (gGameData.status == EGameStatus.run) return;
        }

        this.lines.clear();
        for (let j = 0; j < 3; j++) {
            this.slots.shakeSameMinor(connectedIndex);
            await new Promise(resolve => setTimeout(resolve, 200));
            if (gGameData.status == EGameStatus.run) return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));

        if (this.lines.done) return;
        this.repeatLineShake(lineSames, connectedIndex);
    }

    private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
        let enterGameResp = await this.player.enterGame();
        await this.initPlayerData(enterGameResp, true);
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
            Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
            (<any>window).onRankAwardFinish = (diamond: number) => this.account.setAccountDiamond(diamond);
            if (enterGameResp.lastResult) {
                gGameData.results = enterGameResp.lastResult.results;
                gGameData.lineSames = enterGameResp.lastResult.lineSames;
                gGameData.multiple = enterGameResp.lastResult.multiple;
                gGameData.freeCount = enterGameResp.lastResult.freeCount;
                gGameData.freeWinAmount = enterGameResp.lastResult.freeWinAmount;
                gGameData.jackpotAmount = enterGameResp.lastResult.jackpotAmount;
                gGameData.jackpotAmountPool = enterGameResp.lastResult.jackpotAmountPool;
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

    async synchronize() {
        if (gGameData.status != EGameStatus.stop) {
            let enterGameResp = await this.player.synchronize();
            this.initPlayerData(enterGameResp);
        }
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
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
        };
        let autoStatus = false;
        (<any>window).isAutoPlaying = () => SpinUI.Instance.isAuto();
        (<any>window).stopAuto = () => {
            console.log("win stop")

            autoStatus = SpinUI.Instance.isAuto();
            SpinUI.Instance.setAutoBet(false);
        };
        (<any>window).resumeAuto = () => {
            console.log("resumeAuto")
            SpinUI.Instance.setAutoBet(autoStatus);
        };
        (<any>window).onReconnect = async () => {
            let enterGameResp = await this.player.enterGame();
            await this.initPlayerData(enterGameResp);
            await this.resumeFreeRoundAfterReconnect();
        }
        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮
            SpinUI.Instance.auto_up.active = SpinUI.Instance.auto_down.active = false;
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
        afterLoad();
        this.registerSdk();

        await this.initGame();
        await MailModel.getInstance().mail_system_init((<any>window).jsnet);
        this.account.setGameCoin();
        this.visibleNodes();
        cc.game.on(cc.game.EVENT_HIDE, () => {
            this.isBackground = true;
            // FruitSlots 切到后台后必须终止自动开奖，不依赖平台配置开关。
            autoStatus = false;
            SpinUI.Instance.setAutoBet(false);
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            this.isBackground = false;
            // ClientSwitch 可能按平台配置恢复自动状态；FruitSlots 返回前台后仍保持停止。
            SpinUI.Instance.setAutoBet(false);
            if (gGameData.status != EGameStatus.stop) {
                let enterGameResp = await this.player.synchronize();
                this.initPlayerData(enterGameResp);
            }
        });
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
            gGameData.status = EGameStatus.stop;
        }

        // this.changeGameStatus(EGameStatus.bet);
        let betAmount = gBetAmounts[gGameData.betAmountIndex];
        Bottombar.Instance.setBetAmount(betAmount);
        this.player.sendBetAmounts();
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
