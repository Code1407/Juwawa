// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Wheels from "./Wheels";
import { gGameData } from "./GameData";
import Results from "./Results";
import Account from "./Account";
import Audio from "./Audio";
import RoundFinal from "./RoundFinal";
import AutoBetUI from "./ui/AutoBetUI";
import BetAmountSelector from "./BetAmountSelector";
import { arraySum, IRoundStep, IEnterGameResp, IBetListResp, IPlayerBetList, IAllBetResp } from "./interface/ILuxuryCarR";
import PoppusViewUI from "./ui/PopupsViewUI";
import MyHistoryView from "./view/MyHistoryView";
import PlayerAccount from "./PlayerAccount";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import { Effect } from "./effect/FlyDiamond";
import BettingBox from "./BettingBox";
import ReadyView from "./view/ReadyView";
import ChipMoveNodeUI from "./ui/ChipMoveNodeUI";
import { sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2, setRechargeView } from "../shared2/GlobalViewsLoader";
import EffRPS from "./effect/EffRPS";
import ImageCache from "./image/ImageCache";
import MailModel from "../mail/script/MailModel";

const { ccclass, property } = cc._decorator;

function normalizeList<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    return Object.keys(value)
        .filter(key => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map(key => value[key]);
}

function normalizeNestedList<T>(value: any): T[][] {
    return normalizeList<any>(value).map(row => normalizeList<T>(row));
}

@ccclass
export default class Game extends cc.Component {
    @property(Results)
    results: Results = null;

    @property(Account)
    account: Account = null;

    @property(cc.Node)
    other: cc.Node = null;

    @property(EffRPS)
    EffRPS: EffRPS = null;

    @property(cc.Label)
    todayRoundLabel: cc.Label = null;

    @property(ReadyView)
    readyView: ReadyView = null;

    @property(RoundFinal)
    roundFinal: RoundFinal = null;


    @property(BettingBox)
    bettingBox: BettingBox = null;

    @property(AutoBetUI)
    autoBetUI: AutoBetUI = null;

    @property(PoppusViewUI)
    poppusViewUI: PoppusViewUI = null;

    chips: any;

    tick: number = 0;
    runSpeed: number = 4;
    player: PlayerAccount = null;
    isHide: boolean = false;
    onBetList: boolean = true;
    balanceNum: number;


    static get Instance() {
        return cc.find("Canvas/Game").getComponent(Game);
    }

    changeGameStatus(status: EGameStatus) {
        Wheels.Instance.setRemainSecond(status, gGameData.roundStep.remainSecond);
        if (status == EGameStatus.final) this.roundFinal.inFinal(gGameData.roundStep.remainSecond);
        switch (gGameData.status) {
            case EGameStatus.bet:
                this.inBet();
                this.readyView.updateTime(gGameData.roundStep.remainSecond);

                break;
        }

        if (status != EGameStatus.bet) {
            //this.player.enterGameWheelAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        if (![EGameStatus.run, EGameStatus.final].includes(gGameData.status) && status == EGameStatus.final) {
            this.roundFinal.changeGameStatus(status);
        }

        if (gGameData.status == status) return;
        gGameData.status = status;

        switch (gGameData.status) {
            case EGameStatus.bet:
                this.roundFinal.changeGameStatus(status);
                this.initRound(gGameData.roundStep)

                break;
            case EGameStatus.run:
                this.inRun();
                break;
        }

        Wheels.Instance.changeGameStatus(status);
        //BetAmountSelector.Instance.changeGameStatus(status);
        this.results.changeGameStatus(status);
    }

    private async initRound(roundStep: IRoundStep) {
        if (Game.Instance.player.accountDiamond < Game.Instance.balanceNum && this.autoBetUI.AutoBg2.active == true) {
            setRechargeView(true);
        }
        this.todayRoundLabel.string = roundStep.todayRound.toString();
        this.player.newRound(roundStep.todayRound);
        this.runSpeed = 4;
        await this.autoBetUI.tryAutoBetNow();
    }

     private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
        let enterGameResp = await this.player.enterGame();
        this.initPlayerData(enterGameResp, true);
        this.poppusViewUI.userSet(enterGameResp.account);//设置用户头像和名字
    }

    private initPlayerData(enterGameResp: IEnterGameResp, isFirstCall: boolean) {
        enterGameResp.historyResults = normalizeList<number>(enterGameResp.historyResults);
        enterGameResp.wheelAmount = normalizeList<number>(enterGameResp.wheelAmount);
        enterGameResp.wheelChipAmount = normalizeNestedList<number>(enterGameResp.wheelChipAmount);
        enterGameResp.totalWheelAmount = normalizeList<number>(enterGameResp.totalWheelAmount);
        enterGameResp.curRoundAllWheelAmount = normalizeList(enterGameResp.curRoundAllWheelAmount);
        enterGameResp.myHistory = normalizeList(enterGameResp.myHistory);
        this.todayRoundLabel.string = enterGameResp.roundStep.todayRound.toString();
        gGameData.historyResults = enterGameResp.historyResults;

        this.player.initPlayerAccount(enterGameResp);
        //this.player.notedWheel = JSON.parse(JSON.stringify(enterGameResp.wheelAmount));
        this.results.assignValue(enterGameResp.historyResults);
        this.poppusViewUI.myHistoryView.getComponent(MyHistoryView).setMyHistoryValues(enterGameResp.myHistory);
        gGameData.betAmountIndex = enterGameResp.lastBetAmountButton
        BetAmountSelector.Instance.swichBetAmountButton();

        const serverSoundVol = enterGameResp.playerSettings?.soundVol;
        let targetSoundVol = serverSoundVol === undefined ? gGameData.soundVol : serverSoundVol;
        const noAudio = String((<any>window).user?.noAudio ?? "");
        const hasAudioOverride = isFirstCall && (noAudio === "0" || noAudio === "1");
        if (hasAudioOverride) {
            targetSoundVol = noAudio === "1" ? 0 : 1;
        }
        gGameData.soundVol = targetSoundVol;
        Audio.Instance.audioOn = targetSoundVol > 0;
        cc.find("tb_sy", this.poppusViewUI.setting).getComponent(cc.Sprite).spriteFrame =
            Audio.Instance.audioOn ? ImageCache.Instance.soundSprite[0] : ImageCache.Instance.soundSprite[1];
        if (hasAudioOverride && serverSoundVol !== targetSoundVol) {
            this.player.updateSettings({
                soundVol: targetSoundVol
            });
        }

        gGameData.totalWheelAmount = enterGameResp.totalWheelAmount;
        this.bettingBox.updateBetAmount();
        gGameData.roundStep = enterGameResp.roundStep;
        if (gGameData.roundStep.status == EGameStatus.final) this.results.inFinal = true;
        if (enterGameResp.roundStep.status == EGameStatus.bet && isFirstCall) {
            if (this.onBetList) {

            for (let index = 0; index < enterGameResp.curRoundAllWheelAmount.length; index++) {
                const playerBetAmount: IPlayerBetList = enterGameResp.curRoundAllWheelAmount[index];
                let gradeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (let index = 0; index < playerBetAmount.betGradeNum.length; index++) {
                    gradeList[index] = arraySum(playerBetAmount.betGradeNum[index]) > 0 ? 1 : 0;
                }
                let date: IBetListResp = {
                    uid: playerBetAmount.uid,
                    flyPlayerPos: 0,
                    batIndex: gradeList,
                    num: playerBetAmount.betGradeNum
                };
                this.onBetListRound(date, true);
            }
            this.onBetList = false;
        }
        }
    }

    private inBet() {
        /*
        if (this.isHide) {
            return;
        }
        */

        Wheels.Instance.inBet(gGameData.roundStep.remainSecond);
    }

    private async inRun() {
        /*
        if (this.isHide) {
            return;
        }
        */
        if (gGameData.gameHide) {
            return;
        }
        if (gGameData.roundStep.remainSecond >= 5 && gGameData.roundStep.status != EGameStatus.final && gGameData.roundStep.status != EGameStatus.bet) {
            Audio.Instance.playstartRun();
        } else {
            Audio.Instance.StopstartRun();
        }
        Wheels.Instance.stratRecoverItems();

        const START_INTERVAL = 260;
        const FAST_INTERVAL = 60;
        const ACCEL_RATE = 3;
        const accelerateStartedAt = Date.now();

        // Smoothly accelerate from rest to the normal running speed.
        while (gGameData.roundStep.remainSecond > 2) {
            //Audio.Instance.playRun();
            const elapsedSecond = (Date.now() - accelerateStartedAt) / 1000;
            const interval = FAST_INTERVAL
                + (START_INTERVAL - FAST_INTERVAL) * Math.exp(-ACCEL_RATE * elapsedSecond);
            await new Promise(resolve => setTimeout(resolve, interval));
            Wheels.Instance.inRun(gGameData.roundStep.remainSecond);
        }

        // Stop on the cell before the result.  The interval grows
        // continuously from 60ms to 220ms, so there is no late speed-up.
        const itemCount = Wheels.Instance.items.length;
        const result = gGameData.roundStep.result;
        const targetIndex = (result - 1 + itemCount) % itemCount;
        const currentIndex = Wheels.Instance.runIndex;
        let distance = (targetIndex - currentIndex + itemCount) % itemCount;
        if (distance === 0) distance = itemCount;

        const STOP_INTERVAL = 220;
        const totalStopSteps = distance + 1;
        for (let i = 0; i < distance; i++) {
            const progress = (i + 1) / totalStopSteps;
            const interval = FAST_INTERVAL * Math.pow(STOP_INTERVAL / FAST_INTERVAL, progress);
            await new Promise(resolve => setTimeout(resolve, interval));
            Wheels.Instance.inRun(gGameData.roundStep.remainSecond);
        }

        await this.inRun2Final(STOP_INTERVAL);
    }

    private async inRun2Final(startInterval: number = 220) {
        let inFinal = false;
        while (!inFinal) {
            await new Promise(resolve => setTimeout(resolve, startInterval));
            //Audio.Instance.playRun();
            inFinal = Wheels.Instance.inRun2Final(gGameData.roundStep.result);
        }
        while (gGameData.roundStep.status != EGameStatus.final) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        //Audio.Instance.playFinal();
        this.inFinal();
    }

    private async inFinal() {
        ChipMoveNodeUI.Instance.final();
        this.bettingBox.resultEff();
        this.roundFinal.changeGameStatus(EGameStatus.final);
        this.roundFinal.inFinal(gGameData.roundStep.remainSecond);
    }

    async synchronize() {
        if (gGameData.status != EGameStatus.stop) {
            let enterGameResp = await this.player.synchronize();
            this.initPlayerData(enterGameResp, false);
        }
        // window.location.reload();
    }
    onResultHandler(msg: { code: number, rawTradeCode?: number, roundId: number }) {
        if (!msg || msg.code == ETradeCode.success) return;
        this.autoBetUI.setAutoBet(false);
        checkTradeCode(msg.rawTradeCode ?? msg.code);
    }
    onBetNoticeAll(data: IAllBetResp) {
        gGameData.totalWheelAmount = data.wheelAmount;
        this.bettingBox.updateBetAmount();
    }
    onBetListRound(data: IBetListResp, login: boolean = false) {
        let moreChip: number = 0;
        if (data.uid != this.player.uid) {
            Audio.Instance.playbet();
            //this.other
            for (let index = 0; index < data.batIndex.length; index++) {
                let value = data.batIndex[index];
                if (value > 0) {
                    for (let j = 0; j < data.num[index].length; j++) {
                        let flyNum = data.num[index][j];
                        if (flyNum > 10) {
                            flyNum = 10;
                        }
                        moreChip += flyNum;
                        for (let k = 0; k < flyNum; k++) {
                            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.otherNode, ChipMoveNodeUI.Instance.items[index], j, index);

                            for (let i = 0; i < Game.Instance.bettingBox.myBetNum.length; i++) {
                                Game.Instance.bettingBox.myBetNum[index].active = true;
                            }
                        }
                    }
                }
            }
            this.other.x = -400;
            this.other.y = 470;
            cc.tween(this.other).stop();
            cc.tween(this.other)
                .to(0.1, { scale: 1.2 })
                .to(0.1, { scale: 1 })
                .call(() => {
                    this.other.scale = 1;
                }).start();
        }
        else if (login) {
            let moreChip: number = 0;
            for (let index = 0; index < data.batIndex.length; index++) {
                let value = data.batIndex[index];
                if (value > 0) {
                    for (let j = 0; j < data.num[index].length; j++) {
                        let flyNum = data.num[index][j];
                        if (flyNum > 10) {
                            flyNum = 10;
                        }
                        moreChip += flyNum;
                        for (let k = 0; k < flyNum; k++) {
                            Effect.FlyDiamond2(ChipMoveNodeUI.Instance.mineNode, ChipMoveNodeUI.Instance.items[index], j, index);
                        }
                    }
                }
            }

        }
        if (moreChip > 1) {
            Audio.Instance.playfly();
        }
        else if (moreChip > 0) {
            Audio.Instance.playsendBet();
        }
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    async start() {
        cc.view.enableAutoFullScreen(false);
        BetAmountSelector.Instance.waitForConfig();
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
            (<any>window).breakRoundStep = true;
            this.changeGameStatus(EGameStatus.stop);
        };
        let autoStatus = false;
        (<any>window).stopAuto = () => {
            console.log("win stop")
            autoStatus = this.autoBetUI.getAutoBet();
            this.autoBetUI.setAutoBet(false);
        };
        (<any>window).resumeAuto = () => {
            console.log("resumeAuto")
            this.autoBetUI.setAutoBet(autoStatus);
        };
         (<any>window).window.onReconnect = async () => {
            //当网络重连成功后，需要登录游戏
            if ((<any>window).isAutoQuitLocked) return;
            (<any>window).breakRoundStep = false;
            let enterGameResp = await this.player.enterGame();
            if (!enterGameResp?.roundStep) return;
            this.initPlayerData(enterGameResp, false);
        }
        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮
            this.autoBetUI.node.active = false;
        };
        let audioStatus = Audio.Instance.audioOn;

        (<any>window).hideAllSounds = () => {
            //将所有声音的音量调到0
            audioStatus = Audio.Instance.audioOn;
            Audio.Instance.audioOn = false;
        };
        (<any>window).showAllSounds = () => {
            //恢复所有声音的音量
            Audio.Instance.audioOn = audioStatus;
        };
        if (!await sdk.init()) {
            console.error("sdk init failed!");
            setDisconnectView2(true);
            return;
        }
        setDisconnectView2(false);
        BetAmountSelector.Instance.showDefaultConfigWhenOffline();

        this.chips = (<any>window).betGrade;
        this.registerSdk();
        await this.initGame();

        MailModel.getInstance().mail_system_init((<any>window).jsnet);
        let __this = this;
        cc.game.on(cc.game.EVENT_HIDE, () => {
            gGameData.gameHide = true;
            audioStatus = Audio.Instance.audioOn;
            this.autoBetUI.setAutoBet(false);
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            gGameData.gameHide = false;
            __this.synchronize();
            Audio.Instance.audioOn = audioStatus;
        });
        Audio.Instance.playbgm();
    }

    update(dt) {
        return;
        switch (gGameData.status) {
            case EGameStatus.bet:
                if (this.tick++ % 60 == 0)
                    this.inBet();
                break;
            case EGameStatus.run:
                if (this.tick++ % Math.round(this.runSpeed) == 0)
                    this.inRun();
                break;
            case EGameStatus.run2final:
                if (this.tick++ % Math.round(this.runSpeed) == 0)
                    this.inRun2Final();
                break;
            case EGameStatus.final:
                if (this.tick++ % 4 == 0)
                    this.inFinal();
                break;
        }
    }
    private registerSdk() {
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
