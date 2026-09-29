// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Account from "./Account";
import Bottombar from "./Bottombar";
import { gBetAmounts, gBetAmountsExtra, gGameData, initBetAmounts } from "./GameData";
import { ILineSame, IEnterGameResp, IResults, EBetAmountIndex, IBetResp } from "./interface/IFruitSlots";
import PlayerAccount from "./PlayerAccount";
import Views from "./Views";
import Audio from "./Audio";
import { afterLoad } from "../lang/afterLoad";
import { getQuery, sdk } from "../shared/Common";
import { checkTradeCode, setDisconnectView2 } from "../shared2/GlobalViewsLoader";
import SlotsFortuneSlot from "./Slot_FortuneSlot";
import ResultView from "./view/ResultView";
import { EGameStatus, ETradeCode } from "../shared3/interface/IGame";
import AutoCtrl from "./AutoCtrl";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import { ELang } from "../lang/langEnum";
import SpinFortune from "./ui/Spin_Fortune";
import HistoryView from "./view/HistoryView";
import Topbar from "./Topbar";
import AudioCtrl from "../shared3/AudioCtrl_shared3";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    audioButton: cc.Node = null;
    @property(SlotsFortuneSlot)
    slotsFortuneSlot: SlotsFortuneSlot = null;
    @property(Account)
    account: Account = null;
    @property(cc.Animation)
    wheelAnim: cc.Animation = null;
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

    onResultHandler(msg: IBetResp){
        if(msg.code == ETradeCode.success){
            this.slotsFortuneSlot.run(msg);
        }else{
            SpinFortune.Instance.isClicked = false;
            checkTradeCode(msg.code);
            SlotsFortuneSlot.Instance.stopAuto();
        }
    }

    async repeatLineShake(lineSames: ILineSame[], connectedIndex: number[]) {
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (gGameData.status == EGameStatus.run) return;
        }

        for (let j = 0; j < 3; j++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (gGameData.status == EGameStatus.run) return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));

        this.repeatLineShake(lineSames, connectedIndex);
    }

    private async initGame() {
        this.player = await PlayerAccount.createPlayer(this.account);
       
    }
    private async initEnterGame(){
        let enterGameResp = await this.player.enterGame();
        await this.initPlayerData(enterGameResp, true);
        
        (<any>window).hideAutoButton = () => {
            //隐藏自动按钮，屏蔽自动玩法
            // this.autoBetUI.node.active = false;
            // this.slotsFortuneSlot.stopAuto();
            Bottombar.Instance.autoFortune.active = false;
        };
        let volumeStatus =  Audio.Instance.Volume;
        (<any>window).hideAllSounds = () => {
            //将所有声音的音量调到0
            volumeStatus =  Audio.Instance.Volume;
            Audio.Instance.stopAllSounds();
            Audio.Instance.Setvolume(0);
        };

        (<any>window).showAllSounds = () => {
            //恢复所有声音的音量
            Audio.Instance.Setvolume(volumeStatus)
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
            AutoCtrl.Instance.init();
            if(this.slotsFortuneSlot.isAuto) this.slotsFortuneSlot.stopAuto();
        });
        cc.game.on(cc.game.EVENT_SHOW, async () => {
            // console.log(cc.game.EVENT_SHOW);
            AudioCtrl.StopAllSounds();
            Audio.Instance.Setvolume(volumeStatus);
            if (gGameData.status != EGameStatus.stop) {
                let enterGameResp = await this.player.synchronize();
                this.initPlayerData(enterGameResp);
            }
            AutoCtrl.Instance.init();
        });
        this.test.on(cc.Node.EventType.TOUCH_START, () => {
            let betAmounts =this.player.isExtra ? gBetAmountsExtra : gBetAmounts
            let betAmount = betAmounts[gGameData.betAmountIndex];
            this.player.test(betAmount, gBetAmounts[gGameData.betAmountIndex], this.player.isExtra);
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
        (<any>window).updateAutoQuit()
    }
    initSounds=true
    private async initPlayerData(enterGameResp: IEnterGameResp, enterGame:boolean = false) {
        if (enterGameResp?.account) {
            this.node.active = true;
            Bottombar.Instance.node.active = true;
            this.player.setAccountDiamond(enterGameResp.account.diamond);
            if(enterGameResp.playerSettings){
                let config = (<any>window).config;
                let chipInit = config?.gameExtra?.chipInit ?? config?.appExtra?.chipInit ?? false;
                if(!enterGame) chipInit = false;
                if(chipInit){
                    AmountSelectorUI.Instance.BetAmountIndex = 0;
                }else{
                    AmountSelectorUI.Instance.BetAmountIndex = enterGameResp.playerSettings.lastBetAmountButton || 0;
                }
                if(this.initSounds){
                    this.initSounds=false
                    if(!(<any>window).showonGameSound){
                        if(enterGameResp.playerSettings?.soundVol==1){
                            enterGameResp.playerSettings.soundVol=0;
                        }
                        gGameData.soundVol = (enterGameResp.playerSettings?.soundVol || 0)/100;
                        if(getQuery("noAudio")!=undefined&&getQuery("noAudio")!=""){
                            gGameData.soundVol=getQuery("noAudio")=="1"?0:1;
                        }
                        Audio.Instance.audioOn = gGameData.soundVol > 0;
                        Audio.Instance.Setvolume(gGameData.soundVol)
                    }
                    this.slotsFortuneSlot.QuickMode = enterGameResp.playerSettings?.isSpeed || false;
                    this.slotsFortuneSlot.quickBet = this.slotsFortuneSlot.quickMode;
                }
            }
            Audio.Instance.stopBgm();
            Audio.Instance.playBgm();
            if (gGameData.betAmountIndex > gBetAmounts.length - 1) gGameData.betAmountIndex = EBetAmountIndex.single;
            // gGameData.jackpotAmountPool = enterGameResp.jackpotAmountPool;
            // Jackpot.Instance.switchIndex(gGameData.betAmountIndex);
            this.isEnterGame = true;
            (<any>window).myUID = this.player.uid;
            (<any>window).onRankAwardFinish = (diamond: number) => this.account.setAccountDiamond(diamond);
            ResultView.Instance.init();
            this.autoBtnEffectPlay();
            this.slotsFortuneSlot.IsRunning = false;
            if(enterGameResp?.history) Views.Instance.historyView.getComponent(HistoryView).history = enterGameResp.history;
            else Topbar.Instance.history.active = false;
            // if(!this.slotsFortuneSlot.isRunning && !this.slotsFortuneSlot.isAuto) this.slotsFortuneSlot.startAuto(false);
        }
    }

    async synchronize() {
        if (gGameData.status != EGameStatus.stop) {
            let enterGameResp = await this.player.synchronize();
            this.initPlayerData(enterGameResp);
        }
    }

    async refreshPlayerBaseData() {
        if (this.player == null)
            return;
        await this.player.refreshPlayerBaseData();
    }

    onPlayerBaseDataResp(resp: any) {
        if (this.player == null)
            return;
        let data = resp?.pBaseData;
        if (data == null)
            return;

        if (data.coins != null) {
            this.player.setAccountDiamond(data.coins);
        }
        if (data.avatarUrl != null) {
            this.account.setMyProfile(data.avatarUrl);
        }
        if ((<any>window).user != null && data.name != null) {
            (<any>window).user.name = data.name;
            (<any>window).user.nickname = data.name;
        }
        if ((<any>window).user != null && data.avatarUrl != null) {
            (<any>window).user.avatarUrl = data.avatarUrl;
        }
    }

    onCoinsUpdate(resp: any) {
        if (this.player == null)
            return;
        if (resp == null || resp.coins == null)
            return;
        this.player.setAccountDiamond(resp.coins);
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
        (<any>window).changedw=()=>{
            initBetAmounts()
        }
        initBetAmounts();

        (<any>window).onReconnect = async () => {
            let enterGameResp = await this.player.enterGame();
            this.initPlayerData(enterGameResp);
            if(this.slotsFortuneSlot.isAuto && !this.slotsFortuneSlot.isRunning) this.slotsFortuneSlot.startAuto(true);
        };

        afterLoad();
        this.registerSdk();
        (<any>window).enterGame=()=>{
            this.initEnterGame()
        }
        await this.initGame();

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
        setInterval(()=>{
            // console.log("autoBtnEffectPlay");
            if(!this.slotsFortuneSlot.isAuto){
                this.autoBtnEffect.active = true;
                this.autoBtnEffect.getComponent(cc.Animation).play();
            }
        },15000)

        this.autoBtnEffect.getComponent(cc.Animation).on('finished', () => {
            this.autoBtnEffect.active = false;
        })
    }
}

(<any>window).updateBalance = function () {
    Game.Instance.synchronize();
};

(<any>window).onQueryUser = function () {
    return Game.Instance.refreshPlayerBaseData();
};

(<any>window).rechargeSuccess = function () {
    Game.Instance.synchronize();
};

(<any>window).showDisconnectView = function () {
    Game.Instance.showDisconnectView();
};

(<any>window).stopAllSounds = function () {
    Audio.Instance.stopAllSounds();
};
