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
import { arraySum, IRoundStep, IEnterGameResp, IBetListResp, IPlayerBetList, IAllBetResp } from "./interface/ILuxuryCar";
import PoppusViewUI from "./ui/PopupsViewUI";
import MyHistoryView from "./view/MyHistoryView";
import RankListView from "./view/RankListView";
import PlayerAccount from "./PlayerAccount";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import { Effect } from "./effect/FlyDiamond";
import BettingBox from "./BettingBox";
import ReadyView from "./view/ReadyView";
import ChipMoveNodeUI from "./ui/ChipMoveNodeUI";
import { sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2, setRechargeView } from "../shared2/GlobalViewsLoader";
import ImageCache from "./image/ImageCache";
import { afterLoad, getLang, langContent } from "../lang/afterLoad";
import { ELang } from "../shared3/langEnum_shared3";
import MailModel from "../mail/script/MailModel";

const { ccclass, property } = cc._decorator;

function normalizeList<T>(value: any): T[] {
    if (Array.isArray(value)) {
        return value;
    }
    if (!value || typeof value !== "object") {
        return [];
    }
    return Object.keys(value)
        .filter(key => !isNaN(Number(key)))
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

    @property(cc.Label)
    todayRoundLabel: cc.Label = null;

    @property(cc.Node)
    todayRoundNode: cc.Node = null;

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

    @property(cc.Node)
    enterGameHide: cc.Node[] = [];

    chips: any;

    tick: number = 0;
    runSpeed: number = 4;
    player: PlayerAccount = null;
    isHide: boolean = false;
    balanceNum: number;
    onBetList: boolean = true;

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
        if (Game.Instance.player.accountDiamond < Game.Instance.balanceNum) {
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
    }

    private initPlayerData(enterGameResp: IEnterGameResp, isFirstCall: boolean) {
        enterGameResp.historyResults = normalizeList<number>(enterGameResp.historyResults);
        enterGameResp.rankList = normalizeList(enterGameResp.rankList);
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
        this.poppusViewUI.rankListView.getComponent(RankListView).setRankListValues(enterGameResp.rankList);
        if (enterGameResp.rankList?.length >= 1) {
            this.poppusViewUI.setRankListNo1Value(enterGameResp.rankList[0]);
        }
        gGameData.betAmountIndex = enterGameResp.lastBetAmountButton;
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
        this.poppusViewUI.soundSprite.spriteFrame = Audio.Instance.audioOn ? ImageCache.Instance.soundSprite[0] : ImageCache.Instance.soundSprite[1];
        if (hasAudioOverride && serverSoundVol !== targetSoundVol) {
            this.player.updateSettings({
                soundVol: targetSoundVol
            });
        }
        Audio.Instance.playbgm();
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

        this.lang_ar();
        this.poppusViewUI.switchLang();
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

        // Exponential acceleration: the step interval falls from 260ms toward 60ms.
        const START_INTERVAL = 260;
        const FAST_INTERVAL = 60;
        const ACCEL_RATE = 3;
        const accelerateStartedAt = Date.now();

        // [MARKER:WHEEL_PHASE1] 阶段1：启动时指数加速，随后平滑接近60ms最高速
        while (gGameData.roundStep.remainSecond > 2) {
            //Audio.Instance.playRun();
            const elapsedSecond = (Date.now() - accelerateStartedAt) / 1000;
            const interval = FAST_INTERVAL
                + (START_INTERVAL - FAST_INTERVAL) * Math.exp(-ACCEL_RATE * elapsedSecond);
            await new Promise(resolve => setTimeout(resolve, interval));
            Wheels.Instance.inRun(gGameData.roundStep.remainSecond);
        }

        // [MARKER:WHEEL_PHASE2] 阶段2：间隔按指数增长，滚动速度按指数下降
        // 关键: 只走到 result 的前1格，留最后1格给阶段3的 runEffect(0) 触发闪烁特效
        let currentIndex = Wheels.Instance.runIndex;
        let result = gGameData.roundStep.result;
        let targetIndex = (result - 1 + 10) % 10;  // result 的前1格
        let distance = (targetIndex - currentIndex + 10) % 10;
        if (distance === 0) distance = 10;  // 至少走1格，避免阶段2空转

        let interval = 60;  // 与阶段1的60ms衔接，无加速跳跃
        const STOP_INTERVAL = 220;
        const totalStopSteps = distance + 1;

        for (let i = 0; i < distance; i++) {
            //Audio.Instance.playRun();
            const progress = (i + 1) / totalStopSteps;
            interval = FAST_INTERVAL * Math.pow(STOP_INTERVAL / FAST_INTERVAL, progress);
            await new Promise(resolve => setTimeout(resolve, interval));
            Wheels.Instance.inRun(gGameData.roundStep.remainSecond);
        }

        // [MARKER:WHEEL_PHASE3] 阶段3: 最终对齐 + 触发闪烁
        // 延续阶段2的间隔继续递增，走最后1格到 result
        // runEffect(0) 会在 itemIndex==result 时触发闪烁特效（骨骼动画+5次灯光闪烁）
        await this.inRun2Final(STOP_INTERVAL);
    }

    private async inRun2Final(startInterval: number = 40) {
        let interval = startInterval;
        let inFinal = false;
        while (!inFinal) {
            await new Promise(resolve => setTimeout(resolve, interval));
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
                            // Effect.FlyDiamond2(ChipMoveNodeUI.Instance.otherNode, ChipMoveNodeUI.Instance.items[index], j, index);//多人飞币，暂时取消
                        }
                    }
                }
            }
            // this.other.x = -400;
            // this.other.y = 470;
            // cc.tween(this.other).stop();
            // cc.tween(this.other)
            //     .to(0.1, { position: cc.v3(-390, 460) })
            //     .to(0.1, { position: cc.v3(-400, 470) })
            //     .call(() => {
            //         this.other.x = -400;
            //         this.other.y = 470;
            //     }).start();
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

    lang_ar(){
        const lang = getLang();   // 获取当前语言代码 (默认英语)
        if(lang==ELang.ar){
            this.todayRoundNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
            this.roundFinal.EarningsNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;
            this.roundFinal.MyBetNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;

            this.todayRoundNode.getComponent(cc.Layout).paddingRight=30;
            this.todayRoundNode.getComponent(cc.Layout).spacingX=-50;

        }else{
            this.todayRoundNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
            this.roundFinal.EarningsNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
            this.roundFinal.MyBetNode.getComponent(cc.Layout).horizontalDirection=cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;

            this.todayRoundNode.getComponent(cc.Layout).paddingRight=0;
            this.todayRoundNode.getComponent(cc.Layout).spacingX=0;
        }
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    async start() {
        cc.view.enableAutoFullScreen(false);
        (<any>window).stopGame = () => {
            //当出现不允许用户再继续玩游戏的问题时(维护、断开、异常)，会调用此方法，需要停止游戏运行
            (<any>window).breakRoundStep = true;
            this.changeGameStatus(EGameStatus.stop);
        }
        (<any>window).window.onReconnect = async () => {
            //当网络重连成功后，需要登录游戏
            if ((<any>window).isAutoQuitLocked) return;
            (<any>window).breakRoundStep = false;
            let enterGameResp = await this.player.enterGame();
            if (!enterGameResp?.roundStep) return;
            this.initPlayerData(enterGameResp, false);
            this.changeGameStatus(enterGameResp.roundStep.status);
        }
        for (let n of this.enterGameHide)
            n.active = false;
        if (!await sdk.init()) {
            console.error("sdk init failed!");
            return;
        }
        afterLoad();

        cc.game.on(cc.game.EVENT_HIDE, () => {
            gGameData.gameHide = true;
            cc.audioEngine.pauseAll();
            cc.audioEngine.pauseMusic();
            this.autoBetUI.setAutoBet(false);

        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            gGameData.gameHide = false;
            cc.audioEngine.resumeAll();
            cc.audioEngine.resumeMusic();
            try {
                await this.synchronize();
            } catch (error) {
                console.warn("synchronize after app show failed", error);
            }
            //await this.autoBetUI.tryAutoBetNow();
        });
        this.chips = (<any>window).betGrade;
        await this.initGame();
        
        MailModel.getInstance().mail_system_init((<any>window).jsnet);   //初始化邮件系统

        for (let n of this.enterGameHide)
            n.active = true;
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

(<any>window).showDisconnectView = function () {
    setDisconnectView2(true);
};

(<any>window).rechargeSuccess = function () {
    return (<any>window).updateBalance();
};

(<any>window).invisibleNodes = function () {
    for (let n of Game.Instance.enterGameHide)
        n.active = false;
};


